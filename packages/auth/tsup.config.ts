import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types.ts", // ← SSOT types entry
    "types-entry": "src/types-entry.ts", // ← emit dist/types-entry.d.ts
  },
  format: ["esm"],
  outDir: "dist",
  dts: {
    entry: {
      index: "src/index.ts",
      types: "src/types.ts",
      "types-entry": "src/types-entry.ts", // ← ensures dist/types-entry.d.ts
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
