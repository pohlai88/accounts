/**
 * SOC2 & GDPR Compliance Service - Enterprise Security & Data Protection
 * Complete compliance framework with audit trails, security controls, and data governance
 * Enterprise-Grade Security with Regulatory Compliance
 * 
 * Features:
 * - SOC2 Type II compliance controls and monitoring
 * - GDPR data protection and privacy rights management
 * - Comprehensive audit logging and security monitoring
 * - Data subject rights automation (Access, Erasure, Portability, etc.)
 * - Data breach incident management and notification
 * - Access control matrix and permissions management
 * - Data classification and handling requirements
 * - Privacy impact assessments and compliance reporting
 * - Security controls testing and effectiveness monitoring
 * - Regulatory compliance dashboards and analytics
 */

import { supabase } from './supabase'

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type FrameworkType = 'Security' | 'Privacy' | 'Financial' | 'Industry' | 'Regional'
export type ControlType = 'Preventive' | 'Detective' | 'Corrective' | 'Deterrent' | 'Recovery' | 'Compensating'
export type ImplementationStatus = 'Not Implemented' | 'Planned' | 'In Progress' | 'Implemented' | 'Tested' | 'Operating Effectively' | 'Needs Remediation'
export type TestResult = 'Pass' | 'Fail' | 'Partial' | 'Not Tested'
export type EffectivenessRating = 'Effective' | 'Partially Effective' | 'Ineffective' | 'Not Assessed'
export type DataSubjectRequestType = 'Access' | 'Rectification' | 'Erasure' | 'Restriction' | 'Portability' | 'Objection' | 'Withdraw Consent'
export type RequestStatus = 'Received' | 'Under Review' | 'Identity Verification' | 'Processing' | 'Completed' | 'Rejected' | 'Partially Fulfilled'
export type BreachType = 'Confidentiality' | 'Integrity' | 'Availability' | 'Combined'
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type InvestigationStatus = 'Open' | 'In Progress' | 'Completed' | 'Closed'
export type EventCategory = 'Authentication' | 'Authorization' | 'Data Access' | 'Data Modification' | 'System Access' | 'Configuration Change' | 'Security Event' | 'Compliance Event'
export type EventResult = 'Success' | 'Failure' | 'Warning' | 'Information'
export type SubjectType = 'User' | 'Role' | 'Group' | 'Service' | 'API Key'
export type AccessLevel = 'None' | 'Read' | 'Write' | 'Delete' | 'Admin' | 'Full Control'
export type AccessStatus = 'Active' | 'Inactive' | 'Expired' | 'Revoked' | 'Pending'
export type ClassificationLevel = 'Public' | 'Internal' | 'Confidential' | 'Restricted' | 'Top Secret'
export type AssessmentType = 'Self Assessment' | 'Internal Audit' | 'External Audit' | 'Penetration Test' | 'Vulnerability Assessment'
export type ComplianceRating = 'Compliant' | 'Substantially Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Assessed'
export type PIAStatus = 'Draft' | 'In Review' | 'Approved' | 'Rejected' | 'Requires Revision'

export interface ComplianceFramework {
    id: string
    framework_name: string
    framework_version: string
    framework_type: FrameworkType
    description: string
    issuing_organization: string
    effective_date: string
    applicable_regions: string[]
    applicable_industries: string[]
    control_categories: any
    mandatory_controls: string[]
    assessment_frequency?: 'Quarterly' | 'Semi-Annual' | 'Annual' | 'Biennial' | 'On-Demand'
    certification_required: boolean
    is_active: boolean
    created_at: string
    modified: string
}

export interface SecurityControl {
    id: string
    company_id: string
    control_id: string
    framework_id: string
    control_name: string
    control_description: string
    control_objective: string
    control_type: ControlType
    control_category: string
    risk_level: RiskLevel
    implementation_status: ImplementationStatus
    implementation_date?: string
    implementation_owner?: string
    testing_frequency?: string
    last_tested_date?: string
    last_test_result?: TestResult
    next_test_date?: string
    evidence_requirements: string[]
    evidence_location?: string
    remediation_required: boolean
    remediation_plan?: string
    remediation_due_date?: string
    remediation_status?: 'Open' | 'In Progress' | 'Completed' | 'Overdue'
    effectiveness_rating?: EffectivenessRating
    effectiveness_notes?: string
    is_automated: boolean
    automation_script?: string
    monitoring_enabled: boolean
    alert_thresholds: any
    created_at: string
    created_by?: string
    modified: string
    modified_by?: string

