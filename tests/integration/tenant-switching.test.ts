import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Tenant Switching Integration Tests', () => {
    let supabase: any;
    let testUser: any;
    let testTenant1: any;
    let testTenant2: any;
    let authToken: string;

    // Skip all tests if Supabase is not available
    const skipTests = !SUPABASE_URL || !SUPABASE_ANON_KEY;

    if (skipTests) {
        console.log('Supabase configuration:', {
            url: SUPABASE_URL ? 'SET' : 'MISSING',
            key: SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
        });
    }

    beforeAll(async () => {
        // Skip tests if Supabase environment variables are not available
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.log('Skipping tenant switching tests - Supabase environment variables not available');
            return;
        }

        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Use service role key to create user directly
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
        }

        const serviceSupabase = createClient(SUPABASE_URL, serviceRoleKey);

        // Create a test user directly using service role
        const testUserId = randomUUID();
        const testUserEmail = `test-${Date.now()}@aibos.com`;

        // Create user in auth.users table
        const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
            email: testUserEmail,
            password: 'testpassword123',
            email_confirm: true
        });

        if (authError) {
            console.log('Auth user creation error:', authError);
            throw authError;
        }

        testUser = authUser.user;

        // Create user profile in the users table
        const { error: profileError } = await serviceSupabase
            .from('users')
            .insert({
                id: testUser.id,
                email: testUser.email,
                first_name: 'Test',
                last_name: 'User'
            });

        if (profileError && !profileError.message.includes('duplicate key')) {
            console.log('Profile creation error:', profileError);
            throw profileError;
        }

        // Sign in with the created user to get a token
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testUserEmail,
            password: 'testpassword123'
        });

        if (signInError) {
            console.log('Sign in error:', signInError);
            throw signInError;
        }

        authToken = signInData.session?.access_token!;

        // Create test tenants using service role
        const { data: tenant1, error: tenant1Error } = await serviceSupabase
            .from('tenants')
            .insert({
                name: 'Test Tenant 1',
                slug: 'test-tenant-1-' + Date.now()
            })
            .select()
            .single();

        if (tenant1Error) throw tenant1Error;
        testTenant1 = tenant1;

        const { data: tenant2, error: tenant2Error } = await serviceSupabase
            .from('tenants')
            .insert({
                name: 'Test Tenant 2',
                slug: 'test-tenant-2-' + Date.now()
            })
            .select()
            .single();

        if (tenant2Error) throw tenant2Error;
        testTenant2 = tenant2;

        // Create memberships using service role
        await serviceSupabase
            .from('memberships')
            .insert([
                {
                    user_id: testUser.id,
                    tenant_id: testTenant1.id,
                    role: 'admin'
                },
                {
                    user_id: testUser.id,
                    tenant_id: testTenant2.id,
                    role: 'user'
                }
            ]);

        // Set initial active tenant using service role
        await serviceSupabase
            .from('user_settings')
            .insert({
                user_id: testUser.id,
                active_tenant_id: testTenant1.id
            });
    });

    afterAll(async () => {
        // Cleanup test data
        if (testUser) {
            await supabase.auth.admin.deleteUser(testUser.id);
        }
        if (testTenant1) {
            await supabase.from('tenants').delete().eq('id', testTenant1.id);
        }
        if (testTenant2) {
            await supabase.from('tenants').delete().eq('id', testTenant2.id);
        }
    });

    it.skipIf(skipTests)('should get user tenants and active tenant', async () => {
        const response = await fetch(`${API_BASE_URL}/api/me/active-tenant`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.availableTenants).toHaveLength(2);
        expect(data.data.activeTenantId).toBe(testTenant1.id);

        const activeTenant = data.data.availableTenants.find((t: any) => t.isActive);
        expect(activeTenant.id).toBe(testTenant1.id);
    });

    it.skipIf(skipTests)('should switch active tenant', async () => {
        const response = await fetch(`${API_BASE_URL}/api/me/active-tenant`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tenantId: testTenant2.id
            })
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.tenant.id).toBe(testTenant2.id);
        expect(data.data.tenant.name).toBe('Test Tenant 2');
    });

    it.skipIf(skipTests)('should get members for tenant', async () => {
        const response = await fetch(`${API_BASE_URL}/api/tenants/${testTenant1.id}/members`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.members).toHaveLength(1);
        expect(data.data.members[0].email).toBe(testUser.email);
        expect(data.data.currentUserRole).toBe('admin');
    });

    it.skipIf(skipTests)('should invite user to tenant', async () => {
        const response = await fetch(`${API_BASE_URL}/api/tenants/${testTenant1.id}/invite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'invited@example.com',
                role: 'user'
            })
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.email).toBe('invited@example.com');
        expect(data.data.role).toBe('user');
    });

    it.skipIf(skipTests)('should handle tenant switching with JWT refresh', async () => {
        // First, switch to tenant 2
        await fetch(`${API_BASE_URL}/api/me/active-tenant`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tenantId: testTenant2.id
            })
        });

        // Refresh the session to get new JWT with updated tenant context
        const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();

        expect(sessionError).toBeNull();
        expect(sessionData.session).toBeDefined();

        // Use the new token to make a request
        const newToken = sessionData.session?.access_token;
        const response = await fetch(`${API_BASE_URL}/api/rules`, {
            headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json'
            }
        });

        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.rules[0].tenantId).toBe(testTenant2.id);
    });

    it.skipIf(skipTests)('should validate tenant access with RLS', async () => {
        // Try to access tenant 1 data while active tenant is tenant 2
        const response = await fetch(`${API_BASE_URL}/api/tenants/${testTenant1.id}/members`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Should still work because user has membership in both tenants
        expect(response.ok).toBe(true);
    });

    it.skipIf(skipTests)('should handle invalid tenant switching', async () => {
        const response = await fetch(`${API_BASE_URL}/api/me/active-tenant`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tenantId: '00000000-0000-0000-0000-000000000000'
            })
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(403);

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('TENANT_ACCESS_DENIED');
    });

    it.skipIf(skipTests)('should handle unauthorized access', async () => {
        const response = await fetch(`${API_BASE_URL}/api/me/active-tenant`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
    });
});
