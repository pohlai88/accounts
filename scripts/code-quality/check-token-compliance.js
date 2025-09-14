#!/usr/bin/env node

/**
 * Token Compliance & WCAG 2.2 AAA Checker
 *
 * This script scans the codebase for violations of the token system and accessibility:
 * - Raw hex colors (#ffffff, #000, etc.)
 * - Arbitrary Tailwind values ([#fff], [12px], etc.)
 * - Inline style props
 * - Raw CSS color properties
 * - WCAG 2.2 AAA compliance issues
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Patterns to check for violations
const VIOLATION_PATTERNS = [
  {
    name: "Raw Hex Colors in JSX/TSX",
    pattern: /#[0-9A-Fa-f]{3,6}(?![^<]*>)/g,
    message: "Raw hex colors found. Use semantic token classes instead.",
    examples: ["#ffffff", "#000", "#ff0000", "#abc123"],
    excludeFiles: ["packages/tokens/src/tokens.ts"], // Allow hex in tokens file
  },
  {
    name: "Arbitrary Tailwind Values in className",
    pattern: /className\s*=\s*["'][^"']*\[(?!var\(--)[^\]]+\][^"']*["']/g,
    message: "Arbitrary Tailwind values found. Use semantic token classes instead.",
    examples: ['className="w-[12px]"', 'className="bg-[#fff]"', 'className="text-[1rem]"'],
  },
  {
    name: "Inline Style Props",
    pattern: /style\s*=\s*\{[^}]*\}/g,
    message: "Inline style props found. Use Tailwind classes instead.",
    examples: ['style={{ color: "red" }}', 'style={{ backgroundColor: "#fff" }}'],
  },
  {
    name: "Raw CSS Color Properties in Style Objects",
    pattern: /(backgroundColor|color|borderColor|fill|stroke)\s*:\s*["'][^"']*["']/g,
    message: "Raw CSS color properties found. Use semantic token classes instead.",
    examples: ['backgroundColor: "red"', 'color: "#fff"', 'borderColor: "blue"'],
  },
];

// WCAG 2.2 AAA Compliance Patterns
const WCAG_PATTERNS = [
  {
    name: "Missing ARIA Labels",
    pattern: /<(button|input|select|textarea)(?![^>]*aria-label)(?![^>]*aria-labelledby)[^>]*>/g,
    message:
      "Interactive elements missing aria-label or aria-labelledby. Required for WCAG 2.2 AAA.",
    examples: ["<button>", '<input type="text">', "<select>"],
    severity: "high",
  },
  {
    name: "Missing Focus Management",
    pattern:
      /<(button|input|select|textarea|a)(?![^>]*focus:outline-none)(?![^>]*focus:ring)[^>]*>/g,
    message:
      "Interactive elements missing focus styles. Required for WCAG 2.2 AAA keyboard navigation.",
    examples: ['<button className="btn">', '<input className="input">'],
    severity: "high",
  },
  {
    name: "Missing Semantic Roles",
    pattern:
      /<(div|span)(?![^>]*role=)(?![^>]*aria-label)(?![^>]*aria-labelledby)[^>]*onClick[^>]*>/g,
    message:
      'Clickable div/span missing role attribute. Use semantic elements or add role="button".',
    examples: ["<div onClick={handleClick}>", "<span onClick={handleClick}>"],
    severity: "medium",
  },
  {
    name: "Missing Alt Text",
    pattern: /<img(?![^>]*alt=)[^>]*>/g,
    message: "Images missing alt attribute. Required for WCAG 2.2 AAA.",
    examples: ['<img src="image.jpg">'],
    severity: "high",
  },
  {
    name: "Missing Form Labels",
    pattern:
      /<(input|select|textarea)(?![^>]*aria-label)(?![^>]*aria-labelledby)(?![^>]*placeholder)[^>]*>/g,
    message: "Form elements missing labels. Use <label>, aria-label, or aria-labelledby.",
    examples: ['<input type="text">', "<select>", "<textarea>"],
    severity: "high",
  },
  {
    name: "Missing Heading Hierarchy",
    pattern: /<h([2-9])(?![^>]*aria-hidden)[^>]*>(?!.*<h[1-9])/g,
    message:
      "Heading hierarchy issue. H2-H6 should follow H1, or use aria-hidden for decorative headings.",
    examples: ["<h2>", "<h3>"],
    severity: "medium",
  },
  {
    name: "Missing Live Regions",
    pattern:
      /(error|success|warning|loading|updating)(?![^>]*aria-live)(?![^>]*role="status")(?![^>]*role="alert")/g,
    message: 'Dynamic content missing live regions. Use aria-live, role="status", or role="alert".',
    examples: ["error", "success", "warning"],
    severity: "medium",
  },
  {
    name: "Missing Skip Links",
    pattern: /<main(?![^>]*id=)(?![^>]*tabindex=)/g,
    message: 'Main content missing skip link target. Add id="main-content" or tabindex="-1".',
    examples: ["<main>"],
    severity: "medium",
  },
];

// Directories to scan - now covers all packages using SSOT
const SCAN_DIRS = [
  "packages/ui/src",
  "packages/accounting/src",
  "packages/auth/src",
  "packages/contracts/src",
  "packages/db/src",
  "packages/utils/src",
  "packages/cache/src",
  "packages/security/src",
  "packages/monitoring/src",
  "packages/deployment/src",
  "packages/api-gateway/src",
  "packages/realtime/src",
  "packages/tokens/src",
  "apps/web/app",
  "apps/web-api/app",
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /dist/,
  /build/,
  /\.git/,
  /\.d\.ts$/,
  /\.config\.(js|ts|cjs)$/,
  /scripts\//,
  /\.eslintrc/,
  /tailwind\.preset\.cjs$/,
  /build-preset\.cjs$/,
];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath))) {
        getAllFiles(filePath, fileList);
      }
    } else if (stat.isFile()) {
      if (
        file.endsWith(".ts") ||
        file.endsWith(".tsx") ||
        file.endsWith(".js") ||
        file.endsWith(".jsx")
      ) {
        if (!EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath))) {
          fileList.push(filePath);
        }
      }
    }
  });

  return fileList;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const violations = [];

  // Check token violations
  VIOLATION_PATTERNS.forEach(({ name, pattern, message, excludeFiles }) => {
    // Skip files that are excluded
    if (excludeFiles && excludeFiles.some(excludeFile => filePath.includes(excludeFile))) {
      return;
    }

    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lines = content.substring(0, content.indexOf(match)).split("\n");
        const lineNumber = lines.length;

        violations.push({
          type: name,
          message,
          match,
          file: filePath,
          line: lineNumber,
          category: "token",
        });
      });
    }
  });

  // Check WCAG violations
  WCAG_PATTERNS.forEach(({ name, pattern, message, severity }) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const lines = content.substring(0, content.indexOf(match)).split("\n");
        const lineNumber = lines.length;

        violations.push({
          type: name,
          message,
          match,
          file: filePath,
          line: lineNumber,
          category: "wcag",
          severity,
        });
      });
    }
  });

  return violations;
}

function main() {
  console.log("🔍 Checking token system compliance and WCAG 2.2 AAA compliance...\n");

  let totalViolations = 0;
  const allViolations = [];

  SCAN_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory ${dir} does not exist, skipping...`);
      return;
    }

    console.log(`📁 Scanning ${dir}...`);
    const files = getAllFiles(dir);

    files.forEach(file => {
      const violations = checkFile(file);
      if (violations.length > 0) {
        allViolations.push(...violations);
        totalViolations += violations.length;
      }
    });
  });

  if (totalViolations === 0) {
    console.log("✅ No violations found!");
    console.log(
      "🎉 All styling is using semantic tokens correctly and meets WCAG 2.2 AAA standards.",
    );
    process.exit(0);
  } else {
    // Separate violations by category
    const tokenViolations = allViolations.filter(v => v.category === "token");
    const wcagViolations = allViolations.filter(v => v.category === "wcag");

    console.log(`❌ Found ${totalViolations} violations:\n`);

    if (tokenViolations.length > 0) {
      console.log(`🎨 Token System Violations (${tokenViolations.length}):\n`);
      displayViolations(tokenViolations);
    }

    if (wcagViolations.length > 0) {
      console.log(`♿ WCAG 2.2 AAA Violations (${wcagViolations.length}):\n`);
      displayViolations(wcagViolations);
    }

    console.log("💡 To fix these violations:");
    console.log("   Token Issues:");
    console.log("   1. Replace hex colors with semantic token classes (e.g., bg-brand-solid)");
    console.log(
      "   2. Replace arbitrary values with semantic tokens (e.g., space-4 instead of [1rem])",
    );
    console.log("   3. Replace inline styles with Tailwind classes");
    console.log("   4. Use semantic color classes instead of raw CSS properties\n");

    console.log("   WCAG 2.2 AAA Issues:");
    console.log("   1. Add aria-label or aria-labelledby to interactive elements");
    console.log("   2. Add focus:outline-none and focus:ring-2 to interactive elements");
    console.log("   3. Use semantic HTML elements or add role attributes");
    console.log("   4. Add alt text to images");
    console.log("   5. Use proper heading hierarchy (H1 → H2 → H3)");
    console.log("   6. Add aria-live regions for dynamic content\n");

    console.log("📚 Available semantic token classes:");
    console.log("   Colors: bg-brand-solid, text-fg-default, border-border-subtle, etc.");
    console.log("   Spacing: space-1, space-2, space-4, space-6, etc.");
    console.log("   Radius: rounded-sm, rounded-md, rounded-lg, etc.");
    console.log("   Shadows: shadow-sm, shadow-md, shadow-lg, etc.\n");

    process.exit(1);
  }
}

function displayViolations(violations) {
  // Group violations by file
  const violationsByFile = {};
  violations.forEach(violation => {
    if (!violationsByFile[violation.file]) {
      violationsByFile[violation.file] = [];
    }
    violationsByFile[violation.file].push(violation);
  });

  Object.entries(violationsByFile).forEach(([file, fileViolations]) => {
    console.log(`📄 ${file}:`);
    fileViolations.forEach(violation => {
      const severity = violation.severity ? ` [${violation.severity.toUpperCase()}]` : "";
      console.log(`   Line ${violation.line}: ${violation.type}${severity}`);
      console.log(`   Found: "${violation.match}"`);
      console.log(`   Fix: ${violation.message}\n`);
    });
  });
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, getAllFiles, VIOLATION_PATTERNS, WCAG_PATTERNS };
