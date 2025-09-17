// @ts-nocheck
import { supabase } from "./supabase";
import type {
  User,
  UserRole,
  AuditLog,
  SecurityEvent,
  ComplianceStandard,
  CompanyCompliance,
} from "./supabase";

/**
 * Security Service Layer
 * Enterprise-grade security and compliance management
 */

export interface CreateUserProfileInput {
  email: string;
  full_name?: string;
  role_id: string;
  company_id: string;
  two_factor_enabled?: boolean;
  ip_whitelist?: string[];
  session_timeout?: number;
}

export interface CreateAuditLogInput {
  user_id?: string;
  company_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  metadata?: Record<string, any>;
}

export interface SecurityEventInput {
  event_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  user_id?: string;
  company_id: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

export interface ComplianceReportInput {
  company_id: string;
  compliance_standard_id: string;
  report_type: string;
  generated_by: string;
}

export class SecurityService {
  /**
   * User Management
   */
  static async createUserProfile(data: CreateUserProfileInput): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const { data: user, error } = await supabase
        .from("user_profiles")
        .insert([
          {
            email: data.email,
            full_name: data.full_name,
            role_id: data.role_id,
            company_id: data.company_id,
            two_factor_enabled: data.two_factor_enabled || false,
            ip_whitelist: data.ip_whitelist || [],
            session_timeout: data.session_timeout || 3600,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log the creation
      await this.logAuditEvent({
        user_id: user.id,
        company_id: data.company_id,
        action: "CREATE",
        entity_type: "user_profile",
        entity_id: user.id,
        new_values: user,
        metadata: { source: "security_service" },
      });

      return { success: true, user };
    } catch (error) {
      console.error("Error creating user profile:", error);
      return { success: false, error: "Failed to create user profile" };
    }
  }

  static async getUserProfile(userId: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const { data: user, error } = await supabase
        .from("user_profiles")
        .select(
          `
          *,
          role:user_roles(*),
          company:companies(*)
        `,
        )
        .eq("id", userId)
        .single();

      if (error) throw error;

      return { success: true, user };
    } catch (error) {
      console.error("Error getting user profile:", error);
      return { success: false, error: "Failed to get user profile" };
    }
  }

  static async updateUserProfile(
    userId: string,
    updates: Partial<CreateUserProfileInput>,
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      // Get old values for audit
      const { data: oldUser } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const { data: user, error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      // Log the update
      await this.logAuditEvent({
        user_id: userId,
        company_id: user.company_id,
        action: "UPDATE",
        entity_type: "user_profile",
        entity_id: userId,
        old_values: oldUser,
        new_values: user,
        metadata: { source: "security_service" },
      });

      return { success: true, user };
    } catch (error) {
      console.error("Error updating user profile:", error);
      return { success: false, error: "Failed to update user profile" };
    }
  }

  /**
   * Role Management
   */
  static async getRoles(): Promise<{
    success: boolean;
    roles?: UserRole[];
    error?: string;
  }> {
    try {
      const { data: roles, error } = await supabase.from("user_roles").select("*").order("name");

      if (error) throw error;

      return { success: true, roles: roles || [] };
    } catch (error) {
      console.error("Error getting roles:", error);
      return { success: false, error: "Failed to get roles" };
    }
  }

