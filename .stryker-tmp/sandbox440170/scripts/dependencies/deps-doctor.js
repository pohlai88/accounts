#!/usr/bin/env node
// @ts-nocheck

/**
 * Dependencies Doctor
 *
 * Quick diagnostic commands for dependency health
 *
 * @version 2.0.0
 * @author AI-BOS Team
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..", "..");

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Enhanced error handling
function handleError(error, context = "") {
  log(`❌ Error ${context}: ${error.message}`, "red");
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
}

// Validate workspace structure
function validateWorkspaceStructure() {
  const requiredDirs = ["packages"];
  const missingDirs = [];

  for (const dir of requiredDirs) {
    if (!existsSync(join(rootDir, dir))) {
      missingDirs.push(dir);
    }
  }

  if (missingDirs.length > 0) {
    log(`❌ Missing required directories: ${missingDirs.join(", ")}`, "red");
    return false;
  }

  return true;
}

// Check for non-workspace internal refs with enhanced validation
function checkNonWorkspaceRefs() {
  log("\n🔍 Checking for non-workspace @aibos/* references...", "blue");

  const directories = ["apps", "packages", "packages/config", "services", "docs"];
  let found = false;
  let totalChecked = 0;
  const errors = [];

  for (const dir of directories) {
    const dirPath = join(rootDir, dir);

    if (!existsSync(dirPath)) {
      continue; // Directory doesn't exist, skip
    }

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packageJsonPath = join(dirPath, entry.name, "package.json");

          if (existsSync(packageJsonPath)) {
            totalChecked++;
            try {
              const content = readFileSync(packageJsonPath, "utf8");

              if (!content.trim()) {
                errors.push(`Empty file: ${relative(rootDir, packageJsonPath)}`);
                continue;
              }

              const packageJson = JSON.parse(content);

              if (typeof packageJson !== "object" || packageJson === null) {
                errors.push(`Invalid JSON: ${relative(rootDir, packageJsonPath)}`);
                continue;
              }

              const dependencyTypes = [
                "dependencies",
                "devDependencies",
                "peerDependencies",
                "optionalDependencies",
              ];

              for (const depType of dependencyTypes) {
                if (packageJson[depType] && typeof packageJson[depType] === "object") {
                  for (const [depName, depVersion] of Object.entries(packageJson[depType])) {
                    if (
                      typeof depName === "string" &&
                      depName.startsWith("@aibos/") &&
                      depVersion !== "workspace:*"
                    ) {
                      log(
                        `❌ ${relative(rootDir, packageJsonPath)}: ${depName} = "${depVersion}" (should be "workspace:*")`,
                        "red",
                      );
                      found = true;
                    }
                  }
                }
              }
            } catch (parseError) {
              errors.push(
                `Parse error in ${relative(rootDir, packageJsonPath)}: ${parseError.message}`,
              );
            }
          }
        }
      }
    } catch (readError) {
      errors.push(`Cannot read directory ${dir}: ${readError.message}`);
    }
  }

  if (errors.length > 0 && process.env.DEBUG) {
    errors.forEach(error => log(`⚠️  ${error}`, "yellow"));
  }

  if (!found) {
    log(
      `✅ All @aibos/* dependencies use workspace:* protocol (checked ${totalChecked} files)`,
      "green",
    );
  } else {
    log(`❌ Found non-workspace @aibos/* references (checked ${totalChecked} files)`, "red");
  }

  return !found;
}

// Check for missing packages with enhanced validation
function checkMissingPackages() {
  log("\n🔍 Checking for missing @aibos/* packages...", "blue");

  // Get all workspace package names
  const workspacePackages = new Set();
  const directories = ["packages", "packages/config", "apps", "services"];
  const errors = [];

  for (const dir of directories) {
    const dirPath = join(rootDir, dir);

    if (!existsSync(dirPath)) {
      continue; // Directory doesn't exist, skip
    }

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packageJsonPath = join(dirPath, entry.name, "package.json");

          if (existsSync(packageJsonPath)) {
            try {
              const content = readFileSync(packageJsonPath, "utf8");

              if (!content.trim()) {
                errors.push(`Empty file: ${relative(rootDir, packageJsonPath)}`);
                continue;
              }

              const packageJson = JSON.parse(content);

              if (packageJson.name && typeof packageJson.name === "string") {
                workspacePackages.add(packageJson.name);
              } else {
                errors.push(`Invalid package name in ${relative(rootDir, packageJsonPath)}`);
              }
            } catch (parseError) {
              errors.push(
                `Parse error in ${relative(rootDir, packageJsonPath)}: ${parseError.message}`,
              );
            }
          }
        }
      }
    } catch (readError) {
      errors.push(`Cannot read directory ${dir}: ${readError.message}`);
    }
  }

  // Check for missing packages
  let found = false;
  let totalChecked = 0;

  for (const dir of directories) {
    const dirPath = join(rootDir, dir);

    if (!existsSync(dirPath)) {
      continue; // Directory doesn't exist, skip
    }

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packageJsonPath = join(dirPath, entry.name, "package.json");

          if (existsSync(packageJsonPath)) {
            totalChecked++;
            try {
              const content = readFileSync(packageJsonPath, "utf8");

              if (!content.trim()) {
                errors.push(`Empty file: ${relative(rootDir, packageJsonPath)}`);
                continue;
              }

              const packageJson = JSON.parse(content);

              if (typeof packageJson !== "object" || packageJson === null) {
                errors.push(`Invalid JSON: ${relative(rootDir, packageJsonPath)}`);
                continue;
              }

              const dependencyTypes = [
                "dependencies",
                "devDependencies",
                "peerDependencies",
                "optionalDependencies",
              ];

              for (const depType of dependencyTypes) {
                if (packageJson[depType] && typeof packageJson[depType] === "object") {
                  for (const [depName, depVersion] of Object.entries(packageJson[depType])) {
                    if (
                      typeof depName === "string" &&
                      depName.startsWith("@aibos/") &&
                      !workspacePackages.has(depName)
                    ) {
                      log(
                        `❌ ${relative(rootDir, packageJsonPath)}: ${depName} (package not found in workspace)`,
                        "red",
                      );
                      found = true;
                    }
                  }
                }
              }
            } catch (parseError) {
              errors.push(
                `Parse error in ${relative(rootDir, packageJsonPath)}: ${parseError.message}`,
              );
            }
          }
        }
      }
    } catch (readError) {
      errors.push(`Cannot read directory ${dir}: ${readError.message}`);
    }
  }

  if (errors.length > 0 && process.env.DEBUG) {
    errors.forEach(error => log(`⚠️  ${error}`, "yellow"));
  }

  if (!found) {
    log(
      `✅ All @aibos/* references point to existing packages (checked ${totalChecked} files)`,
      "green",
    );
  } else {
    log(`❌ Found references to missing @aibos/* packages (checked ${totalChecked} files)`, "red");
  }

  return !found;
}

// Show workspace packages with enhanced validation
function showWorkspacePackages() {
  log("\n📦 Workspace packages:", "blue");

  const workspacePackages = new Set();
  const directories = ["packages", "packages/config", "apps", "services"];
  const errors = [];

  for (const dir of directories) {
    const dirPath = join(rootDir, dir);

    if (!existsSync(dirPath)) {
      continue; // Directory doesn't exist, skip
    }

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packageJsonPath = join(dirPath, entry.name, "package.json");

          if (existsSync(packageJsonPath)) {
            try {
              const content = readFileSync(packageJsonPath, "utf8");

              if (!content.trim()) {
                errors.push(`Empty file: ${relative(rootDir, packageJsonPath)}`);
                continue;
              }

              const packageJson = JSON.parse(content);

              if (packageJson.name && typeof packageJson.name === "string") {
                workspacePackages.add(packageJson.name);
              } else {
                errors.push(`Invalid package name in ${relative(rootDir, packageJsonPath)}`);
              }
            } catch (parseError) {
              errors.push(
                `Parse error in ${relative(rootDir, packageJsonPath)}: ${parseError.message}`,
              );
            }
          }
        }
      }
    } catch (readError) {
      errors.push(`Cannot read directory ${dir}: ${readError.message}`);
    }
  }

  if (errors.length > 0 && process.env.DEBUG) {
    errors.forEach(error => log(`⚠️  ${error}`, "yellow"));
  }

  if (workspacePackages.size === 0) {
    log("  No workspace packages found", "yellow");
  } else {
    for (const pkg of Array.from(workspacePackages).sort()) {
      log(`  - ${pkg}`, "blue");
    }
  }

  log(`\nTotal packages: ${workspacePackages.size}`, "cyan");
}

// Main function with enhanced error handling
function main() {
  const command = process.argv[2];

  log("🏥 Dependencies Doctor v2.0.0", "bold");
  log("==============================", "bold");

  // Validate workspace structure first
  if (!validateWorkspaceStructure()) {
    log("❌ Workspace structure validation failed", "red");
    process.exit(1);
  }

  try {
    switch (command) {
      case "workspace-refs":
        const refsOk = checkNonWorkspaceRefs();
        process.exit(refsOk ? 0 : 1);
        break;

      case "missing-packages":
        const packagesOk = checkMissingPackages();
        process.exit(packagesOk ? 0 : 1);
        break;

      case "list-packages":
        showWorkspacePackages();
        process.exit(0);
        break;

      case "all":
      default:
        const allRefsOk = checkNonWorkspaceRefs();
        const allPackagesOk = checkMissingPackages();
        showWorkspacePackages();

        if (allRefsOk && allPackagesOk) {
          log("\n✅ All dependency checks passed!", "green");
          process.exit(0);
        } else {
          log("\n❌ Some dependency issues found!", "red");
          process.exit(1);
        }
    }
  } catch (error) {
    handleError(error, "running dependency checks");
    process.exit(1);
  }
}

// Run the main function
main();
