#!/usr/bin/env node

/**
 * LOGGING PATTERNS ANALYSIS SCRIPT
 * 
 * Analyzes all logging patterns across the workspace to identify
 * inconsistencies and create a comprehensive replacement strategy.
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = process.cwd();
const EXCLUDED_DIRS = [
  'node_modules', '.git', '.next', 'dist', 'build', 'coverage',
  'docs/api-src', 'docs/api', 'scripts', 'supabase/functions'
];

const patterns = {
  console: {
    log: [],
    error: [],
    warn: [],
    info: [],
    debug: []
  },
  logger: {
    info: [],
    error: [],
    warn: [],
    debug: [],
    trace: [],
    fatal: []
  },
  imports: {
    console: [],
    winston: [],
    pino: [],
    custom: [],
    aibosLogger: []
  },
  competing: {
    winston: [],
    monitoring: [],
    utils: []
  }
};

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
      analyzeFile(fullPath);
    }
  }
}

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  return ['.ts', '.tsx', '.js', '.jsx'].includes(ext) && 
         !filePath.includes('node_modules') &&
         !filePath.includes('.next') &&
         !filePath.includes('dist');
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Console patterns
      if (line.includes('console.log')) {
        patterns.console.log.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('console.error')) {
        patterns.console.error.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('console.warn')) {
        patterns.console.warn.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('console.info')) {
        patterns.console.info.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('console.debug')) {
        patterns.console.debug.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      
      // Logger patterns
      if (line.includes('logger.info')) {
        patterns.logger.info.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('logger.error')) {
        patterns.logger.error.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('logger.warn')) {
        patterns.logger.warn.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('logger.debug')) {
        patterns.logger.debug.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      
      // Import patterns
      if (line.includes('import') && line.includes('console')) {
        patterns.imports.console.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('import') && line.includes('winston')) {
        patterns.imports.winston.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('import') && line.includes('pino')) {
        patterns.imports.pino.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('import') && line.includes('@aibos/logger')) {
        patterns.imports.aibosLogger.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      
      // Competing systems
      if (line.includes('makeLogger') || line.includes('@aibos/utils/logger')) {
        patterns.competing.utils.push({ file: filePath, line: lineNum, content: line.trim() });
      }
      if (line.includes('@aibos/monitoring/logger') || line.includes('Logger from monitoring')) {
        patterns.competing.monitoring.push({ file: filePath, line: lineNum, content: line.trim() });
      }
    });
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
  }
}

// Run analysis
console.log('🔍 Analyzing logging patterns across workspace...');
scanDirectory(WORKSPACE_ROOT);

// Generate report
const report = {
  summary: {
    totalConsole: patterns.console.log.length + patterns.console.error.length + 
                  patterns.console.warn.length + patterns.console.info.length + 
                  patterns.console.debug.length,
    totalLogger: patterns.logger.info.length + patterns.logger.error.length + 
                 patterns.logger.warn.length + patterns.logger.debug.length,
    competingSystems: patterns.competing.utils.length + patterns.competing.monitoring.length,
    filesWithConsole: new Set([...patterns.console.log, ...patterns.console.error, 
                              ...patterns.console.warn, ...patterns.console.info, 
                              ...patterns.console.debug].map(p => p.file)).size,
    filesWithLogger: new Set([...patterns.logger.info, ...patterns.logger.error, 
                             ...patterns.logger.warn, ...patterns.logger.debug].map(p => p.file)).size
  },
  patterns
};

console.log('\n📊 LOGGING PATTERNS ANALYSIS REPORT');
console.log('=====================================');
console.log(`Total Console Statements: ${report.summary.totalConsole}`);
console.log(`Total Logger Statements: ${report.summary.totalLogger}`);
console.log(`Competing Systems: ${report.summary.competingSystems}`);
console.log(`Files with Console: ${report.summary.filesWithConsole}`);
console.log(`Files with Logger: ${report.summary.filesWithLogger}`);

console.log('\n📋 DETAILED BREAKDOWN');
console.log('=====================');
console.log(`Console.log: ${patterns.console.log.length}`);
console.log(`Console.error: ${patterns.console.error.length}`);
console.log(`Console.warn: ${patterns.console.warn.length}`);
console.log(`Console.info: ${patterns.console.info.length}`);
console.log(`Console.debug: ${patterns.console.debug.length}`);

console.log(`\nLogger.info: ${patterns.logger.info.length}`);
console.log(`Logger.error: ${patterns.logger.error.length}`);
console.log(`Logger.warn: ${patterns.logger.warn.length}`);
console.log(`Logger.debug: ${patterns.logger.debug.length}`);

console.log(`\nCompeting Systems:`);
console.log(`- Utils Logger: ${patterns.competing.utils.length}`);
console.log(`- Monitoring Logger: ${patterns.competing.monitoring.length}`);

// Save detailed report
fs.writeFileSync('logging-patterns-analysis.json', JSON.stringify(report, null, 2));
console.log('\n💾 Detailed report saved to: logging-patterns-analysis.json');

// Show sample patterns
console.log('\n🔍 SAMPLE PATTERNS FOUND');
console.log('========================');

if (patterns.console.log.length > 0) {
  console.log('\nConsole.log examples:');
  patterns.console.log.slice(0, 3).forEach(p => {
    console.log(`  ${p.file}:${p.line} - ${p.content}`);
  });
}

if (patterns.logger.error.length > 0) {
  console.log('\nLogger.error examples:');
  patterns.logger.error.slice(0, 3).forEach(p => {
    console.log(`  ${p.file}:${p.line} - ${p.content}`);
  });
}

if (patterns.competing.utils.length > 0) {
  console.log('\nCompeting Utils Logger examples:');
  patterns.competing.utils.slice(0, 3).forEach(p => {
    console.log(`  ${p.file}:${p.line} - ${p.content}`);
  });
}

console.log('\n✅ Analysis complete!');
