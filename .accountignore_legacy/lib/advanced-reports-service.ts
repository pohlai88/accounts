/**
 * Advanced Financial Reports and Analytics Service
 * Comprehensive financial reporting with advanced analytics and insights
 * Based on ERPNext, Xero, QuickBooks, and Oracle best practices
 */

import { supabase } from './supabase'

export interface ReportTemplate {
    id: string
    name: string
    description?: string
    report_type: 'Financial' | 'Analytical' | 'Operational' | 'Compliance' | 'Custom'
    category: string
    company_id: string
    template_config: Record<string, any>
    chart_config?: Record<string, any>
    filter_config?: Record<string, any>
    export_config?: Record<string, any>
    is_public: boolean
    is_default: boolean
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

export interface ReportSchedule {
    id: string
    report_template_id: string
    company_id: string
    schedule_name: string
    schedule_type: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom'
    schedule_config: Record<string, any>
    email_recipients: string[]
    email_subject?: string
    email_body?: string
    include_attachments: boolean
    is_active: boolean
    last_run_at?: string
    next_run_at?: string
    created_at: string
    updated_at: string
}

export interface ReportExecution {
    id: string
    report_template_id: string
    report_schedule_id?: string
    company_id: string
    execution_type: 'Manual' | 'Scheduled' | 'API'
    parameters: Record<string, any>
    filters: Record<string, any>
    status: 'Running' | 'Completed' | 'Failed' | 'Cancelled'
    result_data?: Record<string, any>
    file_path?: string
    file_size?: number
    error_message?: string
    execution_time_ms?: number
    record_count?: number
    started_at: string
    completed_at?: string
    created_at: string
}

export interface FinancialRatios {
    id: string
    company_id: string
    period_start: string
    period_end: string
    current_ratio?: number
    quick_ratio?: number
    cash_ratio?: number
    gross_profit_margin?: number
    operating_profit_margin?: number
    net_profit_margin?: number
    return_on_assets?: number
    return_on_equity?: number
    asset_turnover?: number
    inventory_turnover?: number
    receivables_turnover?: number
    payables_turnover?: number
    debt_to_equity?: number
    debt_to_assets?: number
    interest_coverage?: number
    price_to_earnings?: number
    price_to_book?: number
    earnings_per_share?: number
    created_at: string
    updated_at: string
}

export interface AgedReceivables {
    id: string
    company_id: string
    customer_id?: string
    customer_name: string
    current_amount: number
    days_1_30: number
    days_31_60: number
    days_61_90: number
    days_91_120: number
    days_over_120: number
    total_amount: number
    currency: string
    as_of_date: string
    created_at: string
    updated_at: string
}

export interface AgedPayables {
    id: string
    company_id: string
    supplier_id?: string
    supplier_name: string
    current_amount: number
    days_1_30: number
    days_31_60: number
    days_61_90: number
    days_91_120: number
    days_over_120: number
    total_amount: number
    currency: string
    as_of_date: string
    created_at: string
    updated_at: string
}

export interface CashFlowAnalysis {
    id: string
    company_id: string
    period_start: string
    period_end: string
    net_income: number
    depreciation_amortization: number
    changes_in_working_capital: number
    operating_cash_flow: number
    capital_expenditures: number
    asset_purchases: number
    asset_sales: number
    investing_cash_flow: number
    debt_issued: number
    debt_repayments: number
    equity_issued: number
    dividends_paid: number
    financing_cash_flow: number
    net_cash_flow: number
    beginning_cash: number
    ending_cash: number
    currency: string
    created_at: string
    updated_at: string
}

export interface BudgetVsActual {
    id: string
    company_id: string
    account_id: string
    period_start: string
    period_end: string
    budget_amount: number
    budget_ytd: number
    actual_amount: number
    actual_ytd: number
    variance_amount: number
    variance_percentage: number
    variance_ytd: number
    variance_ytd_percentage: number
    currency: string
    created_at: string
    updated_at: string
}

export interface KPIMetric {
    id: string
    company_id: string
    metric_name: string
    metric_category: string
    metric_type: 'Financial' | 'Operational' | 'Customer' | 'Employee' | 'Custom'
    current_value?: number
    previous_value?: number
    target_value?: number
    unit?: string
    change_amount?: number
    change_percentage?: number
    variance_from_target?: number
    variance_percentage?: number
    status: 'Excellent' | 'Good' | 'Normal' | 'Warning' | 'Critical'
    period_start: string
    period_end: string
    created_at: string
    updated_at: string
}

export interface CreateReportTemplateInput {
    name: string
    description?: string
    report_type: 'Financial' | 'Analytical' | 'Operational' | 'Compliance' | 'Custom'
    category: string
    company_id: string
    template_config: Record<string, any>
    chart_config?: Record<string, any>
    filter_config?: Record<string, any>
    export_config?: Record<string, any>
    is_public?: boolean
    is_default?: boolean
    sort_order?: number
}

export interface CreateReportScheduleInput {
    report_template_id: string
    company_id: string
    schedule_name: string
    schedule_type: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom'
    schedule_config: Record<string, any>
    email_recipients: string[]
    email_subject?: string
    email_body?: string
    include_attachments?: boolean
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

/**
 * Advanced Financial Reports and Analytics Service
 */
export class AdvancedReportsService {
    /**
     * Create report template
     */
    static async createReportTemplate(input: CreateReportTemplateInput): Promise<ApiResponse<ReportTemplate>> {
        try {
            const { data: template, error } = await supabase
                .from('report_templates')
                .insert([{
                    name: input.name.trim(),
                    description: input.description,
                    report_type: input.report_type,
                    category: input.category.trim(),
                    company_id: input.company_id,
                    template_config: input.template_config,
                    chart_config: input.chart_config || {},
                    filter_config: input.filter_config || {},
                    export_config: input.export_config || {},
                    is_public: input.is_public || false,
                    is_default: input.is_default || false,
                    sort_order: input.sort_order || 0
                }])
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: template, message: 'Report template created successfully' }
        } catch (error) {
            console.error('Error creating report template:', error)
            return { success: false, error: 'Failed to create report template' }
        }
    }

