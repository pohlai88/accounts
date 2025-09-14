// API Gateway Integration Tests
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createApiGateway, defaultGatewayConfig } from '../../packages/utils/src/api-gateway';
import { createCacheManager, defaultCacheConfig } from '../../packages/utils/src/cache';
import { createIdempotencyManager, defaultIdempotencyConfig } from '../../packages/utils/src/idempotency';

describe('API Gateway Integration', () => {
    let gateway: any;
    let cacheManager: any;
    let idempotencyManager: any;

    beforeAll(async () => {
        // Initialize cache manager
        cacheManager = createCacheManager({
            ...defaultCacheConfig,
            host: 'memory' // Use memory cache for testing
        });
        await cacheManager.connect();

        // Initialize idempotency manager
        idempotencyManager = createIdempotencyManager({
            ...defaultIdempotencyConfig,
            storage: 'memory'
        }, cacheManager);

        // Initialize API gateway
        gateway = createApiGateway({
            ...defaultGatewayConfig,
            baseUrl: 'http://localhost:3001'
        });
    });

    afterAll(async () => {
        await cacheManager.disconnect();
    });

    describe('Basic Routing', () => {
        it('should handle GET requests', async () => {
            // Register a test route
            gateway.route('/api/test', 'GET')
                .handler(async (req) => ({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: { message: 'Test successful' }
                }))
                .build();

            const request = {
                method: 'GET',
                path: '/api/test',
                headers: {},
                query: {}
            };

            const response = await gateway.processRequest(request);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Test successful');
        });

        it('should handle POST requests', async () => {
            gateway.route('/api/test', 'POST')
                .handler(async (req) => ({
                    status: 201,
                    headers: { 'Content-Type': 'application/json' },
                    body: { message: 'Created', data: req.body }
                }))
                .build();

            const request = {
                method: 'POST',
                path: '/api/test',
                headers: { 'Content-Type': 'application/json' },
                query: {},
                body: { test: 'data' }
            };

            const response = await gateway.processRequest(request);

            expect(response.status).toBe(201);
            expect(response.body.data.test).toBe('data');
        });

        it('should return 404 for unknown routes', async () => {
            const request = {
                method: 'GET',
                path: '/api/unknown',
                headers: {},
                query: {}
            };

            const response = await gateway.processRequest(request);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Route not found');
        });
    });

    describe('Middleware Integration', () => {
        it('should apply CORS middleware', async () => {
            gateway.route('/api/cors-test', 'GET')
                .handler(async (req) => ({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: { message: 'CORS test' }
                }))
                .build();

            const request = {
                method: 'GET',
                path: '/api/cors-test',
                headers: {},
                query: {}
            };

            const response = await gateway.processRequest(request);

            expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
            expect(response.headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE, OPTIONS');
        });

        it('should apply logging middleware', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

            gateway.route('/api/log-test', 'GET')
                .handler(async (req) => ({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: { message: 'Log test' }
                }))
                .build();

            const request = {
                method: 'GET',
                path: '/api/log-test',
                headers: {},
                query: {}
            };

            await gateway.processRequest(request);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[API Gateway] GET /api/log-test - Start')
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Error Handling', () => {
        it('should handle handler errors gracefully', async () => {
            gateway.route('/api/error-test', 'GET')
                .handler(async (req) => {
                    throw new Error('Test error');
                })
                .build();

            const request = {
                method: 'GET',
                path: '/api/error-test',
                headers: {},
                query: {}
            };

            const response = await gateway.processRequest(request);

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Internal server error');
        });
    });
});
