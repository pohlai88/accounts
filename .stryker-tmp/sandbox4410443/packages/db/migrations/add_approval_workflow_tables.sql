-- Migration: Add Approval Workflow Tables
-- Description: Tables for approval workflows following accounting standards from QuickBooks, Odoo, and Zoho
-- Date: 2024-01-15
-- Author: AI-BOS Development Team

-- Create approval_workflows table
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    description TEXT,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('INVOICE', 'BILL', 'PAYMENT', 'JOURNAL_ENTRY')),
    conditions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create approval_workflow_steps table
CREATE TABLE IF NOT EXISTS approval_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order NUMERIC NOT NULL,
    step_name TEXT NOT NULL,
    approver_type TEXT NOT NULL CHECK (approver_type IN ('USER', 'ROLE', 'MANAGER', 'CUSTOM')),
    approver_id UUID,
    approver_email TEXT,
    is_required BOOLEAN NOT NULL DEFAULT true,
    timeout_hours NUMERIC,
    conditions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create approval_requests table
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    entity_data JSONB NOT NULL,
    requested_by UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    current_step_id UUID REFERENCES approval_workflow_steps(id),
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create approval_actions table
CREATE TABLE IF NOT EXISTS approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES approval_workflow_steps(id),
    action TEXT NOT NULL CHECK (action IN ('APPROVE', 'REJECT', 'DELEGATE', 'REQUEST_INFO')),
    performed_by UUID NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comments TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Create approval_delegations table
CREATE TABLE IF NOT EXISTS approval_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    delegator_id UUID NOT NULL,
    delegate_id UUID NOT NULL,
    entity_types JSONB NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS approval_workflows_tenant_company_idx ON approval_workflows(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS approval_workflows_entity_type_idx ON approval_workflows(entity_type);
CREATE INDEX IF NOT EXISTS approval_workflows_active_idx ON approval_workflows(is_active);

CREATE INDEX IF NOT EXISTS approval_workflow_steps_workflow_idx ON approval_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS approval_workflow_steps_order_idx ON approval_workflow_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS approval_workflow_steps_approver_idx ON approval_workflow_steps(approver_id);

CREATE INDEX IF NOT EXISTS approval_requests_tenant_company_idx ON approval_requests(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS approval_requests_workflow_idx ON approval_requests(workflow_id);
CREATE INDEX IF NOT EXISTS approval_requests_entity_idx ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS approval_requests_status_idx ON approval_requests(status);
CREATE INDEX IF NOT EXISTS approval_requests_requested_by_idx ON approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS approval_requests_due_date_idx ON approval_requests(due_date);
CREATE INDEX IF NOT EXISTS approval_requests_created_at_idx ON approval_requests(created_at);

CREATE INDEX IF NOT EXISTS approval_actions_request_idx ON approval_actions(request_id);
CREATE INDEX IF NOT EXISTS approval_actions_step_idx ON approval_actions(step_id);
CREATE INDEX IF NOT EXISTS approval_actions_performed_by_idx ON approval_actions(performed_by);
CREATE INDEX IF NOT EXISTS approval_actions_performed_at_idx ON approval_actions(performed_at);

CREATE INDEX IF NOT EXISTS approval_delegations_tenant_company_idx ON approval_delegations(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS approval_delegations_delegator_idx ON approval_delegations(delegator_id);
CREATE INDEX IF NOT EXISTS approval_delegations_delegate_idx ON approval_delegations(delegate_id);
CREATE INDEX IF NOT EXISTS approval_delegations_active_idx ON approval_delegations(is_active);
CREATE INDEX IF NOT EXISTS approval_delegations_valid_from_idx ON approval_delegations(valid_from);

-- Add RLS policies for multi-tenant security
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;

-- RLS policies for approval_workflows
CREATE POLICY "approval_workflows_tenant_isolation" ON approval_workflows
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS policies for approval_workflow_steps
CREATE POLICY "approval_workflow_steps_tenant_isolation" ON approval_workflow_steps
    FOR ALL USING (
        workflow_id IN (
            SELECT id FROM approval_workflows
            WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
        )
    );

-- RLS policies for approval_requests
CREATE POLICY "approval_requests_tenant_isolation" ON approval_requests
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS policies for approval_actions
CREATE POLICY "approval_actions_tenant_isolation" ON approval_actions
    FOR ALL USING (
        request_id IN (
            SELECT id FROM approval_requests
            WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
        )
    );

-- RLS policies for approval_delegations
CREATE POLICY "approval_delegations_tenant_isolation" ON approval_delegations
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_approval_workflows_updated_at
    BEFORE UPDATE ON approval_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at
    BEFORE UPDATE ON approval_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default approval workflows for common accounting scenarios
INSERT INTO approval_workflows (tenant_id, company_id, name, description, entity_type, conditions)
SELECT
    t.id as tenant_id,
    c.id as company_id,
    'Invoice Approval Workflow',
    'Standard approval workflow for invoices above threshold',
    'INVOICE',
    '{"amount_threshold": 10000, "currency": "MYR"}'::jsonb
FROM tenants t
CROSS JOIN companies c
WHERE NOT EXISTS (
    SELECT 1 FROM approval_workflows aw
    WHERE aw.tenant_id = t.id AND aw.company_id = c.id AND aw.entity_type = 'INVOICE'
);

INSERT INTO approval_workflows (tenant_id, company_id, name, description, entity_type, conditions)
SELECT
    t.id as tenant_id,
    c.id as company_id,
    'Bill Approval Workflow',
    'Standard approval workflow for bills above threshold',
    'BILL',
    '{"amount_threshold": 5000, "currency": "MYR"}'::jsonb
FROM tenants t
CROSS JOIN companies c
WHERE NOT EXISTS (
    SELECT 1 FROM approval_workflows aw
    WHERE aw.tenant_id = t.id AND aw.company_id = c.id AND aw.entity_type = 'BILL'
);

-- Add comments for documentation
COMMENT ON TABLE approval_workflows IS 'Approval workflow definitions following accounting standards from QuickBooks, Odoo, and Zoho';
COMMENT ON TABLE approval_workflow_steps IS 'Individual steps within approval workflows with approver assignments';
COMMENT ON TABLE approval_requests IS 'Approval requests for specific entities (invoices, bills, etc.)';
COMMENT ON TABLE approval_actions IS 'Actions taken on approval requests (approve, reject, delegate)';
COMMENT ON TABLE approval_delegations IS 'Delegation rules for approval authority';

COMMENT ON COLUMN approval_workflows.entity_type IS 'Type of entity this workflow applies to: INVOICE, BILL, PAYMENT, JOURNAL_ENTRY';
COMMENT ON COLUMN approval_workflows.conditions IS 'JSON conditions for when this workflow applies (amount thresholds, etc.)';
COMMENT ON COLUMN approval_workflow_steps.approver_type IS 'Type of approver: USER, ROLE, MANAGER, CUSTOM';
COMMENT ON COLUMN approval_requests.status IS 'Current status: PENDING, APPROVED, REJECTED, CANCELLED, EXPIRED';
COMMENT ON COLUMN approval_requests.priority IS 'Priority level: LOW, NORMAL, HIGH, URGENT';
COMMENT ON COLUMN approval_actions.action IS 'Action taken: APPROVE, REJECT, DELEGATE, REQUEST_INFO';
