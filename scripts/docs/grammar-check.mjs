#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function findMarkdownFiles(dir) {
  const files = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      } else if (/\.(md|mdx)$/i.test(entry.name)) {
        files.push(p);
      }
    }
  }
  walk(dir);
  return files;
}

const docFiles = [
  ...findMarkdownFiles('docs'),
  'README.md'
].filter(f => fs.existsSync(f));

if (docFiles.length === 0) {
  console.log('No markdown files found');
  process.exit(0);
}

const p = spawn('write-good', docFiles, { stdio: "inherit", shell: true });
p.on("exit", (code) => process.exit(code ?? 0));
