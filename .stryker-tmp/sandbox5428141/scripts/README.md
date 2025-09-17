# DOC-179: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Scripts Directory

This directory contains all automation scripts organized by purpose for better maintainability and
discoverability.

## 📁 Directory Structure

### 🔗 `dependencies/`

Scripts for managing dependencies and workspace protocol compliance.

- **`check-internal-workspace.js`** - Validates that all `@aibos/*` dependencies use `workspace:*`
  protocol
- **`deps-doctor.js`** - Comprehensive dependency health checks and diagnostics

### 🎨 `code-quality/`

Scripts for maintaining code quality, style consistency, and accessibility compliance.

- **`check-token-compliance.js`** - Token system and WCAG 2.2 AAA compliance checker
- **`safe-fix.cjs`** - Safe code fixes for spacing, colors, and accessibility issues

### 🧪 `testing/`

Scripts for running various test suites and test-related tasks.

- **`run-attachment-tests.ps1`** - Attachment service test runner with coverage reporting
- **`run-tests.ps1`** - Comprehensive test suite runner for Supabase multi-tenant system

### 🏗️ `infrastructure/`

Scripts for setting up and managing development infrastructure.

- **`quick-start.ps1`** - Quick Supabase setup for development
- **`setup-local-supabase.ps1`** - Local Supabase environment setup
- **`setup-local-supabase.sh`** - Linux/macOS version of local setup
- **`supabase-setup.sh`** - Additional Supabase configuration scripts

### 📚 `docs/`

Scripts for documentation generation and maintenance.

- **`create-missing-guides.mjs`** - Creates missing documentation guides
- **`doctor.mjs`** - Documentation health checker
- **`grammar-check.mjs`** - Grammar and style checker for documentation
- **`run.mjs`** - Generic script runner utility
- **`validate-internal-refs.mjs`** - Validates internal documentation references

### 🛠️ `utilities/`

General utility scripts and documentation.

- **`README.md`** - This file

## 🚀 Usage

### Dependency Management

```bash
# Check workspace protocol compliance
pnpm deps:check

# Run dependency diagnostics
pnpm deps:doctor

# Analyze dependency drift
pnpm deps:analyze
```

### Code Quality

```bash
# Check token compliance and accessibility
pnpm check:tokens

# Run safe code fixes
node scripts/code-quality/safe-fix.cjs --write
```

### Testing

```bash
# Run attachment tests
.\scripts\testing\run-attachment-tests.ps1

# Run comprehensive test suite
.\scripts\testing\run-tests.ps1
```

### Infrastructure Setup

```bash
# Quick Supabase setup
.\scripts\infrastructure\quick-start.ps1

# Local Supabase setup
.\scripts\infrastructure\setup-local-supabase.ps1
```

### Documentation

```bash
# Create missing guides
node scripts/docs/create-missing-guides.mjs

# Check documentation health
node scripts/docs/doctor.mjs
```

## 🔧 Development

### Adding New Scripts

1. **Choose the appropriate category** based on the script's purpose
2. **Place the script** in the relevant subdirectory
3. **Update package.json** if the script should be accessible via npm scripts
4. **Update this README** to document the new script

### Script Naming Conventions

- **JavaScript/TypeScript**: Use descriptive names with `.js` or `.ts` extension
- **PowerShell**: Use descriptive names with `.ps1` extension
- **Shell scripts**: Use descriptive names with `.sh` extension
- **ESM modules**: Use `.mjs` extension for ES modules

### Best Practices

- **Error Handling**: Include comprehensive error handling and user-friendly messages
- **Documentation**: Add JSDoc comments for JavaScript functions
- **Logging**: Use consistent logging with colors and emojis for better UX
- **Exit Codes**: Use appropriate exit codes (0 for success, non-zero for failure)
- **Cross-platform**: Consider both Windows and Unix compatibility when possible

## 📋 Script Categories

| Category           | Purpose                                            | Scripts   |
| ------------------ | -------------------------------------------------- | --------- |
| **Dependencies**   | Manage package dependencies and workspace protocol | 2 scripts |
| **Code Quality**   | Maintain code standards and accessibility          | 2 scripts |
| **Testing**        | Run tests and generate coverage reports            | 2 scripts |
| **Infrastructure** | Set up development environment                     | 4 scripts |
| **Documentation**  | Generate and maintain documentation                | 5 scripts |
| **Utilities**      | General utilities and helpers                      | 1 script  |

## 🔍 Finding Scripts

- **By Purpose**: Browse the appropriate subdirectory
- **By Type**: Use file extensions to identify script types
- **By Name**: Use descriptive names that indicate functionality
- **By Package.json**: Check the `scripts` section for npm-accessible commands

---

_Last updated: $(Get-Date -Format "yyyy-MM-dd")_
