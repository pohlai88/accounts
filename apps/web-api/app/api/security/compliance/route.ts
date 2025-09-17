/**
 * Security Compliance API Routes
 *
 * Provides endpoints for managing compliance frameworks and dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";
import { ComplianceManager } from "@aibos/security";
import { monitoring } from "@aibos/monitoring";

// Force dynamic rendering to avoid build-time header access
export const dynamic = 'force-dynamic';

// Create compliance manager instance
const complianceManager = new ComplianceManager();

/**
 * GET /api/security/compliance
 * Get compliance dashboard and status, or frameworks based on query parameter
 */
export async function GET(req: NextRequest) {
  // Get security context
  const ctx = await getSecurityContext(req);

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    // If requesting frameworks specifically
    if (type === 'frameworks') {
      const frameworks = complianceManager.getFrameworks();
      const frameworksWithStatus = frameworks.map(framework => {
        const status = complianceManager.getComplianceStatus(framework.id);
        return {
          ...framework,
          status,
        };
      });

      return ok(frameworksWithStatus, ctx.requestId);
    }

    // Default: Get compliance dashboard
    const dashboard = complianceManager.getComplianceDashboard();

    // Get individual framework statuses
    const frameworkStatuses = dashboard.frameworks.map(framework => {
      const status = complianceManager.getComplianceStatus(framework.id);
      return {
        ...framework,
        status,
      };
    });

    const response = {
      dashboard,
      frameworkStatuses,
      summary: {
        totalFrameworks: dashboard.frameworks.length,
        compliantFrameworks: dashboard.frameworks.filter(f => f.complianceLevel === "compliant" || f.complianceLevel === "fully_compliant").length,
        averageComplianceScore: Math.round(dashboard.frameworks.reduce((sum, f) => sum + f.overallScore, 0) / dashboard.frameworks.length),
        pendingDataSubjectRequests: dashboard.dataSubjectRequests.pending,
        overdueDataSubjectRequests: dashboard.dataSubjectRequests.overdue,
        openDataBreachIncidents: dashboard.dataBreachIncidents.open,
        criticalDataBreachIncidents: dashboard.dataBreachIncidents.critical,
        upcomingReviews: dashboard.upcomingReviews.length,
      },
    };

    return ok(response, ctx.requestId);
  } catch (error) {
    monitoring.error("Failed to get compliance data", error instanceof Error ? error : new Error(String(error)));

    return problem({
      status: 500,
      title: "Failed to retrieve compliance data",
      code: "COMPLIANCE_FETCH_FAILED",
      detail: "An unexpected error occurred while retrieving compliance data",
      requestId: ctx.requestId,
    });
  }
}
