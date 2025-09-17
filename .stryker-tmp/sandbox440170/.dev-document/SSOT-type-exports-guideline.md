
# SSOT Type Export & Package Structure Guideline (NodeNext/ESM/TypeScript Monorepo)

**Last updated: 2025-09-15 — Proven in production, fully ESM/NodeNext/TypeScript 5+ compatible.**

## Purpose
This document defines the single source of truth (SSOT) strategy for type exports, package structure, and `exports` field configuration for all packages in this monorepo. It is designed to be robust for ESM/NodeNext, modern TypeScript, and all major bundlers.

---


## 1. SSOT for Types: One File, One Source
- **Each package must have a single SSOT file for public types.**
  - Recommended: `src/types.ts`
  - This file should only contain `export type { ... }` statements (no runtime exports).
- **All public types/interfaces must be re-exported from this file.**
- **No deep imports from internal files in consumer code.**
- **Type-only subpath must be a true DTS entry:** Your build must emit a `dist/types.d.ts` for the `types.ts` entry, not just for `index.ts`.

**Example:**
```ts
// src/types.ts (type-only, NodeNext .js specifiers)
export type {
  FeatureFlags,
  PolicySettings,
  MemberPermissions,
  UserContext,
} from "./sod.js";
```

---



## 2. `package.json` Exports Field

- **Explicitly export the SSOT types file as a subpath.**
- **Order matters:** Always put the `types` condition first.
- **Expose only intended subpaths.**
- **Expose `package.json` for tooling.**
- **Type-only subpaths should not have a runtime entry.**
- **All export paths must match your actual `dist/` output structure.**
  - Do **not** use `/src/` in export paths unless your build emits a `src/` folder inside `dist/`.
  - After every build, verify that all exported subpaths exist in `dist/` and point to the correct files.

**Example:**
```jsonc
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./types": {
    "types": "./dist/types.d.ts"
  },
  "./context/request-context": {
    "types": "./dist/context/request-context.d.ts",
    "import": "./dist/context/request-context.js"
  },
  "./package.json": "./package.json"
}
```
- For type-only subpaths, you may optionally ship a `dist/empty.js` with `export {};` and add a `"default": "./dist/empty.js"` to prevent runtime import errors, but this is not required if consumers only use type imports.

---


## 3. Consumer Import Pattern
- **Types:**
  ```ts
  import type { FeatureFlags, PolicySettings } from "@scope/pkg/types";
  ```
- **Runtime + types:**
  ```ts
  import { createSession } from "@scope/pkg";
  import type { UserContext } from "@scope/pkg/types";
  ```
- **Never import from `dist/` or deep internal files.**

---


## 4. TypeScript & Build Settings
- Use one TS version workspace-wide (≥5.3 recommended).
- All packages: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.
- Enable `"verbatimModuleSyntax": true` for type-only exports.
- Use `outDir`/`rootDir` for clean builds.
- Use project references or a build orchestrator (e.g., `tsc -b`, `tsup`, `rollup`).
- Do not use `paths` for published packages; rely on `exports`.
- **For type-only subpaths, ensure your build emits a DTS for each entry:**
  - With `tsup`, use:
    ```ts
    // tsup.config.ts
    export default defineConfig({
      entry: { index: "src/index.ts", types: "src/types.ts" },
      dts: { entry: { index: "src/index.ts", types: "src/types.ts" }, resolve: true },
      // ...
    });
    ```
  - With `tsc`, use a build config with `files: ["src/index.ts", "src/types.ts"]` and `emitDeclarationOnly: true`.

**Example `tsconfig.json`:**
```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "stripInternal": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": false
  },
  "include": ["src"]
}
```

---



## 5. Monorepo Consistency Checklist
- [ ] All packages have a `src/types.ts` as SSOT for types.
- [ ] All public types re-exported from `src/types.ts`.
- [ ] `package.json` has explicit `exports` for `./types` and other public subpaths.
- [ ] All `exports` subpaths in `package.json` have a corresponding file in `dist/` after build (no `/src/` unless present in output).
- [ ] No deep imports in consumer code.
- [ ] All packages use the same TS version and compatible `tsconfig.json`.
- [ ] All builds produce `.d.ts` files for all public entrypoints before consumers compile.
- [ ] (Optional) Ship `dist/empty.js` for type-only subpaths.
---

## 6a. Troubleshooting: Common Export/Type Issues

- **Symptom:** `Cannot find module '@scope/pkg/subpath' or its corresponding type declarations.`
  - **Fix:** Ensure the subpath is exported in `package.json` and the file exists in `dist/` after build. Remove `/src/` from the path if not present in output.
- **Symptom:** Type-only subpath import fails at runtime.
  - **Fix:** Optionally ship a `dist/empty.js` and add a `default` export for the subpath.

---

## 6. FAQ
- **Q: Why not use `index.ts` for types?**
  - A: Keeping types in a dedicated file avoids runtime bloat and makes intent clear.
- **Q: What if I need both runtime and types?**
  - A: Use `index.ts` for runtime, `types.ts` for types. Import both as needed.
- **Q: What about CJS?**
  - A: Only add CJS exports if you actually build CJS output.

---

## 7. References
- [TypeScript: Package Exports](https://www.typescriptlang.org/docs/handbook/esm-node.html#package-exports)
- [Node.js: Conditional Exports](https://nodejs.org/api/packages.html#exports)
- [TypeScript: Module Resolution](https://www.typescriptlang.org/tsconfig#moduleResolution)

---


**This document is the canonical SSOT export and package structure guideline for this monorepo. All new and existing packages must comply.**
