#!/usr/bin/env node
// Cross-package reference validator for @aibos/*
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const pkgsGlobs = ["packages", "apps", "services"];
const docRoots = ["docs", "README.md"];

const readJson = p => JSON.parse(fs.readFileSync(p, "utf8"));
const exists = p => fs.existsSync(p);

function listPackages() {
  const names = new Set();
  for (const g of pkgsGlobs) {
    const dir = path.join(repoRoot, g);
    if (!exists(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      const pkgJson = path.join(dir, entry, "package.json");
      if (exists(pkgJson)) {
        try {
          const { name } = readJson(pkgJson);
          if (name) names.add(name);
        } catch {}
      }
    }
  }
  return names;
}

function listDocFiles() {
  const out = [];
  function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(md|mdx)$/i.test(e.name)) out.push(p);
    }
  }
  for (const r of docRoots) {
    const p = path.join(repoRoot, r);
    if (exists(p)) {
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(md|mdx)$/i.test(r)) out.push(p);
    }
  }
  return out;
}

const packages = listPackages();
const docs = listDocFiles();

const pkgRegex = /@aibos\/[a-z0-9-]+/gi;
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

let badRefs = 0;

for (const f of docs) {
  const content = fs.readFileSync(f, "utf8");
  const foundPkgs = new Set((content.match(pkgRegex) || []).map(s => s.trim()));
  for (const name of foundPkgs) {
    if (!packages.has(name)) {
      console.log(`❌ Missing package ${name} referenced in ${path.relative(repoRoot, f)}`);
      badRefs++;
    }
  }
  // Optional: check relative links exist on disk (for internal docs paths)
  let m;
  while ((m = linkRegex.exec(content))) {
    const target = m[2];
    if (/^https?:\/\//i.test(target)) continue;
    // resolve relative to file
    const resolved = path.resolve(path.dirname(f), target);
    const withExt = exists(resolved)
      ? resolved
      : exists(resolved + ".md")
        ? resolved + ".md"
        : exists(resolved + ".mdx")
          ? resolved + ".mdx"
          : null;
    if (!withExt && !target.startsWith("#")) {
      console.log(`⚠️  Link not found: ${target} in ${path.relative(repoRoot, f)}`);
    }
  }
}

if (badRefs > 0) {
  console.error(`\nFound ${badRefs} missing @aibos/* package references.`);
  process.exit(1);
} else {
  console.log("✅ Internal package references look good.");
}
