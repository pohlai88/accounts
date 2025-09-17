#!/usr/bin/env node

/**
 * Document Management Tool for AI-BOS Accounting SaaS Platform
 *
 * This tool provides automated document version control, registry management,
 * and quality assurance for the project documentation.
 *
 * Usage:
 *   node scripts/document-manager.js --help
 *   node scripts/document-manager.js update-registry
 *   node scripts/document-manager.js validate-docs
 *   node scripts/document-manager.js update-versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DocumentManager {
  constructor() {
    this.registryPath = 'docs/MASTER_DOCUMENT_REGISTRY.md';
    this.today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    this.version = '1.0';
    this.documents = [];
  }

  /**
   * Initialize the document manager
   */
  init() {
    console.log('🚀 Initializing Document Manager...');
    this.loadRegistry();
    this.scanDocuments();
  }

  /**
   * Load the master document registry
   */
  loadRegistry() {
    try {
      const registryContent = fs.readFileSync(this.registryPath, 'utf8');
      console.log('📋 Master Document Registry loaded');
    } catch (error) {
      console.error('❌ Error loading registry:', error.message);
      process.exit(1);
    }
  }

  /**
   * Scan all README files in the project
   */
  scanDocuments() {
    const readmeFiles = this.findReadmeFiles('.');
    this.documents = readmeFiles.map(file => ({
      path: file,
      exists: fs.existsSync(file),
      lastModified: fs.existsSync(file) ? fs.statSync(file).mtime : null
    }));

    console.log(`📄 Found ${this.documents.length} README files`);
  }

  /**
   * Recursively find all README.md files
   */
  findReadmeFiles(dir) {
    const files = [];

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules, .git, and other non-documentation directories
          if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
            files.push(...this.findReadmeFiles(fullPath));
          }
        } else if (item === 'README.md') {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }

    return files;
  }

  /**
   * Update document headers with standardized format
   */
  updateDocumentHeaders() {
    console.log('📝 Updating document headers...');

    const headerTemplate = (docId, title) => `# DOC-${docId}: ${title}

**Version**: ${this.version}
**Date**: ${this.today}
**Status**: Active
**Owner**: Development Team
**Last Updated**: ${this.today}
**Next Review**: ${this.getNextReviewDate()}

---

`;

    this.documents.forEach((doc, index) => {
      if (doc.exists) {
        const docId = String(index + 1).padStart(3, '0');
        const title = this.extractTitleFromPath(doc.path);

        try {
          let content = fs.readFileSync(doc.path, 'utf8');

          // Remove existing DOC- header if present
          content = content.replace(/^# DOC-\d+: .*?\n\n\*\*Version\*\*: .*?\n\*\*Date\*\*: .*?\n\*\*Status\*\*: .*?\n\*\*Owner\*\*: .*?\n\*\*Last Updated\*\*: .*?\n\*\*Next Review\*\*: .*?\n\n---\n\n/, '');

          // Add new header
          const newContent = headerTemplate(docId, title) + content;

          fs.writeFileSync(doc.path, newContent);
          console.log(`✅ Updated: ${doc.path}`);
        } catch (error) {
          console.error(`❌ Error updating ${doc.path}:`, error.message);
        }
      }
    });
  }

  /**
   * Extract title from file path
   */
  extractTitleFromPath(filePath) {
    const pathParts = filePath.split('/');

    if (pathParts.length === 1 && pathParts[0] === 'README.md') {
      return 'Project Overview';
    } else if (pathParts.includes('packages')) {
      const packageName = pathParts[pathParts.indexOf('packages') + 1];
      return `${packageName.charAt(0).toUpperCase() + packageName.slice(1)} Package`;
    } else if (pathParts.includes('apps')) {
      const appName = pathParts[pathParts.indexOf('apps') + 1];
      return `${appName.charAt(0).toUpperCase() + appName.slice(1)} Application`;
    } else if (pathParts.includes('services')) {
      const serviceName = pathParts[pathParts.indexOf('services') + 1];
      return `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service`;
    } else if (pathParts.includes('supabase')) {
      return 'Supabase Configuration';
    } else if (pathParts.includes('docs')) {
      const docName = pathParts[pathParts.indexOf('docs') + 1].replace('.md', '');
      return docName.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }

    return 'Documentation';
  }

  /**
   * Get next review date (3 months from today)
   */
  getNextReviewDate() {
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 3);
    return nextReview.toISOString().split('T')[0];
  }

  /**
   * Validate all documents for quality
   */
  validateDocuments() {
    console.log('🔍 Validating document quality...');

    const issues = [];

    this.documents.forEach((doc, index) => {
      if (doc.exists) {
        const docId = String(index + 1).padStart(3, '0');
        const content = fs.readFileSync(doc.path, 'utf8');

        // Check for required sections
        const requiredSections = ['Overview', 'Quick Start', 'Configuration'];
        const missingSections = requiredSections.filter(section =>
          !content.includes(section)
        );

        if (missingSections.length > 0) {
          issues.push({
            doc: doc.path,
            docId,
            issue: `Missing sections: ${missingSections.join(', ')}`
          });
        }

        // Check for code examples
        if (!content.includes('```')) {
          issues.push({
            doc: doc.path,
            docId,
            issue: 'No code examples found'
          });
        }

        // Check for proper header format
        if (!content.match(/^# DOC-\d+: .*/)) {
          issues.push({
            doc: doc.path,
            docId,
            issue: 'Missing or incorrect document header'
          });
        }
      }
    });

    if (issues.length > 0) {
      console.log('⚠️  Quality issues found:');
      issues.forEach(issue => {
        console.log(`   ${issue.docId}: ${issue.issue}`);
      });
    } else {
      console.log('✅ All documents pass quality checks');
    }

    return issues;
  }

  /**
   * Update the master registry
   */
  updateRegistry() {
    console.log('📋 Updating master document registry...');

    const registryContent = this.generateRegistryContent();
    fs.writeFileSync(this.registryPath, registryContent);
    console.log('✅ Master Document Registry updated');
  }

  /**
   * Generate registry content
   */
  generateRegistryContent() {
    let content = `# Master Document Registry

**Document Control System for AI-BOS Accounting SaaS Platform**

| Document ID | Document Title | Location | Version | Date Created | Last Updated | Status | Owner | Review Date |
|-------------|----------------|----------|---------|--------------|--------------|--------|-------|-------------|`;

    this.documents.forEach((doc, index) => {
      const docId = String(index + 1).padStart(3, '0');
      const title = this.extractTitleFromPath(doc.path);
      const location = doc.path;
      const lastUpdated = doc.lastModified ?
        doc.lastModified.toISOString().split('T')[0] : this.today;

      content += `\n| DOC-${docId} | ${title} | ${location} | ${this.version} | ${this.today} | ${lastUpdated} | Active | Development Team | ${this.getNextReviewDate()} |`;
    });

    // Add the rest of the registry content
    content += `

## Document Control Information

### Version Control System
- **Current Version**: ${this.version}
- **Version Format**: Major.Minor.Patch (e.g., 1.2.3)
- **Versioning Policy**: Semantic Versioning
- **Change Control**: All changes require approval and update to registry

### Document Status Definitions
- **Active**: Current, approved, and in use
- **Draft**: Under development or review
- **Superseded**: Replaced by newer version
- **Obsolete**: No longer relevant or used
- **Under Review**: Currently being reviewed for updates

### Review Schedule
- **Quarterly Review**: Every 3 months
- **Annual Review**: Complete documentation audit
- **Ad-hoc Review**: Triggered by significant changes
- **Next Scheduled Review**: ${this.getNextReviewDate()}

### Change Log

| Version | Date | Changes | Author | Approved By |
|---------|------|---------|--------|-------------|
| ${this.version} | ${this.today} | Initial creation of master document registry | Development Team | Project Manager |

---

**Document Control**: This registry is maintained by the Development Team and updated whenever documents are created, modified, or retired. All changes must be approved and recorded in the change log.

**Last Updated**: ${this.today}
**Next Review**: ${this.getNextReviewDate()}
**Registry Version**: ${this.version}`;

    return content;
  }

  /**
   * Generate document statistics
   */
  generateStats() {
    const stats = {
      totalDocuments: this.documents.length,
      activeDocuments: this.documents.filter(doc => doc.exists).length,
      lastUpdated: this.today,
      averageAge: this.calculateAverageAge(),
      qualityScore: this.calculateQualityScore()
    };

    console.log('📊 Document Statistics:');
    console.log(`   Total Documents: ${stats.totalDocuments}`);
    console.log(`   Active Documents: ${stats.activeDocuments}`);
    console.log(`   Average Age: ${stats.averageAge} days`);
    console.log(`   Quality Score: ${stats.qualityScore}%`);

    return stats;
  }

  /**
   * Calculate average document age
   */
  calculateAverageAge() {
    const now = new Date();
    const ages = this.documents
      .filter(doc => doc.lastModified)
      .map(doc => {
        const diffTime = Math.abs(now - doc.lastModified);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      });

    return ages.length > 0 ?
      Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore() {
    const issues = this.validateDocuments();
    const totalChecks = this.documents.length * 3; // 3 checks per document
    const passedChecks = totalChecks - issues.length;

    return Math.round((passedChecks / totalChecks) * 100);
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const manager = new DocumentManager();
  manager.init();

  switch (command) {
    case 'update-headers':
      manager.updateDocumentHeaders();
      break;
    case 'validate':
      manager.validateDocuments();
      break;
    case 'update-registry':
      manager.updateRegistry();
      break;
    case 'stats':
      manager.generateStats();
      break;
    case 'full-update':
      manager.updateDocumentHeaders();
      manager.updateRegistry();
      manager.generateStats();
      break;
    case 'help':
    default:
      console.log(`
📚 Document Manager for AI-BOS Accounting SaaS Platform

Usage: node scripts/document-manager.js <command>

Commands:
  update-headers    Update all document headers with standardized format
  validate         Validate document quality and completeness
  update-registry  Update the master document registry
  stats           Generate document statistics
  full-update     Perform complete update (headers + registry + stats)
  help            Show this help message

Examples:
  node scripts/document-manager.js full-update
  node scripts/document-manager.js validate
  node scripts/document-manager.js stats
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = DocumentManager;
