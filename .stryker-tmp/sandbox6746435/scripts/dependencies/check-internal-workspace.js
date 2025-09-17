#!/usr/bin/env node
// @ts-nocheck

/**
 * Workspace Protocol Guard Check
 *
 * Ensures all @aibos/* dependencies use workspace:* protocol
 * and that all referenced packages actually exist locally.
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

// Get all package names in the workspace with enhanced error handling
function getWorkspacePackages() {
  const packages = new Set();
  const errors = [];
  const directories = ["packages", "packages/config", "apps", "services", "docs"];

  for (const dir of directories) {
    const dirPath = join(rootDir, dir);

    if (!existsSync(dirPath)) {
      continue; // Directory doesn't exist, skip silently
    }

    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packageJsonPath = join(dirPath, entry.name, "package.json");

          if (!existsSync(packageJsonPath)) {
            continue; // No package.json, skip
          }

          try {
            const content = readFileSync(packageJsonPath, "utf8");
            const packageJson = JSON.parse(content);

            if (packageJson.name && typeof packageJson.name === "string") {
              packages.add(packageJson.name);
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
    } catch (readError) {
      errors.push(`Cannot read directory ${dir}: ${readError.message}`);
    }
  }

  if (errors.length > 0 && process.env.DEBUG) {
    errors.forEach(error => log(`⚠️  ${error}`, "yellow"));
  }

  return packages;
}

// Check a single package.json file with enhanced validation
function checkPackageJson(filePath, workspacePackages) {
  const issues = [];

  if (!existsSync(filePath)) {
    issues.push({
      type: "file-not-found",
      file: filePath,
      error: "File does not exist",
    });
    return issues;
  }

  try {
    const content = readFileSync(filePath, "utf8");

    if (!content.trim()) {
      issues.push({
        type: "empty-file",
        file: filePath,
        error: "File is empty",
      });
      return issues;
    }

    const packageJson = JSON.parse(content);

    // Validate package.json structure
    if (typeof packageJson !== "object" || packageJson === null) {
      issues.push({
        type: "invalid-json",
        file: filePath,
        error: "Invalid JSON structure",
      });
      return issues;
    }

    // Check all dependency types
    const dependencyTypes = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ];

    for (const depType of dependencyTypes) {
      if (packageJson[depType] && typeof packageJson[depType] === "object") {
        for (const [depName, depVersion] of Object.entries(packageJson[depType])) {
          // Validate dependency name
          if (typeof depName !== "string" || depName.trim() === "") {
            issues.push({
              type: "invalid-dependency-name",
              file: filePath,
              dependency: depName,
              error: "Invalid dependency name",
            });
            continue;
          }

          // Validate dependency version
          if (typeof depVersion !== "string" || depVersion.trim() === "") {
            issues.push({
              type: "invalid-dependency-version",
              file: filePath,
              dependency: depName,
              version: depVersion,
              error: "Invalid dependency version",
            });
            continue;
          }

          // Check if it's an @aibos package
          if (depName.startsWith("@aibos/")) {
            // Check if it uses workspace:* protocol
            if (depVersion !== "workspace:*") {
              issues.push({
                type: "non-workspace",
                file: filePath,
                dependency: depName,
                version: depVersion,
                expected: "workspace:*",
              });
            }

            // Check if the package actually exists
            if (!workspacePackages.has(depName)) {
              issues.push({
                type: "missing-package",
                file: filePath,
                dependency: depName,
                version: depVersion,
              });
            }
          }
        }
      }
    }
  } catch (error) {
    issues.push({
      type: "parse-error",
      file: filePath,
      error: error.message,
    });
  }

  return issues;
}

// Main check function with enhanced error handling and reporting
function runWorkspaceCheck() {
  log("🔍 Checking workspace protocol compliance...", "blue");

  // Validate workspace structure first
  if (!validateWorkspaceStructure()) {
    log("❌ Workspace structure validation failed", "red");
    return false;
  }

  const workspacePackages = getWorkspacePackages();
  log(`📦 Found ${workspacePackages.size} workspace packages:`, "blue");
  for (const pkg of Array.from(workspacePackages).sort()) {
    log(`  - ${pkg}`, "blue");
  }

  const allIssues = [];
  const directories = ["apps", "packages", "packages/config", "services", "docs"];
  let totalFilesChecked = 0;

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
            const issues = checkPackageJson(packageJsonPath, workspacePackages);
            allIssues.push(...issues);
            totalFilesChecked++;
          }
        }
      }
    } catch (error) {
      handleError(error, `reading directory ${dir}`);
    }
  }

  // Check root package.json
  const rootPackageJsonPath = join(rootDir, "package.json");
  if (existsSync(rootPackageJsonPath)) {
    const issues = checkPackageJson(rootPackageJsonPath, workspacePackages);
    allIssues.push(...issues);
    totalFilesChecked++;
  }

  // Report results
  log("\n📊 Workspace Protocol Check Results", "bold");
  log("=====================================", "bold");
  log(`Files checked: ${totalFilesChecked}`, "cyan");

  if (allIssues.length === 0) {
    log("✅ All @aibos/* dependencies use workspace:* protocol", "green");
    log("✅ All referenced packages exist in workspace", "green");
    log("\n🎉 Workspace protocol compliance check passed!", "green");
    return true;
  }

  // Group issues by type for better reporting
  const issueTypes = {
    "non-workspace": allIssues.filter(i => i.type === "non-workspace"),
    "missing-package": allIssues.filter(i => i.type === "missing-package"),
    "parse-error": allIssues.filter(i => i.type === "parse-error"),
    "file-not-found": allIssues.filter(i => i.type === "file-not-found"),
    "empty-file": allIssues.filter(i => i.type === "empty-file"),
    "invalid-json": allIssues.filter(i => i.type === "invalid-json"),
    "invalid-dependency-name": allIssues.filter(i => i.type === "invalid-dependency-name"),
    "invalid-dependency-version": allIssues.filter(i => i.type === "invalid-dependency-version"),
  };

  // Report issues by type
  for (const [type, issues] of Object.entries(issueTypes)) {
    if (issues.length > 0) {
      const typeLabels = {
        "non-workspace": "dependencies not using workspace:* protocol",
        "missing-package": "references to non-existent @aibos/* packages",
        "parse-error": "package.json parse errors",
        "file-not-found": "missing package.json files",
        "empty-file": "empty package.json files",
        "invalid-json": "invalid JSON structure",
        "invalid-dependency-name": "invalid dependency names",
        "invalid-dependency-version": "invalid dependency versions",
      };

      log(`\n❌ Found ${issues.length} ${typeLabels[type]}:`, "red");
      for (const issue of issues) {
        const relativePath = relative(rootDir, issue.file);
        if (type === "non-workspace") {
          log(
            `  ${relativePath}: ${issue.dependency} = "${issue.version}" (expected "workspace:*")`,
            "red",
          );
        } else if (type === "missing-package") {
          log(`  ${relativePath}: ${issue.dependency} (package not found in workspace)`, "red");
        } else {
          log(`  ${relativePath}: ${issue.error}`, "red");
        }
      }
    }
  }

  log("\n💡 Fix suggestions:", "yellow");
  log("  1. Convert @aibos/* dependencies to workspace:* protocol", "yellow");
  log("  2. Remove references to non-existent packages", "yellow");
  log("  3. Fix package.json syntax errors", "yellow");
  log("  4. Run: pnpm install to update lockfile", "yellow");
  log("  5. Use DEBUG=1 for detailed error information", "yellow");

  return false;
}

// Run the check
const success = runWorkspaceCheck();
process.exit(success ? 0 : 1);