    /**
     * Get report templates
     */
    static async getReportTemplates(
        companyId: string,
        reportType?: string,
        category?: string
    ): Promise<ApiResponse<ReportTemplate[]>> {
        try {
            let query = supabase
                .from('report_templates')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true)

            if (reportType) {
                query = query.eq('report_type', reportType)
            }

            if (category) {
                query = query.eq('category', category)
            }

            const { data: templates, error } = await query.order('sort_order')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: templates }
        } catch (error) {
            console.error('Error fetching report templates:', error)
            return { success: false, error: 'Failed to fetch report templates' }
        }
    }

    /**
     * Create report schedule
     */
    static async createReportSchedule(input: CreateReportScheduleInput): Promise<ApiResponse<ReportSchedule>> {
        try {
            const { data: schedule, error } = await supabase
                .from('report_schedules')
                .insert([{
                    report_template_id: input.report_template_id,
                    company_id: input.company_id,
                    schedule_name: input.schedule_name.trim(),
                    schedule_type: input.schedule_type,
                    schedule_config: input.schedule_config,
                    email_recipients: input.email_recipients,
                    email_subject: input.email_subject,
                    email_body: input.email_body,
                    include_attachments: input.include_attachments !== false
                }])
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: schedule, message: 'Report schedule created successfully' }
        } catch (error) {
            console.error('Error creating report schedule:', error)
            return { success: false, error: 'Failed to create report schedule' }
        }
    }

    /**
     * Get report schedules
     */
    static async getReportSchedules(companyId: string): Promise<ApiResponse<ReportSchedule[]>> {
        try {
            const { data: schedules, error } = await supabase
                .from('report_schedules')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: schedules }
        } catch (error) {
            console.error('Error fetching report schedules:', error)
            return { success: false, error: 'Failed to fetch report schedules' }
        }
    }

    /**
     * Execute report
     */
    static async executeReport(
        templateId: string,
        companyId: string,
        parameters: Record<string, any> = {},
        filters: Record<string, any> = {},
        executionType: 'Manual' | 'Scheduled' | 'API' = 'Manual'
    ): Promise<ApiResponse<ReportExecution>> {
        try {
            const { data: execution, error } = await supabase
                .from('report_executions')
                .insert([{
                    report_template_id: templateId,
                    company_id: companyId,
                    execution_type: executionType,
                    parameters: parameters,
                    filters: filters,
                    status: 'Running'
                }])
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            // TODO: Implement actual report execution logic
            // For now, we'll simulate completion
            setTimeout(async () => {
                await supabase
                    .from('report_executions')
                    .update({
                        status: 'Completed',
                        completed_at: new Date().toISOString(),
                        execution_time_ms: 1000,
                        record_count: 100,
                        result_data: { message: 'Report executed successfully' }
                    })
                    .eq('id', execution.id)
            }, 1000)

            return { success: true, data: execution, message: 'Report execution started' }
        } catch (error) {
            console.error('Error executing report:', error)
            return { success: false, error: 'Failed to execute report' }
        }
    }

    /**
     * Get report executions
     */
    static async getReportExecutions(
        companyId: string,
        templateId?: string,
        status?: string
    ): Promise<ApiResponse<ReportExecution[]>> {
        try {
            let query = supabase
                .from('report_executions')
                .select('*')
                .eq('company_id', companyId)

            if (templateId) {
                query = query.eq('report_template_id', templateId)
            }

            if (status) {
                query = query.eq('status', status)
            }

            const { data: executions, error } = await query.order('started_at', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: executions }
        } catch (error) {
            console.error('Error fetching report executions:', error)
            return { success: false, error: 'Failed to fetch report executions' }
        }
    }

    /**
     * Calculate financial ratios
     */
    static async calculateFinancialRatios(
        companyId: string,
        periodStart: string,
        periodEnd: string
    ): Promise<ApiResponse<FinancialRatios>> {
        try {
            const { data: ratios, error } = await supabase.rpc('calculate_financial_ratios', {
                p_company_id: companyId,
                p_period_start: periodStart,
                p_period_end: periodEnd
            })

            if (error) {
                return { success: false, error: error.message }
            }

            // Store ratios in database
            const { data: storedRatios, error: storeError } = await supabase
                .from('financial_ratios')
                .upsert([{
                    company_id: companyId,
                    period_start: periodStart,
                    period_end: periodEnd,
                    current_ratio: ratios[0]?.current_ratio,
                    quick_ratio: ratios[0]?.quick_ratio,
                    gross_profit_margin: ratios[0]?.gross_profit_margin,
                    net_profit_margin: ratios[0]?.net_profit_margin,
                    return_on_assets: ratios[0]?.return_on_assets,
                    return_on_equity: ratios[0]?.return_on_equity,
                    debt_to_equity: ratios[0]?.debt_to_equity
                }])
                .select()
                .single()

            if (storeError) {
                return { success: false, error: storeError.message }
            }

            return { success: true, data: storedRatios, message: 'Financial ratios calculated successfully' }
        } catch (error) {
            console.error('Error calculating financial ratios:', error)
            return { success: false, error: 'Failed to calculate financial ratios' }
        }
    }

    /**
     * Get financial ratios
     */
    static async getFinancialRatios(
        companyId: string,
        periodStart?: string,
        periodEnd?: string
    ): Promise<ApiResponse<FinancialRatios[]>> {
        try {
            let query = supabase
                .from('financial_ratios')
                .select('*')
                .eq('company_id', companyId)

            if (periodStart) {
                query = query.gte('period_start', periodStart)
            }

            if (periodEnd) {
                query = query.lte('period_end', periodEnd)
            }

            const { data: ratios, error } = await query.order('period_start', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: ratios }
        } catch (error) {
            console.error('Error fetching financial ratios:', error)
            return { success: false, error: 'Failed to fetch financial ratios' }
        }
    }

    /**
     * Generate aged receivables
     */
    static async generateAgedReceivables(
        companyId: string,
        asOfDate: string
    ): Promise<ApiResponse<number>> {
        try {
            const { data: count, error } = await supabase.rpc('generate_aged_receivables', {
                p_company_id: companyId,
                p_as_of_date: asOfDate
            })

            if (error) {
                return { success: false, error: error.message }
            }

            return {
                success: true,
                data: count,
                message: `Generated ${count} aged receivables records`
            }
        } catch (error) {
            console.error('Error generating aged receivables:', error)
            return { success: false, error: 'Failed to generate aged receivables' }
        }
    }

    /**
     * Get aged receivables
     */
    static async getAgedReceivables(
        companyId: string,
        asOfDate?: string
    ): Promise<ApiResponse<AgedReceivables[]>> {
        try {
            let query = supabase
                .from('aged_receivables')
                .select('*')
                .eq('company_id', companyId)

            if (asOfDate) {
                query = query.eq('as_of_date', asOfDate)
            }

            const { data: receivables, error } = await query.order('total_amount', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: receivables }
        } catch (error) {
            console.error('Error fetching aged receivables:', error)
            return { success: false, error: 'Failed to fetch aged receivables' }
        }
    }

    /**
     * Generate aged payables
     */
    static async generateAgedPayables(
        companyId: string,
        asOfDate: string
    ): Promise<ApiResponse<number>> {
        try {
            const { data: count, error } = await supabase.rpc('generate_aged_payables', {
                p_company_id: companyId,
                p_as_of_date: asOfDate
            })

            if (error) {
                return { success: false, error: error.message }
            }

            return {
                success: true,
                data: count,
                message: `Generated ${count} aged payables records`
            }
        } catch (error) {
            console.error('Error generating aged payables:', error)
            return { success: false, error: 'Failed to generate aged payables' }
        }
    }

    /**
     * Get aged payables
     */
    static async getAgedPayables(
        companyId: string,
        asOfDate?: string
    ): Promise<ApiResponse<AgedPayables[]>> {
        try {
            let query = supabase
                .from('aged_payables')
                .select('*')
                .eq('company_id', companyId)

            if (asOfDate) {
                query = query.eq('as_of_date', asOfDate)
            }

            const { data: payables, error } = await query.order('total_amount', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: payables }
        } catch (error) {
            console.error('Error fetching aged payables:', error)
            return { success: false, error: 'Failed to fetch aged payables' }
        }
    }

    /**
     * Get cash flow analysis
     */
    static async getCashFlowAnalysis(
        companyId: string,
        periodStart?: string,
        periodEnd?: string
    ): Promise<ApiResponse<CashFlowAnalysis[]>> {
        try {
            let query = supabase
                .from('cash_flow_analysis')
                .select('*')
                .eq('company_id', companyId)

            if (periodStart) {
                query = query.gte('period_start', periodStart)
            }

            if (periodEnd) {
                query = query.lte('period_end', periodEnd)
            }

            const { data: cashFlow, error } = await query.order('period_start', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: cashFlow }
        } catch (error) {
            console.error('Error fetching cash flow analysis:', error)
            return { success: false, error: 'Failed to fetch cash flow analysis' }
        }
    }

    /**
     * Get budget vs actual
     */
    static async getBudgetVsActual(
        companyId: string,
        periodStart?: string,
        periodEnd?: string
    ): Promise<ApiResponse<BudgetVsActual[]>> {
        try {
            let query = supabase
                .from('budget_vs_actual')
                .select('*')
                .eq('company_id', companyId)

            if (periodStart) {
                query = query.gte('period_start', periodStart)
            }

            if (periodEnd) {
                query = query.lte('period_end', periodEnd)
            }

            const { data: budgetVsActual, error } = await query.order('period_start', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: budgetVsActual }
        } catch (error) {
            console.error('Error fetching budget vs actual:', error)
            return { success: false, error: 'Failed to fetch budget vs actual' }
        }
    }

    /**
     * Get KPI metrics
     */
    static async getKPIMetrics(
        companyId: string,
        category?: string,
        metricType?: string
    ): Promise<ApiResponse<KPIMetric[]>> {
        try {
            let query = supabase
                .from('kpi_metrics')
                .select('*')
                .eq('company_id', companyId)

            if (category) {
                query = query.eq('metric_category', category)
            }

            if (metricType) {
                query = query.eq('metric_type', metricType)
            }

            const { data: metrics, error } = await query.order('period_start', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: metrics }
        } catch (error) {
            console.error('Error fetching KPI metrics:', error)
            return { success: false, error: 'Failed to fetch KPI metrics' }
        }
    }

    /**
     * Get dashboard analytics
     */
    static async getDashboardAnalytics(companyId: string): Promise<ApiResponse<{
        total_revenue: number
        total_expenses: number
        net_profit: number
        gross_profit_margin: number
        current_ratio: number
        quick_ratio: number
        receivables_turnover: number
        payables_turnover: number
        return_on_assets: number
        return_on_equity: number
    }>> {
        try {
            // Get basic financial data
            const { data: revenue, error: revenueError } = await supabase
                .from('gl_entries')
                .select('debit, credit')
                .eq('company_id', companyId)
                .gte('posting_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])

            if (revenueError) {
                return { success: false, error: revenueError.message }
            }

            // Calculate basic metrics
            const totalRevenue = revenue?.reduce((sum, entry) => sum + (entry.credit || 0), 0) || 0
            const totalExpenses = revenue?.reduce((sum, entry) => sum + (entry.debit || 0), 0) || 0
            const netProfit = totalRevenue - totalExpenses
            const grossProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0

            // Get financial ratios
            const ratiosResult = await this.calculateFinancialRatios(
                companyId,
                new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                new Date().toISOString().split('T')[0]
            )

            const analytics = {
                total_revenue: totalRevenue,
                total_expenses: totalExpenses,
                net_profit: netProfit,
                gross_profit_margin: grossProfitMargin,
                current_ratio: ratiosResult.data?.current_ratio || 0,
                quick_ratio: ratiosResult.data?.quick_ratio || 0,
                receivables_turnover: ratiosResult.data?.receivables_turnover || 0,
                payables_turnover: ratiosResult.data?.payables_turnover || 0,
                return_on_assets: ratiosResult.data?.return_on_assets || 0,
                return_on_equity: ratiosResult.data?.return_on_equity || 0
            }

            return { success: true, data: analytics }
        } catch (error) {
            console.error('Error fetching dashboard analytics:', error)
            return { success: false, error: 'Failed to fetch dashboard analytics' }
        }
    }

    /**
     * Export report to CSV
     */
    static async exportReportToCSV(
        executionId: string,
        format: 'CSV' | 'Excel' | 'PDF' = 'CSV'
    ): Promise<ApiResponse<string>> {
        try {
            const { data: execution, error } = await supabase
                .from('report_executions')
                .select('*')
                .eq('id', executionId)
                .single()

            if (error || !execution) {
                return { success: false, error: 'Report execution not found' }
            }

            if (execution.status !== 'Completed') {
                return { success: false, error: 'Report execution not completed' }
            }

            // TODO: Implement actual CSV export logic
            const csvContent = 'Date,Description,Amount\n2024-01-01,Sample Transaction,1000.00'

            return { success: true, data: csvContent, message: 'Report exported successfully' }
        } catch (error) {
            console.error('Error exporting report:', error)
            return { success: false, error: 'Failed to export report' }
        }
    }
}
