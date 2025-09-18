// Automated Deployment Procedures
// DoD: Automated deployment procedures
// SSOT: Use existing deployment package
// Tech Stack: Node.js + deployment automation

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { logger } from "@aibos/logger";
import { monitoring } from "../../../apps/web-api/lib/monitoring";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DeploymentConfig {
  environment: "staging" | "production";
  version: string;
  buildCommand: string;
  testCommand: string;
  healthCheckCommand: string;
  rollbackVersion?: string;
  dockerEnabled: boolean;
  dockerComposeFile: string;
  backupEnabled: boolean;
  migrationEnabled: boolean;
  notificationEnabled: boolean;
  notificationChannels: string[];
}

export interface DeploymentResult {
  success: boolean;
  version: string;
  timestamp: string;
  duration: number;
  environment: string;
  steps: Array<{
    name: string;
    status: "success" | "failed" | "skipped";
    duration: number;
    message?: string;
  }>;
  healthCheck?: any;
  rollbackAvailable: boolean;
}

export interface DeploymentStep {
  name: string;
  execute: () => Promise<void>;
  rollback?: () => Promise<void>;
  critical: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const defaultConfig: DeploymentConfig = {
  environment: "staging",
  version: process.env.npm_package_version || "1.0.0",
  buildCommand: "pnpm -w build",
  testCommand: "pnpm -w test",
  healthCheckCommand: "pnpm --filter @aibos/deployment health-check",
  dockerEnabled: true,
  dockerComposeFile: "docker-compose.yml",
  backupEnabled: true,
  migrationEnabled: true,
  notificationEnabled: true,
  notificationChannels: ["slack", "email"],
};

// ============================================================================
// DEPLOYMENT MANAGER
// ============================================================================

export class DeploymentManager {
  private config: DeploymentConfig;
  private startTime: number = 0;
  private steps: DeploymentStep[] = [];

  constructor(config: Partial<DeploymentConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.setupSteps();
  }

  private setupSteps(): void {
    this.steps = [
      {
        name: "Pre-deployment Checks",
        execute: () => this.preDeploymentChecks(),
        critical: true,
      },
      {
        name: "Create Backup",
        execute: () => this.createBackup(),
        rollback: () => this.restoreBackup(),
        critical: this.config.backupEnabled,
      },
      {
        name: "Run Tests",
        execute: () => this.runTests(),
        critical: true,
      },
      {
        name: "Build Application",
        execute: () => this.buildApplication(),
        critical: true,
      },
      {
        name: "Run Database Migrations",
        execute: () => this.runMigrations(),
        rollback: () => this.rollbackMigrations(),
        critical: this.config.migrationEnabled,
      },
      {
        name: "Deploy Application",
        execute: () => this.deployApplication(),
        rollback: () => this.rollbackApplication(),
        critical: true,
      },
      {
        name: "Health Check",
        execute: () => this.runHealthCheck(),
        critical: true,
      },
      {
        name: "Send Notifications",
        execute: () => this.sendNotifications(),
        critical: false,
      },
    ];
  }

  async deploy(): Promise<DeploymentResult> {
    this.startTime = Date.now();
    const result: DeploymentResult = {
      success: false,
      version: this.config.version,
      timestamp: new Date().toISOString(),
      duration: 0,
      environment: this.config.environment,
      steps: [],
      rollbackAvailable: false,
    };

    // Log deployment start to monitoring service
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      // eslint-disable-next-line no-console
    }

    try {
      // Execute deployment steps
      for (const step of this.steps) {
        const stepResult = await this.executeStep(step);
        result.steps.push(stepResult);

        // If critical step fails, stop deployment
        if (stepResult.status === "failed" && step.critical) {
          // Log critical step failure to monitoring service
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
          }
          break;
        }
      }

      // Determine overall success
      result.success = result.steps.every(step => step.status === "success" || step.status === "skipped");
      result.duration = Date.now() - this.startTime;
      result.rollbackAvailable = this.config.backupEnabled;

      // Record deployment metrics
      monitoring.recordBusinessMetric(
        "deployment.completed",
        1,
        "count",
        JSON.stringify({
          environment: this.config.environment,
          version: this.config.version,
          success: result.success.toString(),
          duration: result.duration.toString(),
        })
      );

