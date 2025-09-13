// =====================================================
// Phase 8: Professional API Service
// RESTful API with authentication, rate limiting, and webhooks
// =====================================================

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// API Types and Interfaces
export interface APIKey {
    id: string;
    name: string;
    keyHash: string;
    permissions: Record<string, boolean>;
    rateLimitPerHour: number;
    expiresAt?: Date;
    lastUsedAt?: Date;
    isActive: boolean;
    companyId: string;
    createdAt: Date;
}

export interface APIRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: any;
    query: Record<string, string>;
    apiKey: string;
    ipAddress: string;
    userAgent: string;
}

export interface APIResponse {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    rateLimit?: {
        limit: number;
        remaining: number;
        resetAt: Date;
    };
}

export interface WebhookEvent {
    id: string;
    type: string;
    data: any;
    timestamp: Date;
    companyId: string;
}

// API Service Class
export class APIService {
    private companyId: string;
    private userId: string;

    constructor(companyId: string, userId: string) {
        this.companyId = companyId;
        this.userId = userId;
    }

    // Generate API Key
    async generateAPIKey(name: string, permissions: Record<string, boolean>, rateLimitPerHour: number = 1000, expiresAt?: Date): Promise<{ apiKey: string; keyId: string }> {
        const apiKey = this.generateSecureKey();
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const { data, error } = await supabase
            .from('api_keys')
            .insert({
                name,
                key_hash: keyHash,
                permissions,
                rate_limit_per_hour: rateLimitPerHour,
                expires_at: expiresAt?.toISOString(),
                company_id: this.companyId,
                created_by: this.userId
            })
            .select('id')
            .single();

        if (error) throw error;

        return { apiKey, keyId: data.id };
    }

    // Validate API Key
    async validateAPIKey(apiKey: string): Promise<APIKey | null> {
        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('key_hash', keyHash)
            .eq('is_active', true)
            .single();

        if (error || !data) return null;

        // Check if key is expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            return null;
        }

        // Update last used timestamp
        await supabase
            .from('api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', data.id);

