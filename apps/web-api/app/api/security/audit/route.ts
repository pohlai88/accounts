/**
 * Security Audit API Routes
 *
 * Provides endpoints for managing security audits, viewing audit results,
 * and generating security reports.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";
import { SecurityAuditManager } from "@aibos/security";
import { monitoring } from "@aibos/monitoring";

// Force dynamic rendering to avoid build-time header access
export const dynamic = 'force-dynamic';

// Create security audit manager instance
const securityAuditManager = new SecurityAuditManager();

/**
 * GET /api/security/audit
 * Get security audit results and status
 */
export async function GET(req: NextRequest) {
  // Get security context
  const ctx = await getSecurityContext(req);

  try {

    // Get audit history
    const auditHistory = securityAuditManager.getAuditHistory();
    const latestAudit = auditHistory[auditHistory.length - 1];

    // Get vulnerabilities by severity
    const vulnerabilities = {
      critical: securityAuditManager.getVulnerabilitiesBySeverity("critical"),
      high: securityAuditManager.getVulnerabilitiesBySeverity("high"),
      medium: securityAuditManager.getVulnerabilitiesBySeverity("medium"),
      low: securityAuditManager.getVulnerabilitiesBySeverity("low"),
    };

    // Get vulnerabilities by category
    const vulnerabilitiesByCategory = {
      injection: securityAuditManager.getVulnerabilitiesByCategory("injection"),
      authentication: securityAuditManager.getVulnerabilitiesByCategory("authentication"),
      authorization: securityAuditManager.getVulnerabilitiesByCategory("authorization"),
      data_protection: securityAuditManager.getVulnerabilitiesByCategory("data_protection"),
      configuration: securityAuditManager.getVulnerabilitiesByCategory("configuration"),
      dependencies: securityAuditManager.getVulnerabilitiesByCategory("dependencies"),
      encryption: securityAuditManager.getVulnerabilitiesByCategory("encryption"),
      logging: securityAuditManager.getVulnerabilitiesByCategory("logging"),
    };

    const response = {
      auditHistory: auditHistory.map(audit => ({
        auditId: audit.auditId,
        timestamp: audit.timestamp,
        duration: audit.duration,
        riskScore: audit.riskScore,
        summary: audit.summary,
        compliance: audit.compliance,
      })),
      latestAudit: latestAudit ? {
        auditId: latestAudit.auditId,
        timestamp: latestAudit.timestamp,
        duration: latestAudit.duration,
        riskScore: latestAudit.riskScore,
        summary: latestAudit.summary,
        compliance: latestAudit.compliance,
        recommendations: latestAudit.recommendations,
      } : null,
      vulnerabilities,
      vulnerabilitiesByCategory,
      statistics: {
        totalAudits: auditHistory.length,
        averageRiskScore: auditHistory.length > 0
          ? Math.round(auditHistory.reduce((sum, audit) => sum + audit.riskScore, 0) / auditHistory.length)
          : 0,
        lastAuditDate: latestAudit ? new Date(latestAudit.timestamp) : null,
        nextAuditRecommended: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    };

    return ok(response, ctx.requestId);
  } catch (error) {
    monitoring.error("Failed to get security audit data", error instanceof Error ? error : new Error(String(error)));

    return problem({
      status: 500,
      title: "Failed to retrieve security audit data",
      code: "SECURITY_AUDIT_FETCH_FAILED",
      detail: "An unexpected error occurred while retrieving security audit data",
      requestId: ctx.requestId,
    });
  }
}

/**
 * POST /api/security/audit
 * Run a new security audit
 */
export async function POST(req: NextRequest) {
  // Get security context
  const ctx = await getSecurityContext(req);

  try {

    // TODO: Add proper permission checking when user context is available

    // Run security audit
    monitoring.info("Starting security audit", { userId: ctx.userId, tenantId: ctx.tenantId });

    const auditResult = await securityAuditManager.runSecurityAudit();

    const response = {
      auditId: auditResult.auditId,
      timestamp: auditResult.timestamp,
      duration: auditResult.duration,
      riskScore: auditResult.riskScore,
      summary: auditResult.summary,
      compliance: auditResult.compliance,
      recommendations: auditResult.recommendations,
      vulnerabilities: auditResult.vulnerabilities.map(v => ({
        id: v.id,
        severity: v.severity,
        category: v.category,
        title: v.title,
        description: v.description,
        impact: v.impact,
        recommendation: v.recommendation,
        status: v.status,
        detectedAt: v.detectedAt,
        cwe: v.cwe,
        owasp: v.owasp,
      })),
    };

    monitoring.info("Security audit completed", {
      auditId: auditResult.auditId,
      riskScore: auditResult.riskScore,
      vulnerabilities: auditResult.summary.total
    });

    return ok(response, ctx.requestId);
  } catch (error) {
    monitoring.error("Security audit failed", error instanceof Error ? error : new Error(String(error)));

    return problem({
      status: 500,
      title: "Security audit failed",
      code: "SECURITY_AUDIT_FAILED",
      detail: "An unexpected error occurred while running the security audit",
      requestId: ctx.requestId,
    });
  }
}
