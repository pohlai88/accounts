/**
 * Flexible Analysis Engine
 * Advanced collapsible analysis framework inspired by ERPNext but enhanced
 * Supports dynamic pivoting, drilling, and multi-dimensional analysis
 */

import { supabase } from "./supabase";

export type AnalysisDimension =
  | "account"
  | "cost_center"
  | "project"
  | "customer"
  | "supplier"
  | "item"
  | "territory"
  | "sales_person"
  | "fiscal_year"
  | "month"
  | "quarter"
  | "year";

export type AnalysisMeasure =
  | "debit"
  | "credit"
  | "balance"
  | "count"
  | "average"
  | "sum"
  | "min"
  | "max"
  | "variance"
  | "percentage";

export type AnalysisPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

export type AnalysisAggregation =
  | "sum"
  | "average"
  | "count"
  | "min"
  | "max"
  | "variance"
  | "percentage";

export interface AnalysisFilter {
  dimension: AnalysisDimension;
  operator:
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "in"
  | "not_in"
  | "between"
  | "greater_than"
  | "less_than";
  value: string | number | string[] | number[];
  label?: string;
}

export interface AnalysisConfig {
  id?: string;
  name: string;
  description?: string;
  dimensions: AnalysisDimension[];
  measures: AnalysisMeasure[];
  period: AnalysisPeriod;
  dateRange: {
    start: string;
    end: string;
  };
  filters: AnalysisFilter[];
  groupBy: AnalysisDimension[];
  sortBy: {
    dimension: AnalysisDimension;
    direction: "asc" | "desc";
  }[];
  aggregation: AnalysisAggregation;
  showZeroValues: boolean;
  showPercentages: boolean;
  showVariances: boolean;
  drillDownLevels: number;
  isCollapsible: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnalysisNode {
  id: string;
  label: string;
  value: number;
  percentage?: number;
  variance?: number;
  children: AnalysisNode[];
  level: number;
  isExpanded: boolean;
  isCollapsible: boolean;
  metadata: Record<string, any>;
  drillDownData?: AnalysisNode[];
}

export interface AnalysisResult {
  config: AnalysisConfig;
  data: AnalysisNode[];
  summary: {
    totalRows: number;
    totalValue: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
    variance: number;
  };
  metadata: {
    generatedAt: string;
    processingTime: number;
    dataSource: string;
    currency: string;
  };
}

export interface PivotTableConfig {
  rows: AnalysisDimension[];
  columns: AnalysisDimension[];
  values: AnalysisMeasure[];
  filters: AnalysisFilter[];
  aggregation: AnalysisAggregation;
}

export interface PivotTableResult {
  config: PivotTableConfig;
  data: Array<{
    [key: string]: unknown;
    _total?: number;
    _percentage?: number;
  }>;
  rowTotals: Record<string, number>;
  columnTotals: Record<string, number>;
  grandTotal: number;
}

/**
 * Flexible Analysis Engine
 */
export class FlexibleAnalysisEngine {
  /**
   * Create analysis configuration
   */
  static async createAnalysisConfig(
    config: Omit<AnalysisConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<{
    success: boolean;
    config?: AnalysisConfig;
    error?: string;
  }> {
    try {
      const { data: newConfig, error } = await supabase
        .from("analysis_configs")
        .insert([
          {
            ...config,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, config: newConfig };
    } catch (error) {
      // Log analysis config creation error to monitoring service
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error("Error creating analysis config:", error);
      }
      return { success: false, error: "Failed to create analysis configuration" };
    }
  }

  /**
   * Execute analysis with collapsible tree structure
   */
  static async executeAnalysis(
    configId: string,
    companyId: string,
  ): Promise<{
    success: boolean;
    result?: AnalysisResult;
    error?: string;
  }> {
    try {
      // Get analysis configuration
      const { data: config, error: configError } = await supabase
        .from("analysis_configs")
        .select("*")
        .eq("id", configId)
        .single();

      if (configError) throw configError;
      if (!config) {
        return { success: false, error: "Analysis configuration not found" };
      }

      const startTime = Date.now();

      // Build dynamic query based on configuration
      const query = this.buildAnalysisQuery(config, companyId);

      // Execute query
      const { data: rawData, error: queryError } = await supabase.rpc("execute_analysis_query", {
        query_sql: query.sql,
        query_params: query.params,
      });

      if (queryError) throw queryError;

      // Process data into collapsible tree structure
      const processedData = this.processDataIntoTree(rawData || [], config);

      // Calculate summary statistics
      const summary = this.calculateSummary(processedData);

      const processingTime = Date.now() - startTime;

      const result: AnalysisResult = {
        config,
        data: processedData,
        summary,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime,
          dataSource: "gl_entries",
          currency: "USD", // This should come from company settings
        },
      };

      return { success: true, result };
    } catch (error) {
      // Log analysis execution error to monitoring service
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error("Error executing analysis:", error);
      }
      return { success: false, error: "Failed to execute analysis" };
    }
  }

