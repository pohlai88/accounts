-- V1 Compliance: Attachment System Migration
-- Creates tables for file upload/storage/management with audit trail
-- Supports polymorphic relationships and comprehensive access logging

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL, -- in bytes
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for deduplication
    
    -- Storage information
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'supabase',
    storage_path TEXT NOT NULL,
    storage_url TEXT,
    
    -- Categorization
    category VARCHAR(50) NOT NULL, -- 'invoice', 'receipt', 'contract', 'report', etc.
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Status and metadata
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'archived', 'deleted'
    is_public BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Attachment relationships - links attachments to various entities
CREATE TABLE IF NOT EXISTS attachment_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
    
    -- Entity reference (polymorphic)
    entity_type VARCHAR(50) NOT NULL, -- 'invoice', 'bill', 'journal', 'customer', etc.
    entity_id UUID NOT NULL,
    
    -- Relationship metadata
    relationship_type VARCHAR(50) NOT NULL DEFAULT 'attachment', -- 'attachment', 'supporting_doc', 'approval_doc'
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- Attachment access log for audit trail
CREATE TABLE IF NOT EXISTS attachment_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attachment_id UUID NOT NULL REFERENCES attachments(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Access details
    action VARCHAR(50) NOT NULL, -- 'view', 'download', 'share', 'delete'
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Context
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS attachments_tenant_company_idx ON attachments(tenant_id, company_id);
CREATE INDEX IF NOT EXISTS attachments_category_idx ON attachments(category);
CREATE INDEX IF NOT EXISTS attachments_status_idx ON attachments(status);
CREATE INDEX IF NOT EXISTS attachments_hash_idx ON attachments(file_hash);
CREATE INDEX IF NOT EXISTS attachments_created_at_idx ON attachments(created_at);

CREATE INDEX IF NOT EXISTS attachment_relationships_attachment_idx ON attachment_relationships(attachment_id);
CREATE INDEX IF NOT EXISTS attachment_relationships_entity_idx ON attachment_relationships(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS attachment_relationships_type_idx ON attachment_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS attachment_access_log_attachment_idx ON attachment_access_log(attachment_id);
CREATE INDEX IF NOT EXISTS attachment_access_log_user_idx ON attachment_access_log(user_id);
CREATE INDEX IF NOT EXISTS attachment_access_log_action_idx ON attachment_access_log(action);
CREATE INDEX IF NOT EXISTS attachment_access_log_accessed_at_idx ON attachment_access_log(accessed_at);

-- Row Level Security (RLS)
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachment_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachment_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments in their tenant" ON attachments
    FOR SELECT USING (
        tenant_id IN (
            SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert attachments in their tenant" ON attachments
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own attachments" ON attachments
    FOR UPDATE USING (
        tenant_id IN (
            SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can delete their own attachments" ON attachments
    FOR DELETE USING (
        tenant_id IN (
            SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

-- RLS Policies for attachment_relationships
CREATE POLICY "Users can view attachment relationships in their tenant" ON attachment_relationships
    FOR SELECT USING (
        attachment_id IN (
            SELECT a.id FROM attachments a 
            JOIN memberships m ON a.tenant_id = m.tenant_id 
            WHERE m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create attachment relationships" ON attachment_relationships
    FOR INSERT WITH CHECK (
        attachment_id IN (
            SELECT a.id FROM attachments a 
            JOIN memberships m ON a.tenant_id = m.tenant_id 
            WHERE m.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- RLS Policies for attachment_access_log
CREATE POLICY "Users can view their own access logs" ON attachment_access_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert access logs" ON attachment_access_log
    FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attachments_updated_at 
    BEFORE UPDATE ON attachments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log attachment access
CREATE OR REPLACE FUNCTION log_attachment_access(
    p_attachment_id UUID,
    p_user_id UUID,
    p_action VARCHAR(50),
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO attachment_access_log (
        attachment_id, user_id, action, ip_address, 
        user_agent, session_id, metadata
    ) VALUES (
        p_attachment_id, p_user_id, p_action, p_ip_address,
        p_user_agent, p_session_id, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get attachment with access logging
CREATE OR REPLACE FUNCTION get_attachment_with_logging(
    p_attachment_id UUID,
    p_user_id UUID,
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    company_id UUID,
    filename VARCHAR(255),
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INTEGER,
    storage_url TEXT,
    category VARCHAR(50),
    tags JSONB,
    status VARCHAR(20),
    is_public BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Log the access
    PERFORM log_attachment_access(
        p_attachment_id, 
        p_user_id, 
        'view',
        p_ip_address,
        p_user_agent
    );
    
    -- Return the attachment data
    RETURN QUERY
    SELECT 
        a.id, a.tenant_id, a.company_id, a.filename, 
        a.original_filename, a.mime_type, a.file_size,
        a.storage_url, a.category, a.tags, a.status,
        a.is_public, a.metadata, a.created_at
    FROM attachments a
    WHERE a.id = p_attachment_id
      AND a.status = 'active'
      AND a.tenant_id IN (
          SELECT m.tenant_id FROM memberships m WHERE m.user_id = p_user_id
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete attachment
CREATE OR REPLACE FUNCTION soft_delete_attachment(
    p_attachment_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    attachment_exists BOOLEAN;
BEGIN
    -- Check if attachment exists and user has permission
    SELECT EXISTS(
        SELECT 1 FROM attachments a
        JOIN memberships m ON a.tenant_id = m.tenant_id
        WHERE a.id = p_attachment_id 
          AND m.user_id = p_user_id
          AND a.status = 'active'
    ) INTO attachment_exists;
    
    IF NOT attachment_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Soft delete the attachment
    UPDATE attachments 
    SET status = 'deleted', deleted_at = NOW()
    WHERE id = p_attachment_id;
    
    -- Log the deletion
    PERFORM log_attachment_access(
        p_attachment_id, 
        p_user_id, 
        'delete'
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attachment_relationships TO authenticated;
GRANT SELECT, INSERT ON attachment_access_log TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION log_attachment_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_attachment_with_logging TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_attachment TO authenticated;

-- Comments for documentation
COMMENT ON TABLE attachments IS 'File attachments with metadata and audit trail';
COMMENT ON TABLE attachment_relationships IS 'Polymorphic relationships between attachments and business entities';
COMMENT ON TABLE attachment_access_log IS 'Audit log for all attachment access activities';

COMMENT ON FUNCTION log_attachment_access IS 'Logs attachment access for audit trail';
COMMENT ON FUNCTION get_attachment_with_logging IS 'Retrieves attachment with automatic access logging';
COMMENT ON FUNCTION soft_delete_attachment IS 'Soft deletes attachment with audit logging';
