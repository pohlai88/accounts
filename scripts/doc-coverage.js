#!/usr/bin/env node

/**
 * Documentation Coverage Checker
 *
 * Generates TypeDoc JSON and calculates documentation coverage
 * Fails CI if coverage is below threshold
 *
 * P0 Robustness Features:
 * - Deterministic builds with pinned versions
 * - Fail for broken links & missing exports
 * - Environment-aware error checking
 * - Per-package coverage gates
 * - Baseline comparison to prevent doc drift
 * - Actionable artifacts for CI/dashboards
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_THRESHOLD = 85; // start at 85%, raise to 95% later
const TYPEDOC_JSON_PATH = 'docs/api.json';
const COVERAGE_SUMMARY_PATH = 'docs/api-coverage-summary.json';

// Allow override via env or CLI: COVERAGE_THRESHOLD=90 or --threshold 90
function resolveThreshold() {
  const fromEnv = Number(process.env.COVERAGE_THRESHOLD);
  const fromArg = (() => {
    const i = process.argv.indexOf('--threshold');
    return i > -1 ? Number(process.argv[i + 1]) : NaN;
  })();
  const val = Number.isFinite(fromArg) ? fromArg : (Number.isFinite(fromEnv) ? fromEnv : DEFAULT_THRESHOLD);
  return Math.min(Math.max(val, 0), 100);
}
const COVERAGE_THRESHOLD = resolveThreshold();

// Parse baseline path from CLI args
function resolveBaseline() {
  const bIdx = process.argv.indexOf('--baseline');
  return bIdx > -1 ? process.argv[bIdx + 1] : null;
}
const BASELINE_PATH = resolveBaseline();

function runCommand(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function generateTypeDocJson() {
  console.log('📚 Generating TypeDoc JSON...');

  // Clean previous JSON
  if (fs.existsSync(TYPEDOC_JSON_PATH)) {
    fs.unlinkSync(TYPEDOC_JSON_PATH);
  }

  // Get current git SHA for deterministic source links
  const gitRevision = runCommand('git rev-parse HEAD').trim();

  // Generate JSON output with P0 robustness features
  const typedocConfig = {
    "$schema": "https://typedoc.org/schema.json",
    "plugin": [],
    "readme": "none",
    "hideGenerator": true,
    "excludeInternal": true,
    "excludePrivate": true,
    "excludeProtected": true,
    "entryPointStrategy": "resolve",
    "entryPoints": [
      "packages/accounting/src/index.ts",
      "packages/auth/src/index.ts",
      "packages/ui/src/index.ts",
      "packages/utils/src/index.ts",
      "packages/cache/src/index.ts",
      "packages/db/src/index.ts",
      "packages/monitoring/src/index.ts",
      "packages/realtime/src/index.ts",
      "packages/security/src/index.ts",
      "packages/tokens/src/index.ts"
    ],
    "tsconfig": "tsconfig.typedoc.json",
    // P0: Environment-aware error checking
    "skipErrorChecking": process.env.CI ? false : true,
    // P0: Fail for broken links & missing exports
    "validation": {
      "invalidLink": true,
      "notExported": true
    },
    // P0: Deterministic builds with git SHA
    "gitRevision": gitRevision,
    "json": TYPEDOC_JSON_PATH,
    "name": "AI-BOS Accounts API Documentation",
    "includeVersion": true,
    "excludeExternals": true,
    "sort": ["source-order"],
    "exclude": [
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/test/**",
      "**/tests/**",
      "**/__tests__/**",
      "**/dist/**",
      "**/node_modules/**"
    ]
  };

  // Write temporary config
  const tempConfigPath = 'typedoc.coverage.json';
  fs.writeFileSync(tempConfigPath, JSON.stringify(typedocConfig, null, 2));

  try {
    // P0: Use pinned TypeDoc version for deterministic builds
    runCommand(`npx typedoc@0.25.4 --options ${tempConfigPath}`);
  } finally {
    // Clean up temp config
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  }

  if (!fs.existsSync(TYPEDOC_JSON_PATH)) {
    throw new Error('TypeDoc JSON generation failed');
  }
}

function calculateCoverage() {
  console.log('📊 Calculating documentation coverage...');

  const jsonData = JSON.parse(fs.readFileSync(TYPEDOC_JSON_PATH, 'utf8'));

  // TypeDoc numeric kinds → buckets we care about (top-level public surface only)
  const KIND = {
    Project: 1, Module: 2, Namespace: 4, Enum: 8, EnumMember: 16, Variable: 32,
    Function: 64, Class: 128, Interface: 256, Constructor: 512, Property: 1024,
    Method: 2048, CallSignature: 4096, IndexSignature: 8192, ConstructorSignature: 16384,
    Parameter: 32768, TypeLiteral: 65536, TypeParameter: 131072, Accessor: 262144,
    GetSignature: 524288, SetSignature: 1048576, ObjectLiteral: 2097152, TypeAlias: 4194304,
    Reference: 8388608
  };

  const BUCKETS = {
    functions: new Set([KIND.Function]),
    classes: new Set([KIND.Class]),
    interfaces: new Set([KIND.Interface]),
    enums: new Set([KIND.Enum]),
    typeAliases: new Set([KIND.TypeAlias]),
    variables: new Set([KIND.Variable])
  };

  const coverage = {
    functions: { total: 0, documented: 0 },
    classes: { total: 0, documented: 0 },
    interfaces: { total: 0, documented: 0 },
    enums: { total: 0, documented: 0 },
    typeAliases: { total: 0, documented: 0 },
    variables: { total: 0, documented: 0 }
  };

  // P0: Per-package coverage tracking
  const perPackage = new Map(); // name -> { documented, total }

  let totalSymbols = 0;
  let documentedSymbols = 0;
  const missing = []; // up to 20 offenders

  const bucketFor = (kind) => {
    for (const [name, set] of Object.entries(BUCKETS)) if (set.has(kind)) return name;
    return null;
  };

  const isInternal = (node) => {
    const tags = node?.comment?.modifierTags;
    if (Array.isArray(tags)) return tags.includes('@internal');
    // Some TypeDoc versions encode modifierTags as an object/set-like
    if (tags && typeof tags === 'object') return !!tags['@internal'];
    return false;
  };

  const hasComment = (node) => {
    const hasOwn = !!(node?.comment?.summary?.length);
    if (hasOwn) return true;
    // Functions typically hold docs on their signature(s)
    if (Array.isArray(node?.signatures)) {
      return node.signatures.some(s => !!(s.comment?.summary?.length));
    }
    return false;
  };

  const fqName = (stack) => stack.map(s => s.name).filter(Boolean).join(' :: ');

  // Traverse once; count only top-level surface (no class members, no signatures)
  const walk = (node, stack = []) => {
    if (!node || isInternal(node)) return;
    const kind = node.kind;
    const bucket = bucketFor(kind);

    if (bucket) {
      coverage[bucket].total++;
      totalSymbols++;
      const documented = hasComment(node);
      if (documented) {
        coverage[bucket].documented++;
        documentedSymbols++;
      } else if (missing.length < 20) {
        missing.push({ name: fqName([...stack, node]), bucket });
      }

      // P0: Track per-package coverage
      const pkgName = (stack.find(n => [KIND.Module, KIND.Namespace].includes(n.kind))?.name) || 'root';
      const p = perPackage.get(pkgName) || { documented: 0, total: 0 };
      p.total++;
      if (documented) p.documented++;
      perPackage.set(pkgName, p);

      // Do NOT descend into signatures/members for coverage — we measure surface only
      return;
    }

    // Keep walking into modules/namespaces/projects to find surface symbols
    if (Array.isArray(node.children)) {
      const nextStack = (kind === KIND.Project || kind === KIND.Module || kind === KIND.Namespace)
        ? [...stack, node] : stack;
      for (const c of node.children) walk(c, nextStack);
    }
  };

  if (Array.isArray(jsonData.children) && jsonData.children.length > 0) {
    console.log(`Analyzing ${jsonData.children.length} packages/modules...`);
    for (const child of jsonData.children) walk(child, []);
  } else {
    console.log('No children found in TypeDoc JSON');
  }

  const overallCoverage = totalSymbols > 0 ? (documentedSymbols / totalSymbols) * 100 : 0;

  return {
    overall: overallCoverage,
    documented: documentedSymbols,
    total: totalSymbols,
    breakdown: coverage,
    missing,
    perPackage: Object.fromEntries(perPackage)
  };
}

// P0: Baseline comparison to prevent doc drift
function compareWithBaseline(coverage) {
  if (!BASELINE_PATH || !fs.existsSync(BASELINE_PATH)) {
    console.log('ℹ️  No baseline provided or baseline file not found');
    return { passed: true, issues: [] };
  }

  console.log(`📊 Comparing with baseline: ${BASELINE_PATH}`);
  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const issues = [];

  // Check for new undocumented APIs
  const currentSet = new Set(coverage.missing.map(m => m.name));
  const baseSet = new Set(baseline.missing?.map(m => m.name) || []);
  const newUndoc = [...currentSet].filter(n => !baseSet.has(n));

  if (newUndoc.length > 0) {
    console.log('❌ New undocumented APIs since baseline:');
    newUndoc.forEach(n => console.log('  -', n));
    issues.push(`Found ${newUndoc.length} new undocumented APIs`);
  }

  // Check for coverage drop
  const baselineOverall = baseline.overall || 0;
  const drop = baselineOverall - coverage.overall;
  if (drop > 0.5) {
    console.log(`❌ Coverage dropped by ${drop.toFixed(1)}% vs baseline`);
    issues.push(`Coverage dropped by ${drop.toFixed(1)}%`);
  }

  return { passed: issues.length === 0, issues };
}

function generateReport(coverage) {
  console.log('\n📈 Documentation Coverage Report');
  console.log('=====================================');
  console.log(`Overall Coverage: ${coverage.overall.toFixed(1)}% (${coverage.documented}/${coverage.total})`);
  console.log(`Threshold: ${COVERAGE_THRESHOLD}%`);
  console.log('');

  console.log('Breakdown by Type:');
  Object.entries(coverage.breakdown).forEach(([type, stats]) => {
    if (stats.total > 0) {
      const percentage = (stats.documented / stats.total) * 100;
      console.log(`  ${type}: ${percentage.toFixed(1)}% (${stats.documented}/${stats.total})`);
    }
  });

  // P0: Per-package coverage gates
  console.log('\nPer-package coverage:');
  let hardFail = false;
  for (const [name, p] of Object.entries(coverage.perPackage)) {
    const pct = p.total ? (p.documented / p.total) * 100 : 100;
    console.log(`  ${name}: ${pct.toFixed(1)}% (${p.documented}/${p.total})`);
    if (pct + 1e-9 < (COVERAGE_THRESHOLD - 10)) {
      console.log(`    ❌ Package below threshold (${COVERAGE_THRESHOLD - 10}%)`);
      hardFail = true;
    }
  }

  console.log('');
  if (coverage.missing?.length) {
    console.log('Top missing docs (up to 20):');
    for (const m of coverage.missing) {
      console.log(`  - [${m.bucket}] ${m.name}`);
    }
    console.log('');
  }

  // P0: Baseline comparison
  const baselineResult = compareWithBaseline(coverage);
  if (!baselineResult.passed) {
    console.log('❌ Baseline comparison failed!');
    baselineResult.issues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  }

  const passed = coverage.overall >= COVERAGE_THRESHOLD && !hardFail;
  if (passed) {
    console.log('✅ Coverage meets threshold!');
  } else {
    console.log('❌ Coverage below threshold!');
    const gap = Math.max(0, (COVERAGE_THRESHOLD - coverage.overall)).toFixed(1);
    console.log(`   Need ${gap}% more coverage`);
  }

  return passed;
}

function main() {
  console.log('🔍 Documentation Coverage Checker');
  console.log('==================================');

  try {
    // Generate TypeDoc JSON
    generateTypeDocJson();

    // Calculate coverage
    const coverage = calculateCoverage();

    // Generate report
    const passed = generateReport(coverage);

    // P0: Emit machine-readable summary for dashboards/PR comments
    fs.writeFileSync(COVERAGE_SUMMARY_PATH, JSON.stringify({
      ...coverage,
      threshold: COVERAGE_THRESHOLD,
      passed,
      timestamp: new Date().toISOString(),
      gitRevision: runCommand('git rev-parse HEAD').trim()
    }, null, 2));

    console.log(`\n📄 Coverage summary written to: ${COVERAGE_SUMMARY_PATH}`);

    // Exit with appropriate code
    process.exit(passed ? 0 : 1);

  } catch (error) {
    console.error('❌ Coverage check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { calculateCoverage, generateTypeDocJson };
