/**
 * Metadata Management Service
 * Essential data governance, lineage, and quality tracking
 */
// @ts-nocheck


import { supabase } from "./supabase";

export type EntityType =
  | "Item"
  | "Account"
  | "Transaction"
  | "Customer"
  | "Vendor"
  | "Invoice"
  | "Payment";
export type ValidationStatus = "Valid" | "Warning" | "Error" | "Pending";
export type StewardshipLevel = "Owner" | "Custodian" | "Consumer";
export type ActionType = "View" | "Edit" | "Delete" | "Export" | "Print" | "Search" | "Filter";
export type RelationshipType = "Parent" | "Child" | "Related" | "Dependency" | "Reference";
export type RelationshipStrength = "Strong" | "Medium" | "Weak";
export type ChangeType = "Create" | "Update" | "Delete" | "Merge" | "Split";
export type ChangeSource = "Manual" | "Import" | "API" | "System";
export type TagCategory = "Business" | "Technical" | "Compliance" | "Quality";

export interface DataLineage {
  id: string;
  companyId: string;
  entityType: EntityType;
  entityId: string;
  sourceSystem: string;
  sourceTable?: string;
  sourceRecordId?: string;
  sourceTimestamp: string;
  createdBy?: string;
  createdAt: string;
}

export interface DataQualityMetrics {
  id: string;
  companyId: string;
  entityType: EntityType;
  entityId: string;
  completenessScore: number;
  accuracyScore: number;
  consistencyScore: number;
  timelinessScore: number;
  overallScore: number;
  validationStatus: ValidationStatus;
  lastValidatedAt?: string;
  validationIssues: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DataSteward {
  id: string;
  companyId: string;
  entityType: EntityType;
  entityId: string;
  stewardUserId: string;
  stewardshipLevel: StewardshipLevel;
  assignedAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface DataUsageAnalytics {
  id: string;
  companyId: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  actionType: ActionType;
  actionTimestamp: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface DataRelationship {
  id: string;
  companyId: string;
  sourceEntityType: EntityType;
  sourceEntityId: string;
  targetEntityType: EntityType;
  targetEntityId: string;
  relationshipType: RelationshipType;
  relationshipStrength: RelationshipStrength;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataTag {
  id: string;
  companyId: string;
  entityType: EntityType;
  entityId: string;
  tagName: string;
  tagValue?: string;
  tagCategory?: TagCategory;
  createdBy?: string;
  createdAt: string;
}

export interface DataChangeHistory {
  id: string;
  companyId: string;
  entityType: EntityType;
  entityId: string;
  changeType: ChangeType;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeReason?: string;
  changedBy: string;
  changedAt: string;
  changeSource: ChangeSource;
}

export interface DataCatalogItem {
  entityType: EntityType;
  entityId: string;
  name: string;
  description?: string;
  qualityScore: number;
  lastModified: string;
  steward?: string;
  tags: string[];
  relationships: number;
  usageCount: number;
  lastAccessed?: string;
}

export class MetadataManagementService {
  /**
   * Track data lineage
   */
  static async trackLineage(
    companyId: string,
    entityType: EntityType,
    entityId: string,
    sourceSystem: string,
    sourceTable?: string,
    sourceRecordId?: string,
    createdBy?: string,
  ): Promise<{ success: boolean; lineageId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("data_lineage")
        .insert({
          company_id: companyId,
          entity_type: entityType,
          entity_id: entityId,
          source_system: sourceSystem,
          source_table: sourceTable,
          source_record_id: sourceRecordId,
          source_timestamp: new Date().toISOString(),
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) {
        console.error("Error tracking data lineage:", error);
        return { success: false, error: "Failed to track data lineage" };
      }

      return { success: true, lineageId: data.id };
    } catch (error) {
      console.error("Error tracking data lineage:", error);
      return { success: false, error: "Failed to track data lineage" };
    }
  }

  /**
   * Calculate and update data quality score
   */
  static async calculateQualityScore(
    entityType: EntityType,
    entityId: string,
  ): Promise<{ success: boolean; score?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("calculate_data_quality_score", {
        p_entity_type: entityType,
        p_entity_id: entityId,
      });

      if (error) {
        console.error("Error calculating quality score:", error);
        return { success: false, error: "Failed to calculate quality score" };
      }

      return { success: true, score: data };
    } catch (error) {
      console.error("Error calculating quality score:", error);
      return { success: false, error: "Failed to calculate quality score" };
    }
  }

  /**
   * Get data quality metrics
   */
  static async getQualityMetrics(
    entityType: EntityType,
    entityId: string,
  ): Promise<{ success: boolean; metrics?: DataQualityMetrics; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("data_quality_metrics")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .single();

      if (error) {
        console.error("Error fetching quality metrics:", error);
        return { success: false, error: "Failed to fetch quality metrics" };
      }

      const metrics: DataQualityMetrics = {
        id: data.id,
        companyId: data.company_id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        completenessScore: data.completeness_score,
        accuracyScore: data.accuracy_score,
        consistencyScore: data.consistency_score,
        timelinessScore: data.timeliness_score,
        overallScore: data.overall_score,
        validationStatus: data.validation_status,
        lastValidatedAt: data.last_validated_at,
        validationIssues: data.validation_issues || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, metrics };
    } catch (error) {
      console.error("Error fetching quality metrics:", error);
      return { success: false, error: "Failed to fetch quality metrics" };
    }
  }

  /**
   * Track data usage
   */
  static async trackUsage(
    companyId: string,
    entityType: EntityType,
    entityId: string,
    userId: string,
    actionType: ActionType,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc("track_data_usage", {
        p_company_id: companyId,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_user_id: userId,
        p_action_type: actionType,
        p_session_id: sessionId,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
      });

      if (error) {
        console.error("Error tracking data usage:", error);
        return { success: false, error: "Failed to track data usage" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error tracking data usage:", error);
      return { success: false, error: "Failed to track data usage" };
    }
  }

  /**
   * Get data lineage
   */
  static async getLineage(
    entityType: EntityType,
    entityId: string,
  ): Promise<{ success: boolean; lineage?: DataLineage[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_data_lineage", {
        p_entity_type: entityType,
        p_entity_id: entityId,
      });

      if (error) {
        console.error("Error fetching data lineage:", error);
        return { success: false, error: "Failed to fetch data lineage" };
      }

      const lineage: DataLineage[] = data.map(item => ({
        id: item.id || "",
        companyId: "",
        entityType: entityType,
        entityId: entityId,
        sourceSystem: item.source_system,
        sourceTable: item.source_table,
        sourceRecordId: item.source_record_id,
        sourceTimestamp: item.source_timestamp,
        createdBy: item.created_by,
        createdAt: "",
      }));

      return { success: true, lineage };
    } catch (error) {
      console.error("Error fetching data lineage:", error);
      return { success: false, error: "Failed to fetch data lineage" };
    }
  }

  /**
   * Get data relationships
   */
  static async getRelationships(
    entityType: EntityType,
    entityId: string,
  ): Promise<{ success: boolean; relationships?: DataRelationship[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_data_relationships", {
        p_entity_type: entityType,
        p_entity_id: entityId,
      });

      if (error) {
        console.error("Error fetching data relationships:", error);
        return { success: false, error: "Failed to fetch data relationships" };
      }

      const relationships: DataRelationship[] = data.map(item => ({
        id: "",
        companyId: "",
        sourceEntityType: entityType,
        sourceEntityId: entityId,
        targetEntityType: item.target_entity_type,
        targetEntityId: item.target_entity_id,
        relationshipType: item.relationship_type,
        relationshipStrength: item.relationship_strength,
        isActive: true,
        createdAt: "",
        updatedAt: "",
      }));

      return { success: true, relationships };
    } catch (error) {
      console.error("Error fetching data relationships:", error);
      return { success: false, error: "Failed to fetch data relationships" };
    }
  }

  /**
   * Add data tag
   */
  static async addTag(
    companyId: string,
    entityType: EntityType,
    entityId: string,
    tagName: string,
    tagValue?: string,
    tagCategory?: TagCategory,
    createdBy?: string,
  ): Promise<{ success: boolean; tagId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("data_tags")
        .insert({
          company_id: companyId,
          entity_type: entityType,
          entity_id: entityId,
          tag_name: tagName,
          tag_value: tagValue,
          tag_category: tagCategory,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding data tag:", error);
        return { success: false, error: "Failed to add data tag" };
      }

      return { success: true, tagId: data.id };
    } catch (error) {
      console.error("Error adding data tag:", error);
      return { success: false, error: "Failed to add data tag" };
    }
  }

  /**
   * Get data tags
   */
  static async getTags(
    entityType: EntityType,
    entityId: string,
  ): Promise<{ success: boolean; tags?: DataTag[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("data_tags")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching data tags:", error);
        return { success: false, error: "Failed to fetch data tags" };
      }

      const tags: DataTag[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        entityType: item.entity_type,
        entityId: item.entity_id,
        tagName: item.tag_name,
        tagValue: item.tag_value,
        tagCategory: item.tag_category,
        createdBy: item.created_by,
        createdAt: item.created_at,
      }));

      return { success: true, tags };
    } catch (error) {
      console.error("Error fetching data tags:", error);
      return { success: false, error: "Failed to fetch data tags" };
    }
  }

  /**
   * Create data relationship
   */
  static async createRelationship(
    companyId: string,
    sourceEntityType: EntityType,
    sourceEntityId: string,
    targetEntityType: EntityType,
    targetEntityId: string,
    relationshipType: RelationshipType,
    relationshipStrength: RelationshipStrength = "Medium",
  ): Promise<{ success: boolean; relationshipId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("data_relationships")
        .insert({
          company_id: companyId,
          source_entity_type: sourceEntityType,
          source_entity_id: sourceEntityId,
          target_entity_type: targetEntityType,
          target_entity_id: targetEntityId,
          relationship_type: relationshipType,
          relationship_strength: relationshipStrength,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating data relationship:", error);
        return { success: false, error: "Failed to create data relationship" };
      }

      return { success: true, relationshipId: data.id };
    } catch (error) {
      console.error("Error creating data relationship:", error);
      return { success: false, error: "Failed to create data relationship" };
    }
  }

  /**
   * Get data catalog
   */
  static async getDataCatalog(
    companyId: string,
    entityType?: EntityType,
    searchTerm?: string,
    qualityThreshold?: number,
  ): Promise<{ success: boolean; catalog?: DataCatalogItem[]; error?: string }> {
    try {
      // This would be a complex query joining multiple tables
      // For now, we'll return a simplified version
      const catalog: DataCatalogItem[] = [];

      return { success: true, catalog };
    } catch (error) {
      console.error("Error fetching data catalog:", error);
      return { success: false, error: "Failed to fetch data catalog" };
    }
  }

  /**
   * Get data change history
   */
  static async getChangeHistory(
    entityType: EntityType,
    entityId: string,
    limit: number = 50,
  ): Promise<{ success: boolean; history?: DataChangeHistory[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("data_change_history")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("changed_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching change history:", error);
        return { success: false, error: "Failed to fetch change history" };
      }

      const history: DataChangeHistory[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        entityType: item.entity_type,
        entityId: item.entity_id,
        changeType: item.change_type,
        fieldName: item.field_name,
        oldValue: item.old_value,
        newValue: item.new_value,
        changeReason: item.change_reason,
        changedBy: item.changed_by,
        changedAt: item.changed_at,
        changeSource: item.change_source,
      }));

      return { success: true, history };
    } catch (error) {
      console.error("Error fetching change history:", error);
      return { success: false, error: "Failed to fetch change history" };
    }
  }

  /**
   * Assign data steward
   */
  static async assignSteward(
    companyId: string,
    entityType: EntityType,
    entityId: string,
    stewardUserId: string,
    stewardshipLevel: StewardshipLevel,
  ): Promise<{ success: boolean; stewardId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("data_stewards")
        .insert({
          company_id: companyId,
          entity_type: entityType,
          entity_id: entityId,
          steward_user_id: stewardUserId,
          stewardship_level: stewardshipLevel,
        })
        .select()
        .single();

      if (error) {
        console.error("Error assigning data steward:", error);
        return { success: false, error: "Failed to assign data steward" };
      }

      return { success: true, stewardId: data.id };
    } catch (error) {
      console.error("Error assigning data steward:", error);
      return { success: false, error: "Failed to assign data steward" };
    }
  }
}
