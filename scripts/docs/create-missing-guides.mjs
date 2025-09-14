#!/usr/bin/env node
import fs from "fs";
import path from "path";

const docsRoot = path.resolve("docs");
const guidesRoot = path.join(docsRoot, "guides");

if (!fs.existsSync(guidesRoot)) fs.mkdirSync(guidesRoot, { recursive: true });

const mdFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(md|mdx)$/i.test(e.name)) mdFiles.push(p);
  }
})(docsRoot);

const linkRx = /\[([^\]]+)\]\((\.\/guides\/[a-z0-9\-\/]+)\)/gi;
const stubs = new Set();

for (const file of mdFiles) {
  const txt = fs.readFileSync(file, "utf8");
  let m;
  while ((m = linkRx.exec(txt))) {
    const rel = m[2];
    const target = path.resolve(path.dirname(file), rel);
    const exists =
      fs.existsSync(target) || fs.existsSync(target + ".md") || fs.existsSync(target + ".mdx");
    if (!exists) {
      const finalPath = target.endsWith(".md") || target.endsWith(".mdx") ? target : target + ".md";
      stubs.add(finalPath);
    }
  }
}

for (const stub of stubs) {
  if (!fs.existsSync(path.dirname(stub))) fs.mkdirSync(path.dirname(stub), { recursive: true });
  if (!fs.existsSync(stub)) {
    const title = path.basename(stub, path.extname(stub)).replace(/-/g, " ");
    fs.writeFileSync(
      stub,
      `# ${title}\n\n> Placeholder. Add content.\n\n## Overview\n\n## Steps\n\n## See also\n`,
      "utf8",
    );
    console.log("Created stub", path.relative(process.cwd(), stub));
  }
}

console.log(`Done. Created ${stubs.size} stub guide(s).`);