  static async createRole(data: {
    name: string;
    description?: string;
    permissions: string[];
  }): Promise<{
    success: boolean;
    role?: UserRole;
    error?: string;
  }> {
    try {
      const { data: role, error } = await supabase
        .from("user_roles")
        .insert([
          {
            name: data.name,
            description: data.description,
            permissions: data.permissions,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, role };
    } catch (error) {
      console.error("Error creating role:", error);
      return { success: false, error: "Failed to create role" };
    }
  }

  /**
   * Audit Logging
   */
  static async logAuditEvent(data: CreateAuditLogInput): Promise<{
    success: boolean;
    audit_id?: string;
    error?: string;
  }> {
    try {
      const { data: result, error } = await supabase.rpc("log_audit_event", {
        p_user_id: data.user_id || null,
        p_company_id: data.company_id,
        p_action: data.action,
        p_entity_type: data.entity_type,
        p_entity_id: data.entity_id || null,
        p_old_values: data.old_values || null,
        p_new_values: data.new_values || null,
        p_ip_address: data.ip_address || null,
        p_user_agent: data.user_agent || null,
        p_session_id: data.session_id || null,
        p_metadata: data.metadata || {},
      });

      if (error) throw error;

      return { success: true, audit_id: result };
    } catch (error) {
      console.error("Error logging audit event:", error);
      return { success: false, error: "Failed to log audit event" };
    }
  }

  static async getAuditLogs(
    companyId: string,
    filters?: {
      user_id?: string;
      action?: string;
      entity_type?: string;
      from_date?: string;
      to_date?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<{
    success: boolean;
    logs?: AuditLog[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from("audit_logs")
        .select(
          `
          *,
          user:user_profiles(email, full_name),
          company:companies(name)
        `,
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (filters?.user_id) {
        query = query.eq("user_id", filters.user_id);
      }
      if (filters?.action) {
        query = query.eq("action", filters.action);
      }
      if (filters?.entity_type) {
        query = query.eq("entity_type", filters.entity_type);
      }
      if (filters?.from_date) {
        query = query.gte("created_at", filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte("created_at", filters.to_date);
      }

      // Get total count
      const { count } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1);
      }

      const { data: logs, error } = await query;

      if (error) throw error;

      return { success: true, logs: logs || [], total: count || 0 };
    } catch (error) {
      console.error("Error getting audit logs:", error);
      return { success: false, error: "Failed to get audit logs" };
    }
  }

  /**
   * Security Events
   */
  static async logSecurityEvent(data: SecurityEventInput): Promise<{
    success: boolean;
    event_id?: string;
    error?: string;
  }> {
    try {
      const { data: event, error } = await supabase
        .from("security_events")
        .insert([
          {
            event_type: data.event_type,
            severity: data.severity,
            user_id: data.user_id,
            company_id: data.company_id,
            description: data.description,
            ip_address: data.ip_address,
            user_agent: data.user_agent,
            metadata: data.metadata || {},
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, event_id: event.id };
    } catch (error) {
      console.error("Error logging security event:", error);
      return { success: false, error: "Failed to log security event" };
    }
  }

  static async getSecurityEvents(
    companyId: string,
    filters?: {
      severity?: string;
      event_type?: string;
      is_resolved?: boolean;
      from_date?: string;
      to_date?: string;
    },
  ): Promise<{
    success: boolean;
    events?: SecurityEvent[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from("security_events")
        .select(
          `
          *,
          user:user_profiles(email, full_name),
          company:companies(name)
        `,
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (filters?.severity) {
        query = query.eq("severity", filters.severity);
      }
      if (filters?.event_type) {
        query = query.eq("event_type", filters.event_type);
      }
      if (filters?.is_resolved !== undefined) {
        query = query.eq("is_resolved", filters.is_resolved);
      }
      if (filters?.from_date) {
        query = query.gte("created_at", filters.from_date);
      }
      if (filters?.to_date) {
        query = query.lte("created_at", filters.to_date);
      }

      const { data: events, error } = await query;

      if (error) throw error;

      return { success: true, events: events || [] };
    } catch (error) {
      console.error("Error getting security events:", error);
      return { success: false, error: "Failed to get security events" };
    }
  }

  /**
   * Session Management
   */
  static async createSession(
    userId: string,
    sessionToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    success: boolean;
    session_id?: string;
    error?: string;
  }> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

      const { data: session, error } = await supabase
        .from("user_sessions")
        .insert([
          {
            user_id: userId,
            session_token: sessionToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt.toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, session_id: session.id };
    } catch (error) {
      console.error("Error creating session:", error);
      return { success: false, error: "Failed to create session" };
    }
  }

  static async validateSession(sessionToken: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const { data: session, error } = await supabase
        .from("user_sessions")
        .select(
          `
          *,
          user:user_profiles(*)
        `,
        )
        .eq("session_token", sessionToken)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !session) {
        return { success: false, error: "Invalid or expired session" };
      }

      // Update last activity
      await supabase
        .from("user_sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("id", session.id);

      return { success: true, user: session.user };
    } catch (error) {
      console.error("Error validating session:", error);
      return { success: false, error: "Failed to validate session" };
    }
  }

  static async cleanupExpiredSessions(): Promise<{
    success: boolean;
    deleted_count?: number;
    error?: string;
  }> {
    try {
      const { data: count, error } = await supabase.rpc("cleanup_expired_sessions");

      if (error) throw error;

      return { success: true, deleted_count: count };
    } catch (error) {
      console.error("Error cleaning up sessions:", error);
      return { success: false, error: "Failed to cleanup sessions" };
    }
  }

  /**
   * Permission Checking
   */
  static async checkPermission(
    userId: string,
    permission: string,
  ): Promise<{
    success: boolean;
    has_permission?: boolean;
    error?: string;
  }> {
    try {
      const { data: result, error } = await supabase.rpc("check_user_permission", {
        p_user_id: userId,
        p_permission: permission,
      });

      if (error) throw error;

      return { success: true, has_permission: result };
    } catch (error) {
      console.error("Error checking permission:", error);
      return { success: false, error: "Failed to check permission" };
    }
  }

  /**
   * Compliance Management
   */
  static async getComplianceStandards(): Promise<{
    success: boolean;
    standards?: ComplianceStandard[];
    error?: string;
  }> {
    try {
      const { data: standards, error } = await supabase
        .from("compliance_standards")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      return { success: true, standards: standards || [] };
    } catch (error) {
      console.error("Error getting compliance standards:", error);
      return { success: false, error: "Failed to get compliance standards" };
    }
  }

  static async setCompanyCompliance(
    companyId: string,
    complianceStandardId: string,
    effectiveDate: string,
    configuration?: Record<string, any>,
  ): Promise<{
    success: boolean;
    compliance?: CompanyCompliance;
    error?: string;
  }> {
    try {
      const { data: compliance, error } = await supabase
        .from("company_compliance")
        .upsert([
          {
            company_id: companyId,
            compliance_standard_id: complianceStandardId,
            effective_date: effectiveDate,
            configuration: configuration || {},
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, compliance };
    } catch (error) {
      console.error("Error setting company compliance:", error);
      return { success: false, error: "Failed to set company compliance" };
    }
  }

  static async generateComplianceReport(data: ComplianceReportInput): Promise<{
    success: boolean;
    report_id?: string;
    error?: string;
  }> {
    try {
      const { data: reportId, error } = await supabase.rpc("generate_compliance_report", {
        p_company_id: data.company_id,
        p_compliance_standard_id: data.compliance_standard_id,
        p_report_type: data.report_type,
        p_generated_by: data.generated_by,
      });

      if (error) throw error;

      return { success: true, report_id: reportId };
    } catch (error) {
      console.error("Error generating compliance report:", error);
      return { success: false, error: "Failed to generate compliance report" };
    }
  }

  /**
   * Data Retention
   */
  static async setDataRetentionPolicy(
    companyId: string,
    entityType: string,
    retentionPeriodDays: number,
    archiveBeforeDelete: boolean = true,
  ): Promise<{
    success: boolean;
    policy_id?: string;
    error?: string;
  }> {
    try {
      const { data: policy, error } = await supabase
        .from("data_retention_policies")
        .upsert([
          {
            company_id: companyId,
            entity_type: entityType,
            retention_period_days: retentionPeriodDays,
            archive_before_delete: archiveBeforeDelete,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, policy_id: policy.id };
    } catch (error) {
      console.error("Error setting data retention policy:", error);
      return { success: false, error: "Failed to set data retention policy" };
    }
  }

  /**
   * Security Monitoring
   */
  static async getSecurityDashboard(companyId: string): Promise<{
    success: boolean;
    dashboard?: {
      total_users: number;
      active_sessions: number;
      security_events_today: number;
      critical_events: number;
      audit_logs_today: number;
      compliance_status: string;
    };
    error?: string;
  }> {
    try {
      // Get various metrics
      const [
        usersResult,
        sessionsResult,
        eventsResult,
        criticalEventsResult,
        auditResult,
        complianceResult,
      ] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("is_active", true),

        supabase
          .from("user_sessions")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString()),

        supabase
          .from("security_events")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .gte("created_at", new Date().toISOString().split("T")[0]),

        supabase
          .from("security_events")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("severity", "CRITICAL")
          .eq("is_resolved", false),

        supabase
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .gte("created_at", new Date().toISOString().split("T")[0]),

        supabase
          .from("company_compliance")
          .select("*")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .single(),
      ]);

      const dashboard = {
        total_users: usersResult.count || 0,
        active_sessions: sessionsResult.count || 0,
        security_events_today: eventsResult.count || 0,
        critical_events: criticalEventsResult.count || 0,
        audit_logs_today: auditResult.count || 0,
        compliance_status: complianceResult.data ? "Active" : "Not Configured",
      };

      return { success: true, dashboard };
    } catch (error) {
      console.error("Error getting security dashboard:", error);
      return { success: false, error: "Failed to get security dashboard" };
    }
  }
}
