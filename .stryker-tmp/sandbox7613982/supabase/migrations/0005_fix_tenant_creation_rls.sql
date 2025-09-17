-- Fix tenant creation RLS policy
-- Allow authenticated users to create tenants, but restrict access to existing tenants

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS tenant_own_data ON tenants;

-- Create a new policy that allows tenant creation for authenticated users
CREATE POLICY tenant_create_for_auth_users ON tenants FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Create a policy for reading tenants that the user has membership in
CREATE POLICY tenant_read_membership ON tenants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() 
    AND tenant_id = tenants.id
  )
);

-- Create a policy for updating tenants that the user has admin membership in
CREATE POLICY tenant_update_admin_membership ON tenants FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() 
    AND tenant_id = tenants.id
    AND role = 'admin'
  )
);

-- Create a policy for deleting tenants that the user has admin membership in
CREATE POLICY tenant_delete_admin_membership ON tenants FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() 
    AND tenant_id = tenants.id
    AND role = 'admin'
  )
);
