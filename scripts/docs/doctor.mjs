#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const steps = [
  { name: "Internal refs", cmd: "node", args: ["scripts/docs/validate-internal-refs.mjs"] },
  { name: "Markdown lint", cmd: "markdownlint", args: ["-c", ".markdownlint.jsonc", "docs/**/*.md", "docs/**/*.mdx", "README.md"] },
  { name: "Grammar", cmd: "node", args: ["scripts/docs/grammar-check.mjs"] },
  { name: "External links", cmd: "lychee", args: ["--config", ".lychee.toml", "docs/**/*.md", "docs/**/*.mdx", "README.md"] },
  { name: "Build (CI policy)", cmd: "node", args: ["-e","process.env.CI='true'; require('child_process').spawn('vitepress', ['build','docs'], {stdio:'inherit', shell:true}).on('exit', c=>process.exit(c||0))"] }
];

let failures = 0;
for (const s of steps) {
  const opts = { stdio: "inherit", shell: s.shell ?? true };
  const res = spawnSync(s.cmd, s.args, opts);
  if (res.status) {
    failures++;
    console.error(`❌ ${s.name} failed (exit ${res.status})`);
  } else {
    console.log(`✅ ${s.name} ok`);
  }
}

if (failures) {
  console.error(`\n📉 Docs Doctor: ${failures} step(s) failed.`);
  process.exit(1);
} else {
  console.log("\n📈 Docs Doctor: all checks passed.");
}
