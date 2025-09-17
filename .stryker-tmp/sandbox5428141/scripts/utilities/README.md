# DOC-180: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Scripts — Development & Maintenance Tools

> **TL;DR**: Collection of development scripts for code quality, compliance checking, automated
> fixes, and local environment setup. Enforces SSOT principles and WCAG 2.2 AAA accessibility
> standards.  
> **Owner**: @aibos/devops-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Provides development and maintenance automation scripts
- Enforces token system compliance and SSOT principles
- Validates WCAG 2.2 AAA accessibility standards
- Automates safe code fixes and improvements
- Sets up local development environments
- Maintains code quality and consistency

**Does NOT**:

- Implement business logic (delegated to packages)
- Handle UI components (delegated to @aibos/ui)
- Manage database operations (delegated to @aibos/db)
- Provide API endpoints (implemented by @aibos/web-api)

**Consumers**: Developers, CI/CD pipelines, local development environments

## 2) Quick Links

- **Token Compliance**: `check-token-compliance.js`
- **Safe Fixes**: `safe-fix.cjs`
- **Local Setup (Windows)**: `setup-local-supabase.ps1`
- **Local Setup (Unix)**: `setup-local-supabase.sh`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Check token compliance
node scripts/check-token-compliance.js

# Run safe fixes (dry run)
node scripts/safe-fix.cjs

# Apply safe fixes
node scripts/safe-fix.cjs --write

# Setup local Supabase (Windows)
.\scripts\setup-local-supabase.ps1

# Setup local Supabase (Unix)
./scripts/setup-local-supabase.sh
```

## 4) Script Categories

### **Code Quality & Compliance**

- **Token Compliance Checker**: Validates semantic token usage
- **WCAG 2.2 AAA Checker**: Ensures accessibility compliance
- **Safe Fix Automation**: Automated code improvements
- **Code Style Enforcement**: Maintains consistent code style

### **Development Environment**

- **Local Supabase Setup**: Automated local database setup
- **Environment Configuration**: Development environment preparation
- **Dependency Management**: Package and dependency validation

### **Maintenance & Automation**

- **Automated Fixes**: Safe code transformations
- **Compliance Validation**: Continuous compliance checking
- **Code Quality Gates**: Pre-commit and CI validation

## 5) Core Scripts

### **Token Compliance Checker (`check-token-compliance.js`)**

**Purpose**: Scans codebase for violations of the token system and WCAG 2.2 AAA compliance

**Features**:

- Detects raw hex colors (#ffffff, #000, etc.)
- Finds arbitrary Tailwind values ([#fff], [12px], etc.)
- Identifies inline style props
- Validates WCAG 2.2 AAA accessibility standards
- Provides detailed violation reports with fix suggestions

**Usage**:

```bash
# Check compliance
node scripts/check-token-compliance.js

# Exit code 0: No violations
# Exit code 1: Violations found
```

**Violation Categories**:

- **Token System**: Raw colors, arbitrary values, inline styles
- **WCAG 2.2 AAA**: Missing ARIA labels, focus management, semantic roles

### **Safe Fix Automation (`safe-fix.cjs`)**

**Purpose**: Automatically fixes common code issues while maintaining safety

**Features**:

- Converts arbitrary Tailwind values to semantic tokens
- Fixes spacing, radius, and text size values
- Adds ARIA labels to icon buttons
- Maintains code safety with conservative heuristics
- Reports unfixable issues for manual review

**Usage**:

```bash
# Dry run (preview changes)
node scripts/safe-fix.cjs

# Apply fixes
node scripts/safe-fix.cjs --write

# Include ARIA fixes
node scripts/safe-fix.cjs --write --fix-aria
```

**Fix Categories**:

- **Spacing**: Converts [1rem] to space-4, [2rem] to space-8
- **Radius**: Converts [8px] to rounded-lg, [12px] to rounded-xl
- **Text Sizes**: Converts [1.25rem] to text-xl
- **ARIA Labels**: Adds aria-label to icon buttons

### **Local Supabase Setup**

**Purpose**: Automated setup of local Supabase development environment

**Features**:

- Checks for required dependencies (Supabase CLI, Docker)
- Initializes Supabase project if needed
- Starts local Supabase services
- Applies database schema
- Provides connection details and environment variables

**Usage**:

```bash
# Windows PowerShell
.\scripts\setup-local-supabase.ps1

# Unix/Linux/macOS
./scripts/setup-local-supabase.sh
```

**Prerequisites**:

- Supabase CLI installed (`npm install -g supabase`)
- Docker running
- Network access for Docker containers

## 6) Compliance Standards

### **Token System Compliance**

- **Semantic Tokens**: All styling must use semantic token classes
- **No Raw Colors**: No hardcoded hex colors (#ffffff, #000, etc.)
- **No Arbitrary Values**: No arbitrary Tailwind values ([12px], [#fff])
- **No Inline Styles**: No inline style props in JSX/TSX
- **CSS Variables**: Use CSS variables for dynamic values

### **WCAG 2.2 AAA Compliance**

- **ARIA Labels**: All interactive elements must have aria-label or aria-labelledby
- **Focus Management**: Interactive elements must have focus styles
- **Semantic Roles**: Clickable divs/spans must have role attributes
- **Alt Text**: All images must have alt attributes
- **Form Labels**: Form elements must have proper labels
- **Heading Hierarchy**: Proper H1 → H2 → H3 hierarchy
- **Live Regions**: Dynamic content must have aria-live regions
- **Skip Links**: Main content must have skip link targets

## 7) Safe Fix Heuristics

### **Spacing Conversions**

- **Allowed Values**: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20 (4px units)
- **Conversion**: [1rem] → space-4, [2rem] → space-8
- **Viewport Units**: [90vh] → max-h-screen, [100vw] → max-w-screen

### **Radius Conversions**

- **Allowed Values**: 0, 2, 6, 8, 12, 16, 9999px
- **Conversion**: [8px] → rounded-lg, [12px] → rounded-xl
- **Side Variants**: rounded-tl-[2px] → rounded-tl-sm

### **Text Size Conversions**

- **Allowed Values**: 12, 14, 16, 18, 20, 24, 30, 36px
- **Conversion**: [1.25rem] → text-xl, [1.5rem] → text-2xl

### **ARIA Label Inference**

- **Icon Detection**: Identifies aria-hidden SVG icons
- **Label Sources**: title, data-label, icon class names, component names
- **Keyword Mapping**: close → "Close", search → "Search", etc.
- **Safety**: Only adds labels when confident about meaning

## 8) Usage Examples

### **Token Compliance Checking**

```bash
# Check all packages and apps
node scripts/check-token-compliance.js

