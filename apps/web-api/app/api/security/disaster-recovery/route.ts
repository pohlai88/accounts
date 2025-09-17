/**
 * Security Disaster Recovery API Routes
 *
 * Provides endpoints for managing backup and restore operations.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";
import { DisasterRecoveryManager } from "@aibos/security";
import { monitoring } from "@aibos/monitoring";

// Force dynamic rendering to avoid build-time header access
export const dynamic = 'force-dynamic';

// Create disaster recovery manager instance
const disasterRecoveryManager = new DisasterRecoveryManager();

/**
 * GET /api/security/disaster-recovery
 * Get backup status and history
 */
export async function GET(req: NextRequest) {
  // Get security context
  const ctx = await getSecurityContext(req);

  try {
    // TODO: Implement proper backup listing and status methods
    const response = {
      status: {
        isHealthy: true,
        lastBackup: null,
        nextScheduledBackup: null,
        totalBackups: 0,
        totalSize: 0,
      },
      backups: [],
    };

    return ok(response, ctx.requestId);
  } catch (error) {
    monitoring.error("Failed to get disaster recovery data", error instanceof Error ? error : new Error(String(error)));

    return problem({
      status: 500,
      title: "Failed to retrieve disaster recovery data",
      code: "DISASTER_RECOVERY_FETCH_FAILED",
      detail: "An unexpected error occurred while retrieving disaster recovery data",
      requestId: ctx.requestId,
    });
  }
}

/**
 * POST /api/security/disaster-recovery
 * Create backup or restore operation
 */
export async function POST(req: NextRequest) {
  // Get security context
  const ctx = await getSecurityContext(req);

  try {
    const body = await req.json();
    const { action, backupId, name } = body;

    if (action === 'create_backup') {
      const backup = await disasterRecoveryManager.createBackup();

      return ok({ backup }, ctx.requestId);
    }

    if (action === 'restore' && backupId) {
      const result = await disasterRecoveryManager.restoreBackup({
        backupId,
        targetEnvironment: 'production',
        restoreTables: [],
        skipConflicts: false,
        validateData: true,
        dryRun: false,
      });
      return ok({ result }, ctx.requestId);
    }

    return problem({
      status: 400,
      title: "Invalid action or missing parameters",
      code: "INVALID_ACTION",
      detail: "Action must be 'create_backup' or 'restore' with backupId",
      requestId: ctx.requestId,
    });
  } catch (error) {
    monitoring.error("Failed to perform disaster recovery operation", error instanceof Error ? error : new Error(String(error)));

    return problem({
      status: 500,
      title: "Failed to perform disaster recovery operation",
      code: "DISASTER_RECOVERY_OPERATION_FAILED",
      detail: "An unexpected error occurred while performing disaster recovery operation",
      requestId: ctx.requestId,
    });
  }
}
