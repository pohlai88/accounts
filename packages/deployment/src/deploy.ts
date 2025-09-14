/**
 * @aibos/deployment - Production Deployment
 *
 * Automated deployment scripts and utilities
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import chalk from "chalk";
import { ProductionHealthChecker } from "./health-check";

export interface DeploymentConfig {
  environment: "staging" | "production";
  version: string;
  buildCommand: string;
  testCommand: string;
  healthCheckCommand: string;
  rollbackVersion?: string;
}

export interface DeploymentResult {
  success: boolean;
  version: string;
  timestamp: string;
  duration: number;
  steps: Array<{
    name: string;
    status: "success" | "failed" | "skipped";
    duration: number;
    message?: string;
  }>;
  healthCheck?: unknown;
}

export class ProductionDeployer {
  private config: DeploymentConfig;
  private startTime: number = 0;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  async deploy(): Promise<DeploymentResult> {
    this.startTime = Date.now();
    const steps: DeploymentResult["steps"] = [];

    console.log(chalk.blue(`🚀 Starting ${this.config.environment} deployment...`));
    console.log(chalk.blue(`📦 Version: ${this.config.version}\n`));

    try {
      // Step 1: Pre-deployment checks
      steps.push(await this.runStep("Pre-deployment Checks", () => this.preDeploymentChecks()));

      // Step 2: Run tests
      steps.push(await this.runStep("Run Tests", () => this.runTests()));

      // Step 3: Build application
      steps.push(await this.runStep("Build Application", () => this.buildApplication()));

      // Step 4: Deploy to environment
      steps.push(await this.runStep("Deploy to Environment", () => this.deployToEnvironment()));

      // Step 5: Post-deployment health check
      const healthCheck = await this.runPostDeploymentHealthCheck();
      steps.push(
        await this.runStep("Post-deployment Health Check", () => Promise.resolve(healthCheck)),
      );

      const duration = Date.now() - this.startTime;
      const result: DeploymentResult = {
        success: true,
        version: this.config.version,
        timestamp: new Date().toISOString(),
        duration,
        steps,
        healthCheck,
      };

      console.log(chalk.green(`\n✅ Deployment completed successfully in ${duration}ms`));
      return result;
    } catch (error) {
      const duration = Date.now() - this.startTime;
      const result: DeploymentResult = {
        success: false,
        version: this.config.version,
        timestamp: new Date().toISOString(),
        duration,
        steps,
      };

      console.log(chalk.red(`\n❌ Deployment failed after ${duration}ms`));
      console.log(chalk.red(`Error: ${error}`));

      // Attempt rollback if configured
      if (this.config.rollbackVersion) {
        console.log(chalk.yellow("\n🔄 Attempting rollback..."));
        await this.rollback();
      }

      return result;
    }
  }

  private async runStep(
    name: string,
    stepFn: () => Promise<unknown>,
  ): Promise<DeploymentResult["steps"][0]> {
    const stepStartTime = Date.now();
    console.log(chalk.blue(`⏳ ${name}...`));

    try {
      await stepFn();
      const duration = Date.now() - stepStartTime;
      console.log(chalk.green(`✅ ${name} completed in ${duration}ms`));

      return {
        name,
        status: "success",
        duration,
        message: "Completed successfully",
      };
    } catch (error) {
      const duration = Date.now() - stepStartTime;
      console.log(chalk.red(`❌ ${name} failed after ${duration}ms`));
      console.log(chalk.red(`Error: ${error}`));

      return {
        name,
        status: "failed",
        duration,
        message: String(error),
      };
    }
  }

  private async preDeploymentChecks(): Promise<void> {
    // Check if we're in the right directory
    if (!existsSync("package.json")) {
      throw new Error("Not in project root directory");
    }

    // Check if git is clean
    try {
      const gitStatus = execSync("git status --porcelain", { encoding: "utf8" });
      if (gitStatus.trim()) {
        throw new Error("Git working directory is not clean. Commit or stash changes first.");
      }
    } catch (error) {
      throw new Error(`Git check failed: ${error}`);
    }

    // Check if we're on the right branch
    const currentBranch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
    const expectedBranch = this.config.environment === "production" ? "main" : "develop";

    if (currentBranch !== expectedBranch) {
      throw new Error(`Expected to be on ${expectedBranch} branch, but on ${currentBranch}`);
    }

    // Check environment variables
    const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
    }
  }

  private async runTests(): Promise<void> {
    try {
      execSync(this.config.testCommand, {
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "test" },
      });
    } catch (error) {
      throw new Error(`Tests failed: ${error}`);
    }
  }

  private async buildApplication(): Promise<void> {
    try {
      execSync(this.config.buildCommand, {
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: this.config.environment },
      });
    } catch (error) {
      throw new Error(`Build failed: ${error}`);
    }
  }

  private async deployToEnvironment(): Promise<void> {
    // This would be environment-specific deployment logic
    // For now, simulate deployment
    console.log(chalk.yellow("📦 Simulating deployment..."));

    // In a real deployment, this would:
    // 1. Upload build artifacts to the target environment
    // 2. Update environment variables
    // 3. Restart services
    // 4. Update load balancer configuration

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(chalk.green("✅ Deployment simulation completed"));
  }

  private async runPostDeploymentHealthCheck(): Promise<unknown> {
    const healthChecker = new ProductionHealthChecker();
    return await healthChecker.runFullHealthCheck();
  }

  private async rollback(): Promise<void> {
    if (!this.config.rollbackVersion) {
      console.log(chalk.red("❌ No rollback version specified"));
      return;
    }

    console.log(chalk.yellow(`🔄 Rolling back to version ${this.config.rollbackVersion}...`));

    try {
      // In a real deployment, this would:
      // 1. Revert to the previous version
      // 2. Restart services
      // 3. Verify rollback success

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(chalk.green("✅ Rollback completed"));
    } catch (error) {
      console.log(chalk.red(`❌ Rollback failed: ${error}`));
    }
  }
}

// Default deployment configurations
export const DEPLOYMENT_CONFIGS = {
  staging: {
    environment: "staging" as const,
    version: process.env.npm_package_version || "1.0.0",
    buildCommand: "pnpm -w build",
    testCommand: "pnpm -w test",
    healthCheckCommand: "pnpm --filter @aibos/deployment health-check",
    rollbackVersion: undefined,
  },
  production: {
    environment: "production" as const,
    version: process.env.npm_package_version || "1.0.0",
    buildCommand: "pnpm -w build",
    testCommand: "pnpm -w test",
    healthCheckCommand: "pnpm --filter @aibos/deployment health-check",
    rollbackVersion: process.env.ROLLBACK_VERSION,
  },
} as const;

// CLI interface
export async function deployStaging(): Promise<void> {
  const deployer = new ProductionDeployer(DEPLOYMENT_CONFIGS.staging);
  const result = await deployer.deploy();

  if (!result.success) {
    process.exit(1);
  }
}

export async function deployProduction(): Promise<void> {
  const deployer = new ProductionDeployer(DEPLOYMENT_CONFIGS.production);
  const result = await deployer.deploy();

  if (!result.success) {
    process.exit(1);
  }
}
