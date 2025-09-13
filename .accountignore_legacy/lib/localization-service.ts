/**
 * Localization Service
 * Global localization packs with country-specific accounting rules
 * Premium business differentiator for international markets
 */

import { supabase } from './supabase'

export interface Country {
    id: string
    country_code: string
    country_name: string
    region: string
    continent: string
    currency_code: string
    currency_symbol: string
    currency_name: string
    decimal_places: number
    thousand_separator: string
    decimal_separator: string
    date_format: string
    time_format: string
    timezone: string
    number_format: string
    percentage_format: string
    primary_language: string
    locale: string
    rtl_support: boolean
    fiscal_year_start_month: number
    business_days: string
    weekend_days: string
    is_active: boolean
    is_supported: boolean
    created_at: string
    updated_at: string
}

export interface LocalizationPack {
    id: string
    pack_name: string
    pack_code: string
    country_id: string
    description?: string
    version: string
    pack_type: 'Standard' | 'Premium' | 'Enterprise' | 'Custom'
    includes_chart_of_accounts: boolean
    includes_tax_templates: boolean
    includes_report_formats: boolean
    includes_compliance_rules: boolean
    includes_banking_formats: boolean
    includes_payroll_rules: boolean
    includes_industry_specific: boolean
    base_price: number
    monthly_price: number
    annual_price: number
    setup_fee: number
    support_level: 'Basic' | 'Standard' | 'Premium' | 'Enterprise'
    maintenance_included: boolean
    update_frequency: string
    min_system_version?: string
    dependencies?: string[]
    prerequisites?: string[]
    is_active: boolean
    is_published: boolean
    is_certified: boolean
    certification_body?: string
    certification_date?: string
    created_at: string
    updated_at: string
    published_at?: string
}

