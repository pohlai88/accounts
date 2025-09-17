# Hybrid SSOT Type Export & Package Structure Guideline

## Practical ESM/TypeScript Monorepo Configuration

**Last updated: 2025-01-27 — Hybrid approach balancing best practices with practical implementation**

---

## Purpose

This document defines a **hybrid SSOT strategy** for type exports, package structure, and `exports` field configuration for this monorepo. It combines theoretical best practices with practical implementation needs, designed to work with the current ESM/TypeScript setup while fixing deep import issues.

---

## 1. Hybrid SSOT for Types: Flexible Type Management

### **Core Principle:**

- **Each package must have a single SSOT file for public types**
- **Recommended: `src/types.ts`** (but flexible based on package needs)
- **This file should primarily contain `export type { ... }` statements**
- **Runtime exports in types.ts are acceptable if they're constants/enums**

### **Flexible Type Export Patterns:**

#### **Pattern A: Pure Type-Only (Recommended for most packages)**

```ts
// src/types.ts (type-only, NodeNext .js specifiers)
export type { FeatureFlags, PolicySettings, MemberPermissions, UserContext } from "./sod.js";

// Constants/enums are acceptable
export const DEFAULT_TIMEOUT = 5000;
export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
```

#### **Pattern B: Mixed Types + Constants (Acceptable)**

```ts
// src/types.ts (types + runtime constants)
export type { JournalId, InvoiceId, TenantId } from "@aibos/contracts";

// Runtime exports for constants/enums are acceptable
export { STALENESS_THRESHOLDS } from "./fx/ingest.js";
export { defaultFxPolicy } from "./fx/policy.js";
```

#### **Pattern C: Component Packages (UI-specific)**

```ts
// src/types.ts (UI component types)
export type { ComponentProps, ThemeConfig } from "./components/index.js";

// Re-export component types for external consumption
export type { ButtonProps } from "./Button.js";
export type { CardProps } from "./Card.js";
```

---

## 2. Hybrid `package.json` Exports Field

### **Core Principle:**

- **Explicitly export the SSOT types file as a subpath**
- **Order matters:** Always put the `types` condition first
- **Support both main package imports AND subpath imports**
- **Expose `package.json` for tooling**

### **Hybrid Export Patterns:**

#### **Pattern A: Main Package Only (Recommended for most packages)**

```jsonc
{
  "main": "dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
    },
    "./types": {
      "types": "./dist/types.d.ts",
    },
    "./package.json": "./package.json",
  },
}
```

#### **Pattern B: Main + Subpaths (For complex packages like UI)**

```jsonc
{
  "main": "dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
    },
    "./types": {
      "types": "./dist/types.d.ts",
    },
    "./Button": {
      "types": "./dist/Button.d.ts",
      "import": "./dist/Button.js",
    },
    "./Card": {
      "types": "./dist/Card.d.ts",
      "import": "./dist/Card.js",
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.js",
    },
    "./package.json": "./package.json",
  },
}
```

#### **Pattern C: Legacy Support (For packages with existing deep imports)**

```jsonc
{
  "main": "dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
    },
    "./types": {
      "types": "./dist/types.d.ts",
    },
    // Legacy subpath support
    "./Button": {
      "types": "./dist/Button.d.ts",
      "import": "./dist/Button.js",
    },
    "./Card": {
      "types": "./dist/Card.d.ts",
      "import": "./dist/Card.js",
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.js",
    },
    "./hooks/use-tenant-management": {
      "types": "./dist/hooks/use-tenant-management.d.ts",
      "import": "./dist/hooks/use-tenant-management.js",
    },
    "./components/tenant-switcher": {
      "types": "./dist/components/tenant-switcher.d.ts",
      "import": "./dist/components/tenant-switcher.js",
    },
    "./package.json": "./package.json",
  },
}
```

---

## 3. Hybrid Consumer Import Patterns

### **Preferred Import Patterns:**

#### **Pattern A: Main Package Import (Recommended)**

```ts
// Types only
import type { FeatureFlags, PolicySettings } from "@aibos/auth/types";

// Runtime + types
import { createSession } from "@aibos/auth";
import type { UserContext } from "@aibos/auth/types";

// UI components (main package)
import { Button, Card, cn } from "@aibos/ui";
```

#### **Pattern B: Subpath Imports (Acceptable for UI packages)**

```ts
// UI components (subpath imports)
import { Button } from "@aibos/ui/Button";
import { Card } from "@aibos/ui/Card";
import { cn } from "@aibos/ui/utils";

// Hooks and utilities
import { useTenantManagement } from "@aibos/ui/hooks/use-tenant-management";
import { TenantSwitcher } from "@aibos/ui/components/tenant-switcher";
```

#### **Pattern C: Mixed Imports (Transitional)**

```ts
// Mix of main package and subpath imports
import { Button, Card } from "@aibos/ui"; // Main package
import { cn } from "@aibos/ui/utils"; // Subpath
import type { ButtonProps } from "@aibos/ui/types"; // Types
```

---

## 4. Hybrid TypeScript & Build Settings

### **Core Configuration (Hybrid Approach):**

#### **Base TypeScript Configuration:**

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext", // Keep ESNext for flexibility
    "moduleResolution": "nodenext", // Use nodenext for modern resolution
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true, // Enable for type-only exports
    "declaration": true,
    "declarationMap": true,
    "stripInternal": true,
  },
}
```

#### **Package-Level TypeScript Configuration:**

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "types": ["node"],
    "moduleResolution": "nodenext",
    "module": "NodeNext", // Use NodeNext at package level
  },
  "include": ["src", "src/types.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.spec.ts"],
}
```

### **Build Configuration Patterns:**

#### **Pattern A: Standard TypeScript Build**