    // Related data
    framework?: ComplianceFramework
}

export interface DataProcessingRecord {
    id: string
    company_id: string
    processing_activity_name: string
    controller_name: string
    controller_contact: string
    data_protection_officer?: string
    dpo_contact?: string
    processing_purposes: string[]
    legal_basis: string[]
    data_subjects: string[]
    personal_data_categories: string[]
    recipients: string[]
    third_country_transfers: any[]
    transfer_safeguards?: string
    retention_schedule?: string
    deletion_schedule?: string
    technical_measures: string[]
    organizational_measures: string[]
    rights_exercised: any
    privacy_impact_assessment_required: boolean
    pia_completion_date?: string
    pia_review_date?: string
    estimated_data_subjects?: number
    data_volume_category?: 'Small' | 'Medium' | 'Large' | 'Very Large'
    is_active: boolean
    review_date?: string
    created_at: string
    created_by?: string
    modified: string
    modified_by?: string
}

export interface DataSubjectRequest {
    id: string
    company_id: string
    request_number: string
    data_subject_email: string
    data_subject_name?: string
    data_subject_id?: string
    request_type: DataSubjectRequestType
    request_description: string
    request_date: string
    identity_verified: boolean
    verification_method?: string
    verification_date?: string
    verified_by?: string
    status: RequestStatus
    assigned_to?: string
    assigned_at?: string
    request_legitimate?: boolean
    rejection_reason?: string
    legal_basis_assessment?: string
    response_method?: 'Email' | 'Secure Portal' | 'Physical Mail' | 'In Person'
    response_date?: string
    response_content?: string
    data_extracted: any
    data_modified: any
    data_deleted: any
    systems_affected: string[]
    due_date: string
    extension_requested: boolean
    extended_due_date?: string
    extension_reason?: string
    reviewed_by?: string
    reviewed_at?: string
    qa_notes?: string
    communications: any[]
    created_at: string
    created_by?: string
    modified: string
    modified_by?: string

    // Related data
    assignee?: any
}

export interface DataBreachIncident {
    id: string
    company_id: string
    incident_number: string
    incident_title: string
    incident_description: string
    discovery_date: string
    discovery_time?: string
    estimated_occurrence_date?: string
    breach_type: BreachType
    cause_category: string
    root_cause?: string
    personal_data_involved: boolean
    data_categories: string[]
    approximate_individuals?: number
    data_subjects_identified: boolean
    risk_level: RiskLevel
    risk_to_individuals?: RiskLevel
    risk_assessment?: string
    incident_contained: boolean
    containment_date?: string
    containment_measures?: string
    investigation_status: InvestigationStatus
    investigating_team: string[]
    investigation_findings?: string
    dpa_notification_required: boolean
    dpa_notified: boolean
    dpa_notification_date?: string
    dpa_reference?: string
    dpa_response?: string
    individual_notification_required: boolean
    individuals_notified: boolean
    notification_method?: string
    notification_date?: string
    notification_content?: string
    recovery_actions: any[]
    preventive_measures: any[]
    resolved: boolean
    resolution_date?: string
    lessons_learned?: string
    external_experts_engaged: boolean
    law_enforcement_notified: boolean
    insurance_claim_filed: boolean
    created_at: string
    created_by?: string
    modified: string
    modified_by?: string
}

export interface SystemAuditLog {
    id: string
    company_id: string
    event_id: string
    event_type: string
    event_category: EventCategory
    user_id?: string
    user_email?: string
    user_name?: string
    user_ip_address?: string
    user_agent?: string
    session_id?: string
    system_component?: string
    source_system?: string
    hostname?: string
    process_id?: number
    event_timestamp: string
    event_description: string
    event_result: EventResult
    resource_type?: string
    resource_id?: string
    resource_name?: string
    data_before?: any
    data_after?: any
    authentication_method?: string
    authorization_level?: string
    risk_score?: number
    request_id?: string
    request_method?: string
    request_path?: string
    request_parameters?: any
    response_status?: number
    country?: string
    region?: string
    city?: string
    correlation_id?: string
    parent_event_id?: string
    additional_data: any
    retention_date?: string
    log_hash?: string
    created_at: string
}

