#!/usr/bin/env node
// @ts-nocheck
/**
 * Codemod: annotate common implicit-any sites in @aibos/worker
 * - ({ event, step }) -> ({ event, step }: WorkflowArgs)
 * - async ({ event, step }) -> async ({ event, step }: WorkflowArgs)
 * - .map(x => ...) -> .map((x: unknown) => ...)
 *
 * Safe, idempotent, and intentionally conservative. Review diff before commit.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../src");

/** Files to include */
const isTs = (p) => p.endsWith(".ts") || p.endsWith(".tsx");
/** Skip our new type scaffolding & d.ts */
const skip = new Set(["types.ts", "schemas.ts", "global-types.d.ts"]);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && isTs(full) && !skip.has(entry.name)) {
      yield full;
    }
  }
}

const RX_PARAM =
  /(\basync\s*)?\(\s*\{\s*event\s*,\s*step\s*\}\s*\)/g; // matches "({ event, step })" and "async ({ event, step })"
const RX_MAP = /\.map\(\s*([a-zA-Z_$][\w$]*)\s*=>/g; // matches ".map(x =>" capturing the param name

function annotateParams(src) {
  return src.replace(RX_PARAM, (m, asyncKw) => {
    const prefix = asyncKw ?? "";
    return `${prefix}({ event, step }: WorkflowArgs)`;
  });
}

function annotateMapParam(src) {
  return src.replace(RX_MAP, (m, name) => `.map((${name}: unknown) =>`);
}

function run() {
  let changed = 0;
  for (const file of walk(ROOT)) {
    const before = fs.readFileSync(file, "utf8");
    let after = before;
    after = annotateParams(after);
    after = annotateMapParam(after);
    if (after !== before) {
      fs.writeFileSync(file, after);
      changed++;
      console.log(`✔ Updated ${path.relative(ROOT, file)}`);
    }
  }
  console.log(changed ? `\nDone. Modified ${changed} file(s).` : "\nNo changes needed.");
}

run();
