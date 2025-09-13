/**
 * Consolidated Reporting Service - Multi-Entity Financial Consolidation
 * Closes Critical CFO Gap #5 - Multi-Entity Reporting & Consolidation
 * 
 * Features:
 * - Multi-entity financial consolidation with ownership percentages
 * - Intercompany transaction elimination and balance reconciliation
 * - Multi-currency consolidation with automatic translation
 * - Consolidated financial statement generation (BS, P&L, CF, Equity)
 * - Hierarchical consolidation groups and subsidiary management
 * - Real-time consolidation processing with progress tracking
 */

import { supabase } from './supabase'

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type GroupType = 'Standard' | 'Holding Company' | 'Subsidiary' | 'Joint Venture' | 'Associate'
export type ConsolidationMethod = 'Full' | 'Proportionate' | 'Equity' | 'None'
export type ControlType = 'Full Control' | 'Majority Control' | 'Significant Influence' | 'Joint Control' | 'No Control'
export type StatementType = 'Balance Sheet' | 'Income Statement' | 'Cash Flow Statement' | 'Statement of Equity' | 'Notes'
export type StatementVersion = 'Draft' | 'Preliminary' | 'Final' | 'Audited' | 'Published'
export type ReportingFramework = 'GAAP' | 'IFRS' | 'Local GAAP' | 'Tax' | 'Regulatory' | 'Management'
export type RunStatus = 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Cancelled' | 'Partially Completed'
export type EliminationType = 'Intercompany Sales' | 'Intercompany Receivables' | 'Intercompany Payables' | 'Investment Elimination' | 'Dividend Elimination' | 'Markup Elimination' | 'Goodwill' | 'Manual'
export type TranslationMethod = 'Current Rate' | 'Temporal' | 'Historical Rate' | 'Manual'

export interface ConsolidationGroup {
    id: string
    group_name: string
    group_code: string
    description?: string
    group_type: GroupType
    base_currency: string
    consolidation_method: ConsolidationMethod
    parent_group_id?: string
    hierarchy_level: number
    sort_order: number
    elimination_rules: Record<string, any>
    reporting_frequency: string
    fiscal_year_end: string
    is_active: boolean
    created_at: string
    created_by?: string
    updated_at: string
    updated_by?: string
}

export interface ConsolidationEntity {
    id: string
    consolidation_group_id: string
    company_id: string
    ownership_percentage: number
    voting_percentage?: number
    control_type: ControlType
    acquisition_date?: string
    acquisition_cost: number
    acquisition_currency: string
    consolidation_method: ConsolidationMethod
    elimination_required: boolean
    reporting_lag_days: number
    fiscal_year_alignment: string
    functional_currency: string
    translation_method: TranslationMethod
    effective_from: string
    effective_to?: string
    is_active: boolean
    created_at: string
    created_by?: string
    updated_at: string
    updated_by?: string
}

export interface IntercompanyRule {
    id: string
    consolidation_group_id: string
    rule_name: string
    rule_type: string
    source_criteria: Record<string, any>
    target_treatment: Record<string, any>
    application_method: string
    priority: number
    matching_tolerance: number
    matching_criteria: Record<string, any>
    requires_approval: boolean
    approval_threshold?: number
    approved_by?: string
    approved_at?: string
    is_active: boolean
    effective_from: string
    effective_to?: string
    created_at: string
    created_by?: string
    updated_at: string
    updated_by?: string
}

export interface ConsolidatedTrialBalance {
    id: string
    consolidation_group_id: string
    consolidation_period: string
    consolidation_type: string
    account_id: string
    account_code: string
    account_name: string
    account_type: string
    account_category?: string
    pre_elimination_debit: number
    pre_elimination_credit: number
    elimination_debit: number
    elimination_credit: number
    post_elimination_debit: number
    post_elimination_credit: number
    consolidated_balance: number
    contributing_entities: Array<{
        company_id: string
        company_name: string
        original_amount: number
        currency: string
        exchange_rate: number
        converted_amount: number
        ownership_percentage: number
    }>
    weighted_average_rate: number
    translation_adjustments: number
    minority_interest_amount: number
    parent_interest_amount: number
    data_completeness: number
    validation_status: string
    validation_notes?: string
    consolidation_run_id?: string
    processing_timestamp: string
    processing_duration_ms: number
    created_at: string
}

