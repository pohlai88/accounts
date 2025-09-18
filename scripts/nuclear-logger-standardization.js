#!/usr/bin/env node

/**
 * NUCLEAR LOGGER STANDARDIZATION SCRIPT
 * 
 * This script performs nuclear standardization of all logging across the workspace.
 * It replaces ALL console statements and competing logging systems with a single pattern.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const WORKSPACE_ROOT = process.cwd();
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  'docs/api-src',
  'docs/api',
  'scripts',
  'supabase/functions',
  'services/worker/scripts'
];

const EXCLUDED_FILES = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.js',
  'vitest.config.ts',
  'jest.config.js'
];

// The ONLY allowed logging pattern
const STANDARD_IMPORT = `import { logger } from "@aibos/logger";`;

// Pattern replacements
const REPLACEMENTS = [
  // Console statements
  {
    pattern: /console\.log\(([^)]+)\)/g,
    replacement: (match, args) => {
      if (args.includes('`') || args.includes('+')) {
        // Template literal or concatenation - extract structured data
        return `logger.info("Log message", { data: ${args} })`;
      }
      return `logger.info("Log message", { data: ${args} })`;
    }
  },
  {
    pattern: /console\.error\(([^)]+)\)/g,
    replacement: (match, args) => {
      if (args.includes('error') || args.includes('Error')) {
        return `logger.error("Error occurred", ${args})`;
      }
      return `logger.error("Error occurred", new Error(${args}))`;
    }
  },
  {
    pattern: /console\.warn\(([^)]+)\)/g,
    replacement: (match, args) => {
      return `logger.warn("Warning", { message: ${args} })`;
    }
  },
  {
    pattern: /console\.info\(([^)]+)\)/g,
    replacement: (match, args) => {
      return `logger.info("Info message", { data: ${args} })`;
    }
  },
  {
    pattern: /console\.debug\(([^)]+)\)/g,
    replacement: (match, args) => {
      return `logger.debug("Debug message", { data: ${args} })`;
    }
  },

  // Remove competing logger imports
  {
    pattern: /import.*winston.*from.*["']winston["']/g,
    replacement: ''
  },
  {
    pattern: /import.*makeLogger.*from.*["']@aibos\/utils\/logger["']/g,
    replacement: ''
  },
  {
    pattern: /import.*Logger.*from.*["']@aibos\/monitoring\/logger["']/g,
    replacement: ''
  },
  {
    pattern: /import.*createLogger.*from.*["']winston["']/g,
    replacement: ''
  },

  // Standardize logger usage patterns
  {
    pattern: /logger\.error\("([^"]+)",\s*error\s*instanceof\s*Error\s*\?\s*error\s*:\s*new\s*Error\(String\(error\)\)\)/g,
    replacement: 'logger.error("$1", error)'
  },
  {
    pattern: /logger\.error\("([^"]+)",\s*error\s*instanceof\s*Error\s*\?\s*error\s*:\s*new\s*Error\(String\(error\)\)/g,
    replacement: 'logger.error("$1", error)'
  }
];

// Files to process
const filesToProcess = [];

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.some(excluded => fullPath.includes(excluded))) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      if (shouldProcessFile(fullPath)) {
        filesToProcess.push(fullPath);
      }
    }
  }
}

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);
  
  // Only process TypeScript/JavaScript files
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return false;
  }
  
  // Skip excluded files
  if (EXCLUDED_FILES.includes(fileName)) {
    return false;
  }
  
  // Skip if in excluded directories
  if (EXCLUDED_DIRS.some(excluded => filePath.includes(excluded))) {
    return false;
  }
  
  return true;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file has console statements or competing loggers
    const hasConsole = /console\.(log|error|warn|info|debug)/.test(content);
    const hasCompetingLogger = /import.*winston|import.*makeLogger|import.*Logger.*from.*monitoring/.test(content);
    
    if (!hasConsole && !hasCompetingLogger) {
      return; // Skip files that don't need changes
    }
    
    console.log(`Processing: ${filePath}`);
    
    // Apply replacements
    for (const { pattern, replacement } of REPLACEMENTS) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
    
    // Add standard logger import if needed
    if (modified && !content.includes('import { logger } from "@aibos/logger"')) {
      // Find the best place to add the import
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
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🚀 Starting Nuclear Logger Standardization...');
console.log(`📁 Scanning workspace: ${WORKSPACE_ROOT}`);

scanDirectory(WORKSPACE_ROOT);

console.log(`📊 Found ${filesToProcess.length} files to process`);

let processed = 0;
let errors = 0;

for (const file of filesToProcess) {
  try {
    processFile(file);
    processed++;
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
    errors++;
  }
}

console.log('\n🎯 Nuclear Standardization Complete!');
console.log(`✅ Processed: ${processed} files`);
console.log(`❌ Errors: ${errors} files`);

// Run build to check for issues
console.log('\n🔨 Running build to validate changes...');
try {
  execSync('pnpm -w build', { stdio: 'inherit' });
  console.log('✅ Build successful - nuclear standardization complete!');
} catch (error) {
  console.error('❌ Build failed - please check the errors above');
  process.exit(1);
}
