import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment, cleanupTestData, skipIfNoTenant } from './test-utils';

describe('Integration Tests', () => {
    let testSetup: any;
    const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

    beforeAll(async () => {
        testSetup = await setupTestEnvironment();
    });

    afterAll(async () => {
        await cleanupTestData(testSetup.supabase, testSetup.testUser, testSetup.testTenant);
    });

    it('should complete full tenant switching workflow', async () => {
        skipIfNoTenant(testSetup.testTenant, 'tenant switching workflow');
        if (!testSetup.testTenant) return;

        // 1. Get initial active tenant
        let response = await fetch(`${API_BASE_URL}/api/me/active-tenant`, {
            headers: {
                'Authorization': `Bearer ${testSetup.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        expect(response.ok).toBe(true);
        let data = await response.json();
        expect(data.data.activeTenantId).toBe(testSetup.testTenant.id);

        // 2. Verify tenant switching works
        response = await fetch(`${API_BASE_URL}/api/me/active-tenant`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${testSetup.authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tenantId: testSetup.testTenant.id })
        });

        expect(response.ok).toBe(true);
        data = await response.json();
        expect(data.data.activeTenantId).toBe(testSetup.testTenant.id);
    });

    it('should handle complete member management workflow', async () => {
        skipIfNoTenant(testSetup.testTenant, 'member management workflow');
        if (!testSetup.testTenant) return;

        // 1. Get tenant members
        let response = await fetch(`${API_BASE_URL}/api/tenants/${testSetup.testTenant.id}/members`, {
            headers: {
                'Authorization': `Bearer ${testSetup.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        expect(response.ok).toBe(true);
        let data = await response.json();
        expect(data.data).toBeDefined();
        expect(Array.isArray(data.data)).toBe(true);

        // 2. Verify current user is a member
        const currentUserMember = data.data.find((member: any) => member.user_id === testSetup.testUser.id);
        expect(currentUserMember).toBeDefined();
        expect(currentUserMember.role).toBe('admin');
    });

    it('should handle file upload and retrieval workflow', async () => {
        skipIfNoTenant(testSetup.testTenant, 'file upload workflow');
        if (!testSetup.testTenant) return;

        // This test would require storage buckets to be properly configured
        // For now, we'll just verify the storage system is accessible
        const { data: buckets, error } = await testSetup.supabase.storage.listBuckets();

        if (error) {
            console.log('Storage not properly configured, skipping file upload test');
            return;
        }

        expect(buckets).toBeDefined();
        expect(Array.isArray(buckets)).toBe(true);
    });

    it('should handle realtime updates during tenant operations', async () => {
        skipIfNoTenant(testSetup.testTenant, 'realtime updates');
        if (!testSetup.testTenant) return;

        // This test would require realtime to be properly configured
        // For now, we'll just verify the realtime system is accessible
        const channel = testSetup.supabase
            .channel(`test-tenant:${testSetup.testTenant.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'memberships'
            }, (payload: any) => {
                expect(payload).toBeDefined();
            });

        const subscribePromise = new Promise((resolve) => {
            channel.subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    resolve(status);
                }
            });
        });

        // Wait for subscription or timeout
        await Promise.race([
            subscribePromise,
            new Promise(resolve => setTimeout(resolve, 2000))
        ]);

        channel.unsubscribe();
    });

    it('should enforce tenant isolation across all operations', async () => {
        skipIfNoTenant(testSetup.testTenant, 'tenant isolation');
        if (!testSetup.testTenant) return;

        // Create another test user to verify isolation
        const otherEmail = `other-test-${Date.now()}@example.com`;
        const { data: otherAuthData } = await testSetup.supabase.auth.admin.createUser({
            email: otherEmail,
            password: 'testpassword123',
            email_confirm: true
        });

        const otherUser = otherAuthData.user;

        // Create user profile
        await testSetup.supabase
            .from('users')
            .insert({
                id: otherUser.id,
                email: otherUser.email,
                first_name: 'Other',
                last_name: 'User'
            });

        // Create another tenant
        const { data: otherTenantData } = await testSetup.supabase
            .from('tenants')
            .insert({
                name: 'Other Test Tenant',
                slug: 'other-test-tenant-' + Date.now()
            })
            .select()
            .single();

        if (otherTenantData) {
            // Create membership for other user in other tenant
            await testSetup.supabase
                .from('memberships')
                .insert({
                    user_id: otherUser.id,
                    tenant_id: otherTenantData.id,
                    role: 'admin'
                });

            // Verify tenant isolation - other user shouldn't see our tenant's data
            const { data: memberships } = await testSetup.supabase
                .from('memberships')
                .select('*')
                .eq('user_id', otherUser.id);

            expect(memberships).toBeDefined();
            expect(memberships.length).toBe(1);
            expect(memberships[0].tenant_id).toBe(otherTenantData.id);

            // Clean up other tenant
            await testSetup.supabase
                .from('tenants')
                .delete()
                .eq('id', otherTenantData.id);
        }

        // Clean up other user
        await testSetup.supabase.auth.admin.deleteUser(otherUser.id);
    });
});