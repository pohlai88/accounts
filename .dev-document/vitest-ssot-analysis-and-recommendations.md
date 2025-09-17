# 🔍 Vitest SSOT Analysis & Recommendations

## 📋 **Current State Analysis**

### **✅ What's Working Well**

#### **1. SSOT Configuration Structure**

- **Centralized Configuration**: `packages/config/vitest-config/index.ts` provides unified defaults
- **Environment-Specific Configs**: Node, jsdom, happy-dom configurations available
- **Package-Specific Overrides**: Accounting, security, db coverage configurations
- **Monorepo Aliases**: Centralized resolve aliases for all packages
- **Coverage Thresholds**: 95% global, with package-specific overrides (98% for accounting, 90% for db)

#### **2. Root-Level Integration**

- **Root Config**: `vitest.config.ts` properly extends SSOT with monorepo-specific overrides
- **Environment Variables**: Test environment variables properly configured
- **Test Patterns**: Comprehensive include/exclude patterns for monorepo structure
- **Coverage Overrides**: Root-level coverage thresholds match SSOT expectations

#### **3. Package-Level Usage**

- **Consistent Pattern**: All packages use `mergeConfig(base, nodeConfig, packageConfig)`
- **Proper Imports**: Packages correctly import from `@aibos/vitest-config`
- **Minimal Overrides**: Packages only override what's necessary

### **⚠️ Issues Identified**

#### **1. ESM Configuration Problems**

```bash
# Current Error Pattern:
ERROR: "@aibos/vitest-config" resolved to an ESM file. ESM file cannot be loaded by `require`
```

**Root Cause**: The vitest-config package is configured as ESM but packages are trying to import it using CommonJS require.

#### **2. Duplicate Configuration**

- **Root vs SSOT**: Root `vitest.config.ts` duplicates many configurations from SSOT
- **Alias Redundancy**: Monorepo aliases defined in both root and SSOT
- **Coverage Duplication**: Coverage thresholds repeated in multiple places

#### **3. Performance Issues**

- **Large Config Files**: SSOT config is 268 lines with extensive coverage configurations
- **Complex Merging**: Multiple `mergeConfig` calls create complex inheritance chains
- **Slow Resolution**: ESM/CommonJS conflicts slow down test startup

#### **4. Maintenance Challenges**

- **Scattered Overrides**: Package-specific configs scattered across multiple files
- **Version Drift**: Different packages might use different vitest versions
- **Hard to Debug**: Complex inheritance makes debugging difficult

## 🎯 **Recommendations**

### **Option 1: Fix Current SSOT (Recommended)**

#### **1.1 Fix ESM Configuration**

```typescript
// packages/config/vitest-config/package.json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

#### **1.2 Simplify SSOT Structure**

```typescript
// packages/config/vitest-config/index.ts
export const baseConfig = defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      thresholds: { global: { branches: 95, functions: 95, lines: 95, statements: 95 } },
    },
    // Simplified configuration
  },
});

// Environment-specific configs
export const nodeConfig = defineConfig({ test: { environment: "node" } });
export const jsdomConfig = defineConfig({ test: { environment: "jsdom" } });

// Package-specific configs
export const accountingConfig = defineConfig({
  test: {
    coverage: {
      thresholds: { global: { branches: 98, functions: 98, lines: 98, statements: 98 } },
    },
  },
});
```

#### **1.3 Root-Level Simplification**

```typescript
// vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import base, { jsdomConfig } from "@aibos/vitest-config";

export default mergeConfig(
  base,
  jsdomConfig,
  defineConfig({
    test: {
      setupFiles: ["./tests/setup.ts"],
      env: { NODE_ENV: "test", DATABASE_URL: process.env.DATABASE_URL },
      sequence: { shuffle: true },
      // Only root-specific overrides
    },
  }),
);
```

### **Option 2: Root-Directory Implementation (Alternative)**

#### **2.1 Move SSOT to Root**

```typescript
// vitest.config.base.ts (root level)
export const baseConfig = defineConfig({
  // All SSOT configuration here
});

