/**
 * Audit Trail and Compliance Service
 * Comprehensive audit logging and compliance management
 * Based on SOX, GDPR, HIPAA, and enterprise audit requirements
 */

import { supabase } from "./supabase";

export interface AuditLog {
  id: string;
  company_id: string;
  table_name: string;
  record_id: string;
  operation_type:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "VIEW"
    | "EXPORT"
    | "IMPORT"
    | "APPROVE"
    | "REJECT";
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  user_ip_address?: string;
  user_agent?: string;
  session_id?: string;
  device_type?: string;
  browser_name?: string;
  operating_system?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  compliance_flags?: string[];
  retention_period: number;
  is_sensitive_data: boolean;
  module_name?: string;
  action_description?: string;
  business_context?: Record<string, any>;
  error_message?: string;
  timestamp: string;
  created_at: string;
}

export interface ComplianceFramework {
  id: string;
  framework_name: string;
  framework_code: string;
  description?: string;
  version?: string;
  effective_date?: string;
  requirements: Record<string, any>;
  controls: Record<string, any>;
  documentation_requirements?: Record<string, any>;
  is_active: boolean;
  is_mandatory: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyComplianceSettings {
  id: string;
  company_id: string;
  framework_id: string;
  configuration: Record<string, any>;
  custom_requirements?: Record<string, any>;
  exemptions?: Record<string, any>;
  compliance_status:
    | "Not Assessed"
    | "In Progress"
    | "Compliant"
    | "Non-Compliant"
    | "Partially Compliant";
  last_assessment_date?: string;
  next_assessment_due?: string;
  compliance_officer_id?: string;
  compliance_officer_name?: string;
  compliance_officer_email?: string;
  created_at: string;
  updated_at: string;
}

export interface DataRetentionPolicy {
  id: string;
  company_id: string;
  policy_name: string;
  policy_description?: string;
  table_name: string;
  data_category: string;
  retention_period_days: number;
  retention_basis: "Creation Date" | "Last Modified" | "Last Accessed" | "Custom Field";
  custom_date_field?: string;
  action_after_retention: "Archive" | "Delete" | "Anonymize" | "Notify";
  archive_location?: string;
  legal_hold_override: boolean;
  legal_hold_reason?: string;
  legal_hold_until?: string;
  is_active: boolean;
  last_executed?: string;
  next_execution?: string;
  created_at: string;
  updated_at: string;
}

export interface AccessLog {
  id: string;
  company_id: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  access_type: "read" | "write" | "delete" | "export" | "print" | "email" | "share";
  user_id?: string;
  user_name: string;
  user_email?: string;
  user_role?: string;
  access_method?: "web" | "api" | "mobile" | "desktop" | "integration";
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  access_granted: boolean;
  denial_reason?: string;
  contains_pii: boolean;
  contains_financial_data: boolean;
  contains_confidential_data: boolean;
  data_classification: "Public" | "Internal" | "Confidential" | "Restricted";
  business_justification?: string;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: string;
  accessed_at: string;
  created_at: string;
}

export interface ComplianceViolation {
  id: string;
  company_id: string;
  framework_id: string;
  violation_type: string;
  violation_code?: string;
  severity_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  affected_systems?: string[];
  affected_data_types?: string[];
  detected_by?: string;
  detection_method?: string;
  detection_date: string;
  potential_impact?: string;
  actual_impact?: string;
  data_subjects_affected: number;
  financial_impact: number;
  status: "Open" | "In Review" | "In Remediation" | "Resolved" | "Closed" | "False Positive";
  assigned_to?: string;
  assigned_to_name?: string;
  remediation_plan?: string;
  remediation_deadline?: string;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  requires_regulatory_reporting: boolean;
  regulatory_deadline?: string;
  reported_to_regulator: boolean;
  reported_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDocument {
  id: string;
  company_id: string;
  framework_id?: string;
  document_name: string;
  document_type: string;
  document_category?: string;
  version: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  document_content?: string;
  description?: string;
  tags?: string[];
  keywords?: string[];
  status: "Draft" | "Under Review" | "Approved" | "Published" | "Archived" | "Obsolete";
  approval_required: boolean;
  approved_by?: string;
  approved_at?: string;
  effective_date?: string;
  expiry_date?: string;
  review_frequency_months: number;
  next_review_date?: string;
  access_level: "Public" | "Internal" | "Confidential" | "Restricted";
  authorized_roles?: string[];
  authorized_users?: string[];
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  company_id: string;
  assessment_name: string;
  assessment_type: string;
  assessment_scope?: string;
  methodology?: string;
  identified_risks: any[];
  risk_categories?: string[];
  likelihood_scale: "1-3" | "1-5" | "1-10" | "Low-Medium-High";
  impact_scale: "1-3" | "1-5" | "1-10" | "Low-Medium-High";
  risk_matrix?: Record<string, any>;
  risk_appetite?: string;
  risk_tolerance_levels?: Record<string, any>;
  acceptable_risk_threshold?: number;
  status: "Draft" | "In Progress" | "Under Review" | "Approved" | "Implemented" | "Archived";
  risk_owner_id?: string;
  risk_owner_name?: string;
  assessor_id?: string;
  assessor_name?: string;
  assessment_date: string;
  review_frequency_months: number;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Audit Trail and Compliance Service
 */
export class AuditComplianceService {
  /**
   * Log audit event
   */
  static async logAuditEvent(
    companyId: string,
    tableName: string,
    recordId: string,
    operationType:
      | "CREATE"
      | "UPDATE"
      | "DELETE"
      | "LOGIN"
      | "LOGOUT"
      | "VIEW"
      | "EXPORT"
      | "IMPORT"
      | "APPROVE"
      | "REJECT",
    options: {
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      userId?: string;
      userName?: string;
      userEmail?: string;
      userRole?: string;
      ipAddress?: string;
      sessionId?: string;
      moduleName?: string;
      actionDescription?: string;
      riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      businessContext?: Record<string, any>;
      errorMessage?: string;
    } = {},
  ): Promise<ApiResponse<string>> {
    try {
      const { data: auditId, error } = await supabase.rpc("log_audit_event", {
        p_company_id: companyId,
        p_table_name: tableName,
        p_record_id: recordId,
        p_operation_type: operationType,
        p_old_values: options.oldValues || null,
        p_new_values: options.newValues || null,
        p_user_id: options.userId || null,
        p_user_name: options.userName || null,
        p_user_email: options.userEmail || null,
        p_user_role: options.userRole || null,
        p_ip_address: options.ipAddress || null,
        p_session_id: options.sessionId || null,
        p_module_name: options.moduleName || null,
        p_action_description: options.actionDescription || null,
        p_risk_level: options.riskLevel || "LOW",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: auditId, message: "Audit event logged successfully" };
    } catch (error) {
      console.error("Error logging audit event:", error);
      return { success: false, error: "Failed to log audit event" };
    }
  }

  /**
   * Log access event
   */
  static async logAccessEvent(
    companyId: string,
    resourceType: string,
    resourceId: string,
    resourceName: string,
    accessType: "read" | "write" | "delete" | "export" | "print" | "email" | "share",
    options: {
      userId?: string;
      userName?: string;
      userEmail?: string;
      userRole?: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      accessGranted?: boolean;
      denialReason?: string;
      containsPii?: boolean;
      containsFinancialData?: boolean;
      dataClassification?: "Public" | "Internal" | "Confidential" | "Restricted";
    } = {},
  ): Promise<ApiResponse<string>> {
    try {
      const { data: accessLogId, error } = await supabase.rpc("log_access_event", {
        p_company_id: companyId,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_resource_name: resourceName,
        p_access_type: accessType,
        p_user_id: options.userId || null,
        p_user_name: options.userName || "Unknown",
        p_user_email: options.userEmail || null,
        p_user_role: options.userRole || null,
        p_ip_address: options.ipAddress || null,
        p_user_agent: options.userAgent || null,
        p_session_id: options.sessionId || null,
        p_access_granted: options.accessGranted !== false,
        p_denial_reason: options.denialReason || null,
        p_contains_pii: options.containsPii || false,
        p_contains_financial_data: options.containsFinancialData || false,
        p_data_classification: options.dataClassification || "Public",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: accessLogId, message: "Access event logged successfully" };
    } catch (error) {
      console.error("Error logging access event:", error);
      return { success: false, error: "Failed to log access event" };
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(
    companyId: string,
    filters: {
      tableName?: string;
      operationType?: string;
      userId?: string;
      riskLevel?: string;
      moduleName?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<ApiResponse<AuditLog[]>> {
    try {
      let query = supabase.from("audit_logs").select("*").eq("company_id", companyId);

      if (filters.tableName) {
        query = query.eq("table_name", filters.tableName);
      }

      if (filters.operationType) {
        query = query.eq("operation_type", filters.operationType);
      }

      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.riskLevel) {
        query = query.eq("risk_level", filters.riskLevel);
      }

      if (filters.moduleName) {
        query = query.eq("module_name", filters.moduleName);
      }

      if (filters.startDate) {
        query = query.gte("timestamp", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("timestamp", filters.endDate);
      }

      query = query.order("timestamp", { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data: auditLogs, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: auditLogs };
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return { success: false, error: "Failed to fetch audit logs" };
    }
  }

  /**
   * Get access logs
   */
  static async getAccessLogs(
    companyId: string,
    filters: {
      resourceType?: string;
      accessType?: string;
      userId?: string;
      accessGranted?: boolean;
      containsPii?: boolean;
      dataClassification?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<ApiResponse<AccessLog[]>> {
    try {
      let query = supabase.from("access_logs").select("*").eq("company_id", companyId);

      if (filters.resourceType) {
        query = query.eq("resource_type", filters.resourceType);
      }

      if (filters.accessType) {
        query = query.eq("access_type", filters.accessType);
      }

      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      if (filters.accessGranted !== undefined) {
        query = query.eq("access_granted", filters.accessGranted);
      }

      if (filters.containsPii !== undefined) {
        query = query.eq("contains_pii", filters.containsPii);
      }

      if (filters.dataClassification) {
        query = query.eq("data_classification", filters.dataClassification);
      }

      if (filters.startDate) {
        query = query.gte("accessed_at", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("accessed_at", filters.endDate);
      }

      query = query.order("accessed_at", { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data: accessLogs, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: accessLogs };
    } catch (error) {
      console.error("Error fetching access logs:", error);
      return { success: false, error: "Failed to fetch access logs" };
    }
  }

  /**
   * Get compliance frameworks
   */
  static async getComplianceFrameworks(): Promise<ApiResponse<ComplianceFramework[]>> {
    try {
      const { data: frameworks, error } = await supabase
        .from("compliance_frameworks")
        .select("*")
        .eq("is_active", true)
        .order("framework_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: frameworks };
    } catch (error) {
      console.error("Error fetching compliance frameworks:", error);
      return { success: false, error: "Failed to fetch compliance frameworks" };
    }
  }

  /**
   * Get company compliance settings
   */
  static async getCompanyComplianceSettings(
    companyId: string,
  ): Promise<ApiResponse<CompanyComplianceSettings[]>> {
    try {
      const { data: settings, error } = await supabase
        .from("company_compliance_settings")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: settings };
    } catch (error) {
      console.error("Error fetching compliance settings:", error);
      return { success: false, error: "Failed to fetch compliance settings" };
    }
  }

  /**
   * Get compliance status
   */
  static async getComplianceStatus(companyId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data: status, error } = await supabase.rpc("get_compliance_status", {
        p_company_id: companyId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: status };
    } catch (error) {
      console.error("Error fetching compliance status:", error);
      return { success: false, error: "Failed to fetch compliance status" };
    }
  }

  /**
   * Create compliance violation
   */
  static async createComplianceViolation(
    companyId: string,
    frameworkId: string,
    violationType: string,
    title: string,
    description: string,
    severityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    options: {
      violationCode?: string;
      affectedSystems?: string[];
      affectedDataTypes?: string[];
      detectedBy?: string;
      detectionMethod?: string;
      potentialImpact?: string;
      dataSubjectsAffected?: number;
      financialImpact?: number;
      assignedTo?: string;
      assignedToName?: string;
      requiresRegulatoryReporting?: boolean;
      regulatoryDeadline?: string;
    } = {},
  ): Promise<ApiResponse<ComplianceViolation>> {
    try {
      const { data: violation, error } = await supabase
        .from("compliance_violations")
        .insert([
          {
            company_id: companyId,
            framework_id: frameworkId,
            violation_type: violationType,
            violation_code: options.violationCode,
            severity_level: severityLevel,
            title: title.trim(),
            description: description.trim(),
            affected_systems: options.affectedSystems,
            affected_data_types: options.affectedDataTypes,
            detected_by: options.detectedBy,
            detection_method: options.detectionMethod,
            potential_impact: options.potentialImpact,
            data_subjects_affected: options.dataSubjectsAffected || 0,
            financial_impact: options.financialImpact || 0,
            assigned_to: options.assignedTo,
            assigned_to_name: options.assignedToName,
            requires_regulatory_reporting: options.requiresRegulatoryReporting || false,
            regulatory_deadline: options.regulatoryDeadline,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: violation,
        message: "Compliance violation created successfully",
      };
    } catch (error) {
      console.error("Error creating compliance violation:", error);
      return { success: false, error: "Failed to create compliance violation" };
    }
  }

  /**
   * Get compliance violations
   */
  static async getComplianceViolations(
    companyId: string,
    filters: {
      frameworkId?: string;
      severityLevel?: string;
      status?: string;
      assignedTo?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<ApiResponse<ComplianceViolation[]>> {
    try {
      let query = supabase.from("compliance_violations").select("*").eq("company_id", companyId);

      if (filters.frameworkId) {
        query = query.eq("framework_id", filters.frameworkId);
      }

      if (filters.severityLevel) {
        query = query.eq("severity_level", filters.severityLevel);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.assignedTo) {
        query = query.eq("assigned_to", filters.assignedTo);
      }

      if (filters.startDate) {
        query = query.gte("detection_date", filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte("detection_date", filters.endDate);
      }

      const { data: violations, error } = await query.order("detection_date", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: violations };
    } catch (error) {
      console.error("Error fetching compliance violations:", error);
      return { success: false, error: "Failed to fetch compliance violations" };
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(companyId: string): Promise<
    ApiResponse<{
      total_audit_logs: number;
      total_access_logs: number;
      high_risk_events: number;
      failed_access_attempts: number;
      compliance_violations: number;
      critical_violations: number;
      pii_access_events: number;
      financial_data_access_events: number;
    }>
  > {
    try {
      // Get audit logs count
      const { data: auditLogsCount } = await supabase
        .from("audit_logs")
        .select("id", { count: "exact" })
        .eq("company_id", companyId);

      // Get access logs count
      const { data: accessLogsCount } = await supabase
        .from("access_logs")
        .select("id", { count: "exact" })
        .eq("company_id", companyId);

      // Get high risk events count
      const { data: highRiskEventsCount } = await supabase
        .from("audit_logs")
        .select("id", { count: "exact" })
        .eq("company_id", companyId)
        .in("risk_level", ["HIGH", "CRITICAL"]);

      // Get failed access attempts count
      const { data: failedAccessCount } = await supabase
        .from("access_logs")
        .select("id", { count: "exact" })
        .eq("company_id", companyId)
        .eq("access_granted", false);

      // Get compliance violations count
      const { data: violationsCount } = await supabase
        .from("compliance_violations")
        .select("id", { count: "exact" })
        .eq("company_id", companyId)
        .not("status", "in", "(Resolved,Closed,False Positive)");

      // Get critical violations count
      const { data: criticalViolationsCount } = await supabase
        .from("compliance_violations")
        .select("id", { count: "exact" })
        .eq("company_id", companyId)
        .eq("severity_level", "CRITICAL")
        .not("status", "in", "(Resolved,Closed,False Positive)");

      // Get PII access events count
      const { data: piiAccessCount } = await supabase
        .from("access_logs")
        .select("id", { count: "exact" })
        .eq("company_id", companyId)
        .eq("contains_pii", true);

      // Get financial data access events count
      const { data: financialAccessCount } = await supabase
        .from("access_logs")
        .select("id", { count: "exact" })
        .eq("company_id", companyId)
        .eq("contains_financial_data", true);

      const stats = {
        total_audit_logs: auditLogsCount?.length || 0,
        total_access_logs: accessLogsCount?.length || 0,
        high_risk_events: highRiskEventsCount?.length || 0,
        failed_access_attempts: failedAccessCount?.length || 0,
        compliance_violations: violationsCount?.length || 0,
        critical_violations: criticalViolationsCount?.length || 0,
        pii_access_events: piiAccessCount?.length || 0,
        financial_data_access_events: financialAccessCount?.length || 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error fetching audit statistics:", error);
      return { success: false, error: "Failed to fetch audit statistics" };
    }
  }

  /**
   * Export audit logs to CSV
   */
  static async exportAuditLogsToCSV(
    companyId: string,
    filters: {
      tableName?: string;
      operationType?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<ApiResponse<string>> {
    try {
      const result = await this.getAuditLogs(companyId, { ...filters, limit: 10000 });

      if (!result.success || !result.data) {
        return { success: false, error: "Failed to fetch audit logs for export" };
      }

      // Generate CSV content
      const headers = [
        "Timestamp",
        "Table Name",
        "Operation Type",
        "User Name",
        "User Email",
        "User Role",
        "IP Address",
        "Risk Level",
        "Module Name",
        "Action Description",
        "Changed Fields",
      ];

      const csvRows = [
        headers.join(","),
        ...result.data.map(log =>
          [
            log.timestamp,
            log.table_name,
            log.operation_type,
            log.user_name || "",
            log.user_email || "",
            log.user_role || "",
            log.user_ip_address || "",
            log.risk_level,
            log.module_name || "",
            `"${log.action_description || ""}"`,
            `"${log.changed_fields?.join(", ") || ""}"`,
          ].join(","),
        ),
      ];

      const csvContent = csvRows.join("\n");

      return { success: true, data: csvContent, message: "Audit logs exported successfully" };
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      return { success: false, error: "Failed to export audit logs" };
    }
  }
}
