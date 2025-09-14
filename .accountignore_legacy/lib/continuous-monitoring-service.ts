/**
 * Continuous Monitoring Service - Advanced Financial Controls & Risk Monitoring
 * Comprehensive Internal Controls, Automated Testing & Risk Assessment
 *
 * Features:
 * - Automated control testing and effectiveness monitoring
 * - Real-time monitoring rules engine with intelligent alerting
 * - Key Risk Indicators (KRI) tracking and trend analysis
 * - Control effectiveness metrics and performance dashboards
 * - Exception management and remediation tracking
 */

import { createClient } from "@/lib/supabase-client";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ControlFramework {
  id: string;
  framework_name: string;
  framework_code: string;
  framework_version: string;
  framework_description?: string;
  framework_type: "SOX" | "COSO" | "COBIT" | "ISO27001" | "Custom";
  risk_category: "Financial" | "Operational" | "Compliance" | "Strategic";
  compliance_standard?: string;
  testing_frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  effectiveness_threshold: number;
  materiality_threshold: number;
  framework_status: "active" | "inactive" | "deprecated";
  last_assessment_date?: string;
  next_assessment_date?: string;
  created_at: string;
  updated_at: string;
}

export interface InternalControl {
  id: string;
  control_id: string;
  control_name: string;
  control_description: string;
  control_objective: string;
  framework_id: string;
  process_area: string;
  control_type: "Preventive" | "Detective" | "Corrective";
  control_nature: "Manual" | "Automated" | "Semi-automated";
  control_frequency: "Continuous" | "Daily" | "Weekly" | "Monthly" | "Quarterly";
  inherent_risk_rating: "Low" | "Medium" | "High" | "Critical";
  residual_risk_rating: "Low" | "Medium" | "High" | "Critical";
  risk_impact_score: number;
  risk_likelihood_score: number;
  key_control_indicator: boolean;
  sox_relevant: boolean;
  automated_testing: boolean;
  requires_it_dependency: boolean;
  testing_method: string;
  sample_size_calculation?: string;
  testing_procedures: string;
  evidence_requirements: string;
  control_effectiveness_target: number;
  deficiency_threshold: number;
  material_weakness_threshold: number;
  control_status: "active" | "inactive" | "deprecated";
  implementation_date?: string;
  last_update_date?: string;
  review_date?: string;
  created_at: string;
  updated_at: string;
  framework?: ControlFramework;
}

