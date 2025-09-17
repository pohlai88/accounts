// Unit Tests for API Client Business Logic
// Tests request handling, error management, and response processing

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, ApiError } from '@aibos/ui/lib/api-client';
import { testConfig, expectError } from '../../config/test-config';

describe('API Client', () => {
    let apiClient: ApiClient;
    let mockFetch: any;

    beforeEach(() => {
        apiClient = new ApiClient();

        // Mock fetch globally
        mockFetch = vi.fn();
        global.fetch = mockFetch;
    });

    describe('Request Handling', () => {
        it('should make GET request successfully', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'test' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', {
                method: 'GET',
            });

            expect(result).toEqual({ data: 'test' });
            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });

        it('should make POST request with body successfully', async () => {
            const mockResponse = {
                ok: true,
                status: 201,
                json: vi.fn().mockResolvedValue({ id: '123' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const requestData = { name: 'Test' };
            const result = await apiClient.request('/api/test', {
                method: 'POST',
                body: requestData,
            });

            expect(result).toEqual({ id: '123' });
            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
        });

        it('should make PUT request successfully', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ updated: true }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test/123', {
                method: 'PUT',
                body: { name: 'Updated' },
            });

            expect(result).toEqual({ updated: true });
            expect(mockFetch).toHaveBeenCalledWith('/api/test/123', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: 'Updated' }),
            });
        });

        it('should make DELETE request successfully', async () => {
            const mockResponse = {
                ok: true,
                status: 204,
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test/123', {
                method: 'DELETE',
            });

            expect(result).toEqual({});
            expect(mockFetch).toHaveBeenCalledWith('/api/test/123', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });

        it('should handle custom headers', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'test' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer token123',
                    'X-Custom-Header': 'custom-value',
                },
            });

            expect(result).toEqual({ data: 'test' });
            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer token123',
                    'X-Custom-Header': 'custom-value',
                },
            });
        });

        it('should handle query parameters', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'test' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', {
                method: 'GET',
                query: {
                    page: 1,
                    limit: 10,
                    search: 'test query',
                },
            });

            expect(result).toEqual({ data: 'test' });
            expect(mockFetch).toHaveBeenCalledWith('/api/test?page=1&limit=10&search=test%20query', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle HTTP error responses', async () => {
            const mockResponse = {
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: vi.fn().mockResolvedValue({ error: 'Invalid input' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await expect(apiClient.request('/api/test', { method: 'GET' }))
                .rejects.toThrow(ApiError);
        });

        it('should handle network errors', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            await expect(apiClient.request('/api/test', { method: 'GET' }))
                .rejects.toThrow('Network error');
        });

        it('should handle timeout errors', async () => {
            mockFetch.mockImplementation(() =>
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 100)
                )
            );

            await expect(apiClient.request('/api/test', {
                method: 'GET',
                timeout: 50,
            })).rejects.toThrow('Timeout');
        });

        it('should handle JSON parsing errors', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await expect(apiClient.request('/api/test', { method: 'GET' }))
                .rejects.toThrow('Invalid JSON');
        });

        it('should handle 401 Unauthorized errors', async () => {
            const mockResponse = {
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: vi.fn().mockResolvedValue({ error: 'Authentication required' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await expect(apiClient.request('/api/test', { method: 'GET' }))
                .rejects.toThrow(ApiError);
        });

        it('should handle 403 Forbidden errors', async () => {
            const mockResponse = {
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                json: vi.fn().mockResolvedValue({ error: 'Access denied' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await expect(apiClient.request('/api/test', { method: 'GET' }))
                .rejects.toThrow(ApiError);
        });

        it('should handle 404 Not Found errors', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: vi.fn().mockResolvedValue({ error: 'Resource not found' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await expect(apiClient.request('/api/test', { method: 'GET' }))
                .rejects.toThrow(ApiError);
        });

        it('should handle 500 Internal Server errors', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: vi.fn().mockResolvedValue({ error: 'Server error' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await expect(apiClient.request('/api/test', { method: 'GET' }))
                .rejects.toThrow(ApiError);
        });
    });

    describe('Response Processing', () => {
        it('should process successful response', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'test', count: 5 }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', { method: 'GET' });

            expect(result).toEqual({ data: 'test', count: 5 });
        });

        it('should handle empty response', async () => {
            const mockResponse = {
                ok: true,
                status: 204,
                json: vi.fn().mockResolvedValue({}),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', { method: 'DELETE' });

            expect(result).toEqual({});
        });

        it('should handle response with pagination', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    data: ['item1', 'item2'],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 25,
                        totalPages: 3,
                    },
                }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', { method: 'GET' });

            expect(result).toEqual({
                data: ['item1', 'item2'],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 25,
                    totalPages: 3,
                },
            });
        });

        it('should handle response with metadata', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    data: 'test',
                    metadata: {
                        timestamp: '2024-01-01T00:00:00Z',
                        version: '1.0.0',
                    },
                }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', { method: 'GET' });

            expect(result).toEqual({
                data: 'test',
                metadata: {
                    timestamp: '2024-01-01T00:00:00Z',
                    version: '1.0.0',
                },
            });
        });
    });

    describe('Request Configuration', () => {
        it('should set default headers', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'test' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await apiClient.request('/api/test', { method: 'GET' });

            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        });

        it('should override default headers', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'test' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            await apiClient.request('/api/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/xml',
                },
            });

            expect(mockFetch).toHaveBeenCalledWith('/api/test', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/xml',
                },
            });
        });

        it('should handle request timeout', async () => {
            mockFetch.mockImplementation(() =>
                new Promise((resolve) =>
                    setTimeout(() => resolve({
                        ok: true,
                        status: 200,
                        json: vi.fn().mockResolvedValue({ data: 'test' }),
                    }), 200)
                )
            );

            const result = await apiClient.request('/api/test', {
                method: 'GET',
                timeout: 300,
            });

            expect(result).toEqual({ data: 'test' });
        });

        it('should handle request retries', async () => {
            let callCount = 0;
            mockFetch.mockImplementation(() => {
                callCount++;
                if (callCount < 3) {
                    return Promise.reject(new Error('Network error'));
                }
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: vi.fn().mockResolvedValue({ data: 'test' }),
                });
            });

            const result = await apiClient.request('/api/test', {
                method: 'GET',
                retries: 3,
                retryDelay: 100,
            });

            expect(result).toEqual({ data: 'test' });
            expect(callCount).toBe(3);
        });
    });

    describe('Specific API Methods', () => {
        it('should handle invoice CRUD operations', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ id: '123', amount: 100 }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            // Test GET
            const getResult = await apiClient.getInvoices();
            expect(getResult).toEqual({ id: '123', amount: 100 });

            // Test POST
            const postResult = await apiClient.createInvoice({ amount: 100 });
            expect(postResult).toEqual({ id: '123', amount: 100 });

            // Test PUT
            const putResult = await apiClient.updateInvoice('123', { amount: 200 });
            expect(putResult).toEqual({ id: '123', amount: 100 });

            // Test DELETE
            const deleteResult = await apiClient.deleteInvoice('123');
            expect(deleteResult).toEqual({ id: '123', amount: 100 });
        });

        it('should handle bill CRUD operations', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ id: '123', amount: 100 }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            // Test GET
            const getResult = await apiClient.getBills();
            expect(getResult).toEqual({ id: '123', amount: 100 });

            // Test POST
            const postResult = await apiClient.createBill({ amount: 100 });
            expect(postResult).toEqual({ id: '123', amount: 100 });

            // Test PUT
            const putResult = await apiClient.updateBill('123', { amount: 200 });
            expect(putResult).toEqual({ id: '123', amount: 100 });

            // Test DELETE
            const deleteResult = await apiClient.deleteBill('123');
            expect(deleteResult).toEqual({ id: '123', amount: 100 });
        });

        it('should handle payment CRUD operations', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ id: '123', amount: 100 }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            // Test GET
            const getResult = await apiClient.getPayments();
            expect(getResult).toEqual({ id: '123', amount: 100 });

            // Test POST
            const postResult = await apiClient.createPayment({ amount: 100 });
            expect(postResult).toEqual({ id: '123', amount: 100 });

            // Test PUT
            const putResult = await apiClient.updatePayment('123', { amount: 200 });
            expect(putResult).toEqual({ id: '123', amount: 100 });

            // Test DELETE
            const deleteResult = await apiClient.deletePayment('123');
            expect(deleteResult).toEqual({ id: '123', amount: 100 });
        });

        it('should handle bank account CRUD operations', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ id: '123', name: 'Test Bank' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            // Test GET
            const getResult = await apiClient.getBankAccounts();
            expect(getResult).toEqual({ id: '123', name: 'Test Bank' });

            // Test POST
            const postResult = await apiClient.createBankAccount({ name: 'Test Bank' });
            expect(postResult).toEqual({ id: '123', name: 'Test Bank' });

            // Test PUT
            const putResult = await apiClient.updateBankAccount('123', { name: 'Updated Bank' });
            expect(putResult).toEqual({ id: '123', name: 'Test Bank' });

            // Test DELETE
            const deleteResult = await apiClient.deleteBankAccount('123');
            expect(deleteResult).toEqual({ id: '123', name: 'Test Bank' });
        });
    });

    describe('Performance Testing', () => {
        it('should complete request within performance threshold', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'test' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const startTime = performance.now();
            const result = await apiClient.request('/api/test', { method: 'GET' });
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result).toEqual({ data: 'test' });
        });

        it('should handle concurrent requests efficiently', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: 'test' }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const startTime = performance.now();
            const promises = Array.from({ length: 10 }, () =>
                apiClient.request('/api/test', { method: 'GET' })
            );
            const results = await Promise.all(promises);
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95 * 2);
            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(result).toEqual({ data: 'test' });
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large response', async () => {
            const largeData = Array.from({ length: 10000 }, (_, i) => ({ id: i, data: 'test' }));
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({ data: largeData }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', { method: 'GET' });

            expect(result.data).toHaveLength(10000);
        });

        it('should handle response with special characters', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    data: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
                }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', { method: 'GET' });

            expect(result.data).toBe('Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?');
        });

        it('should handle response with null values', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    data: null,
                    count: 0,
                    items: [],
                }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', { method: 'GET' });

            expect(result).toEqual({
                data: null,
                count: 0,
                items: [],
            });
        });

        it('should handle response with undefined values', async () => {
            const mockResponse = {
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    data: undefined,
                    count: undefined,
                    items: undefined,
                }),
            };
            mockFetch.mockResolvedValue(mockResponse);

            const result = await apiClient.request('/api/test', { method: 'GET' });

            expect(result).toEqual({
                data: undefined,
                count: undefined,
                items: undefined,
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle fetch not available', async () => {
            // @ts-ignore
            global.fetch = undefined;

            await expect(apiClient.request('/api/test', { method: 'GET' }))
                .rejects.toThrow('Fetch is not available');
        });

        it('should handle invalid URL', async () => {
            await expect(apiClient.request('invalid-url', { method: 'GET' }))
                .rejects.toThrow();
        });

        it('should handle invalid request options', async () => {
            await expect(apiClient.request('/api/test', {
                method: 'INVALID_METHOD'
            })).rejects.toThrow();
        });
    });
});