  /**
   * Execute pivot table analysis
   */
  static async executePivotTable(
    config: PivotTableConfig,
    companyId: string,
  ): Promise<{
    success: boolean;
    result?: PivotTableResult;
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      // Build pivot table query
      const query = this.buildPivotTableQuery(config, companyId);

      // Execute query
      const { data: rawData, error: queryError } = await supabase.rpc("execute_pivot_query", {
        query_sql: query.sql,
        query_params: query.params,
      });

      if (queryError) throw queryError;

      // Process pivot table data
      const processedData = this.processPivotTableData(rawData || [], config);

      // Calculate totals
      const { rowTotals, columnTotals, grandTotal } = this.calculatePivotTotals(
        processedData,
        config,
      );

      const result: PivotTableResult = {
        config,
        data: processedData,
        rowTotals,
        columnTotals,
        grandTotal,
      };

      return { success: true, result };
    } catch (error) {
      // Log pivot table execution error to monitoring service
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error("Error executing pivot table:", error);
      }
      return { success: false, error: "Failed to execute pivot table analysis" };
    }
  }

  /**
   * Drill down into specific node
   */
  static async drillDown(
    nodeId: string,
    configId: string,
    companyId: string,
    additionalFilters: AnalysisFilter[] = [],
  ): Promise<{
    success: boolean;
    data?: AnalysisNode[];
    error?: string;
  }> {
    try {
      // Get node metadata to understand drill-down context
      const { data: config, error: configError } = await supabase
        .from("analysis_configs")
        .select("*")
        .eq("id", configId)
        .single();

      if (configError) throw configError;
      if (!config) {
        return { success: false, error: "Analysis configuration not found" };
      }

      // Build drill-down query with additional filters
      const drillDownQuery = this.buildDrillDownQuery(nodeId, config, companyId, additionalFilters);

      // Execute drill-down query
      const { data: rawData, error: queryError } = await supabase.rpc("execute_drill_down_query", {
        query_sql: drillDownQuery.sql,
        query_params: drillDownQuery.params,
      });

      if (queryError) throw queryError;

      // Process drill-down data
      const processedData = this.processDataIntoTree(rawData || [], config, 1); // Level 1 for drill-down

      return { success: true, data: processedData };
    } catch (error) {
      // Log drill-down error to monitoring service
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error("Error drilling down:", error);
      }
      return { success: false, error: "Failed to drill down" };
    }
  }

  /**
   * Get available analysis configurations
   */
  static async getAnalysisConfigs(
    companyId: string,
    userId?: string,
  ): Promise<{
    success: boolean;
    configs?: AnalysisConfig[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from("analysis_configs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.or(`created_by.eq.${userId},is_public.eq.true`);
      } else {
        query = query.eq("is_public", true);
      }

      const { data: configs, error } = await query;

      if (error) throw error;

      return { success: true, configs: configs || [] };
    } catch (error) {
      // Log analysis configs fetch error to monitoring service
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error("Error fetching analysis configs:", error);
      }
      return { success: false, error: "Failed to fetch analysis configurations" };
    }
  }

  /**
   * Build dynamic analysis query
   */
  private static buildAnalysisQuery(
    config: AnalysisConfig,
    companyId: string,
  ): {
    sql: string;
    params: unknown[];
  } {
    const dimensions = config.dimensions;
    const measures = config.measures;
    const filters = config.filters;
    const groupBy = config.groupBy;
    const sortBy = config.sortBy;

    // Build SELECT clause
    const selectClause = dimensions.map(dim => this.getDimensionField(dim)).join(", ");
    const measureClause = measures.map(measure => this.getMeasureField(measure)).join(", ");

    // Build WHERE clause
    const whereConditions = [`ge.company_id = $1`];
    const params = [companyId];
    let paramIndex = 2;

    // Add date range filter
    whereConditions.push(`ge.posting_date >= $${paramIndex}`);
    params.push(config.dateRange.start);
    paramIndex++;

    whereConditions.push(`ge.posting_date <= $${paramIndex}`);
    params.push(config.dateRange.end);
    paramIndex++;

    // Add custom filters
    for (const filter of filters) {
      const condition = this.buildFilterCondition(filter, paramIndex);
      whereConditions.push(condition.condition);
      params.push(...condition.params);
      paramIndex += condition.params.length;
    }

    // Build GROUP BY clause
    const groupByClause = groupBy.map(dim => this.getDimensionField(dim)).join(", ");

    // Build ORDER BY clause
    const orderByClause = sortBy
      .map(sort => `${this.getDimensionField(sort.dimension)} ${sort.direction}`)
      .join(", ");

    const sql = `
      SELECT
        ${selectClause},
        ${measureClause}
      FROM gl_entries ge
      LEFT JOIN accounts a ON ge.account_id = a.id
      LEFT JOIN companies c ON ge.company_id = c.id
      ${this.buildJoinsForDimensions(dimensions)}
      WHERE ${whereConditions.join(" AND ")}
      ${groupByClause ? `GROUP BY ${groupByClause}` : ""}
      ${orderByClause ? `ORDER BY ${orderByClause}` : ""}
    `;

    return { sql, params };
  }

  /**
   * Build pivot table query
   */
  private static buildPivotTableQuery(
    config: PivotTableConfig,
    companyId: string,
  ): {
    sql: string;
    params: unknown[];
  } {
    // This is a simplified version - in practice, you'd need more complex SQL
    // to handle dynamic pivoting
    const sql = `
      SELECT
        ${config.rows.map(row => this.getDimensionField(row)).join(", ")},
        ${config.columns.map(col => this.getDimensionField(col)).join(", ")},
        ${config.values.map(val => this.getMeasureField(val)).join(", ")}
      FROM gl_entries ge
      LEFT JOIN accounts a ON ge.account_id = a.id
      WHERE ge.company_id = $1
      GROUP BY ${config.rows.map(row => this.getDimensionField(row)).join(", ")},
               ${config.columns.map(col => this.getDimensionField(col)).join(", ")}
    `;

    return { sql, params: [companyId] };
  }

  /**
   * Build drill-down query
   */
  private static buildDrillDownQuery(
    nodeId: string,
    config: AnalysisConfig,
    companyId: string,
    additionalFilters: AnalysisFilter[],
  ): {
    sql: string;
    params: unknown[];
  } {
    // Parse nodeId to understand what to drill down into
    const nodeData = JSON.parse(nodeId);

    // Build query with node-specific filters
    const whereConditions = [`ge.company_id = $1`];
    const params = [companyId];
    let paramIndex = 2;

    // Add node-specific filters
    for (const [key, value] of Object.entries(nodeData)) {
      whereConditions.push(`${this.getDimensionField(key as AnalysisDimension)} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }

    // Add additional filters
    for (const filter of additionalFilters) {
      const condition = this.buildFilterCondition(filter, paramIndex);
      whereConditions.push(condition.condition);
      params.push(...condition.params);
      paramIndex += condition.params.length;
    }

    const sql = `
      SELECT
        ${config.dimensions.map(dim => this.getDimensionField(dim)).join(", ")},
        ${config.measures.map(measure => this.getMeasureField(measure)).join(", ")}
      FROM gl_entries ge
      LEFT JOIN accounts a ON ge.account_id = a.id
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY ${config.dimensions.map(dim => this.getDimensionField(dim)).join(", ")}
    `;

    return { sql, params };
  }

  /**
   * Process data into collapsible tree structure
   */
  private static processDataIntoTree(
    rawData: Record<string, unknown>[],
    config: AnalysisConfig,
    startLevel: number = 0,
  ): AnalysisNode[] {
    const tree: AnalysisNode[] = [];
    const nodeMap = new Map<string, AnalysisNode>();

    for (const row of rawData) {
      const nodeId = this.generateNodeId(row, config.dimensions);
      const parentId = this.generateParentId(row, config.dimensions);

      const node: AnalysisNode = {
        id: nodeId,
        label: this.generateNodeLabel(row, config.dimensions),
        value: this.calculateNodeValue(row, config.measures),
        percentage: 0, // Will be calculated after all nodes are processed
        children: [],
        level: startLevel,
        isExpanded: config.isCollapsible ? false : true,
        isCollapsible: config.isCollapsible,
        metadata: this.extractNodeMetadata(row, config.dimensions),
      };

      nodeMap.set(nodeId, node);

      if (parentId && nodeMap.has(parentId)) {
        nodeMap.get(parentId)!.children.push(node);
        node.level = nodeMap.get(parentId)!.level + 1;
      } else {
        tree.push(node);
      }
    }

    // Calculate percentages and variances
    this.calculatePercentagesAndVariances(tree);

    return tree;
  }

  /**
   * Process pivot table data
   */
  private static processPivotTableData(rawData: Record<string, unknown>[], config: PivotTableConfig): Record<string, unknown>[] {
    // Process raw data into pivot table format
    const pivotData: Record<string, unknown>[] = [];

    for (const row of rawData) {
      const pivotRow: Record<string, unknown> = {};

      // Add row dimensions
      for (const rowDim of config.rows) {
        pivotRow[rowDim] = row[this.getDimensionField(rowDim)];
      }

      // Add column dimensions
      for (const colDim of config.columns) {
        pivotRow[colDim] = row[this.getDimensionField(colDim)];
      }

      // Add values
      for (const value of config.values) {
        pivotRow[value] = row[this.getMeasureField(value)];
      }

      pivotData.push(pivotRow);
    }

    return pivotData;
  }

  /**
   * Calculate summary statistics
   */
  private static calculateSummary(data: AnalysisNode[]): AnalysisResult["summary"] {
    let totalRows = 0;
    let totalValue = 0;
    let minValue = Infinity;
    let maxValue = -Infinity;
    const values: number[] = [];

    const traverse = (nodes: AnalysisNode[]) => {
      for (const node of nodes) {
        totalRows++;
        totalValue += node.value;
        minValue = Math.min(minValue, node.value);
        maxValue = Math.max(maxValue, node.value);
        values.push(node.value);
        traverse(node.children);
      }
    };

    traverse(data);

    const averageValue = totalRows > 0 ? totalValue / totalRows : 0;
    const variance = this.calculateVariance(values, averageValue);

    return {
      totalRows,
      totalValue,
      averageValue,
      minValue: minValue === Infinity ? 0 : minValue,
      maxValue: maxValue === -Infinity ? 0 : maxValue,
      variance,
    };
  }

  /**
   * Calculate pivot table totals
   */
  private static calculatePivotTotals(
    data: Record<string, unknown>[],
    config: PivotTableConfig,
  ): {
    rowTotals: Record<string, number>;
    columnTotals: Record<string, number>;
    grandTotal: number;
  } {
    const rowTotals: Record<string, number> = {};
    const columnTotals: Record<string, number> = {};
    let grandTotal = 0;

    for (const row of data) {
      const rowKey = config.rows.map(r => row[r]).join("|");
      const colKey = config.columns.map(c => row[c]).join("|");

      const value = config.values.reduce((sum, val) => sum + (row[val] || 0), 0);

      rowTotals[rowKey] = (rowTotals[rowKey] || 0) + value;
      columnTotals[colKey] = (columnTotals[colKey] || 0) + value;
      grandTotal += value;
    }

    return { rowTotals, columnTotals, grandTotal };
  }

  /**
   * Helper methods for query building
   */
  private static getDimensionField(dimension: AnalysisDimension): string {
    const fieldMap: Record<AnalysisDimension, string> = {
      account: "a.name",
      cost_center: "ge.cost_center",
      project: "ge.project",
      customer: "ge.customer",
      supplier: "ge.supplier",
      item: "ge.item",
      territory: "ge.territory",
      sales_person: "ge.sales_person",
      fiscal_year: "EXTRACT(YEAR FROM ge.posting_date)",
      month: "EXTRACT(MONTH FROM ge.posting_date)",
      quarter: "EXTRACT(QUARTER FROM ge.posting_date)",
      year: "EXTRACT(YEAR FROM ge.posting_date)",
    };
    return fieldMap[dimension] || dimension;
  }

  private static getMeasureField(measure: AnalysisMeasure): string {
    const fieldMap: Record<AnalysisMeasure, string> = {
      debit: "SUM(ge.debit)",
      credit: "SUM(ge.credit)",
      balance: "SUM(ge.debit - ge.credit)",
      count: "COUNT(*)",
      average: "AVG(ge.debit - ge.credit)",
      sum: "SUM(ge.debit - ge.credit)",
      min: "MIN(ge.debit - ge.credit)",
      max: "MAX(ge.debit - ge.credit)",
      variance: "VARIANCE(ge.debit - ge.credit)",
      percentage: "SUM(ge.debit - ge.credit) / SUM(SUM(ge.debit - ge.credit)) OVER() * 100",
    };
    return fieldMap[measure] || measure;
  }

  private static buildFilterCondition(
    filter: AnalysisFilter,
    paramIndex: number,
  ): {
    condition: string;
    params: unknown[];
  } {
    const field = this.getDimensionField(filter.dimension);
    const params: unknown[] = [];

    switch (filter.operator) {
      case "equals":
        return { condition: `${field} = $${paramIndex}`, params: [filter.value] };
      case "not_equals":
        return { condition: `${field} != $${paramIndex}`, params: [filter.value] };
      case "contains":
        return { condition: `${field} ILIKE $${paramIndex}`, params: [`%${filter.value}%`] };
      case "not_contains":
        return { condition: `${field} NOT ILIKE $${paramIndex}`, params: [`%${filter.value}%`] };
      case "in":
        return { condition: `${field} = ANY($${paramIndex})`, params: [filter.value as unknown[]] };
      case "not_in":
        return { condition: `${field} != ALL($${paramIndex})`, params: [filter.value as unknown[]] };
      case "between":
        return {
          condition: `${field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`,
          params: [filter.value[0], filter.value[1]],
        };
      case "greater_than":
        return { condition: `${field} > $${paramIndex}`, params: [filter.value] };
      case "less_than":
        return { condition: `${field} < $${paramIndex}`, params: [filter.value] };
      default:
        return { condition: "1=1", params: [] };
    }
  }

  private static buildJoinsForDimensions(dimensions: AnalysisDimension[]): string {
    const joins: string[] = [];

    if (dimensions.includes("account")) {
      joins.push("LEFT JOIN accounts a ON ge.account_id = a.id");
    }

    // Add more joins as needed for other dimensions

    return joins.join("\n");
  }

  /**
   * Helper methods for data processing
   */
  private static generateNodeId(row: Record<string, unknown>, dimensions: AnalysisDimension[]): string {
    const key = dimensions.map(dim => row[this.getDimensionField(dim)]).join("|");
    return btoa(key).replace(/[^a-zA-Z0-9]/g, "");
  }

  private static generateParentId(row: Record<string, unknown>, dimensions: AnalysisDimension[]): string | null {
    if (dimensions.length <= 1) return null;

    const parentDimensions = dimensions.slice(0, -1);
    const key = parentDimensions.map(dim => row[this.getDimensionField(dim)]).join("|");
    return btoa(key).replace(/[^a-zA-Z0-9]/g, "");
  }

  private static generateNodeLabel(row: Record<string, unknown>, dimensions: AnalysisDimension[]): string {
    const lastDimension = dimensions[dimensions.length - 1];
    return row[this.getDimensionField(lastDimension)] || "Unknown";
  }

  private static calculateNodeValue(row: Record<string, unknown>, measures: AnalysisMeasure[]): number {
    return measures.reduce((sum, measure) => {
      const value = row[this.getMeasureField(measure)] || 0;
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  }

  private static extractNodeMetadata(
    row: Record<string, unknown>,
    dimensions: AnalysisDimension[],
  ): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    for (const dim of dimensions) {
      metadata[dim] = row[this.getDimensionField(dim)];
    }

    return metadata;
  }

  private static calculatePercentagesAndVariances(nodes: AnalysisNode[]): void {
    const totalValue = this.calculateTotalValue(nodes);

    const traverse = (nodeList: AnalysisNode[]) => {
      for (const node of nodeList) {
        node.percentage = totalValue > 0 ? (node.value / totalValue) * 100 : 0;
        traverse(node.children);
      }
    };

    traverse(nodes);
  }

  private static calculateTotalValue(nodes: AnalysisNode[]): number {
    let total = 0;

    const traverse = (nodeList: AnalysisNode[]) => {
      for (const node of nodeList) {
        total += node.value;
        traverse(node.children);
      }
    };

    traverse(nodes);
    return total;
  }

  private static calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0;

    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}