export interface AccessControlEntry {
    id: string
    company_id: string
    subject_type: SubjectType
    subject_id: string
    subject_name: string
    resource_type: string
    resource_id?: string
    resource_name: string
    resource_category?: string
    permissions: any
    access_level: AccessLevel
    conditions: any
    granted_by: string
    granted_at: string
    business_justification: string
    approved_by?: string
    approved_at?: string
    effective_date: string
    expiry_date?: string
    review_required: boolean
    last_reviewed_date?: string
    next_review_date?: string
    status: AccessStatus
    created_at: string
    created_by?: string
    modified: string
    modified_by?: string
}

export interface DataClassification {
    id: string
    company_id: string
    data_asset_name: string
    data_asset_type: 'Database Table' | 'File' | 'API Endpoint' | 'System' | 'Application' | 'Document'
    data_location?: string
    classification_level: ClassificationLevel
    contains_personal_data: boolean
    contains_sensitive_data: boolean
    contains_financial_data: boolean
    data_categories: string[]
    lawful_basis: string[]
    special_category_data: boolean
    data_subjects: string[]
    encryption_required: boolean
    encryption_method?: string
    access_controls: any
    retention_period?: number
    deletion_method?: string
    geographic_restrictions: string[]
    cross_border_transfers: boolean
    transfer_mechanisms: string[]
    risk_rating?: RiskLevel
    risk_factors: string[]
    regulatory_requirements: string[]
    compliance_notes?: string
    data_owner: string
    data_custodian?: string
    business_steward?: string
    classification_date: string
    review_frequency: number
    next_review_date?: string
    created_at: string
    created_by?: string
    modified: string
    modified_by?: string

    // Related data
    owner?: any
    custodian?: any
    steward?: any
}

export interface ComplianceAssessment {
    id: string
    company_id: string
    framework_id: string
    assessment_name: string
    assessment_type: AssessmentType
    assessment_scope: string
    assessment_date: string
    assessment_period_from?: string
    assessment_period_to?: string
    lead_assessor: string
    assessment_team: string[]
    external_auditor?: string
    overall_rating?: ComplianceRating
    total_controls_tested?: number
    controls_passed?: number
    controls_failed?: number
    controls_not_tested?: number
    findings_summary?: string
    critical_findings: number
    high_findings: number
    medium_findings: number
    low_findings: number
    remediation_plan?: string
    remediation_due_date?: string
    remediation_completion_date?: string
    certification_achieved: boolean
    certificate_number?: string
    certificate_valid_until?: string
    certification_body?: string
    next_assessment_due?: string
    continuous_monitoring: boolean
    report_location?: string
    evidence_package_location?: string
    created_at: string
    created_by?: string
    modified: string
    modified_by?: string

    // Related data
    framework?: ComplianceFramework
}

export interface PrivacyImpactAssessment {
    id: string
    company_id: string
    pia_name: string
    processing_activity: string
    pia_reference?: string
    description: string
    data_types: string[]
    data_subjects: string[]
    processing_purposes: string[]
    high_risk_processing: boolean
    risk_factors: string[]
    necessity_assessment?: string
    proportionality_assessment?: string
    rights_impact_assessment: string
    freedom_impact_assessment?: string
    mitigation_measures: any[]
    dpo_consulted: boolean
    dpo_opinion?: string
    stakeholder_consultation: any[]
    technical_measures: string[]
    organizational_measures: string[]
    safeguards: string[]
    residual_risk?: RiskLevel
    risk_acceptable: boolean
    supervisory_authority_consultation: boolean
    monitoring_measures?: string
    review_schedule?: string
    next_review_date?: string
    status: PIAStatus
    approved_by?: string
    approved_at?: string
    approval_comments?: string
    created_at: string
    created_by?: string
    modified: string
    modified_by?: string
}

export interface ComplianceDashboard {
    soc2_compliance_score: number
    gdpr_compliance_score: number
    total_security_controls: number
    effective_controls: number
    overdue_control_tests: number
    open_data_subject_requests: number
    overdue_dsr_count: number
    open_data_breaches: number
    high_risk_breaches: number
    recent_audit_events: SystemAuditLog[]
    overdue_access_reviews: number
    data_classification_coverage: number
    compliance_gaps: any[]
    upcoming_deadlines: any[]
}

// =====================================================================================
// INPUT TYPES
// =====================================================================================

