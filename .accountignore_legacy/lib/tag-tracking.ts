/**
 * Advanced Tag Tracking System
 * Implements cost center accounting with flexible tag dimensions
 * Based on ERPNext, QuickBooks Class Tracking, and Odoo Analytic Accounting
 */

import { supabase } from "./supabase";
import { AccountingService } from "./accounting-service";

export type TagType =
  | "Cost Center"
  | "Project"
  | "Department"
  | "Location"
  | "Product Line"
  | "Customer Segment"
  | "Custom";

export type TagStatus = "Active" | "Inactive" | "Archived";

export interface Tag {
  id: string;
  name: string;
  tag_type: TagType;
  parent_id?: string;
  company_id: string;
  description?: string;
  color?: string;
  is_group: boolean;
  status: TagStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TagAssignment {
  id: string;
  gl_entry_id: string;
  tag_id: string;
  tag_type: TagType;
  percentage: number; // For allocation (0-100)
  amount: number; // Calculated amount
  created_at: string;
}

export interface TagHierarchy {
  id: string;
  name: string;
  tag_type: TagType;
  children: TagHierarchy[];
  level: number;
  path: string;
  is_group: boolean;
  status: TagStatus;
}

export interface TagReport {
  tag_id: string;
  tag_name: string;
  tag_type: TagType;
  total_debit: number;
  total_credit: number;
  net_amount: number;
  transaction_count: number;
  percentage_of_total: number;
}

/**
 * Tag Tracking Service
 * Implements powerful yet simple dimensional accounting
 */
export class TagTrackingService {
  /**
   * Create a new tag
   */
  static async createTag(tag: Omit<Tag, "id" | "created_at" | "updated_at">): Promise<{
    success: boolean;
    tag?: Tag;
    error?: string;
  }> {
    try {
      // Validate parent exists and is group
      if (tag.parent_id) {
        const parent = await this.getTagById(tag.parent_id);
        if (!parent || !parent.is_group) {
          return { success: false, error: "Parent tag must exist and be a group" };
        }
      }

      // Generate sort order if not provided
      if (!tag.sort_order) {
        const maxOrder = await this.getMaxSortOrder(tag.company_id, tag.tag_type, tag.parent_id);
        tag.sort_order = maxOrder + 1;
      }

      const { data: newTag, error } = await supabase
        .from("tags")
        .insert([
          {
            ...tag,
            status: "Active" as TagStatus,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, tag: newTag };
    } catch (error) {
      console.error("Error creating tag:", error);
      return { success: false, error: "Failed to create tag" };
    }
  }

  /**
   * Get tags for a company with optional filtering
   */
  static async getTags(
    companyId: string,
    tagType?: TagType,
    parentId?: string,
    includeInactive = false,
  ): Promise<{
    success: boolean;
    tags?: Tag[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from("tags")
        .select("*")
        .eq("company_id", companyId)
        .order("sort_order", { ascending: true });

      if (tagType) {
        query = query.eq("tag_type", tagType);
      }

      if (parentId) {
        query = query.eq("parent_id", parentId);
      } else if (parentId === null) {
        query = query.is("parent_id", null);
      }

      if (!includeInactive) {
        query = query.eq("status", "Active");
      }

      const { data: tags, error } = await query;

      if (error) throw error;

      return { success: true, tags: tags || [] };
    } catch (error) {
      console.error("Error fetching tags:", error);
      return { success: false, error: "Failed to fetch tags" };
    }
  }

  /**
   * Get tag hierarchy (tree structure)
   */
  static async getTagHierarchy(
    companyId: string,
    tagType?: TagType,
  ): Promise<{
    success: boolean;
    hierarchy?: TagHierarchy[];
    error?: string;
  }> {
    try {
      const result = await this.getTags(companyId, tagType, undefined, true);
      const tags = result.tags;
      const error = result.error;

      if (!tags) {
        return { success: false, error: "Failed to fetch tags" };
      }

      // Build hierarchy
      const tagMap = new Map<string, TagHierarchy>();
      const roots: TagHierarchy[] = [];

      // Create all nodes
      for (const tag of tags) {
        tagMap.set(tag.id, {
          id: tag.id,
          name: tag.name,
          tag_type: tag.tag_type,
          children: [],
          level: 0,
          path: tag.name,
          is_group: tag.is_group,
          status: tag.status,
        });
      }

      // Build tree structure
      for (const tag of tags) {
        const node = tagMap.get(tag.id)!;

        if (tag.parent_id) {
          const parent = tagMap.get(tag.parent_id);
          if (parent) {
            parent.children.push(node);
            node.level = parent.level + 1;
            node.path = `${parent.path} > ${node.name}`;
          }
        } else {
          roots.push(node);
        }
      }

      return { success: true, hierarchy: roots };
    } catch (error) {
      console.error("Error building tag hierarchy:", error);
      return { success: false, error: "Failed to build tag hierarchy" };
    }
  }

  /**
   * Assign tags to GL entries
   */
  static async assignTagsToGLEntry(
    glEntryId: string,
    tagAssignments: {
      tag_id: string;
      percentage: number;
    }[],
  ): Promise<{
    success: boolean;
    assignments?: TagAssignment[];
    error?: string;
  }> {
    try {
      // Validate total percentage equals 100%
      const totalPercentage = tagAssignments.reduce(
        (sum, assignment) => sum + assignment.percentage,
        0,
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return { success: false, error: "Total percentage must equal 100%" };
      }

      // Get GL entry details for amount calculation
      const { data: glEntry } = await supabase
        .from("gl_entries")
        .select("debit, credit, account_id")
        .eq("id", glEntryId)
        .single();

      if (!glEntry) {
        return { success: false, error: "GL entry not found" };
      }

      const netAmount = glEntry.debit - glEntry.credit;

      // Create tag assignments
      const assignments = tagAssignments.map(assignment => ({
        gl_entry_id: glEntryId,
        tag_id: assignment.tag_id,
        tag_type: "Cost Center" as TagType, // Default, can be enhanced
        percentage: assignment.percentage,
        amount: (netAmount * assignment.percentage) / 100,
      }));

      const { data: newAssignments, error } = await supabase
        .from("tag_assignments")
        .insert(assignments)
        .select();

      if (error) throw error;

      return { success: true, assignments: newAssignments };
    } catch (error) {
      console.error("Error assigning tags:", error);
      return { success: false, error: "Failed to assign tags" };
    }
  }

  /**
   * Get tag-based financial reports
   */
  static async getTagReport(
    companyId: string,
    tagType: TagType,
    startDate: string,
    endDate: string,
    accountIds?: string[],
  ): Promise<{
    success: boolean;
    report?: TagReport[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from("tag_assignments")
        .select(
          `
          tag_id,
          amount,
          tags!inner(name, tag_type),
          gl_entries!inner(debit, credit, posting_date)
        `,
        )
        .eq("tags.company_id", companyId)
        .eq("tags.tag_type", tagType)
        .gte("gl_entries.posting_date", startDate)
        .lte("gl_entries.posting_date", endDate);

      if (accountIds && accountIds.length > 0) {
        query = query.in("gl_entries.account_id", accountIds);
      }

      const { data: assignments, error } = await query;

      if (error) throw error;

      // Aggregate data by tag
      const reportMap = new Map<string, TagReport>();

      for (const assignment of assignments || []) {
        const tagId = assignment.tag_id;
        const tagName = (assignment.tags as any).name;
        const tagType = (assignment.tags as any).tag_type;
        const debit = (assignment.gl_entries as any).debit;
        const credit = (assignment.gl_entries as any).credit;
        const amount = assignment.amount;

        if (!reportMap.has(tagId)) {
          reportMap.set(tagId, {
            tag_id: tagId,
            tag_name: tagName,
            tag_type: tagType,
            total_debit: 0,
            total_credit: 0,
            net_amount: 0,
            transaction_count: 0,
            percentage_of_total: 0,
          });
        }

        const report = reportMap.get(tagId)!;
        report.total_debit += debit;
        report.total_credit += credit;
        report.net_amount += amount;
        report.transaction_count += 1;
      }

      const report = Array.from(reportMap.values());

      // Calculate percentages
      const totalAmount = report.reduce((sum, item) => sum + Math.abs(item.net_amount), 0);
      report.forEach(item => {
        item.percentage_of_total =
          totalAmount > 0 ? (Math.abs(item.net_amount) / totalAmount) * 100 : 0;
      });

      // Sort by net amount descending
      report.sort((a, b) => Math.abs(b.net_amount) - Math.abs(a.net_amount));

      return { success: true, report };
    } catch (error) {
      console.error("Error generating tag report:", error);
      return { success: false, error: "Failed to generate tag report" };
    }
  }

  /**
   * Get cost center allocation (like ERPNext)
   */
  static async getCostCenterAllocation(
    companyId: string,
    mainCostCenterId: string,
    validFrom: string,
  ): Promise<{
    success: boolean;
    allocation?: { cost_center_id: string; percentage: number }[];
    error?: string;
  }> {
    try {
      const { data: allocation, error } = await supabase
        .from("cost_center_allocations")
        .select(
          `
          cost_center_allocations_percentages(
            cost_center_id,
            percentage
          )
        `,
        )
        .eq("company_id", companyId)
        .eq("main_cost_center_id", mainCostCenterId)
        .eq("is_active", true)
        .lte("valid_from", validFrom)
        .order("valid_from", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return {
        success: true,
        allocation: allocation?.cost_center_allocations_percentages || [],
      };
    } catch (error) {
      console.error("Error getting cost center allocation:", error);
      return { success: false, error: "Failed to get cost center allocation" };
    }
  }

  /**
   * Create cost center allocation
   */
  static async createCostCenterAllocation(
    companyId: string,
    mainCostCenterId: string,
    allocations: { cost_center_id: string; percentage: number }[],
    validFrom: string,
  ): Promise<{
    success: boolean;
    allocationId?: string;
    error?: string;
  }> {
    try {
      // Validate total percentage equals 100%
      const totalPercentage = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return { success: false, error: "Total allocation percentage must equal 100%" };
      }

      // Create main allocation record
      const { data: mainAllocation, error: mainError } = await supabase
        .from("cost_center_allocations")
        .insert([
          {
            company_id: companyId,
            main_cost_center_id: mainCostCenterId,
            valid_from: validFrom,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (mainError) throw mainError;

      // Create percentage records
      const percentageRecords = allocations.map(alloc => ({
        allocation_id: mainAllocation.id,
        cost_center_id: alloc.cost_center_id,
        percentage: alloc.percentage,
      }));

      const { error: percentageError } = await supabase
        .from("cost_center_allocations_percentages")
        .insert(percentageRecords);

      if (percentageError) throw percentageError;

      return { success: true, allocationId: mainAllocation.id };
    } catch (error) {
      console.error("Error creating cost center allocation:", error);
      return { success: false, error: "Failed to create cost center allocation" };
    }
  }

  /**
   * Get suggested tags for quick assignment
   */
  static async getSuggestedTags(
    companyId: string,
    glEntryId: string,
    tagType: TagType,
  ): Promise<{
    success: boolean;
    suggestions?: { id: string; name: string; recent_usage: number }[];
    error?: string;
  }> {
    try {
      // Get recently used tags for this type
      const { data: recentTags } = await supabase
        .from("tag_assignments")
        .select(
          `
          tag_id,
          tags!inner(name),
          created_at
        `,
        )
        .eq("tags.company_id", companyId)
        .eq("tags.tag_type", tagType)
        .order("created_at", { ascending: false })
        .limit(10);

      // Get all available tags
      const { data: allTags } = await supabase
        .from("tags")
        .select("id, name")
        .eq("company_id", companyId)
        .eq("tag_type", tagType)
        .eq("status", "Active");

      // Combine and deduplicate
      const suggestions = new Map<string, { id: string; name: string; recent_usage: number }>();

      recentTags?.forEach(assignment => {
        suggestions.set(assignment.tag_id, {
          id: assignment.tag_id,
          name: (assignment.tags as any).name,
          recent_usage: 1,
        });
      });

      allTags?.forEach(tag => {
        if (!suggestions.has(tag.id)) {
          suggestions.set(tag.id, {
            id: tag.id,
            name: tag.name,
            recent_usage: 0,
          });
        }
      });

      return {
        success: true,
        suggestions: Array.from(suggestions.values()).sort(
          (a, b) => b.recent_usage - a.recent_usage,
        ),
      };
    } catch (error) {
      console.error("Error getting suggested tags:", error);
      return { success: false, error: "Failed to get suggested tags" };
    }
  }

  /**
   * Helper methods
   */
  private static async getTagById(tagId: string): Promise<Tag | null> {
    const { data: tag } = await supabase.from("tags").select("*").eq("id", tagId).single();

    return tag;
  }

  private static async getMaxSortOrder(
    companyId: string,
    tagType: TagType,
    parentId?: string,
  ): Promise<number> {
    let query = supabase
      .from("tags")
      .select("sort_order")
      .eq("company_id", companyId)
      .eq("tag_type", tagType)
      .order("sort_order", { ascending: false })
      .limit(1);

    if (parentId) {
      query = query.eq("parent_id", parentId);
    } else {
      query = query.is("parent_id", null);
    }

    const { data: tags } = await query;
    return tags?.[0]?.sort_order || 0;
  }
}
