-- Storage setup for multi-tenant file management
-- This migration sets up storage buckets and RLS policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('tenant-documents', 'tenant-documents', false, 52428800, ARRAY['application/pdf', 'image/*', 'text/*']),
  ('tenant-avatars', 'tenant-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('tenant-attachments', 'tenant-attachments', false, 104857600, ARRAY['application/pdf', 'image/*', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('public-assets', 'public-assets', true, 10485760, ARRAY['image/*', 'text/css', 'application/javascript']);

-- RLS policies for tenant-documents bucket
CREATE POLICY "Users can view documents from their tenant" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tenant-documents' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "Users can upload documents to their tenant" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tenant-documents' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "Users can update documents from their tenant" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tenant-documents' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "Users can delete documents from their tenant" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tenant-documents' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- RLS policies for tenant-avatars bucket
CREATE POLICY "Users can view avatars from their tenant" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tenant-avatars' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "Users can upload avatars to their tenant" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tenant-avatars' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "Users can update avatars from their tenant" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tenant-avatars' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "Users can delete avatars from their tenant" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tenant-avatars' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- RLS policies for tenant-attachments bucket
CREATE POLICY "Users can view attachments from their tenant" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tenant-attachments' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "Users can upload attachments to their tenant" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tenant-attachments' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "Users can update attachments from their tenant" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tenant-attachments' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "Users can delete attachments from their tenant" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tenant-attachments' 
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- Public assets bucket (no RLS needed as it's public)
-- Users can read from public-assets bucket without authentication

-- Function to get signed URL for tenant-scoped files
CREATE OR REPLACE FUNCTION get_tenant_file_url(
  bucket_name TEXT,
  file_path TEXT,
  expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
  tenant_id TEXT;
  full_path TEXT;
BEGIN
  -- Get tenant_id from JWT
  tenant_id := auth.jwt() ->> 'tenant_id';
  
  -- Construct tenant-scoped path
  full_path := tenant_id || '/' || file_path;
  
  -- Return signed URL
  RETURN storage.create_signed_url(bucket_name, full_path, expires_in);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upload file to tenant-scoped path
CREATE OR REPLACE FUNCTION upload_tenant_file(
  bucket_name TEXT,
  file_path TEXT,
  file_data BYTEA,
  content_type TEXT DEFAULT 'application/octet-stream'
)
RETURNS TEXT AS $$
DECLARE
  tenant_id TEXT;
  full_path TEXT;
BEGIN
  -- Get tenant_id from JWT
  tenant_id := auth.jwt() ->> 'tenant_id';
  
  -- Construct tenant-scoped path
  full_path := tenant_id || '/' || file_path;
  
  -- Upload file
  PERFORM storage.upload(bucket_name, full_path, file_data, content_type);
  
  RETURN full_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