# Output example:
# 🔍 Checking token system compliance and WCAG 2.2 AAA compliance...
#
# 📁 Scanning packages/ui/src...
# 📁 Scanning apps/web/app...
#
# ❌ Found 3 violations:
#
# 🎨 Token System Violations (2):
# 📄 packages/ui/src/Button.tsx:
#    Line 15: Raw Hex Colors in JSX/TSX
#    Found: "#ffffff"
#    Fix: Raw hex colors found. Use semantic token classes instead.
#
# ♿ WCAG 2.2 AAA Violations (1):
# 📄 apps/web/app/page.tsx:
#    Line 23: Missing ARIA Labels [HIGH]
#    Found: "<button>"
#    Fix: Interactive elements missing aria-label or aria-labelledby.
```

### **Safe Fix Automation**

```bash
# Preview changes
node scripts/safe-fix.cjs

# Output example:
# 🔎 Would fix: packages/ui/src/Button.tsx
# ⚠️  Unfixable items in apps/web/app/page.tsx: bracket-class, color-literal
#
# — Safe Fix Summary —
# Files to edit: 1
# Edits planned: 3
# Still needs attention:
#   • bracket-class: 2
#   • color-literal: 1

# Apply fixes
node scripts/safe-fix.cjs --write --fix-aria

# Output example:
# ✏️  Fixed: packages/ui/src/Button.tsx
#    ↳ ✅ added 2 aria-labels
#
# — Safe Fix Summary —
# Files edited: 1
# Edits applied: 3
# ARIA labels auto-added: 2
```

### **Local Environment Setup**

```bash
# Windows
.\scripts\setup-local-supabase.ps1

# Output example:
# 🚀 Setting up Local Supabase for AIBOS Accounts...
# ✅ Supabase CLI found
# ✅ Docker is running
# 📁 Initializing Supabase project...
# 🔄 Starting local Supabase...
# 📊 Applying database schema...
#
# 🎉 Local Supabase is ready!
#
# 📋 Connection Details:
# API URL: http://localhost:54321
# Database URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
```

## 9) Integration with CI/CD

### **Pre-commit Hooks**

```bash
# Check compliance before commit
node scripts/check-token-compliance.js

# Apply safe fixes
node scripts/safe-fix.cjs --write --fix-aria
```

### **CI Pipeline Integration**

```yaml
# GitHub Actions example
- name: Check Token Compliance
  run: node scripts/check-token-compliance.js

- name: Apply Safe Fixes
  run: node scripts/safe-fix.cjs --write --fix-aria

- name: Verify No Remaining Issues
  run: node scripts/check-token-compliance.js
```

### **Exit Codes**

- **0**: Success, no violations
- **1**: Violations found (token compliance)
- **2**: Unfixable issues remain (safe fix)

## 10) Troubleshooting

**Common Issues**:

- **Token Violations**: Replace raw colors with semantic token classes
- **WCAG Violations**: Add missing ARIA labels and focus styles
- **Unfixable Issues**: Manual review required for complex cases
- **Docker Issues**: Ensure Docker is running for Supabase setup

**Debug Mode**:

```bash
# Verbose token compliance checking
DEBUG=token-compliance node scripts/check-token-compliance.js

# Dry run with detailed output
node scripts/safe-fix.cjs --verbose
```

**Logs**:

- Token compliance violation reports
- Safe fix application logs
- Supabase setup progress
- Unfixable issue summaries

## 11) Contributing

**Code Style**:

- Follow Node.js best practices
- Use conservative heuristics for safety
- Document all fix patterns
- Maintain backward compatibility

**Testing**:

- Test all fix patterns
- Validate compliance checking
- Test edge cases and error scenarios
- Verify Supabase setup scripts

**Review Process**:

- All changes must maintain safety
- Breaking changes require major version bump
- New fix patterns need validation
- Documentation must be updated

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [Tokens Package](../packages/tokens/README.md)
- [UI Package](../packages/ui/README.md)

---

## 🔗 **Script Principles**

### **Safety First**

- Conservative heuristics for automated fixes
- Dry run mode for previewing changes
- Unfixable issue reporting
- Manual review for complex cases

### **Compliance Enforcement**

- Token system compliance validation
- WCAG 2.2 AAA accessibility checking
- SSOT principle enforcement
- Code quality maintenance

### **Developer Experience**

- Clear violation reports with fix suggestions
- Automated environment setup
- Easy integration with CI/CD
- Comprehensive documentation

### **Maintainability**

- Modular script architecture
- Extensible fix patterns
- Clear error messages
- Regular validation and testing

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
