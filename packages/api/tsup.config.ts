import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/server.ts", "src/client.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: "node18",
  external: ["express", "cors", "helmet", "express-rate-limit", "compression", "morgan"],
  esbuildOptions(options) {
    options.banner = {
      js: '"use strict";',
    };
  },
});