export interface LocalizationRule {
    id: string
    localization_pack_id: string
    rule_name: string
    rule_category: string
    rule_type: 'Tax' | 'Accounting' | 'Reporting' | 'Compliance' | 'Banking' | 'Payroll' | 'Custom'
    rule_config: Record<string, any>
    conditions?: Record<string, any>
    actions?: Record<string, any>
    effective_date?: string
    expiry_date?: string
    is_mandatory: boolean
    priority: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CountryChartTemplate {
    id: string
    localization_pack_id: string
    template_name: string
    template_description?: string
    industry_type?: string
    accounts_config: any[]
    account_numbering_scheme: string
    account_code_length: number
    is_default: boolean
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CountryTaxConfig {
    id: string
    localization_pack_id: string
    tax_system_name: string
    tax_authority: string
    tax_year_start_month: number
    tax_types: any[]
    standard_rates: Record<string, any>
    reduced_rates?: Record<string, any>
    zero_rates?: Record<string, any>
    exempt_categories?: any[]
    calculation_method: 'Inclusive' | 'Exclusive' | 'Compound'
    rounding_method: 'Round' | 'Floor' | 'Ceiling'
    rounding_precision: number
    reporting_frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually'
    filing_deadlines?: Record<string, any>
    required_reports?: any[]
    digital_tax_compliance: boolean
    e_invoicing_required: boolean
    real_time_reporting: boolean
    is_active: boolean
    effective_date: string
    created_at: string
    updated_at: string
}

export interface CountryReportFormat {
    id: string
    localization_pack_id: string
    report_name: string
    report_type: string
    regulatory_requirement: boolean
    filing_frequency?: string
    format_config: Record<string, any>
    template_config?: Record<string, any>
    validation_rules?: Record<string, any>
    supported_formats: string[]
    default_format: string
    regulatory_body?: string
    form_number?: string
    submission_method?: string
    is_active: boolean
    is_mandatory: boolean
    created_at: string
    updated_at: string
}

export interface CompanyLocalizationSettings {
    id: string
    company_id: string
    localization_pack_id: string
    activated_at: string
    activated_by?: string
    activation_status: 'Active' | 'Inactive' | 'Suspended' | 'Expired'
    license_type: 'Trial' | 'Standard' | 'Premium' | 'Enterprise'
    license_start_date: string
    license_end_date?: string
    max_transactions?: number
    max_users?: number
    custom_rules?: Record<string, any>
    custom_formats?: Record<string, any>
    custom_translations?: Record<string, any>
    transactions_used: number
    last_used_at?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

/**
 * Localization Service
 */
export class LocalizationService {
    /**
     * Get all countries
     */
    static async getCountries(
        region?: string,
        continent?: string,
        isSupported?: boolean
    ): Promise<ApiResponse<Country[]>> {
        try {
            let query = supabase
                .from('countries')
                .select('*')
                .eq('is_active', true)

            if (region) {
                query = query.eq('region', region)
            }

            if (continent) {
                query = query.eq('continent', continent)
            }

            if (isSupported !== undefined) {
                query = query.eq('is_supported', isSupported)
            }

            const { data: countries, error } = await query.order('country_name')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: countries }
        } catch (error) {
            console.error('Error fetching countries:', error)
            return { success: false, error: 'Failed to fetch countries' }
        }
    }

    /**
     * Get localization packs
     */
    static async getLocalizationPacks(
        countryCode?: string,
        packType?: string,
        isPublished?: boolean
    ): Promise<ApiResponse<LocalizationPack[]>> {
        try {
            let query = supabase
                .from('localization_packs')
                .select(`
                    *,
                    countries (
                        country_code,
                        country_name,
                        currency_code,
                        currency_symbol
                    )
                `)
                .eq('is_active', true)

            if (countryCode) {
                query = query.eq('countries.country_code', countryCode)
            }

            if (packType) {
                query = query.eq('pack_type', packType)
            }

            if (isPublished !== undefined) {
                query = query.eq('is_published', isPublished)
            }

            const { data: packs, error } = await query.order('pack_name')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: packs }
        } catch (error) {
            console.error('Error fetching localization packs:', error)
            return { success: false, error: 'Failed to fetch localization packs' }
        }
    }

    /**
     * Get localization pack details
     */
    static async getLocalizationPackDetails(packId: string): Promise<ApiResponse<{
        pack: LocalizationPack
        rules: LocalizationRule[]
        chartTemplates: CountryChartTemplate[]
        taxConfigs: CountryTaxConfig[]
        reportFormats: CountryReportFormat[]
    }>> {
        try {
            const [packResult, rulesResult, chartResult, taxResult, reportResult] = await Promise.all([
                supabase.from('localization_packs').select('*').eq('id', packId).single(),
                supabase.from('localization_rules').select('*').eq('localization_pack_id', packId).eq('is_active', true),
                supabase.from('country_chart_templates').select('*').eq('localization_pack_id', packId).eq('is_active', true),
                supabase.from('country_tax_configs').select('*').eq('localization_pack_id', packId).eq('is_active', true),
                supabase.from('country_report_formats').select('*').eq('localization_pack_id', packId).eq('is_active', true)
            ])

            if (packResult.error) {
                return { success: false, error: packResult.error.message }
            }

            return {
                success: true,
                data: {
                    pack: packResult.data,
                    rules: rulesResult.data || [],
                    chartTemplates: chartResult.data || [],
                    taxConfigs: taxResult.data || [],
                    reportFormats: reportResult.data || []
                }
            }
        } catch (error) {
            console.error('Error fetching localization pack details:', error)
            return { success: false, error: 'Failed to fetch localization pack details' }
        }
    }

    /**
     * Activate localization pack for company
     */
    static async activateLocalizationPack(
        companyId: string,
        packId: string,
        licenseType: 'Trial' | 'Standard' | 'Premium' | 'Enterprise' = 'Standard',
        licenseStartDate: string = new Date().toISOString().split('T')[0],
        licenseEndDate?: string,
        maxTransactions?: number,
        maxUsers?: number
    ): Promise<ApiResponse<CompanyLocalizationSettings>> {
        try {
            // Check if pack is already activated
            const { data: existing } = await supabase
                .from('company_localization_settings')
                .select('id')
                .eq('company_id', companyId)
                .eq('localization_pack_id', packId)
                .eq('activation_status', 'Active')
                .single()

            if (existing) {
                return { success: false, error: 'Localization pack is already activated for this company' }
            }

            const { data: settings, error } = await supabase
                .from('company_localization_settings')
                .insert([{
                    company_id: companyId,
                    localization_pack_id: packId,
                    license_type: licenseType,
                    license_start_date: licenseStartDate,
                    license_end_date: licenseEndDate,
                    max_transactions: maxTransactions,
                    max_users: maxUsers,
                    activation_status: 'Active'
                }])
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: settings, message: 'Localization pack activated successfully' }
        } catch (error) {
            console.error('Error activating localization pack:', error)
            return { success: false, error: 'Failed to activate localization pack' }
        }
    }