      if (result.success) {
        // Log deployment success to monitoring service
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
        }
      } else {

        // Attempt rollback if available
        if (result.rollbackAvailable) {
          await this.attemptRollback();
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.duration = Date.now() - this.startTime;

      logger.error("Deployment failed", error instanceof Error ? error : new Error(String(error)));

      // Attempt rollback
      if (this.config.backupEnabled) {
        await this.attemptRollback();
      }

      return result;
    }
  }

  private async executeStep(step: DeploymentStep): Promise<DeploymentResult["steps"][0]> {
    const stepStartTime = Date.now();

    try {
      await step.execute();
      const duration = Date.now() - stepStartTime;

      return {
        name: step.name,
        status: "success",
        duration,
        message: "Completed successfully",
      };
    } catch (error) {
      const duration = Date.now() - stepStartTime;

      return {
        name: step.name,
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

    // Check Docker if enabled
    if (this.config.dockerEnabled) {
      if (!existsSync(this.config.dockerComposeFile)) {
        throw new Error(`Docker Compose file not found: ${this.config.dockerComposeFile}`);
      }
    }
  }

  private async createBackup(): Promise<void> {
    if (!this.config.backupEnabled) {
      return;
    }

    try {
      // Import and use backup manager
      const { BackupManager } = await import("./backup.js");
      const backupManager = new BackupManager();

      const backupResult = await backupManager.createBackup();

      if (!backupResult.success) {
        throw new Error(`Backup failed: ${backupResult.errors.join(", ")}`);
      }

    } catch (error) {
      throw new Error(`Backup creation failed: ${error}`);
    }
  }

  private async restoreBackup(): Promise<void> {
    try {
      // Get latest backup
      const { BackupManager } = await import("./backup.js");
      const backupManager = new BackupManager();

      const backups = await backupManager.listBackups();
      if (backups.length === 0) {
        throw new Error("No backups available for restore");
      }

      const latestBackup = backups[0];
      if (!latestBackup) {
        throw new Error("No backup found for rollback");
      }

      const restoreResult = await backupManager.restoreBackup({
        backupId: latestBackup.id,
        targetEnvironment: this.config.environment,
        restoreTables: [],
        skipConflicts: false,
        validateData: true,
      });

      if (!restoreResult.success) {
        throw new Error(`Restore failed: ${restoreResult.errors.join(", ")}`);
      }

    } catch (error) {
      throw new Error(`Backup restore failed: ${error}`);
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

  private async runMigrations(): Promise<void> {
    if (!this.config.migrationEnabled) {
      return;
    }

    try {
      // Run database migrations
      execSync("pnpm --filter @aibos/db migrate", {
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: this.config.environment },
      });
    } catch (error) {
      throw new Error(`Migration failed: ${error}`);
    }
  }

  private async rollbackMigrations(): Promise<void> {
    try {
      // Rollback database migrations
      execSync("pnpm --filter @aibos/db migrate:rollback", {
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: this.config.environment },
      });
    } catch (error) {
      logger.error("Migration rollback failed", error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async deployApplication(): Promise<void> {
    if (this.config.dockerEnabled) {
      await this.deployWithDocker();
    } else {
      await this.deployWithoutDocker();
    }
  }

  private async deployWithDocker(): Promise<void> {
    try {
      // Pull latest images
      execSync(`docker-compose -f ${this.config.dockerComposeFile} pull`, {
        stdio: "inherit",
      });

      // Deploy services
      execSync(`docker-compose -f ${this.config.dockerComposeFile} up -d`, {
        stdio: "inherit",
      });

      // Wait for services to be ready
      await this.waitForServices();
    } catch (error) {
      throw new Error(`Docker deployment failed: ${error}`);
    }
  }

  private async deployWithoutDocker(): Promise<void> {
    try {
      // This would be environment-specific deployment logic
      // For now, simulate deployment

      // In a real deployment, this would:
      // 1. Upload build artifacts to the target environment
      // 2. Update environment variables
      // 3. Restart services
      // 4. Update load balancer configuration

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      throw new Error(`Non-Docker deployment failed: ${error}`);
    }
  }

  private async rollbackApplication(): Promise<void> {
    try {
      if (this.config.dockerEnabled) {
        // Rollback Docker services
        execSync(`docker-compose -f ${this.config.dockerComposeFile} down`, {
          stdio: "inherit",
        });

        // Restart with previous version
        execSync(`docker-compose -f ${this.config.dockerComposeFile} up -d`, {
          stdio: "inherit",
        });
      } else {
        // Rollback non-Docker deployment
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error("Application rollback failed", error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async waitForServices(): Promise<void> {
    const maxWaitTime = 300000; // 5 minutes
    const checkInterval = 10000; // 10 seconds
    let waitTime = 0;

    while (waitTime < maxWaitTime) {
      try {
        // Check if services are healthy
        const healthCheck = await this.runHealthCheck();
        if (healthCheck.status === "healthy") {
          return;
        }
      } catch (error) {
        // Services not ready yet, continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
    }

    throw new Error("Services did not become healthy within timeout period");
  }

  private async runHealthCheck(): Promise<any> {
    try {
      // Run health check
      const response = await fetch("http://localhost:3001/api/health?type=quick");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Health check failed: ${result.status}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Health check failed: ${error}`);
    }
  }

  private async sendNotifications(): Promise<void> {
    if (!this.config.notificationEnabled) {
      return;
    }

    try {
      // Send deployment notifications
      const message = `🚀 Deployment ${this.config.environment} completed successfully!\nVersion: ${this.config.version}\nEnvironment: ${this.config.environment}`;

      // Send to Slack if configured
      if (this.config.notificationChannels.includes("slack") && process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: message,
            channel: "#deployments",
          }),
        });
      }

    } catch (error) {
      logger.error("Notification failed", error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async attemptRollback(): Promise<void> {
    try {

      // Find rollback steps and execute them in reverse order
      const rollbackSteps = this.steps
        .filter(step => step.rollback)
        .reverse();

      for (const step of rollbackSteps) {
        try {
          await step.rollback!();
        } catch (error) {
          logger.error("Rollback step failed", error instanceof Error ? error : new Error(`${step.name}: ${String(error)}`));
        }
      }

    } catch (error) {
      logger.error("Rollback failed", error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

export async function deployStaging(): Promise<void> {
  const deployer = new DeploymentManager({
    environment: "staging",
    version: process.env.npm_package_version || "1.0.0",
  });

  const result = await deployer.deploy();

  if (!result.success) {
    logger.error("Staging deployment failed");
    process.exit(1);
  }

}

export async function deployProduction(): Promise<void> {
  const deployer = new DeploymentManager({
    environment: "production",
    version: process.env.npm_package_version || "1.0.0",
    rollbackVersion: process.env.ROLLBACK_VERSION,
  });

  const result = await deployer.deploy();

  if (!result.success) {
    logger.error("Production deployment failed");
    process.exit(1);
  }

}

export async function rollbackDeployment(environment: "staging" | "production"): Promise<void> {
  const deployer = new DeploymentManager({
    environment,
    version: process.env.npm_package_version || "1.0.0",
  });

  await deployer.deploy();
}

// ============================================================================
// DEPLOYMENT CONFIGURATIONS
// ============================================================================

export const DEPLOYMENT_CONFIGS = {
  staging: {
    environment: "staging" as const,
    version: process.env.npm_package_version || "1.0.0",
    buildCommand: "pnpm -w build",
    testCommand: "pnpm -w test",
    healthCheckCommand: "pnpm --filter @aibos/deployment health-check",
    dockerEnabled: true,
    dockerComposeFile: "docker-compose.staging.yml",
    backupEnabled: true,
    migrationEnabled: true,
    notificationEnabled: true,
    notificationChannels: ["slack"],
  },
  production: {
    environment: "production" as const,
    version: process.env.npm_package_version || "1.0.0",
    buildCommand: "pnpm -w build",
    testCommand: "pnpm -w test",
    healthCheckCommand: "pnpm --filter @aibos/deployment health-check",
    dockerEnabled: true,
    dockerComposeFile: "docker-compose.prod.yml",
    backupEnabled: true,
    migrationEnabled: true,
    notificationEnabled: true,
    notificationChannels: ["slack", "email"],
    rollbackVersion: process.env.ROLLBACK_VERSION,
  },
} as const;

export default DeploymentManager;
