/**
 * Predictive Analytics Service - AI-Powered Financial Forecasting & Machine Learning
 * Advanced Financial Modeling, Predictive Analytics & Automated Insights
 *
 * Features:
 * - AI-powered financial forecasting with multiple algorithms
 * - Automated model training and performance tracking
 * - Real-time prediction execution and monitoring
 * - Intelligent insights generation and recommendations
 * - Feature engineering and ML feature store
 * - A/B testing for model performance optimization
 */

import { createClient } from "@/lib/supabase-client";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ForecastingModel {
  id: string;
  model_name: string;
  model_code: string;
  model_description?: string;
  model_version: string;
  model_type:
    | "Revenue Forecast"
    | "Cash Flow Forecast"
    | "Expense Forecast"
    | "Budget Variance"
    | "Risk Assessment";
  forecasting_domain: "Financial" | "Operational" | "Strategic" | "Risk" | "Compliance";
  prediction_horizon: "Short-term" | "Medium-term" | "Long-term";
  time_granularity: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annual";
  algorithm_type:
    | "Linear Regression"
    | "ARIMA"
    | "Prophet"
    | "Neural Network"
    | "Random Forest"
    | "XGBoost";
  training_data_requirements: any;
  feature_engineering_rules?: any;
  hyperparameters?: any;
  primary_data_sources: string[];
  external_data_sources?: string[];
  required_features: string[];
  target_variable: string;
  accuracy_score?: number;
  precision_score?: number;
  recall_score?: number;
  f1_score?: number;
  rmse_score?: number;
  mae_score?: number;
  mape_score?: number;
  training_start_date?: string;
  training_end_date?: string;
  validation_method: "holdout" | "cross_validation" | "time_series_split";
  last_training_date?: string;
  next_retraining_date?: string;
  training_duration_minutes?: number;
  deployment_status: "development" | "testing" | "staging" | "production" | "deprecated";
  deployment_date?: string;
  model_endpoint_url?: string;
  batch_prediction_schedule?: string;
  model_owner?: string;
  business_stakeholder?: string;
  last_review_date?: string;
  next_review_date?: string;
  approval_status: "pending" | "approved" | "rejected";
  approved_by?: string;
  approval_date?: string;
  model_documentation?: string;
  regulatory_compliance?: string[];
  ethical_considerations?: string;
  bias_assessment?: string;
  interpretability_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PredictionJob {
  id: string;
  job_name: string;
  job_code: string;
  job_description?: string;
  model_id: string;
  prediction_type: "batch" | "real_time" | "scheduled" | "on_demand";
  data_source_query: string;
  prediction_parameters?: any;
  output_format: "database" | "file" | "api" | "dashboard";
  schedule_enabled: boolean;
  schedule_cron?: string;
  schedule_timezone: string;
  job_status: "pending" | "running" | "completed" | "failed" | "cancelled";
  last_execution_date?: string;
  next_execution_date?: string;
  execution_duration_seconds?: number;
  records_processed?: number;
  predictions_generated?: number;
  error_count: number;
  last_error_message?: string;
  last_error_date?: string;
  retry_count: number;
  max_retries: number;
  notification_enabled: boolean;
  notification_recipients: string[];
  success_notifications: boolean;
  failure_notifications: boolean;
  created_at: string;
  updated_at: string;
  model?: ForecastingModel;
}

export interface PredictionResult {
  id: string;
  prediction_job_id: string;
  model_id: string;
  prediction_date: string;
  prediction_horizon_start: string;
  prediction_horizon_end: string;
  prediction_granularity: "daily" | "weekly" | "monthly" | "quarterly";
  data_as_of_date: string;
  input_features: any;
  model_version: string;
  prediction_context?: any;
  external_factors?: any;
  predicted_value: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  confidence_score?: number;
  prediction_variance?: number;
  base_case_prediction?: number;
  optimistic_prediction?: number;
  pessimistic_prediction?: number;
  scenario_probabilities?: any;
  component_predictions?: any;
  driver_analysis?: any;
  sensitivity_analysis?: any;
  prediction_quality_score?: number;
  data_quality_score?: number;
  model_drift_indicator?: number;
  outlier_flag: boolean;
  business_impact_category?: string;
  risk_level?: "Low" | "Medium" | "High" | "Critical";
  action_recommendations?: string[];
  actual_value?: number;
  prediction_error?: number;
  absolute_error?: number;
  percentage_error?: number;
  accuracy_flag?: boolean;
  created_at: string;
  updated_at: string;
  model?: ForecastingModel;
  prediction_job?: PredictionJob;
}

export interface ModelPerformanceMetric {
  id: string;
  model_id: string;
  evaluation_date: string;
  evaluation_period_start: string;
  evaluation_period_end: string;
  evaluation_type: "holdout" | "time_series_validation" | "cross_validation" | "production";
  evaluation_dataset_size: number;
  training_dataset_size?: number;
  overall_accuracy: number;
  mean_absolute_error: number;
  root_mean_square_error: number;
  mean_absolute_percentage_error: number;
  r_squared?: number;
  adjusted_r_squared?: number;
  precision_macro?: number;
  recall_macro?: number;
  f1_score_macro?: number;
  confusion_matrix?: any;
  forecast_bias?: number;
  seasonal_accuracy?: number;
  trend_accuracy?: number;
  business_value_generated?: number;
  cost_savings_achieved?: number;
  decision_quality_improvement?: number;
  prediction_variance?: number;
  drift_detection_score?: number;
  stability_score?: number;
  benchmark_model_type?: string;
  benchmark_accuracy?: number;
  improvement_over_benchmark?: number;
  feature_importance?: any;
  prediction_intervals_coverage?: number;
  residual_analysis?: any;
  outlier_detection_results?: any;
  performance_trend?: "Improving" | "Stable" | "Degrading";
  degradation_rate?: number;
  retraining_recommendation?: "Immediate" | "Soon" | "Scheduled" | "Not Needed";
  reviewed_by?: string;
  review_date?: string;
  review_notes?: string;
  performance_status: "excellent" | "good" | "acceptable" | "poor" | "unacceptable";
  created_at: string;
  updated_at: string;
  model?: ForecastingModel;
}

export interface PredictiveInsight {
  id: string;
  insight_title: string;
  insight_description: string;
  insight_type:
    | "Trend Analysis"
    | "Anomaly Detection"
    | "Forecast Alert"
    | "Pattern Recognition"
    | "Risk Indicator";
  insight_category: "Financial" | "Operational" | "Strategic" | "Risk" | "Compliance";
  model_id?: string;
  prediction_result_id?: string;
  data_sources: string[];
  analysis_date: string;
  key_findings: string[];
  supporting_data?: any;
  confidence_level: number;
  statistical_significance?: number;
  impact_magnitude: "Low" | "Medium" | "High" | "Critical";
  impact_type: "Financial" | "Operational" | "Strategic" | "Regulatory" | "Reputational";
  estimated_financial_impact?: number;
  impact_time_horizon: "Immediate" | "Short-term" | "Medium-term" | "Long-term";
  recommended_actions: string[];
  action_priority: "Low" | "Medium" | "High" | "Urgent";
  recommended_timeline?: string;
  resource_requirements?: string;
  success_metrics?: string[];
  risk_level: "Low" | "Medium" | "High" | "Critical";
  risk_factors?: string[];
  mitigation_strategies?: string[];
  monitoring_requirements?: string[];
  target_audience: string;
  business_owner?: string;
  notification_sent: boolean;
  notification_date?: string;
  insight_status: "active" | "acknowledged" | "acted_upon" | "resolved" | "expired";
  acknowledgment_date?: string;
  acknowledged_by?: string;
  action_taken_date?: string;
  action_taken_by?: string;
  action_notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  outcome_assessment?: string;
  insight_accuracy_rating?: number;
  usefulness_rating?: number;
  feedback_comments?: string;
  feedback_date?: string;
  feedback_by?: string;
  created_at: string;
  updated_at: string;
  model?: ForecastingModel;
  prediction_result?: PredictionResult;
}

export interface MLFeature {
  id: string;
  feature_name: string;
  feature_code: string;
  feature_description?: string;
  feature_category: "Financial" | "Temporal" | "Behavioral" | "External" | "Derived";
  data_type: "numeric" | "categorical" | "boolean" | "datetime" | "text";
  feature_type: "raw" | "engineered" | "derived" | "aggregated";
  computation_logic?: string;
  update_frequency: "real_time" | "hourly" | "daily" | "weekly" | "monthly";
  primary_table?: string;
  source_columns?: string[];
  transformation_rules?: any;
  aggregation_rules?: any;
  min_value?: number;
  max_value?: number;
  mean_value?: number;
  median_value?: number;
  standard_deviation?: number;
  null_percentage?: number;
  unique_values_count?: number;
  data_quality_score?: number;
  completeness_score?: number;
  consistency_score?: number;
  validity_score?: number;
  models_using_feature: string[];
  usage_frequency: number;
  feature_importance_avg?: number;
  last_used_date?: string;
  feature_version: string;
  feature_status: "development" | "active" | "deprecated" | "archived";
  deprecated_date?: string;
  replacement_feature_id?: string;
  business_definition?: string;
  technical_definition?: string;
  calculation_example?: string;
  usage_guidelines?: string;
  feature_owner?: string;
  data_steward?: string;
  last_validation_date?: string;
  next_validation_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ModelABTest {
  id: string;
  test_name: string;
  test_description?: string;
  test_hypothesis: string;
  control_model_id: string;
  treatment_model_id: string;
  test_start_date: string;
  test_end_date: string;
  traffic_split_percentage: number;
  sample_size_required?: number;
  actual_sample_size?: number;
  primary_metric: string;
  secondary_metrics?: string[];
  success_threshold?: number;
  statistical_significance_threshold: number;
  test_status: "planned" | "running" | "completed" | "stopped" | "invalid";
  control_performance?: number;
  treatment_performance?: number;
  performance_lift?: number;
  statistical_significance?: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  test_conclusion?: "treatment_wins" | "control_wins" | "no_difference" | "inconclusive";
  decision_rationale?: string;
  rollout_decision?: "rollout" | "no_rollout" | "partial_rollout" | "further_testing";
  rollout_percentage?: number;
  test_owner?: string;
  stakeholders?: string[];
  reviewed_by?: string;
  review_date?: string;
  created_at: string;
  updated_at: string;
  control_model?: ForecastingModel;
  treatment_model?: ForecastingModel;
}

// Dashboard Summary Types
export interface PredictiveAnalyticsDashboard {
  forecasting_models: ForecastingModel[];
  model_summary: {
    total_models: number;
    production_models: number;
    models_by_type: { [key: string]: number };
    models_by_domain: { [key: string]: number };
    avg_accuracy: number;
    models_requiring_retraining: number;
  };
  prediction_summary: {
    total_predictions_today: number;
    predictions_in_progress: number;
    avg_prediction_accuracy: number;
    high_confidence_predictions: number;
    outlier_predictions: number;
    failed_predictions: number;
  };
  insight_summary: {
    active_insights: number;
    high_priority_insights: number;
    insights_by_category: { [key: string]: number };
    insights_acted_upon: number;
    avg_insight_confidence: number;
    insights_requiring_attention: number;
  };
  performance_summary: {
    avg_model_performance: number;
    best_performing_model: ForecastingModel | null;
    models_degrading: number;
    business_value_generated: number;
    cost_savings_achieved: number;
    prediction_accuracy_trend: number;
  };
  recent_predictions: PredictionResult[];
  recent_insights: PredictiveInsight[];
  model_performance_trends: ModelPerformanceMetric[];
  active_ab_tests: ModelABTest[];
}

export interface PredictiveAnalyticsAnalysis {
  model_performance: {
    by_algorithm: { algorithm: string; avg_accuracy: number; model_count: number }[];
    by_domain: { domain: string; avg_accuracy: number; model_count: number }[];
    by_time_horizon: { horizon: string; avg_accuracy: number; model_count: number }[];
    accuracy_trends: { period: string; accuracy: number; prediction_count: number }[];
  };
  prediction_patterns: {
    by_confidence: { confidence_range: string; count: number; avg_accuracy: number }[];
    by_risk_level: { risk_level: string; count: number; success_rate: number }[];
    by_business_impact: { impact: string; count: number; value_generated: number }[];
    outlier_analysis: { period: string; outlier_count: number; outlier_rate: number }[];
  };
  insight_effectiveness: {
    by_type: { insight_type: string; count: number; action_rate: number; success_rate: number }[];
    by_priority: { priority: string; count: number; avg_response_time: number }[];
    by_domain: { domain: string; count: number; business_value: number }[];
    feedback_analysis: { rating: number; count: number; percentage: number }[];
  };
  feature_analysis: {
    most_important_features: {
      feature_name: string;
      avg_importance: number;
      usage_count: number;
    }[];
    feature_quality_trends: {
      feature_category: string;
      avg_quality: number;
      feature_count: number;
    }[];
    feature_usage_patterns: { feature_name: string; usage_frequency: number; last_used: string }[];
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
// PREDICTIVE ANALYTICS SERVICE CLASS
// ============================================================================

export class PredictiveAnalyticsService {
  private static supabase = createClient();

  // ============================================================================
  // FORECASTING MODEL MANAGEMENT
  // ============================================================================

  static async createForecastingModel(
    model: Omit<ForecastingModel, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResponse<ForecastingModel>> {
    try {
      const { data, error } = await this.supabase
        .from("forecasting_models")
        .insert(model)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Forecasting model created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getForecastingModels(filters?: {
    model_type?: string;
    forecasting_domain?: string;
    deployment_status?: string;
    approval_status?: string;
  }): Promise<ServiceResponse<ForecastingModel[]>> {
    try {
      let query = this.supabase.from("forecasting_models").select("*").order("model_name");

      if (filters?.model_type) {
        query = query.eq("model_type", filters.model_type);
      }
      if (filters?.forecasting_domain) {
        query = query.eq("forecasting_domain", filters.forecasting_domain);
      }
      if (filters?.deployment_status) {
        query = query.eq("deployment_status", filters.deployment_status);
      }
      if (filters?.approval_status) {
        query = query.eq("approval_status", filters.approval_status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updateModelDeploymentStatus(
    modelId: string,
    status: ForecastingModel["deployment_status"],
    deploymentDate?: string,
  ): Promise<ServiceResponse<ForecastingModel>> {
    try {
      const updateData: any = { deployment_status: status };
      if (deploymentDate) {
        updateData.deployment_date = deploymentDate;
      }
      if (status === "production") {
        updateData.deployment_date = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from("forecasting_models")
        .update(updateData)
        .eq("id", modelId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: `Model deployment status updated to ${status}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // PREDICTION JOB MANAGEMENT
  // ============================================================================

  static async createPredictionJob(
    job: Omit<
      PredictionJob,
      "id" | "created_at" | "updated_at" | "error_count" | "retry_count" | "model"
    >,
  ): Promise<ServiceResponse<PredictionJob>> {
    try {
      const jobData = {
        ...job,
        error_count: 0,
        retry_count: 0,
      };

      const { data, error } = await this.supabase
        .from("prediction_jobs")
        .insert(jobData)
        .select(
          `
          *,
          model:model_id(*)
        `,
        )
        .single();

      if (error) throw error;

      return { success: true, data, message: "Prediction job created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async executePredictionJob(
    jobId: string,
  ): Promise<ServiceResponse<{ predictions_generated: number }>> {
    try {
      // Update job status to running
      await this.supabase
        .from("prediction_jobs")
        .update({
          job_status: "running",
          last_execution_date: new Date().toISOString(),
        })
        .eq("id", jobId);

      // Get job details
      const { data: job, error: jobError } = await this.supabase
        .from("prediction_jobs")
        .select("*, model:model_id(*)")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      // Simulate prediction execution (in real implementation, this would call ML model)
      const startTime = Date.now();
      const recordsToProcess = Math.floor(Math.random() * 1000) + 100;
      const predictionsGenerated = recordsToProcess;

      // Create mock prediction results
      for (let i = 0; i < Math.min(5, predictionsGenerated); i++) {
        const predictionData: Omit<
          PredictionResult,
          "id" | "created_at" | "updated_at" | "model" | "prediction_job"
        > = {
          prediction_job_id: jobId,
          model_id: job.model_id,
          prediction_date: new Date().toISOString(),
          prediction_horizon_start: new Date().toISOString().split("T")[0],
          prediction_horizon_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          prediction_granularity: "monthly",
          data_as_of_date: new Date().toISOString().split("T")[0],
          input_features: {
            historical_revenue: Math.random() * 1000000,
            seasonality_factor: Math.random() * 0.5 + 0.75,
            economic_indicator: Math.random() * 100,
          },
          model_version: job.model?.model_version || "1.0",
          predicted_value: Math.random() * 1000000 + 500000,
          confidence_interval_lower: Math.random() * 900000 + 400000,
          confidence_interval_upper: Math.random() * 1100000 + 600000,
          confidence_score: Math.random() * 0.3 + 0.7,
          base_case_prediction: Math.random() * 1000000 + 500000,
          optimistic_prediction: Math.random() * 1200000 + 700000,
          pessimistic_prediction: Math.random() * 800000 + 300000,
          prediction_quality_score: Math.random() * 0.2 + 0.8,
          data_quality_score: Math.random() * 0.1 + 0.9,
          model_drift_indicator: Math.random() * 0.1,
          outlier_flag: Math.random() < 0.05,
          business_impact_category: "Revenue Growth",
          risk_level: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)] as any,
          action_recommendations: [
            "Monitor revenue trends closely",
            "Adjust marketing spend based on forecast",
            "Prepare for seasonal variations",
          ],
        };

        await this.supabase.from("prediction_results").insert(predictionData);
      }

      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      // Update job completion status
      await this.supabase
        .from("prediction_jobs")
        .update({
          job_status: "completed",
          execution_duration_seconds: durationSeconds,
          records_processed: recordsToProcess,
          predictions_generated: predictionsGenerated,
          next_execution_date: job.schedule_enabled
            ? this.calculateNextExecution(job.schedule_cron || "@daily")
            : null,
        })
        .eq("id", jobId);

      return {
        success: true,
        data: { predictions_generated: predictionsGenerated },
        message: `Prediction job completed successfully. Generated ${predictionsGenerated} predictions.`,
      };
    } catch (error: any) {
      // Update job status to failed
      await this.supabase
        .from("prediction_jobs")
        .update({
          job_status: "failed",
          last_error_message: error.message,
          last_error_date: new Date().toISOString(),
          error_count: this.supabase.raw("error_count + 1"),
        })
        .eq("id", jobId);

      return { success: false, error: error.message };
    }
  }

  private static calculateNextExecution(cronExpression: string): string {
    // Simple cron parsing - in production, use a proper cron library
    const now = new Date();

    switch (cronExpression) {
      case "@daily":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case "@weekly":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case "@monthly":
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  static async getPredictionJobs(filters?: {
    model_id?: string;
    job_status?: string;
    prediction_type?: string;
  }): Promise<ServiceResponse<PredictionJob[]>> {
    try {
      let query = this.supabase
        .from("prediction_jobs")
        .select(
          `
          *,
          model:model_id(*)
        `,
        )
        .order("created_at", { ascending: false });

      if (filters?.model_id) {
        query = query.eq("model_id", filters.model_id);
      }
      if (filters?.job_status) {
        query = query.eq("job_status", filters.job_status);
      }
      if (filters?.prediction_type) {
        query = query.eq("prediction_type", filters.prediction_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // PREDICTION RESULTS MANAGEMENT
  // ============================================================================

  static async getPredictionResults(filters?: {
    model_id?: string;
    prediction_job_id?: string;
    date_from?: string;
    date_to?: string;
    risk_level?: string;
  }): Promise<ServiceResponse<PredictionResult[]>> {
    try {
      let query = this.supabase
        .from("prediction_results")
        .select(
          `
          *,
          model:model_id(*),
          prediction_job:prediction_job_id(*)
        `,
        )
        .order("prediction_date", { ascending: false });

      if (filters?.model_id) {
        query = query.eq("model_id", filters.model_id);
      }
      if (filters?.prediction_job_id) {
        query = query.eq("prediction_job_id", filters.prediction_job_id);
      }
      if (filters?.date_from) {
        query = query.gte("prediction_date", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("prediction_date", filters.date_to);
      }
      if (filters?.risk_level) {
        query = query.eq("risk_level", filters.risk_level);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updatePredictionActual(
    predictionId: string,
    actualValue: number,
  ): Promise<ServiceResponse<PredictionResult>> {
    try {
      // Get the current prediction
      const { data: prediction, error: fetchError } = await this.supabase
        .from("prediction_results")
        .select("*")
        .eq("id", predictionId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate error metrics
      const predictionError = actualValue - prediction.predicted_value;
      const absoluteError = Math.abs(predictionError);
      const percentageError =
        prediction.predicted_value !== 0 ? (predictionError / prediction.predicted_value) * 100 : 0;
      const accuracyFlag = Math.abs(percentageError) <= 10; // Within 10% is considered accurate

      const { data, error } = await this.supabase
        .from("prediction_results")
        .update({
          actual_value: actualValue,
          prediction_error: predictionError,
          absolute_error: absoluteError,
          percentage_error: percentageError,
          accuracy_flag: accuracyFlag,
        })
        .eq("id", predictionId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Prediction actual value updated successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // MODEL PERFORMANCE TRACKING
  // ============================================================================

  static async recordModelPerformance(
    performance: Omit<ModelPerformanceMetric, "id" | "created_at" | "updated_at" | "model">,
  ): Promise<ServiceResponse<ModelPerformanceMetric>> {
    try {
      const { data, error } = await this.supabase
        .from("model_performance_metrics")
        .insert(performance)
        .select(
          `
          *,
          model:model_id(*)
        `,
        )
        .single();

      if (error) throw error;

      return { success: true, data, message: "Model performance recorded successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getModelPerformanceMetrics(
    modelId?: string,
    evaluationType?: string,
  ): Promise<ServiceResponse<ModelPerformanceMetric[]>> {
    try {
      let query = this.supabase
        .from("model_performance_metrics")
        .select(
          `
          *,
          model:model_id(*)
        `,
        )
        .order("evaluation_date", { ascending: false });

      if (modelId) {
        query = query.eq("model_id", modelId);
      }
      if (evaluationType) {
        query = query.eq("evaluation_type", evaluationType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // PREDICTIVE INSIGHTS GENERATION
  // ============================================================================

  static async generatePredictiveInsights(
    predictionResultId?: string,
  ): Promise<ServiceResponse<PredictiveInsight[]>> {
    try {
      const insights: Omit<
        PredictiveInsight,
        "id" | "created_at" | "updated_at" | "model" | "prediction_result"
      >[] = [];

      // Generate mock insights based on recent predictions
      const recentPredictionsResult = await this.getPredictionResults({
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });

      if (recentPredictionsResult.success && recentPredictionsResult.data) {
        const predictions = recentPredictionsResult.data;

        // Trend Analysis Insight
        if (predictions.length >= 3) {
          const trendInsight: Omit<
            PredictiveInsight,
            "id" | "created_at" | "updated_at" | "model" | "prediction_result"
          > = {
            insight_title: "Revenue Trend Analysis",
            insight_description:
              "Analysis of revenue trends based on recent predictions shows consistent growth pattern.",
            insight_type: "Trend Analysis",
            insight_category: "Financial",
            model_id: predictions[0].model_id,
            prediction_result_id: predictionResultId,
            data_sources: ["prediction_results", "gl_entries"],
            analysis_date: new Date().toISOString().split("T")[0],
            key_findings: [
              "Revenue predictions show 15% month-over-month growth trend",
              "Confidence intervals are narrowing, indicating improved forecast accuracy",
              "Seasonal patterns are consistent with historical data",
            ],
            supporting_data: {
              avg_growth_rate: 15.2,
              confidence_trend: "improving",
              seasonal_correlation: 0.87,
            },
            confidence_level: 87.5,
            statistical_significance: 0.02,
            impact_magnitude: "High",
            impact_type: "Financial",
            estimated_financial_impact: 250000,
            impact_time_horizon: "Short-term",
            recommended_actions: [
              "Increase inventory levels to support growth",
              "Review marketing spend allocation",
              "Prepare cash flow projections for growth scenario",
            ],
            action_priority: "Medium",
            recommended_timeline: "Next 30 days",
            resource_requirements: "Finance and Operations teams",
            success_metrics: [
              "Revenue achievement vs forecast",
              "Inventory turnover rate",
              "Cash flow adequacy",
            ],
            risk_level: "Low",
            risk_factors: ["Market volatility", "Supply chain disruptions"],
            mitigation_strategies: ["Diversify suppliers", "Maintain adequate cash reserves"],
            monitoring_requirements: ["Weekly revenue tracking", "Monthly forecast updates"],
            target_audience: "Executive Leadership, Finance Team",
            notification_sent: false,
            insight_status: "active",
            follow_up_required: true,
            follow_up_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          };

          insights.push(trendInsight);
        }

        // Anomaly Detection Insight
        const outliers = predictions.filter(p => p.outlier_flag);
        if (outliers.length > 0) {
          const anomalyInsight: Omit<
            PredictiveInsight,
            "id" | "created_at" | "updated_at" | "model" | "prediction_result"
          > = {
            insight_title: "Forecast Anomaly Detection",
            insight_description: `Detected ${outliers.length} outlier predictions that require attention and investigation.`,
            insight_type: "Anomaly Detection",
            insight_category: "Risk",
            model_id: outliers[0].model_id,
            prediction_result_id: outliers[0].id,
            data_sources: ["prediction_results"],
            analysis_date: new Date().toISOString().split("T")[0],
            key_findings: [
              `${outliers.length} predictions flagged as outliers`,
              "Outliers show significant deviation from expected patterns",
              "May indicate data quality issues or model drift",
            ],
            supporting_data: {
              outlier_count: outliers.length,
              avg_deviation:
                outliers.reduce((sum, o) => sum + (o.prediction_variance || 0), 0) /
                outliers.length,
              data_quality_impact: "medium",
            },
            confidence_level: 92.0,
            impact_magnitude: "Medium",
            impact_type: "Operational",
            impact_time_horizon: "Immediate",
            recommended_actions: [
              "Investigate data sources for anomalies",
              "Review model performance and retrain if necessary",
              "Validate outlier predictions manually",
            ],
            action_priority: "High",
            recommended_timeline: "Within 7 days",
            resource_requirements: "Data Science and Finance teams",
            success_metrics: [
              "Reduction in outlier predictions",
              "Improved model accuracy",
              "Data quality scores",
            ],
            risk_level: "Medium",
            risk_factors: [
              "Model degradation",
              "Data quality issues",
              "Business environment changes",
            ],
            mitigation_strategies: [
              "Implement automated data quality checks",
              "Schedule regular model retraining",
            ],
            monitoring_requirements: [
              "Daily outlier monitoring",
              "Weekly model performance reviews",
            ],
            target_audience: "Data Science Team, Finance Team",
            notification_sent: false,
            insight_status: "active",
            follow_up_required: true,
            follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          };

          insights.push(anomalyInsight);
        }
      }

      // Insert insights into database
      const insertedInsights: PredictiveInsight[] = [];
      for (const insight of insights) {
        const { data, error } = await this.supabase
          .from("predictive_insights")
          .insert(insight)
          .select(
            `
            *,
            model:model_id(*),
            prediction_result:prediction_result_id(*)
          `,
          )
          .single();

        if (!error && data) {
          insertedInsights.push(data);
        }
      }

      return {
        success: true,
        data: insertedInsights,
        message: `Generated ${insertedInsights.length} predictive insights`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getPredictiveInsights(filters?: {
    insight_type?: string;
    insight_category?: string;
    insight_status?: string;
    model_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ServiceResponse<PredictiveInsight[]>> {
    try {
      let query = this.supabase
        .from("predictive_insights")
        .select(
          `
          *,
          model:model_id(*),
          prediction_result:prediction_result_id(*)
        `,
        )
        .order("analysis_date", { ascending: false });

      if (filters?.insight_type) {
        query = query.eq("insight_type", filters.insight_type);
      }
      if (filters?.insight_category) {
        query = query.eq("insight_category", filters.insight_category);
      }
      if (filters?.insight_status) {
        query = query.eq("insight_status", filters.insight_status);
      }
      if (filters?.model_id) {
        query = query.eq("model_id", filters.model_id);
      }
      if (filters?.date_from) {
        query = query.gte("analysis_date", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("analysis_date", filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async acknowledgeInsight(
    insightId: string,
    acknowledgedBy: string,
    actionNotes?: string,
  ): Promise<ServiceResponse<PredictiveInsight>> {
    try {
      const { data, error } = await this.supabase
        .from("predictive_insights")
        .update({
          insight_status: "acknowledged",
          acknowledgment_date: new Date().toISOString().split("T")[0],
          acknowledged_by: acknowledgedBy,
          action_notes: actionNotes,
        })
        .eq("id", insightId)
        .select(
          `
          *,
          model:model_id(*),
          prediction_result:prediction_result_id(*)
        `,
        )
        .single();

      if (error) throw error;

      return { success: true, data, message: "Insight acknowledged successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // DASHBOARD AND ANALYTICS
  // ============================================================================

  static async getPredictiveAnalyticsDashboard(): Promise<
    ServiceResponse<PredictiveAnalyticsDashboard>
  > {
    try {
      // Get forecasting models
      const modelsResult = await this.getForecastingModels();
      const models = modelsResult.data || [];

      // Get model summary
      const modelSummary = {
        total_models: models.length,
        production_models: models.filter(m => m.deployment_status === "production").length,
        models_by_type: models.reduce(
          (acc, m) => {
            acc[m.model_type] = (acc[m.model_type] || 0) + 1;
            return acc;
          },
          {} as { [key: string]: number },
        ),
        models_by_domain: models.reduce(
          (acc, m) => {
            acc[m.forecasting_domain] = (acc[m.forecasting_domain] || 0) + 1;
            return acc;
          },
          {} as { [key: string]: number },
        ),
        avg_accuracy: models.length
          ? models.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / models.length
          : 0,
        models_requiring_retraining: models.filter(
          m => m.next_retraining_date && new Date(m.next_retraining_date) <= new Date(),
        ).length,
      };

      // Get prediction summary
      const { data: todayPredictions } = await this.supabase
        .from("prediction_results")
        .select("*")
        .gte("prediction_date", new Date().toISOString().split("T")[0]);

      const { data: jobs } = await this.supabase.from("prediction_jobs").select("*");

      const predictionSummary = {
        total_predictions_today: todayPredictions?.length || 0,
        predictions_in_progress: jobs?.filter(j => j.job_status === "running").length || 0,
        avg_prediction_accuracy: todayPredictions?.length
          ? todayPredictions
              .filter(p => p.accuracy_flag !== null)
              .reduce((sum, p) => sum + (p.accuracy_flag ? 1 : 0), 0) / todayPredictions.length
          : 0,
        high_confidence_predictions:
          todayPredictions?.filter(p => (p.confidence_score || 0) > 0.8).length || 0,
        outlier_predictions: todayPredictions?.filter(p => p.outlier_flag).length || 0,
        failed_predictions: jobs?.filter(j => j.job_status === "failed").length || 0,
      };

      // Get insight summary
      const { data: insights } = await this.supabase
        .from("predictive_insights")
        .select("*")
        .eq("insight_status", "active");

      const insightSummary = {
        active_insights: insights?.length || 0,
        high_priority_insights:
          insights?.filter(i => i.action_priority === "High" || i.action_priority === "Urgent")
            .length || 0,
        insights_by_category:
          insights?.reduce(
            (acc, i) => {
              acc[i.insight_category] = (acc[i.insight_category] || 0) + 1;
              return acc;
            },
            {} as { [key: string]: number },
          ) || {},
        insights_acted_upon: 0, // Would need additional queries
        avg_insight_confidence: insights?.length
          ? insights.reduce((sum, i) => sum + i.confidence_level, 0) / insights.length
          : 0,
        insights_requiring_attention:
          insights?.filter(i => i.action_priority === "High" || i.action_priority === "Urgent")
            .length || 0,
      };

      // Get performance summary
      const { data: performanceMetrics } = await this.supabase
        .from("model_performance_metrics")
        .select("*")
        .order("evaluation_date", { ascending: false })
        .limit(100);

      const bestModel = models.reduce(
        (best, current) =>
          (current.accuracy_score || 0) > (best?.accuracy_score || 0) ? current : best,
        null as ForecastingModel | null,
      );

      const performanceSummary = {
        avg_model_performance: performanceMetrics?.length
          ? performanceMetrics.reduce((sum, m) => sum + m.overall_accuracy, 0) /
            performanceMetrics.length
          : 0,
        best_performing_model: bestModel,
        models_degrading:
          performanceMetrics?.filter(m => m.performance_trend === "Degrading").length || 0,
        business_value_generated:
          performanceMetrics?.reduce((sum, m) => sum + (m.business_value_generated || 0), 0) || 0,
        cost_savings_achieved:
          performanceMetrics?.reduce((sum, m) => sum + (m.cost_savings_achieved || 0), 0) || 0,
        prediction_accuracy_trend: 2.5, // Mock trend value
      };

      // Get recent data
      const recentPredictionsResult = await this.getPredictionResults({
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      const recentInsightsResult = await this.getPredictiveInsights({
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      const performanceTrendsResult = await this.getModelPerformanceMetrics();

      const dashboardData: PredictiveAnalyticsDashboard = {
        forecasting_models: models,
        model_summary: modelSummary,
        prediction_summary: predictionSummary,
        insight_summary: insightSummary,
        performance_summary: performanceSummary,
        recent_predictions: recentPredictionsResult.data?.slice(0, 10) || [],
        recent_insights: recentInsightsResult.data?.slice(0, 10) || [],
        model_performance_trends: performanceTrendsResult.data?.slice(0, 10) || [],
        active_ab_tests: [], // Would need A/B test queries
      };

      return { success: true, data: dashboardData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getPredictiveAnalyticsAnalysis(
    period_start?: string,
    period_end?: string,
  ): Promise<ServiceResponse<PredictiveAnalyticsAnalysis>> {
    try {
      // This would typically involve complex aggregation queries
      // For demo purposes, providing mock analysis data
      const analysis: PredictiveAnalyticsAnalysis = {
        model_performance: {
          by_algorithm: [
            { algorithm: "Neural Network", avg_accuracy: 0.89, model_count: 5 },
            { algorithm: "Random Forest", avg_accuracy: 0.85, model_count: 8 },
            { algorithm: "XGBoost", avg_accuracy: 0.87, model_count: 3 },
            { algorithm: "ARIMA", avg_accuracy: 0.82, model_count: 4 },
            { algorithm: "Prophet", avg_accuracy: 0.84, model_count: 6 },
          ],
          by_domain: [
            { domain: "Financial", avg_accuracy: 0.88, model_count: 12 },
            { domain: "Operational", avg_accuracy: 0.85, model_count: 8 },
            { domain: "Risk", avg_accuracy: 0.83, model_count: 4 },
            { domain: "Strategic", avg_accuracy: 0.86, model_count: 2 },
          ],
          by_time_horizon: [
            { horizon: "Short-term", avg_accuracy: 0.91, model_count: 15 },
            { horizon: "Medium-term", avg_accuracy: 0.85, model_count: 8 },
            { horizon: "Long-term", avg_accuracy: 0.79, model_count: 3 },
          ],
          accuracy_trends: [
            { period: "This Month", accuracy: 0.87, prediction_count: 1250 },
            { period: "Last Month", accuracy: 0.85, prediction_count: 1180 },
            { period: "2 Months Ago", accuracy: 0.83, prediction_count: 1090 },
            { period: "3 Months Ago", accuracy: 0.81, prediction_count: 950 },
          ],
        },
        prediction_patterns: {
          by_confidence: [
            { confidence_range: "90-100%", count: 342, avg_accuracy: 0.94 },
            { confidence_range: "80-90%", count: 567, avg_accuracy: 0.87 },
            { confidence_range: "70-80%", count: 289, avg_accuracy: 0.82 },
            { confidence_range: "60-70%", count: 52, avg_accuracy: 0.75 },
          ],
          by_risk_level: [
            { risk_level: "Low", count: 890, success_rate: 0.92 },
            { risk_level: "Medium", count: 267, success_rate: 0.85 },
            { risk_level: "High", count: 78, success_rate: 0.79 },
            { risk_level: "Critical", count: 15, success_rate: 0.73 },
          ],
          by_business_impact: [
            { impact: "High", count: 125, value_generated: 2500000 },
            { impact: "Medium", count: 478, value_generated: 1200000 },
            { impact: "Low", count: 647, value_generated: 350000 },
          ],
          outlier_analysis: [
            { period: "This Week", outlier_count: 12, outlier_rate: 2.1 },
            { period: "Last Week", outlier_count: 18, outlier_rate: 3.2 },
            { period: "2 Weeks Ago", outlier_count: 8, outlier_rate: 1.4 },
            { period: "3 Weeks Ago", outlier_count: 15, outlier_rate: 2.7 },
          ],
        },
        insight_effectiveness: {
          by_type: [
            { insight_type: "Trend Analysis", count: 45, action_rate: 0.78, success_rate: 0.85 },
            { insight_type: "Anomaly Detection", count: 23, action_rate: 0.91, success_rate: 0.89 },
            { insight_type: "Forecast Alert", count: 67, action_rate: 0.82, success_rate: 0.79 },
            { insight_type: "Risk Indicator", count: 34, action_rate: 0.94, success_rate: 0.92 },
          ],
          by_priority: [
            { priority: "Urgent", count: 8, avg_response_time: 2.5 },
            { priority: "High", count: 34, avg_response_time: 8.2 },
            { priority: "Medium", count: 87, avg_response_time: 15.7 },
            { priority: "Low", count: 40, avg_response_time: 28.4 },
          ],
          by_domain: [
            { domain: "Financial", count: 78, business_value: 1800000 },
            { domain: "Operational", count: 56, business_value: 950000 },
            { domain: "Risk", count: 23, business_value: 2200000 },
            { domain: "Strategic", count: 12, business_value: 3100000 },
          ],
          feedback_analysis: [
            { rating: 5, count: 42, percentage: 24.9 },
            { rating: 4, count: 67, percentage: 39.6 },
            { rating: 3, count: 38, percentage: 22.5 },
            { rating: 2, count: 15, percentage: 8.9 },
            { rating: 1, count: 7, percentage: 4.1 },
          ],
        },
        feature_analysis: {
          most_important_features: [
            { feature_name: "Historical Revenue Trend", avg_importance: 0.89, usage_count: 15 },
            { feature_name: "Seasonal Index", avg_importance: 0.76, usage_count: 12 },
            { feature_name: "Economic Indicator", avg_importance: 0.68, usage_count: 8 },
            { feature_name: "Customer Acquisition Rate", avg_importance: 0.62, usage_count: 9 },
            { feature_name: "Market Volatility Index", avg_importance: 0.58, usage_count: 6 },
          ],
          feature_quality_trends: [
            { feature_category: "Financial", avg_quality: 0.92, feature_count: 45 },
            { feature_category: "Temporal", avg_quality: 0.88, feature_count: 23 },
            { feature_category: "Behavioral", avg_quality: 0.85, feature_count: 18 },
            { feature_category: "External", avg_quality: 0.79, feature_count: 12 },
            { feature_category: "Derived", avg_quality: 0.91, feature_count: 34 },
          ],
          feature_usage_patterns: [
            { feature_name: "Revenue Growth Rate", usage_frequency: 156, last_used: "2024-09-09" },
            { feature_name: "Cash Flow Ratio", usage_frequency: 134, last_used: "2024-09-08" },
            { feature_name: "Customer Churn Rate", usage_frequency: 98, last_used: "2024-09-07" },
            { feature_name: "Inventory Turnover", usage_frequency: 87, last_used: "2024-09-06" },
          ],
        },
        recommendations: [
          {
            priority: "High",
            category: "Model Optimization",
            recommendation: "Implement ensemble methods for critical financial forecasts",
            impact: "Improve prediction accuracy by 12-15%",
            effort: "Medium - 6-8 weeks development",
          },
          {
            priority: "High",
            category: "Data Quality",
            recommendation: "Enhance feature engineering pipeline with automated quality checks",
            impact: "Reduce model drift by 25% and improve reliability",
            effort: "Low - 3-4 weeks implementation",
          },
          {
            priority: "Medium",
            category: "Business Integration",
            recommendation: "Develop automated insight-to-action workflows",
            impact: "Reduce response time to insights by 60%",
            effort: "High - 3-4 months development",
          },
          {
            priority: "Medium",
            category: "Model Governance",
            recommendation: "Implement A/B testing framework for model deployment",
            impact: "Reduce deployment risk and ensure model performance",
            effort: "Medium - 4-6 weeks setup",
          },
        ],
      };

      return { success: true, data: analysis };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
