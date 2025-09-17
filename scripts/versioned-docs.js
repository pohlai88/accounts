#!/usr/bin/env node

/**
 * Versioned Documentation System
 * 
 * Creates versioned documentation folders and manages latest symlink
 * Runs on every git tag to create versioned docs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DOCS_BASE_DIR = 'docs';
const VERSIONS_DIR = path.join(DOCS_BASE_DIR, 'versions');
const LATEST_DIR = path.join(DOCS_BASE_DIR, 'latest');

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
    throw error;
  }
}

function getCurrentVersion() {
  try {
    // Try to get version from git tag
    const tag = runCommand('git describe --tags --exact-match HEAD 2>/dev/null || echo ""');
    if (tag.trim()) {
      return tag.trim().replace(/^v/, ''); // Remove 'v' prefix if present
    }
    
    // Fallback to package.json version
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.warn('Could not determine version, using "latest"');
    return 'latest';
  }
}

function createVersionedDocs(version) {
  console.log(`📚 Creating versioned documentation for v${version}...`);
  
  // Ensure versions directory exists
  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
  }
  
  const versionDir = path.join(VERSIONS_DIR, version);
  
  // Clean and create version directory
  if (fs.existsSync(versionDir)) {
    fs.rmSync(versionDir, { recursive: true, force: true });
  }
  fs.mkdirSync(versionDir, { recursive: true });
  
  // Generate documentation for this version
  console.log('Generating API documentation...');
  runCommand('pnpm docs:api:src');
  
  // Copy generated docs to version directory
  const sourceDir = path.join(DOCS_BASE_DIR, 'api-src');
  if (fs.existsSync(sourceDir)) {
    runCommand(`cp -r "${sourceDir}"/* "${versionDir}/"`);
  }
  
  // Create version info file
  const versionInfo = {
    version,
    created: new Date().toISOString(),
    gitCommit: runCommand('git rev-parse HEAD').trim(),
    gitTag: runCommand('git describe --tags --exact-match HEAD 2>/dev/null || echo "none"').trim(),
    buildInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  fs.writeFileSync(
    path.join(versionDir, 'version.json'),
    JSON.stringify(versionInfo, null, 2)
  );
  
  console.log(`✅ Versioned documentation created at ${versionDir}`);
  return versionDir;
}

function updateLatestSymlink(versionDir) {
  console.log('🔗 Updating latest symlink...');
  
  // Remove existing latest directory/symlink
  if (fs.existsSync(LATEST_DIR)) {
    fs.rmSync(LATEST_DIR, { recursive: true, force: true });
  }
  
  // Create symlink to latest version
  try {
    fs.symlinkSync(versionDir, LATEST_DIR, 'dir');
    console.log(`✅ Latest symlink updated to point to ${versionDir}`);
  } catch (error) {
    // Fallback: copy instead of symlink (for Windows compatibility)
    console.log('Using copy instead of symlink (Windows compatibility)');
    runCommand(`cp -r "${versionDir}" "${LATEST_DIR}"`);
  }
}

function createVersionSelector() {
  console.log('📋 Creating version selector...');
  
  const versions = fs.readdirSync(VERSIONS_DIR)
    .filter(dir => fs.statSync(path.join(VERSIONS_DIR, dir)).isDirectory())
    .sort((a, b) => {
      // Sort versions semantically
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        
        if (aPart !== bPart) {
          return bPart - aPart; // Descending order (newest first)
        }
      }
      
      return 0;
    });
  
  const versionSelector = {
    versions: versions.map(version => ({
      version,
      path: `/versions/${version}`,
      isLatest: version === versions[0]
    })),
    latest: versions[0] || 'latest',
    generated: new Date().toISOString()
  };
  
  // Write version selector to both latest and versions directory
  const selectorPath = path.join(DOCS_BASE_DIR, 'versions.json');
  fs.writeFileSync(selectorPath, JSON.stringify(versionSelector, null, 2));
  
  // Also write to latest directory
  fs.writeFileSync(path.join(LATEST_DIR, 'versions.json'), JSON.stringify(versionSelector, null, 2));
  
  console.log(`✅ Version selector created with ${versions.length} versions`);
}

function createVersionIndex() {
  console.log('📄 Creating version index page...');
  
  const versions = fs.readdirSync(VERSIONS_DIR)
    .filter(dir => fs.statSync(path.join(VERSIONS_DIR, dir)).isDirectory())
    .sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        
        if (aPart !== bPart) {
          return bPart - aPart;
        }
      }
      
      return 0;
    });
  
  const indexContent = `# AI-BOS Accounts API Documentation Versions

## Available Versions

${versions.map(version => {
  const versionPath = path.join(VERSIONS_DIR, version);
  const versionInfoPath = path.join(versionPath, 'version.json');
  
  let versionInfo = {};
  if (fs.existsSync(versionInfoPath)) {
    versionInfo = JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'));
  }
  
  const createdDate = versionInfo.created ? new Date(versionInfo.created).toLocaleDateString() : 'Unknown';
  const gitCommit = versionInfo.gitCommit ? versionInfo.gitCommit.substring(0, 8) : 'Unknown';
  
  return `### [v${version}](./versions/${version}/)
- **Created**: ${createdDate}
- **Git Commit**: ${gitCommit}
- **Status**: ${version === versions[0] ? 'Latest' : 'Previous'}`;
}).join('\n\n')}

## Quick Links

- [Latest Documentation](./latest/) - Always points to the most recent version
- [Version Selector](./versions.json) - JSON API for version information

## How to Use

1. **For Development**: Use the latest version for current development
2. **For Production**: Pin to a specific version for stability
3. **For Migration**: Compare versions to understand breaking changes

---

**Last Updated**: ${new Date().toISOString()}
**Total Versions**: ${versions.length}
`;

  fs.writeFileSync(path.join(DOCS_BASE_DIR, 'VERSIONS.md'), indexContent);
  console.log('✅ Version index page created');
}

function main() {
  console.log('🚀 Versioned Documentation System');
  console.log('==================================');
  
  try {
    const version = getCurrentVersion();
    console.log(`Current version: ${version}`);
    
    // Create versioned documentation
    const versionDir = createVersionedDocs(version);
    
    // Update latest symlink
    updateLatestSymlink(versionDir);
    
    // Create version selector
    createVersionSelector();
    
    // Create version index
    createVersionIndex();
    
    console.log('\n✅ Versioned documentation system completed!');
    console.log(`📁 Version directory: ${versionDir}`);
    console.log(`🔗 Latest symlink: ${LATEST_DIR}`);
    console.log(`📋 Version selector: ${path.join(DOCS_BASE_DIR, 'versions.json')}`);
    
  } catch (error) {
    console.error('❌ Versioned documentation system failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createVersionedDocs, updateLatestSymlink, createVersionSelector };
