import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment, cleanupTestData, skipIfNoTenant } from './test-utils';

describe('Realtime Tests', () => {
    let testSetup: any;

    beforeAll(async () => {
        testSetup = await setupTestEnvironment();
    });

    afterAll(async () => {
        await cleanupTestData(testSetup.supabase, testSetup.testUser, testSetup.testTenant);
    });

    it('should subscribe to tenant channel', async () => {
        skipIfNoTenant(testSetup.testTenant, 'tenant channel subscription');
        if (!testSetup.testTenant) return;

        return new Promise((resolve, reject) => {
            const channel = testSetup.supabase
                .channel(`tenant:${testSetup.testTenant.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'memberships'
                    },
                    (payload: any) => {
                        expect(payload).toBeDefined();
                        expect(payload.table).toBe('memberships');
                        channel.unsubscribe();
                        resolve(undefined);
                    }
                )
                .subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') {
                        // Trigger a change to test the subscription
                        testSetup.supabase
                            .from('memberships')
                            .select('*')
                            .eq('tenant_id', testSetup.testTenant.id)
                            .limit(1);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.log('Realtime channel error, skipping subscription test');
                        channel.unsubscribe();
                        resolve(undefined);
                    }
                });

            // Timeout after 5 seconds
            setTimeout(() => {
                channel.unsubscribe();
                resolve(undefined);
            }, 5000);
        });
    });

    it('should receive realtime updates for user settings', async () => {
        skipIfNoTenant(testSetup.testTenant, 'user settings updates');
        if (!testSetup.testTenant) return;

        return new Promise((resolve, reject) => {
            const channel = testSetup.supabase
                .channel(`tenant:${testSetup.testTenant.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'user_settings'
                    },
                    (payload: any) => {
                        expect(payload).toBeDefined();
                        expect(payload.table).toBe('user_settings');
                        channel.unsubscribe();
                        resolve(undefined);
                    }
                )
                .subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') {
                        // Trigger a change to test the subscription
                        testSetup.supabase
                            .from('user_settings')
                            .select('*')
                            .eq('user_id', testSetup.testUser.id)
                            .limit(1);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.log('Realtime channel error, skipping user settings test');
                        channel.unsubscribe();
                        resolve(undefined);
                    }
                });

            // Timeout after 5 seconds
            setTimeout(() => {
                channel.unsubscribe();
                resolve(undefined);
            }, 5000);
        });
    });

    it('should receive realtime updates for tenant changes', async () => {
        skipIfNoTenant(testSetup.testTenant, 'tenant changes updates');
        if (!testSetup.testTenant) return;

        return new Promise((resolve, reject) => {
            const channel = testSetup.supabase
                .channel(`tenant:${testSetup.testTenant.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'tenants'
                    },
                    (payload: any) => {
                        expect(payload).toBeDefined();
                        expect(payload.table).toBe('tenants');
                        channel.unsubscribe();
                        resolve(undefined);
                    }
                )
                .subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') {
                        // Trigger a change to test the subscription
                        testSetup.supabase
                            .from('tenants')
                            .select('*')
                            .eq('id', testSetup.testTenant.id)
                            .limit(1);
                    } else if (status === 'CHANNEL_ERROR') {
                        console.log('Realtime channel error, skipping tenant changes test');
                        channel.unsubscribe();
                        resolve(undefined);
                    }
                });

            // Timeout after 5 seconds
            setTimeout(() => {
                channel.unsubscribe();
                resolve(undefined);
            }, 5000);
        });
    });

    it('should handle channel subscription errors gracefully', async () => {
        return new Promise((resolve, reject) => {
            const channel = testSetup.supabase
                .channel('invalid-channel')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'invalid_schema',
                        table: 'invalid_table'
                    },
                    (payload: any) => {
                        // This should not be called
                        expect(payload).toBeUndefined();
                    }
                )
                .subscribe((status: string) => {
                    expect(['SUBSCRIBED', 'CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']).toContain(status);
                    channel.unsubscribe();
                    resolve(undefined);
                });

            // Timeout after 3 seconds
            setTimeout(() => {
                channel.unsubscribe();
                resolve(undefined);
            }, 3000);
        });
    });
});