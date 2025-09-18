#!/usr/bin/env node

/**
 * NUCLEAR LOGGING STANDARDIZATION SCRIPT
 * 
 * This script performs complete nuclear standardization of all logging patterns.
 * It replaces ALL console statements and competing logging systems with a single pattern.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE_ROOT = process.cwd();
const EXCLUDED_DIRS = [
  'node_modules', '.git', '.next', 'dist', 'build', 'coverage',
  'docs/api-src', 'docs/api', 'scripts', 'supabase/functions',
  'services/worker/scripts', 'packages/logger/src/examples.ts',
  'packages/logger/README.md', 'packages/logger/src/migration.ts'
];

const EXCLUDED_FILES = [
  'package.json', 'package-lock.json', 'pnpm-lock.yaml',
  'tsconfig.json', 'next.config.js', 'tailwind.config.js',
  'vitest.config.ts', 'jest.config.js', 'logging-patterns-analysis.json'
];

// The ONLY allowed logging pattern
const STANDARD_IMPORT = `import { logger } from "@aibos/logger";`;

// Nuclear replacement patterns
const NUCLEAR_REPLACEMENTS = [
  // 1. Console.log patterns
  {
    name: 'Console.log with template literals',
    pattern: /console\.log\(`([^`]+)`\)/g,
    replacement: 'logger.info("$1")'
  },
  {
    name: 'Console.log with string concatenation',
    pattern: /console\.log\(([^)]+)\)/g,
    replacement: (match, args) => {
      // Handle different argument patterns
      if (args.includes('`') || args.includes('+')) {
        return `logger.info("Log message", { data: ${args} })`;
      }
      return `logger.info("Log message", { data: ${args} })`;
    }
  },
  
  // 2. Console.error patterns
  {
    name: 'Console.error with error objects',
    pattern: /console\.error\(([^)]+)\)/g,
    replacement: (match, args) => {
      if (args.includes('error') || args.includes('Error')) {
        return `logger.error("Error occurred", ${args})`;
      }
      return `logger.error("Error occurred", new Error(${args}))`;
    }
  },
  
  // 3. Console.warn patterns
  {
    name: 'Console.warn',
    pattern: /console\.warn\(([^)]+)\)/g,
    replacement: 'logger.warn("Warning", { message: $1 })'
  },
  
  // 4. Console.info patterns
  {
    name: 'Console.info',
    pattern: /console\.info\(([^)]+)\)/g,
    replacement: 'logger.info("Info message", { data: $1 })'
  },
  
  // 5. Console.debug patterns
  {
    name: 'Console.debug',
    pattern: /console\.debug\(([^)]+)\)/g,
    replacement: 'logger.debug("Debug message", { data: $1 })'
  },
  
  // 6. Remove competing logger imports
  {
    name: 'Remove Winston imports',
    pattern: /import\s+.*winston.*from\s+['"]winston['"];?\s*\n?/g,
    replacement: ''
  },
  {
    name: 'Remove makeLogger imports',
    pattern: /import\s+.*makeLogger.*from\s+['"]@aibos\/utils\/logger['"];?\s*\n?/g,
    replacement: ''
  },
  {
    name: 'Remove custom logger imports',
    pattern: /import\s+.*Logger.*from\s+['"]@aibos\/monitoring\/logger['"];?\s*\n?/g,
    replacement: ''
  },
  {
    name: 'Remove createLogger imports',
    pattern: /import\s+.*createLogger.*from\s+['"]winston['"];?\s*\n?/g,
    replacement: ''
  },
  
  // 7. Standardize existing logger patterns
  {
    name: 'Standardize error instanceof patterns',
    pattern: /logger\.error\("([^"]+)",\s*error\s*instanceof\s*Error\s*\?\s*error\s*:\s*new\s*Error\(String\(error\)\)\)/g,
    replacement: 'logger.error("$1", error)'
  },
  {
    name: 'Standardize error instanceof patterns (no closing paren)',
    pattern: /logger\.error\("([^"]+)",\s*error\s*instanceof\s*Error\s*\?\s*error\s*:\s*new\s*Error\(String\(error\)\)/g,
    replacement: 'logger.error("$1", error)'
  },
  
  // 8. Remove eslint-disable comments for console
  {
    name: 'Remove console eslint-disable comments',
    pattern: /\/\/\s*eslint-disable-next-line\s+no-console\s*\n\s*console\./g,
    replacement: 'logger.'
  },
  
  // 9. Remove development-only console statements
  {
    name: 'Remove development-only console',
    pattern: /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\)\s*\{\s*console\./g,
    replacement: 'logger.'
  },
  
  // 10. Clean up empty lines
  {
    name: 'Clean up multiple empty lines',
    pattern: /\n\s*\n\s*\n/g,
    replacement: '\n\n'
  }
];

// Files to process
const filesToProcess = [];
const processedFiles = [];
const errorFiles = [];

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.some(excluded => fullPath.includes(excluded))) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile() && shouldProcessFile(fullPath)) {
      filesToProcess.push(fullPath);
    }
  }
}

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);
  
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return false;
  if (EXCLUDED_FILES.includes(fileName)) return false;
  if (EXCLUDED_DIRS.some(excluded => filePath.includes(excluded))) return false;
  
  return true;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;
    
    // Check if file needs processing
    const hasConsole = /console\.(log|error|warn|info|debug)/.test(content);
    const hasCompetingLogger = /import.*winston|import.*makeLogger|import.*Logger.*from.*monitoring/.test(content);
    const hasInconsistentLogger = /error\s*instanceof\s*Error\s*\?\s*error\s*:\s*new\s*Error/.test(content);
    
    if (!hasConsole && !hasCompetingLogger && !hasInconsistentLogger) {
      return; // Skip files that don't need changes
    }
    
    console.log(`🔧 Processing: ${path.relative(WORKSPACE_ROOT, filePath)}`);
    
    // Apply nuclear replacements
    for (const { name, pattern, replacement } of NUCLEAR_REPLACEMENTS) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`  ✅ Applied: ${name}`);
      }
    }
    
    // Add standard logger import if needed
    if (modified && !content.includes('import { logger } from "@aibos/logger"')) {
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // Find the last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          insertIndex = i + 1;
        }
      }
      
      lines.splice(insertIndex, 0, STANDARD_IMPORT);
      content = lines.join('\n');
      console.log(`  ✅ Added standard logger import`);
    }
    
    // Clean up any remaining issues
    content = content
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple empty lines
      .replace(/import\s*{\s*}\s*from\s*['"]@aibos\/logger['"];?\s*\n?/g, '') // Empty imports
      .replace(/import\s*{\s*logger\s*}\s*from\s*['"]@aibos\/logger['"];?\s*\n?/g, STANDARD_IMPORT); // Standardize import
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      processedFiles.push(filePath);
      console.log(`  ✅ Updated successfully`);
    }
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    errorFiles.push({ file: filePath, error: error.message });
  }
}

// Main execution
console.log('🚀 NUCLEAR LOGGING STANDARDIZATION');
console.log('===================================');
console.log(`📁 Scanning workspace: ${WORKSPACE_ROOT}`);

scanDirectory(WORKSPACE_ROOT);

console.log(`📊 Found ${filesToProcess.length} files to process`);

// Process files
for (const file of filesToProcess) {
  processFile(file);
}

console.log('\n🎯 NUCLEAR STANDARDIZATION COMPLETE!');
console.log('====================================');
console.log(`✅ Successfully processed: ${processedFiles.length} files`);
console.log(`❌ Errors: ${errorFiles.length} files`);

if (errorFiles.length > 0) {
  console.log('\n❌ Files with errors:');
  errorFiles.forEach(({ file, error }) => {
    console.log(`  - ${path.relative(WORKSPACE_ROOT, file)}: ${error}`);
  });
}

// Run build to validate
console.log('\n🔨 Running build to validate nuclear standardization...');
try {
  execSync('pnpm -w build', { stdio: 'inherit' });
  console.log('✅ Build successful - nuclear standardization complete!');
} catch (error) {
  console.error('❌ Build failed - please check the errors above');
  process.exit(1);
}

console.log('\n🎉 NUCLEAR STANDARDIZATION SUCCESSFUL!');
console.log('All logging now follows the single, standardized pattern.');