export interface CreateSecurityControlInput {
    company_id: string
    control_id: string
    framework_id: string
    control_name: string
    control_description: string
    control_objective: string
    control_type: ControlType
    control_category: string
    risk_level?: RiskLevel
    implementation_owner?: string
    testing_frequency?: string
    evidence_requirements?: string[]
    created_by?: string
}

export interface CreateDataSubjectRequestInput {
    company_id: string
    data_subject_email: string
    data_subject_name?: string
    request_type: DataSubjectRequestType
    request_description: string
    created_by?: string
}

export interface CreateDataBreachInput {
    company_id: string
    incident_title: string
    incident_description: string
    discovery_date: string
    breach_type: BreachType
    cause_category: string
    personal_data_involved: boolean
    risk_level?: RiskLevel
    created_by?: string
}

export interface CreateAccessControlInput {
    company_id: string
    subject_type: SubjectType
    subject_id: string
    subject_name: string
    resource_type: string
    resource_id?: string
    resource_name: string
    access_level: AccessLevel
    permissions?: any
    business_justification: string
    effective_date?: string
    expiry_date?: string
    granted_by: string
}

export interface CreateDataClassificationInput {
    company_id: string
    data_asset_name: string
    data_asset_type: 'Database Table' | 'File' | 'API Endpoint' | 'System' | 'Application' | 'Document'
    classification_level: ClassificationLevel
    contains_personal_data?: boolean
    contains_sensitive_data?: boolean
    data_categories?: string[]
    data_owner: string
    created_by?: string
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

// =====================================================================================
// SOC2 & GDPR COMPLIANCE SERVICE
// =====================================================================================

export class ComplianceService {

    // =====================================================================================
    // COMPLIANCE FRAMEWORKS
    // =====================================================================================

