/**
 * Company Hierarchy Management System
 * Handles parent-child company relationships for intercompany transactions
 * Based on enterprise accounting best practices
 */

import { supabase } from './supabase'

export type RelationshipType = 'Parent' | 'Subsidiary' | 'Sister' | 'Joint Venture'

export interface CompanyHierarchy {
    id: string
    parent_company_id: string
    child_company_id: string
    relationship_type: RelationshipType
    ownership_percentage: number
    is_active: boolean
    established_date?: string
    created_at: string
    updated_at: string
}

export interface CompanyRelationship {
    related_company_id: string
    related_company_name: string
    relationship_type: RelationshipType
    ownership_percentage: number
    is_parent: boolean
}

export interface ConsolidatedStructure {
    company_id: string
    company_name: string
    level: number
    path: string
    ownership_percentage: number
}

export interface Company {
    id: string
    name: string
    default_currency: string
    fiscal_year_start: string
    country?: string
    created_at: string
    updated_at: string
}

/**
 * Company Hierarchy Management Service
 */
export class CompanyHierarchyService {
    /**
     * Create company relationship
     */
    static async createRelationship(
        relationship: Omit<CompanyHierarchy, 'id' | 'created_at' | 'updated_at'>
    ): Promise<{
        success: boolean
        relationship?: CompanyHierarchy
        error?: string
    }> {
        try {
            // Validate companies are different
            if (relationship.parent_company_id === relationship.child_company_id) {
                return { success: false, error: 'Parent and child companies must be different' }
            }

            // Validate ownership percentage
            if (relationship.ownership_percentage < 0 || relationship.ownership_percentage > 100) {
                return { success: false, error: 'Ownership percentage must be between 0 and 100' }
            }

            // Check if relationship already exists
            const { data: existing } = await supabase
                .from('company_hierarchy')
                .select('id')
                .eq('parent_company_id', relationship.parent_company_id)
                .eq('child_company_id', relationship.child_company_id)
                .single()

            if (existing) {
                return { success: false, error: 'Relationship already exists between these companies' }
            }

            const { data: newRelationship, error } = await supabase
                .from('company_hierarchy')
                .insert([relationship])
                .select()
                .single()

            if (error) throw error

            return { success: true, relationship: newRelationship }
        } catch (error) {
            console.error('Error creating company relationship:', error)
            return { success: false, error: 'Failed to create company relationship' }
        }
    }

    /**
     * Get company relationships
     */
    static async getCompanyRelationships(
        companyId: string
    ): Promise<{
        success: boolean
        relationships?: CompanyRelationship[]
        error?: string
    }> {
        try {
            const { data: relationships, error } = await supabase
                .rpc('get_company_hierarchy', {
                    p_company_id: companyId
                })

            if (error) throw error

            return { success: true, relationships: relationships || [] }
        } catch (error) {
            console.error('Error fetching company relationships:', error)
            return { success: false, error: 'Failed to fetch company relationships' }
        }
    }

    /**
     * Get consolidated company structure
     */
    static async getConsolidatedStructure(
        rootCompanyId: string
    ): Promise<{
        success: boolean
        structure?: ConsolidatedStructure[]
        error?: string
    }> {
        try {
            const { data: structure, error } = await supabase
                .rpc('get_consolidated_structure', {
                    p_root_company_id: rootCompanyId
                })

            if (error) throw error

            return { success: true, structure: structure || [] }
        } catch (error) {
            console.error('Error fetching consolidated structure:', error)
            return { success: false, error: 'Failed to fetch consolidated structure' }
        }
    }

    /**
     * Validate intercompany transaction eligibility
     */
    static async validateIntercompanyEligibility(
        fromCompanyId: string,
        toCompanyId: string
    ): Promise<{
        success: boolean
        eligible?: boolean
        error?: string
    }> {
        try {
            const { data: eligible, error } = await supabase
                .rpc('validate_intercompany_eligibility', {
                    p_from_company_id: fromCompanyId,
                    p_to_company_id: toCompanyId
                })

            if (error) throw error

            return { success: true, eligible: eligible || false }
        } catch (error) {
            console.error('Error validating intercompany eligibility:', error)
            return { success: false, error: 'Failed to validate intercompany eligibility' }
        }
    }