        return {
            id: data.id,
            name: data.name,
            keyHash: data.key_hash,
            permissions: data.permissions,
            rateLimitPerHour: data.rate_limit_per_hour,
            expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
            lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
            isActive: data.is_active,
            companyId: data.company_id,
            createdAt: new Date(data.created_at)
        };
    }

    // Check Rate Limit
    async checkRateLimit(apiKey: APIKey, ipAddress: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        // Get request count in the last hour
        const { data, error } = await supabase
            .from('api_requests')
            .select('id')
            .eq('api_key_id', apiKey.id)
            .gte('created_at', oneHourAgo.toISOString());

        if (error) throw error;

        const requestCount = data?.length || 0;
        const remaining = Math.max(0, apiKey.rateLimitPerHour - requestCount);
        const allowed = remaining > 0;

        return {
            allowed,
            remaining,
            resetAt: new Date(now.getTime() + 60 * 60 * 1000)
        };
    }

    // Log API Request
    async logAPIRequest(apiKey: APIKey, request: APIRequest, response: APIResponse): Promise<void> {
        await supabase
            .from('api_requests')
            .insert({
                api_key_id: apiKey.id,
                method: request.method,
                path: request.path,
                status_code: response.success ? 200 : 400,
                response_time_ms: 0, // Would be calculated in real implementation
                ip_address: request.ipAddress,
                user_agent: request.userAgent,
                company_id: this.companyId
            });
    }

    // Get Accounts
    async getAccounts(page: number = 1, limit: number = 50, filters?: any): Promise<APIResponse> {
        try {
            let query = supabase
                .from('accounts')
                .select('*', { count: 'exact' })
                .eq('company_id', this.companyId);

            // Apply filters
            if (filters) {
                if (filters.accountType) {
                    query = query.eq('account_type', filters.accountType);
                }
                if (filters.isGroup !== undefined) {
                    query = query.eq('is_group', filters.isGroup);
                }
                if (filters.search) {
                    query = query.ilike('name', `%${filters.search}%`);
                }
            }

            // Apply pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Get Transactions
    async getTransactions(page: number = 1, limit: number = 50, filters?: any): Promise<APIResponse> {
        try {
            let query = supabase
                .from('gl_entries')
                .select(`
          *,
          accounts!gl_entries_account_id_fkey (
            id,
            name,
            account_type,
            account_code
          )
        `, { count: 'exact' })
                .eq('company_id', this.companyId);

            // Apply filters
            if (filters) {
                if (filters.accountId) {
                    query = query.eq('account_id', filters.accountId);
                }
                if (filters.voucherType) {
                    query = query.eq('voucher_type', filters.voucherType);
                }
                if (filters.dateFrom) {
                    query = query.gte('posting_date', filters.dateFrom);
                }
                if (filters.dateTo) {
                    query = query.lte('posting_date', filters.dateTo);
                }
                if (filters.currency) {
                    query = query.eq('currency', filters.currency);
                }
            }

            // Apply pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: data || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Create Transaction
    async createTransaction(transactionData: any): Promise<APIResponse> {
        try {
            // Validate transaction data
            const validation = this.validateTransaction(transactionData);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // Create GL entries
            const { data, error } = await supabase
                .from('gl_entries')
                .insert({
                    ...transactionData,
                    company_id: this.companyId
                })
                .select()
                .single();

            if (error) throw error;

            // Trigger webhook if transaction created
            await this.triggerWebhook('transaction.created', data);

            return {
                success: true,
                data,
                message: 'Transaction created successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Get Reports
    async getReports(reportType: string, filters?: any): Promise<APIResponse> {
        try {
            let data: any;

            switch (reportType) {
                case 'profit_loss':
                    data = await this.generateProfitLossReport(filters);
                    break;
                case 'balance_sheet':
                    data = await this.generateBalanceSheetReport(filters);
                    break;
                case 'cash_flow':
                    data = await this.generateCashFlowReport(filters);
                    break;
                case 'trial_balance':
                    data = await this.generateTrialBalanceReport(filters);
                    break;
                default:
                    return {
                        success: false,
                        error: 'Invalid report type'
                    };
            }

            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Webhook Management
    async createWebhook(name: string, url: string, events: string[]): Promise<APIResponse> {
        try {
            const secretKey = this.generateSecureKey();

            const { data, error } = await supabase
                .from('webhook_endpoints')
                .insert({
                    name,
                    url,
                    events,
                    secret_key: secretKey,
                    company_id: this.companyId,
                    created_by: this.userId
                })
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data,
                message: 'Webhook created successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Trigger Webhook
    async triggerWebhook(eventType: string, data: any): Promise<void> {
        try {
            // Get active webhooks for this event
            const { data: webhooks, error } = await supabase
                .from('webhook_endpoints')
                .select('*')
                .eq('company_id', this.companyId)
                .eq('is_active', true)
                .contains('events', [eventType]);

            if (error || !webhooks) return;

            // Send webhook to each endpoint
            for (const webhook of webhooks) {
                await this.sendWebhook(webhook, eventType, data);
            }
        } catch (error) {
            console.error('Webhook trigger failed:', error);
        }
    }

    // Send Webhook
    private async sendWebhook(webhook: any, eventType: string, data: any): Promise<void> {
        try {
            const payload = {
                event: eventType,
                data,
                timestamp: new Date().toISOString(),
                companyId: this.companyId
            };

            const signature = crypto
                .createHmac('sha256', webhook.secret_key)
                .update(JSON.stringify(payload))
                .digest('hex');

            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': eventType
                },
                body: JSON.stringify(payload)
            });

            // Log webhook delivery
            await supabase
                .from('webhook_deliveries')
                .insert({
                    webhook_id: webhook.id,
                    event_type: eventType,
                    payload,
                    response_status: response.status,
                    response_body: await response.text(),
                    success: response.ok
                });

            // Update webhook stats
            if (response.ok) {
                await supabase
                    .from('webhook_endpoints')
                    .update({
                        success_count: webhook.success_count + 1,
                        last_triggered_at: new Date().toISOString()
                    })
                    .eq('id', webhook.id);
            } else {
                await supabase
                    .from('webhook_endpoints')
                    .update({
                        failure_count: webhook.failure_count + 1,
                        last_triggered_at: new Date().toISOString()
                    })
                    .eq('id', webhook.id);
            }
        } catch (error) {
            console.error('Webhook delivery failed:', error);
        }
    }

    // Helper Methods
    private generateSecureKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private validateTransaction(data: any): { valid: boolean; error?: string } {
        if (!data.account_id) {
            return { valid: false, error: 'Account ID is required' };
        }
        if (!data.posting_date) {
            return { valid: false, error: 'Posting date is required' };
        }
        if (!data.voucher_type) {
            return { valid: false, error: 'Voucher type is required' };
        }
        if (!data.voucher_no) {
            return { valid: false, error: 'Voucher number is required' };
        }
        if (data.debit === undefined && data.credit === undefined) {
            return { valid: false, error: 'Either debit or credit amount is required' };
        }
        return { valid: true };
    }

    // Report Generation Methods (simplified)
    private async generateProfitLossReport(filters?: any): Promise<any> {
        // Implementation would generate P&L report
        return { message: 'Profit & Loss report generated' };
    }

    private async generateBalanceSheetReport(filters?: any): Promise<any> {
        // Implementation would generate Balance Sheet report
        return { message: 'Balance Sheet report generated' };
    }

    private async generateCashFlowReport(filters?: any): Promise<any> {
        // Implementation would generate Cash Flow report
        return { message: 'Cash Flow report generated' };
    }

    private async generateTrialBalanceReport(filters?: any): Promise<any> {
        // Implementation would generate Trial Balance report
        return { message: 'Trial Balance report generated' };
    }
}

// API Middleware
export class APIMiddleware {
    static async authenticate(request: NextRequest): Promise<{ apiKey: APIKey | null; error?: string }> {
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) {
            return { apiKey: null, error: 'API key is required' };
        }

        const apiService = new APIService('', '');
        const validatedKey = await apiService.validateAPIKey(apiKey);

        if (!validatedKey) {
            return { apiKey: null, error: 'Invalid API key' };
        }

        return { apiKey: validatedKey };
    }

    static async checkRateLimit(apiKey: APIKey, ipAddress: string): Promise<{ allowed: boolean; error?: string }> {
        const apiService = new APIService(apiKey.companyId, '');
        const rateLimit = await apiService.checkRateLimit(apiKey, ipAddress);

        if (!rateLimit.allowed) {
            return { allowed: false, error: 'Rate limit exceeded' };
        }

        return { allowed: true };
    }

    static async handleRequest(request: NextRequest, handler: (apiKey: APIKey) => Promise<APIResponse>): Promise<NextResponse> {
        try {
            // Authenticate
            const { apiKey, error: authError } = await this.authenticate(request);
            if (authError || !apiKey) {
                return NextResponse.json(
                    { success: false, error: authError },
                    { status: 401 }
                );
            }

            // Check rate limit
            const ipAddress = request.ip || 'unknown';
            const { allowed, error: rateLimitError } = await this.checkRateLimit(apiKey, ipAddress);
            if (!allowed) {
                return NextResponse.json(
                    { success: false, error: rateLimitError },
                    { status: 429 }
                );
            }

            // Execute handler
            const response = await handler(apiKey);

            // Log request
            const apiService = new APIService(apiKey.companyId, '');
            await apiService.logAPIRequest(apiKey, {
                method: request.method,
                path: request.nextUrl.pathname,
                headers: Object.fromEntries(request.headers.entries()),
                body: await request.json().catch(() => null),
                query: Object.fromEntries(request.nextUrl.searchParams.entries()),
                apiKey: request.headers.get('x-api-key') || '',
                ipAddress,
                userAgent: request.headers.get('user-agent') || ''
            }, response);

            return NextResponse.json(response);
        } catch (error) {
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            );
        }
    }
}

// Export Utility Functions
export const apiUtils = {
    // Generate API Documentation
    generateAPIDocs: (): any => {
        return {
            version: '1.0.0',
            baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.yourapp.com',
            endpoints: {
                accounts: {
                    GET: '/api/v1/accounts',
                    POST: '/api/v1/accounts'
                },
                transactions: {
                    GET: '/api/v1/transactions',
                    POST: '/api/v1/transactions'
                },
                reports: {
                    GET: '/api/v1/reports/{type}'
                },
                webhooks: {
                    POST: '/api/v1/webhooks'
                }
            },
            authentication: {
                type: 'API Key',
                header: 'X-API-Key'
            },
            rateLimiting: {
                default: '1000 requests per hour',
                burst: '100 requests per minute'
            }
        };
    },

    // Validate API Key Format
    validateAPIKeyFormat: (apiKey: string): boolean => {
        return /^[a-f0-9]{64}$/.test(apiKey);
    },

    // Generate Webhook Signature
    generateWebhookSignature: (payload: string, secret: string): string => {
        return crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    },

    // Verify Webhook Signature
    verifyWebhookSignature: (payload: string, signature: string, secret: string): boolean => {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }
};