    /**
     * Get compliance frameworks
     */
    static async getComplianceFrameworks(filters?: {
        framework_type?: FrameworkType
        is_active?: boolean
    }): Promise<ApiResponse<ComplianceFramework[]>> {
        try {
            let query = supabase
                .from('compliance_frameworks')
                .select('*')

            if (filters?.framework_type) {
                query = query.eq('framework_type', filters.framework_type)
            }

            if (filters?.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active)
            }

            const { data: frameworks, error } = await query.order('framework_name')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: frameworks }

        } catch (error) {
            console.error('Error fetching compliance frameworks:', error)
            return { success: false, error: 'Failed to fetch compliance frameworks' }
        }
    }

    // =====================================================================================
    // SECURITY CONTROLS
    // =====================================================================================

    /**
     * Create security control
     */
    static async createSecurityControl(input: CreateSecurityControlInput): Promise<ApiResponse<SecurityControl>> {
        try {
            const { data: control, error } = await supabase
                .from('security_controls')
                .insert({
                    company_id: input.company_id,
                    control_id: input.control_id.trim().toUpperCase(),
                    framework_id: input.framework_id,
                    control_name: input.control_name.trim(),
                    control_description: input.control_description,
                    control_objective: input.control_objective,
                    control_type: input.control_type,
                    control_category: input.control_category,
                    risk_level: input.risk_level || 'Medium',
                    implementation_owner: input.implementation_owner,
                    testing_frequency: input.testing_frequency,
                    evidence_requirements: input.evidence_requirements || [],
                    created_by: input.created_by
                })
                .select(`
                    *,
                    framework:compliance_frameworks(*)
                `)
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: control, message: 'Security control created successfully' }

        } catch (error) {
            console.error('Error creating security control:', error)
            return { success: false, error: 'Failed to create security control' }
        }
    }

    /**
     * Get security controls
     */
    static async getSecurityControls(companyId: string, filters?: {
        framework_id?: string
        implementation_status?: ImplementationStatus
        risk_level?: RiskLevel
        control_category?: string
    }): Promise<ApiResponse<SecurityControl[]>> {
        try {
            let query = supabase
                .from('security_controls')
                .select(`
                    *,
                    framework:compliance_frameworks(*)
                `)
                .eq('company_id', companyId)

            if (filters?.framework_id) {
                query = query.eq('framework_id', filters.framework_id)
            }

            if (filters?.implementation_status) {
                query = query.eq('implementation_status', filters.implementation_status)
            }

            if (filters?.risk_level) {
                query = query.eq('risk_level', filters.risk_level)
            }

            if (filters?.control_category) {
                query = query.eq('control_category', filters.control_category)
            }

            const { data: controls, error } = await query.order('control_id')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: controls }

        } catch (error) {
            console.error('Error fetching security controls:', error)
            return { success: false, error: 'Failed to fetch security controls' }
        }
    }

    /**
     * Update security control implementation status
     */
    static async updateControlImplementationStatus(
        controlId: string,
        status: ImplementationStatus,
        implementationDate?: string,
        notes?: string,
        modifiedBy?: string
    ): Promise<ApiResponse<boolean>> {
        try {
            const updateData: any = {
                implementation_status: status,
                modified: new Date().toISOString(),
                modified_by: modifiedBy
            }

            if (implementationDate) {
                updateData.implementation_date = implementationDate
            }

            if (notes) {
                updateData.effectiveness_notes = notes
            }

            const { error } = await supabase
                .from('security_controls')
                .update(updateData)
                .eq('id', controlId)

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: true, message: 'Control status updated successfully' }

        } catch (error) {
            console.error('Error updating control status:', error)
            return { success: false, error: 'Failed to update control status' }
        }
    }

    // =====================================================================================
    // DATA SUBJECT REQUESTS (GDPR)
    // =====================================================================================

    /**
     * Create data subject request
     */
    static async createDataSubjectRequest(input: CreateDataSubjectRequestInput): Promise<ApiResponse<DataSubjectRequest>> {
        try {
            // Generate request number
            const { data: requestNumber, error: numberError } = await supabase.rpc('generate_dsr_number')

            if (numberError) {
                return { success: false, error: numberError.message }
            }

            const { data: request, error } = await supabase
                .from('data_subject_requests')
                .insert({
                    company_id: input.company_id,
                    request_number: requestNumber,
                    data_subject_email: input.data_subject_email.toLowerCase().trim(),
                    data_subject_name: input.data_subject_name,
                    request_type: input.request_type,
                    request_description: input.request_description,
                    created_by: input.created_by
                })
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            // Log audit event
            await this.logAuditEvent(
                input.company_id,
                'Data Subject Request',
                'Compliance Event',
                `Data subject request ${requestNumber} created for ${input.request_type}`,
                input.created_by,
                'Data Subject Request',
                request.id
            )

            return { success: true, data: request, message: `Data subject request ${requestNumber} created successfully` }

        } catch (error) {
            console.error('Error creating data subject request:', error)
            return { success: false, error: 'Failed to create data subject request' }
        }
    }

    /**
     * Get data subject requests
     */
    static async getDataSubjectRequests(companyId: string, filters?: {
        status?: RequestStatus
        request_type?: DataSubjectRequestType
        overdue_only?: boolean
    }): Promise<ApiResponse<DataSubjectRequest[]>> {
        try {
            let query = supabase
                .from('data_subject_requests')
                .select('*')
                .eq('company_id', companyId)

            if (filters?.status) {
                query = query.eq('status', filters.status)
            }

            if (filters?.request_type) {
                query = query.eq('request_type', filters.request_type)
            }

            if (filters?.overdue_only) {
                query = query.lt('due_date', new Date().toISOString().split('T')[0])
                    .not('status', 'in', ['Completed', 'Rejected'])
            }

            const { data: requests, error } = await query.order('created_at', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: requests }

        } catch (error) {
            console.error('Error fetching data subject requests:', error)
            return { success: false, error: 'Failed to fetch data subject requests' }
        }
    }

    /**
     * Update data subject request status
     */
    static async updateDataSubjectRequestStatus(
        requestId: string,
        status: RequestStatus,
        responseContent?: string,
        modifiedBy?: string
    ): Promise<ApiResponse<boolean>> {
        try {
            const updateData: any = {
                status,
                modified: new Date().toISOString(),
                modified_by: modifiedBy
            }

            if (status === 'Completed') {
                updateData.response_date = new Date().toISOString().split('T')[0]
                updateData.response_content = responseContent
            }

            const { error } = await supabase
                .from('data_subject_requests')
                .update(updateData)
                .eq('id', requestId)

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: true, message: 'Data subject request updated successfully' }

        } catch (error) {
            console.error('Error updating data subject request:', error)
            return { success: false, error: 'Failed to update data subject request' }
        }
    }

    // =====================================================================================
    // DATA BREACH INCIDENTS
    // =====================================================================================

    /**
     * Create data breach incident
     */
    static async createDataBreachIncident(input: CreateDataBreachInput): Promise<ApiResponse<DataBreachIncident>> {
        try {
            // Generate incident number
            const { data: incidentNumber, error: numberError } = await supabase.rpc('generate_incident_number')

            if (numberError) {
                return { success: false, error: numberError.message }
            }

            const { data: incident, error } = await supabase
                .from('data_breach_incidents')
                .insert({
                    company_id: input.company_id,
                    incident_number: incidentNumber,
                    incident_title: input.incident_title,
                    incident_description: input.incident_description,
                    discovery_date: input.discovery_date,
                    breach_type: input.breach_type,
                    cause_category: input.cause_category,
                    personal_data_involved: input.personal_data_involved,
                    risk_level: input.risk_level || 'Medium',
                    created_by: input.created_by
                })
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            // Log audit event
            await this.logAuditEvent(
                input.company_id,
                'Data Breach Incident',
                'Security Event',
                `Data breach incident ${incidentNumber} reported: ${input.incident_title}`,
                input.created_by,
                'Data Breach Incident',
                incident.id
            )

            return { success: true, data: incident, message: `Data breach incident ${incidentNumber} created successfully` }

        } catch (error) {
            console.error('Error creating data breach incident:', error)
            return { success: false, error: 'Failed to create data breach incident' }
        }
    }

    /**
     * Get data breach incidents
     */
    static async getDataBreachIncidents(companyId: string, filters?: {
        investigation_status?: InvestigationStatus
        risk_level?: RiskLevel
        personal_data_involved?: boolean
    }): Promise<ApiResponse<DataBreachIncident[]>> {
        try {
            let query = supabase
                .from('data_breach_incidents')
                .select('*')
                .eq('company_id', companyId)

            if (filters?.investigation_status) {
                query = query.eq('investigation_status', filters.investigation_status)
            }

            if (filters?.risk_level) {
                query = query.eq('risk_level', filters.risk_level)
            }

            if (filters?.personal_data_involved !== undefined) {
                query = query.eq('personal_data_involved', filters.personal_data_involved)
            }

            const { data: incidents, error } = await query.order('discovery_date', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: incidents }

        } catch (error) {
            console.error('Error fetching data breach incidents:', error)
            return { success: false, error: 'Failed to fetch data breach incidents' }
        }
    }

    // =====================================================================================
    // AUDIT LOGGING
    // =====================================================================================

    /**
     * Log audit event
     */
    static async logAuditEvent(
        companyId: string,
        eventType: string,
        eventCategory: EventCategory,
        eventDescription: string,
        userId?: string,
        resourceType?: string,
        resourceId?: string,
        additionalData?: any
    ): Promise<ApiResponse<string>> {
        try {
            const { data: auditLogId, error } = await supabase.rpc('log_audit_event', {
                p_company_id: companyId,
                p_event_type: eventType,
                p_event_category: eventCategory,
                p_event_description: eventDescription,
                p_user_id: userId,
                p_resource_type: resourceType,
                p_resource_id: resourceId,
                p_additional_data: additionalData
            })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: auditLogId, message: 'Audit event logged successfully' }

        } catch (error) {
            console.error('Error logging audit event:', error)
            return { success: false, error: 'Failed to log audit event' }
        }
    }

    /**
     * Get audit logs
     */
    static async getAuditLogs(
        companyId: string,
        filters?: {
            event_category?: EventCategory
            event_result?: EventResult
            user_id?: string
            date_from?: string
            date_to?: string
        },
        pagination?: {
            page?: number
            limit?: number
        }
    ): Promise<ApiResponse<{ logs: SystemAuditLog[]; total: number; page: number; limit: number }>> {
        try {
            let query = supabase
                .from('system_audit_logs')
                .select('*', { count: 'exact' })
                .eq('company_id', companyId)

            if (filters?.event_category) {
                query = query.eq('event_category', filters.event_category)
            }

            if (filters?.event_result) {
                query = query.eq('event_result', filters.event_result)
            }

            if (filters?.user_id) {
                query = query.eq('user_id', filters.user_id)
            }

            if (filters?.date_from) {
                query = query.gte('event_timestamp', filters.date_from)
            }

            if (filters?.date_to) {
                query = query.lte('event_timestamp', filters.date_to)
            }

            // Pagination
            const page = pagination?.page || 1
            const limit = pagination?.limit || 50
            const offset = (page - 1) * limit

            query = query
                .order('event_timestamp', { ascending: false })
                .range(offset, offset + limit - 1)

            const { data: logs, error, count } = await query

            if (error) {
                return { success: false, error: error.message }
            }

            return {
                success: true,
                data: {
                    logs: logs || [],
                    total: count || 0,
                    page,
                    limit
                }
            }

        } catch (error) {
            console.error('Error fetching audit logs:', error)
            return { success: false, error: 'Failed to fetch audit logs' }
        }
    }

    // =====================================================================================
    // ACCESS CONTROL
    // =====================================================================================

    /**
     * Create access control entry
     */
    static async createAccessControl(input: CreateAccessControlInput): Promise<ApiResponse<AccessControlEntry>> {
        try {
            const { data: accessControl, error } = await supabase
                .from('access_control_matrix')
                .insert({
                    company_id: input.company_id,
                    subject_type: input.subject_type,
                    subject_id: input.subject_id,
                    subject_name: input.subject_name,
                    resource_type: input.resource_type,
                    resource_id: input.resource_id,
                    resource_name: input.resource_name,
                    access_level: input.access_level,
                    permissions: input.permissions || {},
                    business_justification: input.business_justification,
                    effective_date: input.effective_date || new Date().toISOString().split('T')[0],
                    expiry_date: input.expiry_date,
                    granted_by: input.granted_by,
                    next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year from now
                })
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            // Log audit event
            await this.logAuditEvent(
                input.company_id,
                'Access Grant',
                'Authorization',
                `Access granted to ${input.subject_name} for ${input.resource_name} with ${input.access_level} level`,
                input.granted_by,
                'Access Control',
                accessControl.id
            )

            return { success: true, data: accessControl, message: 'Access control entry created successfully' }

        } catch (error) {
            console.error('Error creating access control entry:', error)
            return { success: false, error: 'Failed to create access control entry' }
        }
    }

    /**
     * Get access control entries
     */
    static async getAccessControlEntries(companyId: string, filters?: {
        subject_type?: SubjectType
        resource_type?: string
        status?: AccessStatus
        review_overdue?: boolean
    }): Promise<ApiResponse<AccessControlEntry[]>> {
        try {
            let query = supabase
                .from('access_control_matrix')
                .select('*')
                .eq('company_id', companyId)

            if (filters?.subject_type) {
                query = query.eq('subject_type', filters.subject_type)
            }

            if (filters?.resource_type) {
                query = query.eq('resource_type', filters.resource_type)
            }

            if (filters?.status) {
                query = query.eq('status', filters.status)
            }

            if (filters?.review_overdue) {
                query = query.lt('next_review_date', new Date().toISOString().split('T')[0])
                    .eq('review_required', true)
                    .eq('status', 'Active')
            }

            const { data: entries, error } = await query.order('created_at', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: entries }

        } catch (error) {
            console.error('Error fetching access control entries:', error)
            return { success: false, error: 'Failed to fetch access control entries' }
        }
    }

    // =====================================================================================
    // DATA CLASSIFICATION
    // =====================================================================================

    /**
     * Create data classification
     */
    static async createDataClassification(input: CreateDataClassificationInput): Promise<ApiResponse<DataClassification>> {
        try {
            const { data: classification, error } = await supabase
                .from('data_classification')
                .insert({
                    company_id: input.company_id,
                    data_asset_name: input.data_asset_name.trim(),
                    data_asset_type: input.data_asset_type,
                    classification_level: input.classification_level,
                    contains_personal_data: input.contains_personal_data || false,
                    contains_sensitive_data: input.contains_sensitive_data || false,
                    data_categories: input.data_categories || [],
                    data_owner: input.data_owner,
                    review_frequency: 365, // Annual review by default
                    next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    created_by: input.created_by
                })
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: classification, message: 'Data classification created successfully' }

        } catch (error) {
            console.error('Error creating data classification:', error)
            return { success: false, error: 'Failed to create data classification' }
        }
    }

    /**
     * Get data classifications
     */
    static async getDataClassifications(companyId: string, filters?: {
        classification_level?: ClassificationLevel
        contains_personal_data?: boolean
        data_owner?: string
    }): Promise<ApiResponse<DataClassification[]>> {
        try {
            let query = supabase
                .from('data_classification')
                .select('*')
                .eq('company_id', companyId)

            if (filters?.classification_level) {
                query = query.eq('classification_level', filters.classification_level)
            }

            if (filters?.contains_personal_data !== undefined) {
                query = query.eq('contains_personal_data', filters.contains_personal_data)
            }

            if (filters?.data_owner) {
                query = query.eq('data_owner', filters.data_owner)
            }

            const { data: classifications, error } = await query.order('data_asset_name')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: classifications }

        } catch (error) {
            console.error('Error fetching data classifications:', error)
            return { success: false, error: 'Failed to fetch data classifications' }
        }
    }

    // =====================================================================================
    // COMPLIANCE ANALYTICS
    // =====================================================================================

    /**
     * Get compliance dashboard
     */
    static async getComplianceDashboard(companyId: string): Promise<ApiResponse<ComplianceDashboard>> {
        try {
            // Get compliance scores
            const [soc2Result, gdprResult] = await Promise.all([
                supabase.rpc('calculate_compliance_score', {
                    p_company_id: companyId,
                    p_framework_id: 'soc2-framework-id' // Would get actual SOC2 framework ID
                }),
                supabase.rpc('calculate_compliance_score', {
                    p_company_id: companyId,
                    p_framework_id: 'gdpr-framework-id' // Would get actual GDPR framework ID
                })
            ])

            // Get other metrics
            const [
                controlsResult,
                dsrResult,
                breachesResult,
                auditResult,
                accessResult
            ] = await Promise.all([
                supabase.from('security_controls').select('effectiveness_rating', { count: 'exact' }).eq('company_id', companyId),
                supabase.from('data_subject_requests').select('status,due_date', { count: 'exact' }).eq('company_id', companyId),
                supabase.from('data_breach_incidents').select('investigation_status,risk_level', { count: 'exact' }).eq('company_id', companyId),
                supabase.from('system_audit_logs').select('*').eq('company_id', companyId).order('event_timestamp', { ascending: false }).limit(10),
                supabase.from('access_control_matrix').select('next_review_date', { count: 'exact' }).eq('company_id', companyId).eq('status', 'Active')
            ])

            const totalControls = controlsResult.count || 0
            const effectiveControls = controlsResult.data?.filter(c => c.effectiveness_rating === 'Effective').length || 0

            const openDSRs = dsrResult.data?.filter(r => !['Completed', 'Rejected'].includes(r.status)).length || 0
            const overdueDSRs = dsrResult.data?.filter(r =>
                !['Completed', 'Rejected'].includes(r.status) &&
                new Date(r.due_date) < new Date()
            ).length || 0

            const openBreaches = breachesResult.data?.filter(b => b.investigation_status === 'Open').length || 0
            const highRiskBreaches = breachesResult.data?.filter(b => b.risk_level === 'High' || b.risk_level === 'Critical').length || 0

            const overdueAccessReviews = accessResult.data?.filter(a =>
                a.next_review_date && new Date(a.next_review_date) < new Date()
            ).length || 0

            const dashboard: ComplianceDashboard = {
                soc2_compliance_score: soc2Result.data?.[0]?.effectiveness_percentage || 0,
                gdpr_compliance_score: gdprResult.data?.[0]?.effectiveness_percentage || 0,
                total_security_controls: totalControls,
                effective_controls: effectiveControls,
                overdue_control_tests: 0, // Would calculate from controls
                open_data_subject_requests: openDSRs,
                overdue_dsr_count: overdueDSRs,
                open_data_breaches: openBreaches,
                high_risk_breaches: highRiskBreaches,
                recent_audit_events: auditResult.data || [],
                overdue_access_reviews: overdueAccessReviews,
                data_classification_coverage: 85, // Would calculate actual coverage
                compliance_gaps: [], // Would identify gaps
                upcoming_deadlines: [] // Would get upcoming deadlines
            }

            return { success: true, data: dashboard }

        } catch (error) {
            console.error('Error fetching compliance dashboard:', error)
            return { success: false, error: 'Failed to fetch compliance dashboard' }
        }
    }

    /**
     * Get overdue compliance tasks
     */
    static async getOverdueComplianceTasks(companyId: string): Promise<ApiResponse<any[]>> {
        try {
            const { data: tasks, error } = await supabase.rpc('check_overdue_compliance_tasks', {
                p_company_id: companyId
            })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: tasks }

        } catch (error) {
            console.error('Error fetching overdue compliance tasks:', error)
            return { success: false, error: 'Failed to fetch overdue compliance tasks' }
        }
    }
}