export interface ControlTestingPlan {
  id: string;
  plan_name: string;
  plan_description?: string;
  testing_period_start: string;
  testing_period_end: string;
  framework_ids: string[];
  process_areas: string[];
  control_types: string[];
  risk_ratings: string[];
  testing_approach: "Risk-based" | "Comprehensive" | "Targeted" | "Continuous";
  sample_methodology: "Statistical" | "Judgmental" | "Hybrid";
  confidence_level: number;
  acceptable_error_rate: number;
  planned_testing_hours?: number;
  assigned_testers: string[];
  budget_allocated?: number;
  external_auditor_involvement: boolean;
  plan_status: "draft" | "approved" | "in_progress" | "completed" | "cancelled";
  approval_date?: string;
  approved_by?: string;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ControlTestExecution {
  id: string;
  test_execution_number: string;
  control_id: string;
  testing_plan_id?: string;
  test_date: string;
  testing_period_start: string;
  testing_period_end: string;
  tester_id: string;
  reviewer_id?: string;
  population_size?: number;
  sample_size: number;
  sample_selection_method?: string;
  sample_description?: string;
  tests_passed: number;
  tests_failed: number;
  tests_not_applicable: number;
  effectiveness_rate: number;
  test_conclusion: "Effective" | "Deficient" | "Material Weakness" | "Significant Deficiency";
  control_design_effectiveness: "Effective" | "Ineffective" | "Not Tested";
  control_operating_effectiveness: "Effective" | "Ineffective" | "Not Tested";
  testing_procedures_performed: string;
  evidence_examined?: string;
  findings_summary?: string;
  recommendations?: string;
  management_response?: string;
  test_status: "planned" | "in_progress" | "completed" | "reviewed" | "approved";
  completion_date?: string;
  review_date?: string;
  approval_date?: string;
  requires_followup: boolean;
  followup_due_date?: string;
  followup_responsible_party?: string;
  created_at: string;
  updated_at: string;
  control?: InternalControl;
  exceptions?: ControlTestException[];
}

export interface ControlTestException {
  id: string;
  exception_number: string;
  test_execution_id: string;
  exception_date: string;
  exception_type: "Control Gap" | "Process Deviation" | "System Error" | "Human Error";
  severity_level: "Low" | "Medium" | "High" | "Critical";
  materiality_assessment: "Immaterial" | "Material" | "Highly Material";
  exception_description: string;
  root_cause_analysis?: string;
  business_impact_assessment?: string;
  regulatory_implications?: string;
  transaction_id?: string;
  transaction_date?: string;
  transaction_amount?: number;
  account_affected?: string;
  corrective_action_required: boolean;
  corrective_action_description?: string;
  remediation_owner?: string;
  target_resolution_date?: string;
  actual_resolution_date?: string;
  exception_status: "open" | "in_progress" | "resolved" | "accepted_risk";
  resolution_verified: boolean;
  verification_date?: string;
  verified_by?: string;
  management_comments?: string;
  accepted_by_management: boolean;
  escalated_to_audit_committee: boolean;
  escalation_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MonitoringRule {
  id: string;
  rule_name: string;
  rule_code: string;
  rule_description: string;
  rule_category: "Financial" | "Operational" | "Compliance" | "IT General Controls";
  control_id?: string;
  monitoring_frequency: "Real-time" | "Hourly" | "Daily" | "Weekly" | "Monthly";
  data_source: string;
  rule_sql_query: string;
  threshold_operator: ">" | "<" | ">=" | "<=" | "=" | "!=";
  threshold_value?: number;
  threshold_percentage?: number;
  alert_severity: "low" | "medium" | "high" | "critical";
  alert_threshold_count: number;
  suppress_duplicate_alerts: boolean;
  alert_cooldown_hours: number;
  notification_enabled: boolean;
  notification_recipients: string[];
  email_notifications: boolean;
  dashboard_notifications: boolean;
  false_positive_rate: number;
  detection_rate: number;
  last_triggered?: string;
  total_triggers_count: number;
  rule_status: "active" | "inactive" | "testing" | "deprecated";
  effective_from_date: string;
  effective_to_date?: string;
  last_execution?: string;
  next_execution?: string;
  created_at: string;
  updated_at: string;
  control?: InternalControl;
}

export interface MonitoringAlert {
  id: string;
  alert_number: string;
  monitoring_rule_id: string;
  alert_timestamp: string;
  alert_severity: "low" | "medium" | "high" | "critical";
  alert_title: string;
  alert_description: string;
  alert_category: string;
  trigger_value?: number;
  threshold_value?: number;
  variance_amount?: number;
  variance_percentage?: number;
  affected_records_count?: number;
  affected_transactions?: any;
  affected_accounts?: string[];
  data_source?: string;
  alert_status: "new" | "acknowledged" | "investigating" | "resolved" | "false_positive";
  acknowledged_by?: string;
  acknowledged_at?: string;
  assigned_to?: string;
  investigation_notes?: string;
  investigation_start_date?: string;
  investigation_completion_date?: string;
  investigation_outcome?: string;
  resolution_action?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_verified: boolean;
  requires_control_testing: boolean;
  requires_process_improvement: boolean;
  escalated_to_management: boolean;
  escalation_level?: string;
  created_at: string;
  updated_at: string;
  monitoring_rule?: MonitoringRule;
}

export interface ControlEffectivenessMetric {
  id: string;
  control_id: string;
  measurement_period_start: string;
  measurement_period_end: string;
  metric_date: string;
  design_effectiveness_rating: "Effective" | "Ineffective" | "Needs Improvement";
  operating_effectiveness_rating: "Effective" | "Ineffective" | "Needs Improvement";
  overall_effectiveness_score: number;
  total_tests_performed: number;
  tests_passed: number;
  tests_failed: number;
  exception_count: number;
  control_reliability_percentage: number;
  effectiveness_trend?: "Improving" | "Declining" | "Stable";
  trend_percentage_change?: number;
  benchmark_comparison?: "Above" | "At" | "Below";
  residual_risk_score?: number;
  control_gaps_identified: number;
  material_weaknesses_count: number;
  significant_deficiencies_count: number;
  improvement_recommendations?: string;
  action_plan?: string;
  responsible_party?: string;
  target_completion_date?: string;
  assessment_status: "draft" | "reviewed" | "approved" | "published";
  reviewed_by?: string;
  review_date?: string;
  approved_by?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
  control?: InternalControl;
}

export interface KeyRiskIndicator {
  id: string;
  kri_name: string;
  kri_code: string;
  kri_description: string;
  kri_category: "Financial" | "Operational" | "Strategic" | "Compliance";
  control_ids: string[];
  risk_domain: string;
  risk_sub_category?: string;
  measurement_unit: "Percentage" | "Count" | "Amount" | "Ratio" | "Days";
  calculation_method: string;
  data_source: string;
  measurement_frequency: string;
  green_threshold_min?: number;
  green_threshold_max?: number;
  yellow_threshold_min?: number;
  yellow_threshold_max?: number;
  red_threshold_min?: number;
  red_threshold_max?: number;
  target_value?: number;
  tolerance_percentage: number;
  trend_direction: "Higher is Better" | "Lower is Better" | "Target Range";
  executive_dashboard: boolean;
  board_reporting: boolean;
  regulatory_reporting: boolean;
  kri_status: "active" | "inactive" | "under_review";
  last_measured?: string;
  next_measurement_due?: string;
  created_at: string;
  updated_at: string;
  latest_measurement?: KRIMeasurement;
}

export interface KRIMeasurement {
  id: string;
  kri_id: string;
  measurement_date: string;
  measurement_period_start: string;
  measurement_period_end: string;
  measured_value: number;
  target_value?: number;
  variance_amount?: number;
  variance_percentage?: number;
  status_color: "Green" | "Yellow" | "Red";
  risk_level: "Low" | "Medium" | "High" | "Critical";
  threshold_breached: boolean;
  data_quality_score: number;
  measurement_confidence: "high" | "medium" | "low";
  external_factors?: string;
  business_context?: string;
  trend_vs_previous?: "Improving" | "Declining" | "Stable";
  trend_percentage_change?: number;
  benchmark_position?: string;
  statistical_significance: boolean;
  action_required: boolean;
  action_description?: string;
  action_owner?: string;
  action_due_date?: string;
  analyst_comments?: string;
  management_comments?: string;
  auditor_comments?: string;
  data_validated: boolean;
  validated_by?: string;
  validation_date?: string;
  created_at: string;
  updated_at: string;
  kri?: KeyRiskIndicator;
}

// Dashboard Summary Types
export interface MonitoringDashboard {
  control_frameworks: ControlFramework[];
  control_summary: {
    total_controls: number;
    active_controls: number;
    high_risk_controls: number;
    sox_controls: number;
    automated_controls: number;
    controls_requiring_testing: number;
  };
  testing_summary: {
    total_tests_completed: number;
    tests_in_progress: number;
    overall_effectiveness_rate: number;
    material_weaknesses: number;
    significant_deficiencies: number;
    exceptions_open: number;
  };
  monitoring_summary: {
    active_rules: number;
    alerts_today: number;
    critical_alerts: number;
    alerts_resolved: number;
    false_positive_rate: number;
    detection_accuracy: number;
  };
  kri_summary: {
    total_kris: number;
    red_status_count: number;
    yellow_status_count: number;
    green_status_count: number;
    trending_negative: number;
    requiring_action: number;
  };
  recent_alerts: MonitoringAlert[];
  recent_exceptions: ControlTestException[];
  effectiveness_trends: ControlEffectivenessMetric[];
  top_kris: KRIMeasurement[];
}

export interface MonitoringAnalysis {
  control_performance: {
    by_framework: { framework_name: string; effectiveness_rate: number }[];
    by_process_area: { process_area: string; effectiveness_rate: number }[];
    by_risk_level: { risk_level: string; control_count: number; effectiveness_rate: number }[];
    by_control_type: { control_type: string; control_count: number; effectiveness_rate: number }[];
  };
  alert_patterns: {
    by_severity: { severity: string; count: number; resolution_rate: number }[];
    by_category: { category: string; count: number; avg_resolution_time: number }[];
    by_time_period: { period: string; alert_count: number; false_positive_rate: number }[];
  };
  risk_trends: {
    kri_performance: {
      kri_name: string;
      current_value: number;
      target_value: number;
      status_color: string;
    }[];
    risk_escalation: { risk_domain: string; escalated_count: number; resolution_rate: number }[];
    trend_analysis: { period: string; risk_score: number; control_effectiveness: number }[];
  };
  recommendations: {
    priority: "High" | "Medium" | "Low";
    category: string;
    recommendation: string;
    impact: string;
    effort: string;
  }[];
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// CONTINUOUS MONITORING SERVICE CLASS
// ============================================================================

export class ContinuousMonitoringService {
  private static supabase = createClient();

