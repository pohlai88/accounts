#!/usr/bin/env node
// @ts-nocheck

/**
 * Production Deployment Script
 */

const { deployProduction } = require("../dist/deploy");

async function main() {
  try {
    console.log("🚀 Starting production deployment...");
    await deployProduction();
    console.log("✅ Production deployment completed successfully");
  } catch (error) {
    console.error("❌ Production deployment failed:", error);
    process.exit(1);
  }
}

main();