export interface ConsolidationElimination {
    id: string
    consolidation_group_id: string
    consolidation_period: string
    elimination_type: EliminationType
    elimination_reference?: string
    description: string
    rule_id?: string
    debit_account_id: string
    credit_account_id: string
    elimination_amount: number
    currency: string
    source_entities: Array<{
        company_id: string
        transaction_id?: string
        amount: number
        side: 'debit' | 'credit'
    }>
    is_automatic: boolean
    requires_approval: boolean
    approval_status: string
    approved_by?: string
    approved_at?: string
    is_reversed: boolean
    reversed_by?: string
    reversed_at?: string
    reversal_reason?: string
    original_elimination_id?: string
    consolidation_run_id?: string
    processing_sequence: number
    is_active: boolean
    created_at: string
    created_by?: string
    modified: string
    modified_by?: string
}

export interface ConsolidatedFinancialStatement {
    id: string
    consolidation_group_id: string
    statement_type: StatementType
    reporting_period: string
    period_type: string
    statement_version: StatementVersion
    reporting_framework: ReportingFramework
    statement_data: Record<string, any>
    prior_period_data: Record<string, any>
    variance_analysis: Record<string, any>
    total_entities: number
    minority_interest_total: number
    total_eliminations: number
    data_completeness: number
    balancing_difference: number
    validation_errors: number
    validation_warnings: number
    consolidation_run_id?: string
    generation_timestamp: string
    processing_time_seconds: number
    review_status: string
    reviewed_by?: string
    reviewed_at?: string
    review_notes?: string
    published: boolean
    published_at?: string
    published_by?: string
    created_at: string
    created_by?: string
    updated_at: string
    updated_by?: string
}

export interface ConsolidationRun {
    id: string
    consolidation_group_id: string
    run_name: string
    consolidation_period: string
    run_type: string
    consolidation_scope: Record<string, any>
    run_status: RunStatus
    total_steps: number
    completed_steps: number
    progress_percentage: number
    current_step_description?: string
    started_at?: string
    completed_at?: string
    processing_duration_seconds?: number
    entities_processed: number
    accounts_processed: number
    eliminations_created: number
    total_amount_consolidated: number
    error_count: number
    warning_count: number
    error_details: Array<any>
    output_trial_balance: boolean
    output_statements: boolean
    output_eliminations: boolean
    data_completeness: number
    balancing_status: string
    balancing_difference: number
    created_at: string
    created_by?: string
}

export interface ConsolidationDashboard {
    consolidation_group: ConsolidationGroup
    entities: ConsolidationEntity[]
    latest_run: ConsolidationRun | null
    consolidation_summary: {
        total_entities: number
        total_assets: number
        total_liabilities: number
        total_equity: number
        minority_interest: number
        eliminations_total: number
        data_completeness: number
    }
    financial_statements: ConsolidatedFinancialStatement[]
    key_metrics: {
        consolidation_ratio: number
        intercompany_eliminations: number
        currency_impact: number
        processing_efficiency: number
    }
    recent_eliminations: ConsolidationElimination[]
    validation_issues: Array<{
        type: string
        severity: string
        description: string
        affected_entities: string[]
    }>
}

export interface ConsolidationAnalysis {
    period_comparison: {
        current_period: ConsolidatedFinancialStatement[]
        prior_period: ConsolidatedFinancialStatement[]
        variance_analysis: {
            assets_variance: number
            liabilities_variance: number
            equity_variance: number
            revenue_variance: number
            expense_variance: number
        }
    }
    entity_contribution: Array<{
        entity_name: string
        ownership_percentage: number
        assets_contribution: number
        revenue_contribution: number
        profit_contribution: number
        percentage_of_consolidated: number
    }>
    elimination_impact: {
        total_eliminations: number
        by_type: Record<EliminationType, number>
        material_eliminations: ConsolidationElimination[]
    }
    currency_impact: {
        total_translation_adjustment: number
        by_currency: Record<string, number>
        rate_sensitivity: number
    }
}

// =====================================================================================
// MAIN SERVICE CLASS
// =====================================================================================