// vitest.config.ts (root level)
export default mergeConfig(
  baseConfig,
  defineConfig({
    // Root-specific overrides
  }),
);
```

#### **2.2 Package-Level Simplification**

```typescript
// packages/*/vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import base from "../../vitest.config.base";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      // Only package-specific overrides
    },
  }),
);
```

### **Option 3: Hybrid Approach (Best of Both)**

#### **3.1 Core SSOT + Root Extensions**

```typescript
// packages/config/vitest-config/index.ts (Core SSOT)
export const coreConfig = defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: { provider: "v8" },
    // Core settings only
  },
});

// vitest.config.ts (Root extensions)
import { defineConfig, mergeConfig } from "vitest/config";
import { coreConfig } from "@aibos/vitest-config";

export default mergeConfig(
  coreConfig,
  defineConfig({
    test: {
      // Monorepo-wide settings
      setupFiles: ["./tests/setup.ts"],
      env: { NODE_ENV: "test" },
      coverage: {
        thresholds: {
          global: { branches: 95, functions: 95, lines: 95, statements: 95 },
          "packages/accounting/**": { branches: 98, functions: 98, lines: 98, statements: 98 },
          "packages/db/**": { branches: 90, functions: 90, lines: 90, statements: 90 },
        },
      },
    },
  }),
);
```

## 📊 **Comparison with Other Test Configurations**

### **E2E Tests (Playwright)**

- **✅ Independent Configuration**: `playwright.config.ts` is self-contained
- **✅ Clear Dependencies**: Explicit dependencies on web apps
- **✅ Performance Focused**: Timeout and performance configurations
- **✅ Environment Specific**: Different configs for CI vs local

### **Performance Tests (K6)**

- **✅ Tool-Specific**: K6-specific configuration files
- **✅ Scenario-Based**: Different configs for different test scenarios
- **✅ Monitoring Integration**: Built-in monitoring and alerting
- **✅ Load-Specific**: Configurations optimized for load testing

### **Integration Tests**

- **✅ Environment Setup**: Dedicated setup files for integration testing
- **✅ Database Focused**: Supabase-specific configurations
- **✅ Timeout Management**: Longer timeouts for database operations

## 🚀 **Recommended Implementation**

### **Phase 1: Fix ESM Issues (Immediate)**

1. **Fix Package Configuration**: Update `packages/config/vitest-config/package.json` to support both ESM and CommonJS
2. **Simplify SSOT**: Reduce complexity in the main configuration file
3. **Test Resolution**: Verify all packages can import the config without errors

### **Phase 2: Optimize Structure (Short-term)**

1. **Remove Duplication**: Eliminate duplicate configurations between root and SSOT
2. **Simplify Inheritance**: Reduce the number of `mergeConfig` calls
3. **Performance Optimization**: Optimize configuration loading and resolution

### **Phase 3: Enhance Maintainability (Long-term)**

1. **Documentation**: Create clear documentation for configuration inheritance
2. **Validation**: Add configuration validation to catch errors early
3. **Tooling**: Create scripts to validate configuration consistency

## 📈 **Expected Benefits**

### **Performance Improvements**

- **Faster Test Startup**: Resolve ESM/CommonJS conflicts
- **Reduced Memory Usage**: Simpler configuration inheritance
- **Better Caching**: Optimized configuration resolution

### **Maintainability Improvements**

- **Single Source of Truth**: Clear configuration hierarchy
- **Easier Debugging**: Simplified inheritance chains
- **Consistent Behavior**: Unified configuration across all packages

### **Developer Experience**

- **Faster Development**: Quicker test execution
- **Better Error Messages**: Clearer configuration errors
- **Easier Onboarding**: Simpler configuration structure

## 🎯 **Conclusion**

**The current SSOT approach is fundamentally sound but needs optimization:**

1. **✅ Keep SSOT Structure**: The centralized configuration approach is correct
2. **🔧 Fix ESM Issues**: Resolve the ESM/CommonJS conflicts immediately
3. **⚡ Optimize Performance**: Simplify configuration inheritance
4. **📚 Improve Documentation**: Make configuration hierarchy clear

**Recommended Action**: Implement **Option 1 (Fix Current SSOT)** as it maintains the existing architecture while resolving the critical issues.

The SSOT approach aligns well with other test configurations (E2E with Playwright, Performance with K6) and provides the consistency needed for a monorepo structure.