  // ============================================================================
  // CONTROL FRAMEWORK MANAGEMENT
  // ============================================================================

  static async createControlFramework(
    framework: Omit<ControlFramework, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResponse<ControlFramework>> {
    try {
      const { data, error } = await this.supabase
        .from("control_frameworks")
        .insert(framework)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Control framework created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getControlFrameworks(status?: string): Promise<ServiceResponse<ControlFramework[]>> {
    try {
      let query = this.supabase.from("control_frameworks").select("*").order("framework_name");

      if (status) {
        query = query.eq("framework_status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // INTERNAL CONTROLS MANAGEMENT
  // ============================================================================

  static async createInternalControl(
    control: Omit<InternalControl, "id" | "created_at" | "updated_at" | "framework">,
  ): Promise<ServiceResponse<InternalControl>> {
    try {
      const { data, error } = await this.supabase
        .from("internal_controls")
        .insert(control)
        .select(
          `
          *,
          framework:framework_id(*)
        `,
        )
        .single();

      if (error) throw error;

      return { success: true, data, message: "Internal control created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getInternalControls(filters?: {
    framework_id?: string;
    process_area?: string;
    risk_rating?: string;
    control_status?: string;
    sox_relevant?: boolean;
  }): Promise<ServiceResponse<InternalControl[]>> {
    try {
      let query = this.supabase
        .from("internal_controls")
        .select(
          `
          *,
          framework:framework_id(*)
        `,
        )
        .order("control_id");

      if (filters?.framework_id) {
        query = query.eq("framework_id", filters.framework_id);
      }
      if (filters?.process_area) {
        query = query.eq("process_area", filters.process_area);
      }
      if (filters?.risk_rating) {
        query = query.eq("inherent_risk_rating", filters.risk_rating);
      }
      if (filters?.control_status) {
        query = query.eq("control_status", filters.control_status);
      }
      if (filters?.sox_relevant !== undefined) {
        query = query.eq("sox_relevant", filters.sox_relevant);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // CONTROL TESTING MANAGEMENT
  // ============================================================================

  static async createTestingPlan(
    plan: Omit<ControlTestingPlan, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResponse<ControlTestingPlan>> {
    try {
      const { data, error } = await this.supabase
        .from("control_testing_plans")
        .insert(plan)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Testing plan created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async executeControlTest(
    execution: Omit<
      ControlTestExecution,
      "id" | "created_at" | "updated_at" | "effectiveness_rate" | "control" | "exceptions"
    >,
  ): Promise<ServiceResponse<ControlTestExecution>> {
    try {
      // Generate test execution number
      const testNumber = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const executionData = {
        ...execution,
        test_execution_number: testNumber,
      };

      const { data, error } = await this.supabase
        .from("control_test_executions")
        .insert(executionData)
        .select(
          `
          *,
          control:control_id(*)
        `,
        )
        .single();

      if (error) throw error;

      return { success: true, data, message: "Control test executed successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async createTestException(
    exception: Omit<ControlTestException, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResponse<ControlTestException>> {
    try {
      // Generate exception number
      const exceptionNumber = `EXC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const exceptionData = {
        ...exception,
        exception_number: exceptionNumber,
      };

      const { data, error } = await this.supabase
        .from("control_test_exceptions")
        .insert(exceptionData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Test exception created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getControlTestExecutions(filters?: {
    control_id?: string;
    testing_plan_id?: string;
    test_status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ServiceResponse<ControlTestExecution[]>> {
    try {
      let query = this.supabase
        .from("control_test_executions")
        .select(
          `
          *,
          control:control_id(*),
          exceptions:control_test_exceptions(*)
        `,
        )
        .order("test_date", { ascending: false });

      if (filters?.control_id) {
        query = query.eq("control_id", filters.control_id);
      }
      if (filters?.testing_plan_id) {
        query = query.eq("testing_plan_id", filters.testing_plan_id);
      }
      if (filters?.test_status) {
        query = query.eq("test_status", filters.test_status);
      }
      if (filters?.date_from) {
        query = query.gte("test_date", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("test_date", filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // MONITORING RULES ENGINE
  // ============================================================================

  static async createMonitoringRule(
    rule: Omit<
      MonitoringRule,
      | "id"
      | "created_at"
      | "updated_at"
      | "false_positive_rate"
      | "detection_rate"
      | "total_triggers_count"
      | "control"
    >,
  ): Promise<ServiceResponse<MonitoringRule>> {
    try {
      const ruleData = {
        ...rule,
        false_positive_rate: 0,
        detection_rate: 0,
        total_triggers_count: 0,
      };

      const { data, error } = await this.supabase
        .from("monitoring_rules")
        .insert(ruleData)
        .select(
          `
          *,
          control:control_id(*)
        `,
        )
        .single();

      if (error) throw error;

      return { success: true, data, message: "Monitoring rule created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async executeMonitoringRules(): Promise<
    ServiceResponse<{ rules_executed: number; alerts_generated: number }>
  > {
    try {
      // Get active monitoring rules
      const { data: rules, error: rulesError } = await this.supabase
        .from("monitoring_rules")
        .select("*")
        .eq("rule_status", "active")
        .lte("next_execution", new Date().toISOString());

      if (rulesError) throw rulesError;

      let rulesExecuted = 0;
      let alertsGenerated = 0;

      for (const rule of rules || []) {
        try {
          // Execute the rule (in a real implementation, this would run the SQL query)
          // For demo purposes, we'll simulate rule execution
          const shouldTrigger = Math.random() < 0.1; // 10% chance of triggering

          if (shouldTrigger) {
            // Create an alert
            const alertData = {
              monitoring_rule_id: rule.id,
              alert_severity: rule.alert_severity,
              alert_title: `Rule Triggered: ${rule.rule_name}`,
              alert_description: `Monitoring rule "${rule.rule_name}" has been triggered based on configured thresholds.`,
              alert_category: rule.rule_category,
              trigger_value: Math.random() * 1000000,
              threshold_value: rule.threshold_value,
              alert_status: "new" as const,
            };

            const alertNumber = `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

            await this.supabase.from("monitoring_alerts").insert({
              ...alertData,
              alert_number: alertNumber,
            });

            alertsGenerated++;
          }

          // Update rule execution timestamp
          await this.supabase
            .from("monitoring_rules")
            .update({
              last_execution: new Date().toISOString(),
              next_execution: this.calculateNextExecution(rule.monitoring_frequency),
              total_triggers_count: rule.total_triggers_count + (shouldTrigger ? 1 : 0),
            })
            .eq("id", rule.id);

          rulesExecuted++;
        } catch (ruleError) {
          console.error(`Error executing rule ${rule.rule_code}:`, ruleError);
        }
      }

      return {
        success: true,
        data: { rules_executed: rulesExecuted, alerts_generated: alertsGenerated },
        message: `Executed ${rulesExecuted} rules, generated ${alertsGenerated} alerts`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private static calculateNextExecution(frequency: string): string {
    const now = new Date();

    switch (frequency) {
      case "Real-time":
        return new Date(now.getTime() + 60000).toISOString(); // 1 minute
      case "Hourly":
        return new Date(now.getTime() + 3600000).toISOString(); // 1 hour
      case "Daily":
        return new Date(now.getTime() + 86400000).toISOString(); // 1 day
      case "Weekly":
        return new Date(now.getTime() + 604800000).toISOString(); // 1 week
      case "Monthly":
        return new Date(now.getTime() + 2592000000).toISOString(); // 30 days
      default:
        return new Date(now.getTime() + 86400000).toISOString(); // Default to 1 day
    }
  }

  static async getMonitoringAlerts(filters?: {
    severity?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    assigned_to?: string;
  }): Promise<ServiceResponse<MonitoringAlert[]>> {
    try {
      let query = this.supabase
        .from("monitoring_alerts")
        .select(
          `
          *,
          monitoring_rule:monitoring_rule_id(*)
        `,
        )
        .order("alert_timestamp", { ascending: false });

      if (filters?.severity) {
        query = query.eq("alert_severity", filters.severity);
      }
      if (filters?.status) {
        query = query.eq("alert_status", filters.status);
      }
      if (filters?.date_from) {
        query = query.gte("alert_timestamp", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("alert_timestamp", filters.date_to);
      }
      if (filters?.assigned_to) {
        query = query.eq("assigned_to", filters.assigned_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // CONTROL EFFECTIVENESS METRICS
  // ============================================================================

  static async calculateControlEffectiveness(
    control_id: string,
    period_start: string,
    period_end: string,
  ): Promise<ServiceResponse<ControlEffectivenessMetric>> {
    try {
      // Get test executions for the control in the period
      const { data: executions, error: executionsError } = await this.supabase
        .from("control_test_executions")
        .select(
          `
          *,
          exceptions:control_test_exceptions(*)
        `,
        )
        .eq("control_id", control_id)
        .gte("test_date", period_start)
        .lte("test_date", period_end);

      if (executionsError) throw executionsError;

      // Calculate effectiveness metrics
      const totalTests = executions?.length || 0;
      const passedTests = executions?.filter(e => e.test_conclusion === "Effective").length || 0;
      const failedTests = executions?.filter(e => e.test_conclusion !== "Effective").length || 0;
      const totalExceptions =
        executions?.reduce((sum, e) => sum + (e.exceptions?.length || 0), 0) || 0;
      const materialWeaknesses =
        executions?.filter(e => e.test_conclusion === "Material Weakness").length || 0;
      const significantDeficiencies =
        executions?.filter(e => e.test_conclusion === "Significant Deficiency").length || 0;

      const effectivenessScore = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

      let designRating: "Effective" | "Ineffective" | "Needs Improvement" = "Effective";
      let operatingRating: "Effective" | "Ineffective" | "Needs Improvement" = "Effective";

      if (materialWeaknesses > 0) {
        designRating = "Ineffective";
        operatingRating = "Ineffective";
      } else if (significantDeficiencies > 0 || effectivenessScore < 85) {
        designRating = "Needs Improvement";
        operatingRating = "Needs Improvement";
      }

      const metricData: Omit<
        ControlEffectivenessMetric,
        "id" | "created_at" | "updated_at" | "control_reliability_percentage" | "control"
      > = {
        control_id,
        measurement_period_start: period_start,
        measurement_period_end: period_end,
        metric_date: new Date().toISOString().split("T")[0],
        design_effectiveness_rating: designRating,
        operating_effectiveness_rating: operatingRating,
        overall_effectiveness_score: effectivenessScore,
        total_tests_performed: totalTests,
        tests_passed: passedTests,
        tests_failed: failedTests,
        exception_count: totalExceptions,
        control_gaps_identified: failedTests,
        material_weaknesses_count: materialWeaknesses,
        significant_deficiencies_count: significantDeficiencies,
        assessment_status: "draft",
      };

      const { data, error } = await this.supabase
        .from("control_effectiveness_metrics")
        .insert(metricData)
        .select(
          `
          *,
          control:control_id(*)
        `,
        )
        .single();

      if (error) throw error;

      return { success: true, data, message: "Control effectiveness calculated successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // KEY RISK INDICATORS (KRI) MANAGEMENT
  // ============================================================================

  static async createKRI(
    kri: Omit<KeyRiskIndicator, "id" | "created_at" | "updated_at" | "latest_measurement">,
  ): Promise<ServiceResponse<KeyRiskIndicator>> {
    try {
      const { data, error } = await this.supabase
        .from("key_risk_indicators")
        .insert(kri)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "KRI created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async recordKRIMeasurement(
    measurement: Omit<KRIMeasurement, "id" | "created_at" | "updated_at" | "kri">,
  ): Promise<ServiceResponse<KRIMeasurement>> {
    try {
      // Get the KRI to determine status color based on thresholds
      const { data: kri, error: kriError } = await this.supabase
        .from("key_risk_indicators")
        .select("*")
        .eq("id", measurement.kri_id)
        .single();

      if (kriError) throw kriError;

      // Determine status color based on thresholds
      let statusColor: "Green" | "Yellow" | "Red" = "Green";
      let riskLevel: "Low" | "Medium" | "High" | "Critical" = "Low";
      let thresholdBreached = false;

      if (kri.red_threshold_min !== null && measurement.measured_value >= kri.red_threshold_min) {
        statusColor = "Red";
        riskLevel = "High";
        thresholdBreached = true;
      } else if (
        kri.red_threshold_max !== null &&
        measurement.measured_value <= kri.red_threshold_max
      ) {
        statusColor = "Red";
        riskLevel = "High";
        thresholdBreached = true;
      } else if (
        kri.yellow_threshold_min !== null &&
        measurement.measured_value >= kri.yellow_threshold_min
      ) {
        statusColor = "Yellow";
        riskLevel = "Medium";
        thresholdBreached = true;
      } else if (
        kri.yellow_threshold_max !== null &&
        measurement.measured_value <= kri.yellow_threshold_max
      ) {
        statusColor = "Yellow";
        riskLevel = "Medium";
        thresholdBreached = true;
      }

      const measurementData = {
        ...measurement,
        status_color: statusColor,
        risk_level: riskLevel,
        threshold_breached: thresholdBreached,
      };

      const { data, error } = await this.supabase
        .from("kri_measurements")
        .insert(measurementData)
        .select(
          `
          *,
          kri:kri_id(*)
        `,
        )
        .single();

      if (error) throw error;

      // Update KRI last_measured timestamp
      await this.supabase
        .from("key_risk_indicators")
        .update({ last_measured: new Date().toISOString() })
        .eq("id", measurement.kri_id);

      return { success: true, data, message: "KRI measurement recorded successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getKRIWithLatestMeasurement(
    kri_id?: string,
  ): Promise<ServiceResponse<KeyRiskIndicator[]>> {
    try {
      let query = this.supabase
        .from("key_risk_indicators")
        .select(
          `
          *,
          latest_measurement:kri_measurements(*)
        `,
        )
        .eq("kri_status", "active")
        .order("kri_name");

      if (kri_id) {
        query = query.eq("id", kri_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get the latest measurement for each KRI
      const krisWithLatestMeasurement = await Promise.all(
        (data || []).map(async kri => {
          const { data: latestMeasurement } = await this.supabase
            .from("kri_measurements")
            .select("*")
            .eq("kri_id", kri.id)
            .order("measurement_date", { ascending: false })
            .limit(1)
            .single();

          return {
            ...kri,
            latest_measurement: latestMeasurement,
          };
        }),
      );

      return { success: true, data: krisWithLatestMeasurement };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // DASHBOARD AND ANALYTICS
  // ============================================================================

  static async getMonitoringDashboard(): Promise<ServiceResponse<MonitoringDashboard>> {
    try {
      // Get control frameworks
      const frameworksResult = await this.getControlFrameworks("active");
      const frameworks = frameworksResult.data || [];

      // Get control summary
      const { data: controls } = await this.supabase
        .from("internal_controls")
        .select("*")
        .eq("control_status", "active");

      const controlSummary = {
        total_controls: controls?.length || 0,
        active_controls: controls?.length || 0,
        high_risk_controls:
          controls?.filter(
            c => c.inherent_risk_rating === "High" || c.inherent_risk_rating === "Critical",
          ).length || 0,
        sox_controls: controls?.filter(c => c.sox_relevant).length || 0,
        automated_controls: controls?.filter(c => c.automated_testing).length || 0,
        controls_requiring_testing:
          controls?.filter(
            c =>
              !c.last_update_date ||
              new Date(c.last_update_date) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          ).length || 0,
      };

      // Get testing summary
      const { data: executions } = await this.supabase
        .from("control_test_executions")
        .select("*")
        .gte(
          "test_date",
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        );

      const { data: exceptions } = await this.supabase
        .from("control_test_exceptions")
        .select("*")
        .eq("exception_status", "open");

      const testingSummary = {
        total_tests_completed: executions?.filter(e => e.test_status === "completed").length || 0,
        tests_in_progress: executions?.filter(e => e.test_status === "in_progress").length || 0,
        overall_effectiveness_rate: executions?.length
          ? (executions.filter(e => e.test_conclusion === "Effective").length / executions.length) *
            100
          : 0,
        material_weaknesses:
          executions?.filter(e => e.test_conclusion === "Material Weakness").length || 0,
        significant_deficiencies:
          executions?.filter(e => e.test_conclusion === "Significant Deficiency").length || 0,
        exceptions_open: exceptions?.length || 0,
      };

      // Get monitoring summary
      const { data: rules } = await this.supabase
        .from("monitoring_rules")
        .select("*")
        .eq("rule_status", "active");

      const { data: alerts } = await this.supabase
        .from("monitoring_alerts")
        .select("*")
        .gte("alert_timestamp", new Date().toISOString().split("T")[0]);

      const monitoringSummary = {
        active_rules: rules?.length || 0,
        alerts_today: alerts?.length || 0,
        critical_alerts: alerts?.filter(a => a.alert_severity === "critical").length || 0,
        alerts_resolved: alerts?.filter(a => a.alert_status === "resolved").length || 0,
        false_positive_rate: alerts?.length
          ? (alerts.filter(a => a.alert_status === "false_positive").length / alerts.length) * 100
          : 0,
        detection_accuracy: 85, // Mock value - would be calculated based on historical data
      };

      // Get KRI summary
      const { data: kris } = await this.supabase
        .from("key_risk_indicators")
        .select(
          `
          *,
          latest_measurement:kri_measurements(*)
        `,
        )
        .eq("kri_status", "active");

      const { data: latestMeasurements } = await this.supabase
        .from("kri_measurements")
        .select("*")
        .gte(
          "measurement_date",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        );

      const kriSummary = {
        total_kris: kris?.length || 0,
        red_status_count: latestMeasurements?.filter(m => m.status_color === "Red").length || 0,
        yellow_status_count:
          latestMeasurements?.filter(m => m.status_color === "Yellow").length || 0,
        green_status_count: latestMeasurements?.filter(m => m.status_color === "Green").length || 0,
        trending_negative:
          latestMeasurements?.filter(m => m.trend_vs_previous === "Declining").length || 0,
        requiring_action: latestMeasurements?.filter(m => m.action_required).length || 0,
      };

      // Get recent alerts
      const recentAlertsResult = await this.getMonitoringAlerts({
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      const recentAlerts = recentAlertsResult.data?.slice(0, 10) || [];

      // Get recent exceptions
      const { data: recentExceptions } = await this.supabase
        .from("control_test_exceptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      // Get effectiveness trends (mock data for demo)
      const effectivenessTrends: ControlEffectivenessMetric[] = [];

      // Get top KRIs (mock data for demo)
      const topKris = latestMeasurements?.slice(0, 5) || [];

      const dashboardData: MonitoringDashboard = {
        control_frameworks: frameworks,
        control_summary: controlSummary,
        testing_summary: testingSummary,
        monitoring_summary: monitoringSummary,
        kri_summary: kriSummary,
        recent_alerts: recentAlerts,
        recent_exceptions: recentExceptions || [],
        effectiveness_trends: effectivenessTrends,
        top_kris: topKris,
      };

      return { success: true, data: dashboardData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getMonitoringAnalysis(
    period_start?: string,
    period_end?: string,
  ): Promise<ServiceResponse<MonitoringAnalysis>> {
    try {
      const startDate =
        period_start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const endDate = period_end || new Date().toISOString().split("T")[0];

      // This would typically involve complex aggregation queries
      // For demo purposes, providing mock analysis data
      const analysis: MonitoringAnalysis = {
        control_performance: {
          by_framework: [
            { framework_name: "SOX", effectiveness_rate: 92.5 },
            { framework_name: "COSO", effectiveness_rate: 88.7 },
            { framework_name: "Custom", effectiveness_rate: 85.3 },
          ],
          by_process_area: [
            { process_area: "Financial Reporting", effectiveness_rate: 94.2 },
            { process_area: "Revenue", effectiveness_rate: 91.8 },
            { process_area: "Procurement", effectiveness_rate: 87.5 },
            { process_area: "Payroll", effectiveness_rate: 89.3 },
          ],
          by_risk_level: [
            { risk_level: "Critical", control_count: 15, effectiveness_rate: 96.7 },
            { risk_level: "High", control_count: 42, effectiveness_rate: 91.2 },
            { risk_level: "Medium", control_count: 78, effectiveness_rate: 88.9 },
            { risk_level: "Low", control_count: 134, effectiveness_rate: 85.4 },
          ],
          by_control_type: [
            { control_type: "Preventive", control_count: 156, effectiveness_rate: 89.7 },
            { control_type: "Detective", control_count: 89, effectiveness_rate: 91.3 },
            { control_type: "Corrective", control_count: 24, effectiveness_rate: 87.5 },
          ],
        },
        alert_patterns: {
          by_severity: [
            { severity: "Critical", count: 12, resolution_rate: 100 },
            { severity: "High", count: 34, resolution_rate: 94.1 },
            { severity: "Medium", count: 67, resolution_rate: 86.6 },
            { severity: "Low", count: 145, resolution_rate: 78.6 },
          ],
          by_category: [
            { category: "Financial", count: 89, avg_resolution_time: 4.2 },
            { category: "Operational", count: 78, avg_resolution_time: 6.7 },
            { category: "Compliance", count: 56, avg_resolution_time: 8.1 },
            { category: "IT General Controls", count: 35, avg_resolution_time: 12.3 },
          ],
          by_time_period: [
            { period: "This Month", alert_count: 47, false_positive_rate: 12.8 },
            { period: "Last Month", alert_count: 62, false_positive_rate: 15.4 },
            { period: "Two Months Ago", alert_count: 58, false_positive_rate: 13.7 },
          ],
        },
        risk_trends: {
          kri_performance: [
            {
              kri_name: "Days Sales Outstanding",
              current_value: 32.5,
              target_value: 30.0,
              status_color: "Yellow",
            },
            {
              kri_name: "Control Deficiency Rate",
              current_value: 4.2,
              target_value: 5.0,
              status_color: "Green",
            },
            {
              kri_name: "Exception Rate",
              current_value: 8.7,
              target_value: 10.0,
              status_color: "Green",
            },
            {
              kri_name: "Testing Coverage",
              current_value: 87.3,
              target_value: 90.0,
              status_color: "Yellow",
            },
            {
              kri_name: "Management Response Time",
              current_value: 6.2,
              target_value: 5.0,
              status_color: "Red",
            },
          ],
          risk_escalation: [
            { risk_domain: "Financial Reporting", escalated_count: 3, resolution_rate: 100 },
            { risk_domain: "Revenue Recognition", escalated_count: 2, resolution_rate: 100 },
            { risk_domain: "IT Security", escalated_count: 1, resolution_rate: 100 },
          ],
          trend_analysis: [
            { period: "Q1", risk_score: 2.8, control_effectiveness: 89.2 },
            { period: "Q2", risk_score: 2.6, control_effectiveness: 91.1 },
            { period: "Q3", risk_score: 2.4, control_effectiveness: 92.7 },
            { period: "Q4", risk_score: 2.3, control_effectiveness: 93.4 },
          ],
        },
        recommendations: [
          {
            priority: "High",
            category: "Control Design",
            recommendation: "Implement automated controls for high-volume, routine transactions",
            impact: "Reduce manual errors by 60% and improve efficiency",
            effort: "Medium - 3-4 months implementation",
          },
          {
            priority: "High",
            category: "Risk Monitoring",
            recommendation: "Enhance KRI thresholds based on recent performance data",
            impact: "Improve early warning capabilities by 25%",
            effort: "Low - 2-3 weeks analysis and updates",
          },
          {
            priority: "Medium",
            category: "Testing Optimization",
            recommendation: "Increase testing frequency for critical financial controls",
            impact: "Earlier detection of control deficiencies",
            effort: "Medium - Additional testing resources required",
          },
        ],
      };

      return { success: true, data: analysis };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