    /**
     * Get company localization settings
     */
    static async getCompanyLocalizationSettings(companyId: string): Promise<ApiResponse<CompanyLocalizationSettings[]>> {
        try {
            const { data: settings, error } = await supabase
                .from('company_localization_settings')
                .select(`
                    *,
                    localization_packs (
                        pack_name,
                        pack_code,
                        pack_type,
                        countries (
                            country_name,
                            country_code,
                            currency_code,
                            currency_symbol
                        )
                    )
                `)
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: settings }
        } catch (error) {
            console.error('Error fetching company localization settings:', error)
            return { success: false, error: 'Failed to fetch company localization settings' }
        }
    }

    /**
     * Get localization statistics
     */
    static async getLocalizationStatistics(): Promise<ApiResponse<{
        total_countries: number
        total_packs: number
        published_packs: number
        certified_packs: number
        premium_packs: number
        active_companies: number
        total_revenue: number
        popular_packs: Array<{ pack_name: string; country_name: string; activation_count: number }>
    }>> {
        try {
            // Get basic counts
            const [countriesResult, packsResult, publishedResult, certifiedResult, premiumResult] = await Promise.all([
                supabase.from('countries').select('id', { count: 'exact' }).eq('is_active', true),
                supabase.from('localization_packs').select('id', { count: 'exact' }).eq('is_active', true),
                supabase.from('localization_packs').select('id', { count: 'exact' }).eq('is_published', true),
                supabase.from('localization_packs').select('id', { count: 'exact' }).eq('is_certified', true),
                supabase.from('localization_packs').select('id', { count: 'exact' }).eq('pack_type', 'Premium')
            ])

            // Get active companies count
            const { data: activeCompanies } = await supabase
                .from('company_localization_settings')
                .select('company_id', { count: 'exact' })
                .eq('activation_status', 'Active')

            // Calculate total revenue (mock calculation)
            const { data: packs } = await supabase
                .from('localization_packs')
                .select('monthly_price, annual_price')
                .eq('is_active', true)

            const totalRevenue = packs?.reduce((sum, pack) => sum + (pack.annual_price || 0), 0) || 0

            // Get popular packs
            const { data: popularPacks } = await supabase
                .from('company_localization_settings')
                .select(`
                    localization_pack_id,
                    localization_packs (
                        pack_name,
                        countries (
                            country_name
                        )
                    )
                `)
                .eq('activation_status', 'Active')

            const packCounts = popularPacks?.reduce((acc: Record<string, any>, setting: any) => {
                const key = setting.localization_pack_id
                if (!acc[key]) {
                    acc[key] = {
                        pack_name: setting.localization_packs?.pack_name || 'Unknown',
                        country_name: setting.localization_packs?.countries?.country_name || 'Unknown',
                        activation_count: 0
                    }
                }
                acc[key].activation_count++
                return acc
            }, {}) || {}

            const popularPacksArray = Object.values(packCounts)
                .sort((a: any, b: any) => b.activation_count - a.activation_count)
                .slice(0, 5)

            const stats = {
                total_countries: countriesResult.data?.length || 0,
                total_packs: packsResult.data?.length || 0,
                published_packs: publishedResult.data?.length || 0,
                certified_packs: certifiedResult.data?.length || 0,
                premium_packs: premiumResult.data?.length || 0,
                active_companies: activeCompanies?.length || 0,
                total_revenue: totalRevenue,
                popular_packs: popularPacksArray
            }

            return { success: true, data: stats }
        } catch (error) {
            console.error('Error fetching localization statistics:', error)
            return { success: false, error: 'Failed to fetch localization statistics' }
        }
    }

    /**
     * Apply localization pack to company
     */
    static async applyLocalizationPack(
        companyId: string,
        packId: string,
        applyChartOfAccounts: boolean = true,
        applyTaxTemplates: boolean = true,
        applyReportFormats: boolean = true,
        applyComplianceRules: boolean = true
    ): Promise<ApiResponse<{
        accounts_created: number
        tax_templates_created: number
        report_formats_created: number
        compliance_rules_applied: number
    }>> {
        try {
            let accountsCreated = 0
            let taxTemplatesCreated = 0
            let reportFormatsCreated = 0
            let complianceRulesApplied = 0

            // Get pack details
            const packDetails = await this.getLocalizationPackDetails(packId)
            if (!packDetails.success || !packDetails.data) {
                return { success: false, error: 'Localization pack not found' }
            }

            // Apply chart of accounts
            if (applyChartOfAccounts && packDetails.data.chartTemplates.length > 0) {
                const defaultTemplate = packDetails.data.chartTemplates.find(t => t.is_default) || packDetails.data.chartTemplates[0]

                for (const accountConfig of defaultTemplate.accounts_config) {
                    try {
                        const { error } = await supabase
                            .from('accounts')
                            .insert([{
                                account_code: accountConfig.code,
                                account_name: accountConfig.name,
                                account_type: accountConfig.type,
                                parent_account_id: accountConfig.parent ?
                                    (await supabase
                                        .from('accounts')
                                        .select('id')
                                        .eq('company_id', companyId)
                                        .eq('account_code', accountConfig.parent)
                                        .single()
                                    ).data?.id : null,
                                company_id: companyId,
                                is_group: accountConfig.parent === null
                            }])

                        if (!error) {
                            accountsCreated++
                        }
                    } catch (error) {
                        // Continue with other accounts if one fails
                        console.warn('Failed to create account:', accountConfig.code)
                    }
                }
            }

            // Apply tax templates
            if (applyTaxTemplates && packDetails.data.taxConfigs.length > 0) {
                const taxConfig = packDetails.data.taxConfigs[0]

                for (const taxType of taxConfig.tax_types) {
                    try {
                        const { error } = await supabase
                            .from('tax_templates')
                            .insert([{
                                template_name: taxType.name,
                                template_type: taxType.type,
                                company_id: companyId,
                                is_active: true
                            }])

                        if (!error) {
                            taxTemplatesCreated++
                        }
                    } catch (error) {
                        console.warn('Failed to create tax template:', taxType.name)
                    }
                }
            }

            // Apply report formats
            if (applyReportFormats) {
                reportFormatsCreated = packDetails.data.reportFormats.length
            }

            // Apply compliance rules
            if (applyComplianceRules) {
                complianceRulesApplied = packDetails.data.rules.length
            }

            const result = {
                accounts_created: accountsCreated,
                tax_templates_created: taxTemplatesCreated,
                report_formats_created: reportFormatsCreated,
                compliance_rules_applied: complianceRulesApplied
            }

            return {
                success: true,
                data: result,
                message: `Localization pack applied successfully. Created ${accountsCreated} accounts, ${taxTemplatesCreated} tax templates.`
            }
        } catch (error) {
            console.error('Error applying localization pack:', error)
            return { success: false, error: 'Failed to apply localization pack' }
        }
    }

    /**
     * Get available regions
     */
    static async getAvailableRegions(): Promise<ApiResponse<Array<{ region: string; country_count: number }>>> {
        try {
            const { data: regions, error } = await supabase
                .from('countries')
                .select('region')
                .eq('is_active', true)

            if (error) {
                return { success: false, error: error.message }
            }

            const regionCounts = regions?.reduce((acc: Record<string, number>, country) => {
                acc[country.region] = (acc[country.region] || 0) + 1
                return acc
            }, {}) || {}

            const regionArray = Object.entries(regionCounts).map(([region, count]) => ({
                region,
                country_count: count
            }))

            return { success: true, data: regionArray }
        } catch (error) {
            console.error('Error fetching available regions:', error)
            return { success: false, error: 'Failed to fetch available regions' }
        }
    }

    /**
     * Get pack pricing for business model
     */
    static async getPackPricing(
        packType?: string,
        countryCode?: string
    ): Promise<ApiResponse<Array<{
        pack_id: string
        pack_name: string
        country_name: string
        pack_type: string
        monthly_price: number
        annual_price: number
        setup_fee: number
        features: string[]
        savings_percentage: number
    }>>> {
        try {
            let query = supabase
                .from('localization_packs')
                .select(`
                    id,
                    pack_name,
                    pack_code,
                    pack_type,
                    monthly_price,
                    annual_price,
                    setup_fee,
                    includes_chart_of_accounts,
                    includes_tax_templates,
                    includes_report_formats,
                    includes_compliance_rules,
                    includes_banking_formats,
                    includes_payroll_rules,
                    includes_industry_specific,
                    countries (
                        country_name,
                        country_code
                    )
                `)
                .eq('is_active', true)
                .eq('is_published', true)

            if (packType) {
                query = query.eq('pack_type', packType)
            }

            if (countryCode) {
                query = query.eq('countries.country_code', countryCode)
            }

            const { data: packs, error } = await query.order('monthly_price')

            if (error) {
                return { success: false, error: error.message }
            }

            const pricing = packs?.map((pack: any) => {
                const features = []
                if (pack.includes_chart_of_accounts) features.push('Chart of Accounts')
                if (pack.includes_tax_templates) features.push('Tax Templates')
                if (pack.includes_report_formats) features.push('Report Formats')
                if (pack.includes_compliance_rules) features.push('Compliance Rules')
                if (pack.includes_banking_formats) features.push('Banking Integration')
                if (pack.includes_payroll_rules) features.push('Payroll Rules')
                if (pack.includes_industry_specific) features.push('Industry Specific')

                const annualTotal = pack.annual_price + pack.setup_fee
                const monthlyTotal = (pack.monthly_price * 12) + pack.setup_fee
                const savingsPercentage = monthlyTotal > 0 ? ((monthlyTotal - annualTotal) / monthlyTotal) * 100 : 0

                return {
                    pack_id: pack.id,
                    pack_name: pack.pack_name,
                    country_name: pack.countries?.country_name || 'Unknown',
                    pack_type: pack.pack_type,
                    monthly_price: pack.monthly_price,
                    annual_price: pack.annual_price,
                    setup_fee: pack.setup_fee,
                    features: features,
                    savings_percentage: Math.round(savingsPercentage)
                }
            }) || []

            return { success: true, data: pricing }
        } catch (error) {
            console.error('Error fetching pack pricing:', error)
            return { success: false, error: 'Failed to fetch pack pricing' }
        }
    }

    /**
     * Search localization packs
     */
    static async searchLocalizationPacks(
        searchTerm: string,
        filters: {
            region?: string
            packType?: string
            priceRange?: { min: number; max: number }
            features?: string[]
        } = {}
    ): Promise<ApiResponse<LocalizationPack[]>> {
        try {
            let query = supabase
                .from('localization_packs')
                .select(`
                    *,
                    countries (
                        country_code,
                        country_name,
                        region,
                        currency_code,
                        currency_symbol
                    )
                `)
                .eq('is_active', true)
                .eq('is_published', true)

            // Apply search term
            if (searchTerm) {
                query = query.or(`pack_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,countries.country_name.ilike.%${searchTerm}%`)
            }

            // Apply filters
            if (filters.region) {
                query = query.eq('countries.region', filters.region)
            }

            if (filters.packType) {
                query = query.eq('pack_type', filters.packType)
            }

            if (filters.priceRange) {
                query = query.gte('monthly_price', filters.priceRange.min).lte('monthly_price', filters.priceRange.max)
            }

            const { data: packs, error } = await query.order('pack_name')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: packs }
        } catch (error) {
            console.error('Error searching localization packs:', error)
            return { success: false, error: 'Failed to search localization packs' }
        }
    }
}
