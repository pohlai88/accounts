#!/usr/bin/env node
// @ts-nocheck

/**
 * Staging Deployment Script
 */

const { deployStaging } = require("../dist/deploy");

async function main() {
  try {
    console.log("🚀 Starting staging deployment...");
    await deployStaging();
    console.log("✅ Staging deployment completed successfully");
  } catch (error) {
    console.error("❌ Staging deployment failed:", error);
    process.exit(1);
  }
}

main();