    /**
     * Get available companies for intercompany transactions
     */
    static async getAvailableIntercompanyCompanies(
        companyId: string
    ): Promise<{
        success: boolean
        companies?: Company[]
        error?: string
    }> {
        try {
            // Get company relationships
            const relationshipsResult = await this.getCompanyRelationships(companyId)

            if (!relationshipsResult.success || !relationshipsResult.relationships) {
                return { success: false, error: 'Failed to fetch company relationships' }
            }

            // Get company details for related companies
            const relatedCompanyIds = relationshipsResult.relationships.map(r => r.related_company_id)

            if (relatedCompanyIds.length === 0) {
                return { success: true, companies: [] }
            }

            const { data: companies, error } = await supabase
                .from('companies')
                .select('*')
                .in('id', relatedCompanyIds)
                .eq('is_active', true)

            if (error) throw error

            return { success: true, companies: companies || [] }
        } catch (error) {
            console.error('Error fetching available intercompany companies:', error)
            return { success: false, error: 'Failed to fetch available intercompany companies' }
        }
    }

    /**
     * Update company relationship
     */
    static async updateRelationship(
        relationshipId: string,
        updates: Partial<Pick<CompanyHierarchy, 'relationship_type' | 'ownership_percentage' | 'is_active' | 'established_date'>>
    ): Promise<{
        success: boolean
        relationship?: CompanyHierarchy
        error?: string
    }> {
        try {
            const { data: relationship, error } = await supabase
                .from('company_hierarchy')
                .update(updates)
                .eq('id', relationshipId)
                .select()
                .single()

            if (error) throw error

            return { success: true, relationship }
        } catch (error) {
            console.error('Error updating company relationship:', error)
            return { success: false, error: 'Failed to update company relationship' }
        }
    }

    /**
     * Deactivate company relationship
     */
    static async deactivateRelationship(
        relationshipId: string
    ): Promise<{
        success: boolean
        error?: string
    }> {
        try {
            const { error } = await supabase
                .from('company_hierarchy')
                .update({ is_active: false })
                .eq('id', relationshipId)

            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('Error deactivating company relationship:', error)
            return { success: false, error: 'Failed to deactivate company relationship' }
        }
    }

    /**
     * Get all companies (for relationship setup)
     */
    static async getAllCompanies(): Promise<{
        success: boolean
        companies?: Company[]
        error?: string
    }> {
        try {
            const { data: companies, error } = await supabase
                .from('companies')
                .select('*')
                .eq('is_active', true)
                .order('name')

            if (error) throw error

            return { success: true, companies: companies || [] }
        } catch (error) {
            console.error('Error fetching companies:', error)
            return { success: false, error: 'Failed to fetch companies' }
        }
    }

    /**
     * Check if company has any relationships
     */
    static async hasRelationships(
        companyId: string
    ): Promise<{
        success: boolean
        hasRelationships?: boolean
        error?: string
    }> {
        try {
            const { data: relationships, error } = await supabase
                .from('company_hierarchy')
                .select('id')
                .or(`parent_company_id.eq.${companyId},child_company_id.eq.${companyId}`)
                .eq('is_active', true)
                .limit(1)

            if (error) throw error

            return { success: true, hasRelationships: (relationships?.length || 0) > 0 }
        } catch (error) {
            console.error('Error checking company relationships:', error)
            return { success: false, error: 'Failed to check company relationships' }
        }
    }

    /**
     * Get relationship details
     */
    static async getRelationshipDetails(
        relationshipId: string
    ): Promise<{
        success: boolean
        relationship?: CompanyHierarchy & {
            parent_company: Company
            child_company: Company
        }
        error?: string
    }> {
        try {
            const { data: relationship, error } = await supabase
                .from('company_hierarchy')
                .select(`
          *,
          parent_company:companies!company_hierarchy_parent_company_id_fkey(*),
          child_company:companies!company_hierarchy_child_company_id_fkey(*)
        `)
                .eq('id', relationshipId)
                .single()

            if (error) throw error

            return { success: true, relationship }
        } catch (error) {
            console.error('Error fetching relationship details:', error)
            return { success: false, error: 'Failed to fetch relationship details' }
        }
    }
}