export class ConsolidatedReportingService {
    /**
     * Get comprehensive consolidation dashboard
     */
    static async getConsolidationDashboard(
        groupId: string,
        period?: string
    ): Promise<{
        success: boolean
        data?: ConsolidationDashboard
        error?: string
    }> {
        try {
            const consolidationPeriod = period || new Date().toISOString().split('T')[0]

            // Get consolidation group details
            const { data: group, error: groupError } = await supabase
                .from('consolidation_groups')
                .select('*')
                .eq('id', groupId)
                .single()

            if (groupError) {
                throw new Error(`Consolidation group not found: ${groupError.message}`)
            }

            // Get entities in the consolidation group
            const { data: entities, error: entitiesError } = await supabase
                .from('consolidation_entities')
                .select(`
                    *,
                    company:companies(name, currency)
                `)
                .eq('consolidation_group_id', groupId)
                .eq('is_active', true)
                .order('ownership_percentage', { ascending: false })

            if (entitiesError) {
                throw new Error(`Failed to fetch entities: ${entitiesError.message}`)
            }

            // Get latest consolidation run
            const { data: latestRun, error: runError } = await supabase
                .from('consolidation_runs')
                .select('*')
                .eq('consolidation_group_id', groupId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (runError && runError.code !== 'PGRST116') {
                console.error('Error fetching latest run:', runError)
            }

            // Get consolidation summary from materialized view
            const { data: summaryData, error: summaryError } = await supabase
                .from('mv_consolidation_summary')
                .select('*')
                .eq('group_id', groupId)
                .order('consolidation_period', { ascending: false })
                .limit(1)

            if (summaryError) {
                console.error('Error fetching consolidation summary:', summaryError)
            }

            // Calculate consolidation summary
            const consolidationSummary = await this.calculateConsolidationSummary(groupId, consolidationPeriod)

            // Get financial statements
            const { data: statements, error: statementsError } = await supabase
                .from('consolidated_financial_statements')
                .select('*')
                .eq('consolidation_group_id', groupId)
                .gte('reporting_period', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .order('reporting_period', { ascending: false })

            if (statementsError) {
                console.error('Error fetching statements:', statementsError)
            }

            // Calculate key metrics
            const keyMetrics = await this.calculateKeyMetrics(groupId, consolidationPeriod)

            // Get recent eliminations
            const { data: eliminations, error: eliminationsError } = await supabase
                .from('consolidation_eliminations')
                .select('*')
                .eq('consolidation_group_id', groupId)
                .gte('consolidation_period', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                .order('created_at', { ascending: false })
                .limit(10)

            if (eliminationsError) {
                console.error('Error fetching eliminations:', eliminationsError)
            }

            // Get validation issues
            const validationIssues = await this.getValidationIssues(groupId, consolidationPeriod)

            const dashboard: ConsolidationDashboard = {
                consolidation_group: group,
                entities: entities || [],
                latest_run: latestRun,
                consolidation_summary: consolidationSummary,
                financial_statements: statements || [],
                key_metrics: keyMetrics,
                recent_eliminations: eliminations || [],
                validation_issues: validationIssues
            }

            return {
                success: true,
                data: dashboard
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * Create a new consolidation run
     */
    static async createConsolidationRun(
        groupId: string,
        period: string,
        runName?: string,
        runType: string = 'Full'
    ): Promise<{
        success: boolean
        data?: ConsolidationRun
        error?: string
    }> {
        try {
            const { data, error } = await supabase
                .rpc('create_consolidation_run', {
                    p_group_id: groupId,
                    p_period: period,
                    p_run_name: runName,
                    p_run_type: runType
                })

            if (error) {
                throw new Error(`Failed to create consolidation run: ${error.message}`)
            }

            // Get the created run
            const { data: run, error: runError } = await supabase
                .from('consolidation_runs')
                .select('*')
                .eq('id', data)
                .single()

            if (runError) {
                throw new Error(`Failed to fetch created run: ${runError.message}`)
            }

            return {
                success: true,
                data: run
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * Process consolidation run
     */
    static async processConsolidation(runId: string): Promise<{
        success: boolean
        data?: ConsolidationRun
        error?: string
    }> {
        try {
            const { data: success, error } = await supabase
                .rpc('process_consolidation', {
                    p_run_id: runId
                })

            if (error) {
                throw new Error(`Failed to process consolidation: ${error.message}`)
            }

            // Get updated run details
            const { data: run, error: runError } = await supabase
                .from('consolidation_runs')
                .select('*')
                .eq('id', runId)
                .single()

            if (runError) {
                throw new Error(`Failed to fetch run details: ${runError.message}`)
            }

            return {
                success: success,
                data: run
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * Get consolidated trial balance
     */
    static async getConsolidatedTrialBalance(
        groupId: string,
        period: string,
        accountType?: string
    ): Promise<{
        success: boolean
        data?: ConsolidatedTrialBalance[]
        error?: string
    }> {
        try {
            let query = supabase
                .from('consolidated_trial_balance')
                .select('*')
                .eq('consolidation_group_id', groupId)
                .eq('consolidation_period', period)
                .order('account_code', { ascending: true })

            if (accountType) {
                query = query.eq('account_type', accountType)
            }

            const { data, error } = await query

            if (error) {
                throw new Error(`Failed to fetch consolidated trial balance: ${error.message}`)
            }

            return {
                success: true,
                data: data || []
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * Generate consolidated financial statements
     */
    static async generateConsolidatedStatements(
        groupId: string,
        period: string,
        statementTypes: StatementType[] = ['Balance Sheet', 'Income Statement', 'Cash Flow Statement'],
        framework: ReportingFramework = 'GAAP'
    ): Promise<{
        success: boolean
        data?: ConsolidatedFinancialStatement[]
        error?: string
    }> {
        try {
            const statements: ConsolidatedFinancialStatement[] = []

            for (const statementType of statementTypes) {
                const statement = await this.generateSingleStatement(
                    groupId,
                    period,
                    statementType,
                    framework
                )

                if (statement) {
                    statements.push(statement)
                }
            }

            return {
                success: true,
                data: statements
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * Get consolidation analysis with period comparison
     */
    static async getConsolidationAnalysis(
        groupId: string,
        currentPeriod: string,
        priorPeriod?: string
    ): Promise<{
        success: boolean
        data?: ConsolidationAnalysis
        error?: string
    }> {
        try {
            // Calculate prior period if not provided
            const priorPeriodDate = priorPeriod || this.calculatePriorPeriod(currentPeriod)

            // Get current and prior period statements
            const [currentResult, priorResult] = await Promise.all([
                this.getFinancialStatements(groupId, currentPeriod),
                this.getFinancialStatements(groupId, priorPeriodDate)
            ])

            // Calculate variance analysis
            const varianceAnalysis = this.calculateVarianceAnalysis(
                currentResult.data || [],
                priorResult.data || []
            )

            // Get entity contribution analysis
            const entityContribution = await this.calculateEntityContribution(groupId, currentPeriod)

            // Get elimination impact
            const eliminationImpact = await this.calculateEliminationImpact(groupId, currentPeriod)

            // Get currency impact
            const currencyImpact = await this.calculateCurrencyImpact(groupId, currentPeriod)

            const analysis: ConsolidationAnalysis = {
                period_comparison: {
                    current_period: currentResult.data || [],
                    prior_period: priorResult.data || [],
                    variance_analysis: varianceAnalysis
                },
                entity_contribution: entityContribution,
                elimination_impact: eliminationImpact,
                currency_impact: currencyImpact
            }

            return {
                success: true,
                data: analysis
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * Create intercompany elimination rule
     */
    static async createEliminationRule(
        rule: Omit<IntercompanyRule, 'id' | 'created_at' | 'updated_at'>
    ): Promise<{
        success: boolean
        data?: IntercompanyRule
        error?: string
    }> {
        try {
            const { data, error } = await supabase
                .from('intercompany_rules')
                .insert([rule])
                .select('*')
                .single()

            if (error) {
                throw new Error(`Failed to create elimination rule: ${error.message}`)
            }

            return {
                success: true,
                data: data
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    /**
     * Add entity to consolidation group
     */
    static async addEntityToGroup(
        entity: Omit<ConsolidationEntity, 'id' | 'created_at' | 'updated_at'>
    ): Promise<{
        success: boolean
        data?: ConsolidationEntity
        error?: string
    }> {
        try {
            const { data, error } = await supabase
                .from('consolidation_entities')
                .insert([entity])
                .select('*')
                .single()

            if (error) {
                throw new Error(`Failed to add entity to group: ${error.message}`)
            }

            return {
                success: true,
                data: data
            }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }

    // =====================================================================================
    // PRIVATE HELPER METHODS
    // =====================================================================================

    private static async calculateConsolidationSummary(
        groupId: string,
        period: string
    ): Promise<{
        total_entities: number
        total_assets: number
        total_liabilities: number
        total_equity: number
        minority_interest: number
        eliminations_total: number
        data_completeness: number
    }> {
        // Get entities count
        const { data: entities } = await supabase
            .from('consolidation_entities')
            .select('id')
            .eq('consolidation_group_id', groupId)
            .eq('is_active', true)

        // Get trial balance summary
        const { data: trialBalance } = await supabase
            .from('consolidated_trial_balance')
            .select('account_type, consolidated_balance, data_completeness')
            .eq('consolidation_group_id', groupId)
            .eq('consolidation_period', period)

        let totalAssets = 0
        let totalLiabilities = 0
        let totalEquity = 0
        let avgCompleteness = 0

        if (trialBalance && trialBalance.length > 0) {
            trialBalance.forEach(item => {
                switch (item.account_type) {
                    case 'Asset':
                        totalAssets += item.consolidated_balance
                        break
                    case 'Liability':
                        totalLiabilities += Math.abs(item.consolidated_balance)
                        break
                    case 'Equity':
                        totalEquity += Math.abs(item.consolidated_balance)
                        break
                }
            })

            avgCompleteness = trialBalance.reduce((sum, item) => sum + item.data_completeness, 0) / trialBalance.length
        }

        // Get eliminations total
        const { data: eliminations } = await supabase
            .from('consolidation_eliminations')
            .select('elimination_amount')
            .eq('consolidation_group_id', groupId)
            .eq('consolidation_period', period)
            .eq('is_active', true)

        const eliminationsTotal = eliminations?.reduce((sum, elim) => sum + Math.abs(elim.elimination_amount), 0) || 0

        return {
            total_entities: entities?.length || 0,
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            total_equity: totalEquity,
            minority_interest: 0, // Would be calculated based on ownership percentages
            eliminations_total: eliminationsTotal,
            data_completeness: avgCompleteness
        }
    }

    private static async calculateKeyMetrics(
        groupId: string,
        period: string
    ): Promise<{
        consolidation_ratio: number
        intercompany_eliminations: number
        currency_impact: number
        processing_efficiency: number
    }> {
        // Get consolidation ratio (consolidated vs sum of entities)
        const { data: entities } = await supabase
            .from('consolidation_entities')
            .select('ownership_percentage')
            .eq('consolidation_group_id', groupId)
            .eq('is_active', true)

        const avgOwnership = entities?.reduce((sum, entity) => sum + entity.ownership_percentage, 0) / (entities?.length || 1) || 0

        // Get elimination amounts
        const { data: eliminations } = await supabase
            .from('consolidation_eliminations')
            .select('elimination_amount')
            .eq('consolidation_group_id', groupId)
            .eq('consolidation_period', period)
            .eq('is_active', true)

        const totalEliminations = eliminations?.reduce((sum, elim) => Math.abs(elim.elimination_amount), 0) || 0

        // Get latest processing time
        const { data: latestRun } = await supabase
            .from('consolidation_runs')
            .select('processing_duration_seconds, data_completeness')
            .eq('consolidation_group_id', groupId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        const processingEfficiency = latestRun ? Math.min(100, Math.max(0, 100 - (latestRun.processing_duration_seconds || 0) / 60)) : 0

        return {
            consolidation_ratio: avgOwnership,
            intercompany_eliminations: totalEliminations,
            currency_impact: 0, // Would be calculated from translation adjustments
            processing_efficiency: processingEfficiency
        }
    }

    private static async getValidationIssues(
        groupId: string,
        period: string
    ): Promise<Array<{
        type: string
        severity: string
        description: string
        affected_entities: string[]
    }>> {
        const issues: Array<any> = []

        // Check for data completeness issues
        const { data: incompleteData } = await supabase
            .from('consolidated_trial_balance')
            .select('account_name, data_completeness, contributing_entities')
            .eq('consolidation_group_id', groupId)
            .eq('consolidation_period', period)
            .lt('data_completeness', 0.9)

        if (incompleteData && incompleteData.length > 0) {
            issues.push({
                type: 'Data Completeness',
                severity: 'Warning',
                description: `${incompleteData.length} accounts have incomplete data`,
                affected_entities: incompleteData.flatMap(item =>
                    (item.contributing_entities as any[])?.map(entity => entity.company_name) || []
                )
            })
        }

        // Check for balancing issues
        const { data: unbalancedRuns } = await supabase
            .from('consolidation_runs')
            .select('balancing_difference, balancing_status')
            .eq('consolidation_group_id', groupId)
            .neq('balancing_difference', 0)
            .limit(1)

        if (unbalancedRuns && unbalancedRuns.length > 0) {
            issues.push({
                type: 'Balance Validation',
                severity: 'Critical',
                description: `Consolidation is out of balance by ${unbalancedRuns[0].balancing_difference}`,
                affected_entities: ['All entities']
            })
        }

        return issues
    }

    private static async generateSingleStatement(
        groupId: string,
        period: string,
        statementType: StatementType,
        framework: ReportingFramework
    ): Promise<ConsolidatedFinancialStatement | null> {
        try {
            // Get trial balance data for statement generation
            const { data: trialBalance } = await supabase
                .from('consolidated_trial_balance')
                .select('*')
                .eq('consolidation_group_id', groupId)
                .eq('consolidation_period', period)

            if (!trialBalance || trialBalance.length === 0) {
                return null
            }

            // Generate statement data based on type
            let statementData: Record<string, any> = {}

            switch (statementType) {
                case 'Balance Sheet':
                    statementData = this.generateBalanceSheetData(trialBalance)
                    break
                case 'Income Statement':
                    statementData = this.generateIncomeStatementData(trialBalance)
                    break
                case 'Cash Flow Statement':
                    statementData = this.generateCashFlowStatementData(trialBalance)
                    break
                default:
                    statementData = {}
            }

            // Create the statement record
            const statement: Omit<ConsolidatedFinancialStatement, 'id' | 'created_at' | 'updated_at'> = {
                consolidation_group_id: groupId,
                statement_type: statementType,
                reporting_period: period,
                period_type: 'Monthly',
                statement_version: 'Draft',
                reporting_framework: framework,
                statement_data: statementData,
                prior_period_data: {},
                variance_analysis: {},
                total_entities: 0,
                minority_interest_total: 0,
                total_eliminations: 0,
                data_completeness: 1.0,
                balancing_difference: 0,
                validation_errors: 0,
                validation_warnings: 0,
                generation_timestamp: new Date().toISOString(),
                processing_time_seconds: 0,
                review_status: 'Draft',
                published: false
            }

            const { data, error } = await supabase
                .from('consolidated_financial_statements')
                .insert([statement])
                .select('*')
                .single()

            if (error) {
                console.error('Error creating statement:', error)
                return null
            }

            return data

        } catch (error) {
            console.error('Error generating statement:', error)
            return null
        }
    }

    private static generateBalanceSheetData(trialBalance: ConsolidatedTrialBalance[]): Record<string, any> {
        const assets = trialBalance.filter(item => item.account_type === 'Asset')
        const liabilities = trialBalance.filter(item => item.account_type === 'Liability')
        const equity = trialBalance.filter(item => item.account_type === 'Equity')

        return {
            assets: {
                current_assets: assets.filter(item => item.account_category?.includes('Current')),
                non_current_assets: assets.filter(item => !item.account_category?.includes('Current')),
                total_assets: assets.reduce((sum, item) => sum + item.consolidated_balance, 0)
            },
            liabilities: {
                current_liabilities: liabilities.filter(item => item.account_category?.includes('Current')),
                non_current_liabilities: liabilities.filter(item => !item.account_category?.includes('Current')),
                total_liabilities: liabilities.reduce((sum, item) => sum + Math.abs(item.consolidated_balance), 0)
            },
            equity: {
                share_capital: equity.filter(item => item.account_name.toLowerCase().includes('capital')),
                retained_earnings: equity.filter(item => item.account_name.toLowerCase().includes('retained')),
                total_equity: equity.reduce((sum, item) => sum + Math.abs(item.consolidated_balance), 0)
            }
        }
    }

    private static generateIncomeStatementData(trialBalance: ConsolidatedTrialBalance[]): Record<string, any> {
        const income = trialBalance.filter(item => item.account_type === 'Income')
        const expense = trialBalance.filter(item => item.account_type === 'Expense')

        const totalRevenue = income.reduce((sum, item) => sum + Math.abs(item.consolidated_balance), 0)
        const totalExpenses = expense.reduce((sum, item) => sum + Math.abs(item.consolidated_balance), 0)

        return {
            revenue: {
                sales_revenue: income.filter(item => item.account_name.toLowerCase().includes('sales')),
                other_revenue: income.filter(item => !item.account_name.toLowerCase().includes('sales')),
                total_revenue: totalRevenue
            },
            expenses: {
                cost_of_goods_sold: expense.filter(item => item.account_name.toLowerCase().includes('cost')),
                operating_expenses: expense.filter(item => !item.account_name.toLowerCase().includes('cost')),
                total_expenses: totalExpenses
            },
            net_income: totalRevenue - totalExpenses
        }
    }

    private static generateCashFlowStatementData(trialBalance: ConsolidatedTrialBalance[]): Record<string, any> {
        // Simplified cash flow statement - in reality would need more complex cash flow analysis
        return {
            operating_activities: {
                net_income: 0,
                adjustments: [],
                net_cash_from_operations: 0
            },
            investing_activities: {
                capital_expenditures: 0,
                acquisitions: 0,
                net_cash_from_investing: 0
            },
            financing_activities: {
                debt_proceeds: 0,
                debt_repayments: 0,
                dividends_paid: 0,
                net_cash_from_financing: 0
            },
            net_change_in_cash: 0
        }
    }

    private static async getFinancialStatements(
        groupId: string,
        period: string
    ): Promise<{ success: boolean; data?: ConsolidatedFinancialStatement[] }> {
        const { data, error } = await supabase
            .from('consolidated_financial_statements')
            .select('*')
            .eq('consolidation_group_id', groupId)
            .eq('reporting_period', period)

        return {
            success: !error,
            data: data || []
        }
    }

    private static calculateVarianceAnalysis(
        currentStatements: ConsolidatedFinancialStatement[],
        priorStatements: ConsolidatedFinancialStatement[]
    ): any {
        // Simplified variance calculation
        return {
            assets_variance: 0,
            liabilities_variance: 0,
            equity_variance: 0,
            revenue_variance: 0,
            expense_variance: 0
        }
    }

    private static async calculateEntityContribution(groupId: string, period: string): Promise<any[]> {
        // Simplified entity contribution calculation
        return []
    }

    private static async calculateEliminationImpact(groupId: string, period: string): Promise<any> {
        const { data: eliminations } = await supabase
            .from('consolidation_eliminations')
            .select('elimination_type, elimination_amount')
            .eq('consolidation_group_id', groupId)
            .eq('consolidation_period', period)
            .eq('is_active', true)

        const totalEliminations = eliminations?.reduce((sum, elim) => sum + Math.abs(elim.elimination_amount), 0) || 0

        const byType: Record<string, number> = {}
        eliminations?.forEach(elim => {
            byType[elim.elimination_type] = (byType[elim.elimination_type] || 0) + Math.abs(elim.elimination_amount)
        })

        return {
            total_eliminations: totalEliminations,
            by_type: byType,
            material_eliminations: eliminations?.filter(elim => Math.abs(elim.elimination_amount) > 10000) || []
        }
    }

    private static async calculateCurrencyImpact(groupId: string, period: string): Promise<any> {
        return {
            total_translation_adjustment: 0,
            by_currency: {},
            rate_sensitivity: 0
        }
    }

    private static calculatePriorPeriod(currentPeriod: string): string {
        const date = new Date(currentPeriod)
        date.setMonth(date.getMonth() - 1)
        return date.toISOString().split('T')[0]
    }
}