```jsonc
// tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
  },
  "include": ["src", "src/types.ts"],
}
```

#### **Pattern B: tsup Build (For complex packages)**

```ts
// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types.ts",
    Button: "src/Button.tsx",
    Card: "src/Card.tsx",
    utils: "src/utils.ts",
  },
  format: ["esm"],
  outDir: "dist",
  dts: {
    entry: {
      index: "src/index.ts",
      types: "src/types.ts",
      Button: "src/Button.tsx",
      Card: "src/Card.tsx",
      utils: "src/utils.ts",
    },
    resolve: true,
  },
  sourcemap: true,
  clean: true,
  target: "es2022",
  treeshake: true,
  splitting: false,
  skipNodeModulesBundle: true,
});
```

---

## 5. Hybrid Monorepo Consistency Checklist

### **Required Compliance:**

- [ ] All packages have a `src/types.ts` as SSOT for types
- [ ] All public types re-exported from `src/types.ts`
- [ ] `package.json` has explicit `exports` for `./types` and main package
- [ ] All `exports` subpaths in `package.json` have corresponding files in `dist/`
- [ ] All packages use compatible `tsconfig.json` with NodeNext at package level
- [ ] All builds produce `.d.ts` files for all public entrypoints
- [ ] Main package imports work: `import { Component } from "@aibos/ui"`
- [ ] Type-only imports work: `import type { Type } from "@aibos/ui/types"`

### **Optional Compliance (For UI packages):**

- [ ] Subpath imports work: `import { Button } from "@aibos/ui/Button"`
- [ ] Deep imports work: `import { Hook } from "@aibos/ui/hooks/hook-name"`
- [ ] Legacy import patterns supported during transition

---

## 6. Hybrid Troubleshooting Guide

### **Common Issues and Solutions:**

#### **Issue: "Cannot find module '@scope/pkg/subpath' or its corresponding type declarations"**

**Solution:** Ensure the subpath is exported in `package.json` and the file exists in `dist/` after build

```jsonc
// Add missing export
"./Button": {
  "types": "./dist/Button.d.ts",
  "import": "./dist/Button.js"
}
```

#### **Issue: "Relative import paths need explicit file extensions"**

**Solution:** Add `.js` extensions to relative imports

```ts
// ❌ Wrong
import { Component } from "./Component";

// ✅ Correct
import { Component } from "./Component.js";
```

#### **Issue: "Cannot find module '@aibos/ui' or its corresponding type declarations"**

**Solution:** Fix package.json main and exports paths

```jsonc
// ❌ Wrong
"main": "dist/ui/src/index.js",
"exports": {
  ".": {
    "import": "./dist/ui/src/index.js"
  }
}

// ✅ Correct
"main": "dist/index.js",
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  }
}
```

#### **Issue: Type-only subpath import fails at runtime**

**Solution:** Ensure type-only subpaths don't have runtime entries

```jsonc
// ✅ Correct for type-only subpaths
"./types": {
  "types": "./dist/types.d.ts"
  // No "import" or "default" entry
}
```

---

## 7. Migration Strategy

### **Phase 1: Fix Critical Issues**

1. Fix package.json exports paths to match actual build output
2. Add missing `types` conditions to all exports
3. Fix build processes to actually generate dist files
4. Add missing file extensions to relative imports

### **Phase 2: Standardize Patterns**

1. Ensure all packages have `src/types.ts` as SSOT
2. Standardize export patterns across packages
3. Fix deep import issues by adding proper subpath exports
4. Update TypeScript configurations for consistency

### **Phase 3: Optimize (Optional)**

1. Migrate from subpath imports to main package imports
2. Implement pure type-only exports where possible
3. Add advanced build optimizations

---

## 8. Package-Specific Guidelines

### **UI Package (Complex Component Library)**

- **Use Pattern B or C** for exports (main + subpaths)
- **Support both** main package and subpath imports
- **Include** component-specific exports for individual components
- **Build with tsup** for better tree-shaking and multiple entry points

### **Utility Packages (utils, auth, etc.)**

- **Use Pattern A** for exports (main package only)
- **Prefer** main package imports
- **Keep** types.ts pure type-only when possible
- **Build with tsc** for simplicity

### **Data Packages (db, contracts, etc.)**

- **Use Pattern A** for exports
- **Focus on** type safety and SSOT
- **Minimize** runtime exports in types.ts
- **Build with tsc** with strict settings

---

## 9. Best Practices Summary

### **DO:**

- ✅ Use `src/types.ts` as SSOT for types
- ✅ Put `types` condition first in exports
- ✅ Support both main package and subpath imports
- ✅ Add `.js` extensions to relative imports
- ✅ Ensure export paths match actual build output
- ✅ Use `verbatimModuleSyntax: true` for type safety
- ✅ Include `./package.json` export for tooling

### **DON'T:**

- ❌ Use inconsistent export paths (`/src/` vs no `/src/`)
- ❌ Forget to add `types` condition to exports
- ❌ Mix runtime and type exports without clear separation
- ❌ Use deep imports without proper subpath exports
- ❌ Skip file extensions in relative imports
- ❌ Reference non-existent build output paths

---

## 10. References

- [TypeScript: Package Exports](https://www.typescriptlang.org/docs/handbook/esm-node.html#package-exports)
- [Node.js: Conditional Exports](https://nodejs.org/api/packages.html#exports)
- [TypeScript: Module Resolution](https://www.typescriptlang.org/tsconfig#moduleResolution)
- [Original SSOT Guideline](.dev-document/SSOT-type-exports-guideline.md)

---

**This hybrid guideline balances theoretical best practices with practical implementation needs, providing a flexible approach that can be adopted incrementally while fixing current deep import issues.**
