#!/usr/bin/env node
import { spawn } from "node:child_process";

const [, , cmd, ...args] = process.argv;
const isCI = process.env.CI === "true";

const p = spawn(cmd, args, { stdio: "inherit", shell: true, env: { ...process.env } });
p.on("exit", code => process.exit(code ?? 0));
