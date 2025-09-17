[**AI-BOS Accounts API Documentation (Source)**](../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../README.md) / @aibos/api-gateway

# DOC-284: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/api-gateway

API gateway with middleware support for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/api-gateway
```

## Core Features

- **Request Routing**: Intelligent request routing and load balancing
- **Middleware Support**: Authentication, authorization, rate limiting
- **Request/Response Transformation**: Data transformation and validation
- **Error Handling**: Centralized error handling and logging
- **Monitoring**: Request/response monitoring and metrics
- **Caching**: Response caching and optimization
- **Security**: Security headers and protection
- **Circuit Breaker**: Fault tolerance and resilience

## Quick Start

```typescript
import { ApiGateway, MiddlewareStack } from "@aibos/api-gateway";

// Initialize API gateway
const apiGateway = new ApiGateway({
  port: 3000,
  routes: [
    {
      path: '/api/invoices',
      target: 'http://localhost:3001',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    },
    {
      path: '/api/bills',
      target: 'http://localhost:3002',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  ],
  middleware: [
    'auth',
    'rateLimit',
    'cors',
    'compression'
  ]
});

// Start gateway
await apiGateway.start();
```

## Routing

### Route Configuration

```typescript
import { RouteConfig, Router } from "@aibos/api-gateway";

const routeConfig: RouteConfig[] = [
  {
    path: '/api/invoices',
    target: 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    timeout: 30000,
    retries: 3
  },
  {
    path: '/api/bills',
    target: 'http://localhost:3002',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    timeout: 30000,
    retries: 3
  },
  {
    path: '/api/reports',
    target: 'http://localhost:3003',
    methods: ['GET'],
    timeout: 60000,
    retries: 2
  }
];

const router = new Router(routeConfig);
```

### Dynamic Routing

```typescript
import { DynamicRouter } from "@aibos/api-gateway";

const dynamicRouter = new DynamicRouter({
  serviceDiscovery: {
    type: 'consul',
    endpoint: 'http://localhost:8500'
  },
  loadBalancer: {
    algorithm: 'round-robin',
    healthCheck: true
  }
});

// Add route dynamically
await dynamicRouter.addRoute({
  path: '/api/payments',
  service: 'payment-service',
  methods: ['GET', 'POST']
});

// Remove route dynamically
await dynamicRouter.removeRoute('/api/payments');
```

## Middleware

### Authentication Middleware

```typescript
import { AuthMiddleware } from "@aibos/api-gateway";

const authMiddleware = new AuthMiddleware({
  jwtSecret: process.env.JWT_SECRET,
  excludePaths: ['/api/auth/login', '/api/auth/register'],
  tokenHeader: 'Authorization',
  tokenPrefix: 'Bearer '
});

// Use middleware
apiGateway.use(authMiddleware);
```

### Rate Limiting Middleware

```typescript
import { RateLimitMiddleware } from "@aibos/api-gateway";

const rateLimitMiddleware = new RateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => req.ip,
  skip: (req) => req.path.startsWith('/api/auth')
});

// Use middleware
apiGateway.use(rateLimitMiddleware);
```

### CORS Middleware

```typescript
import { CorsMiddleware } from "@aibos/api-gateway";

const corsMiddleware = new CorsMiddleware({
  origin: ['https://app.aibos.com', 'https://admin.aibos.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Use middleware
apiGateway.use(corsMiddleware);
```

### Compression Middleware

```typescript
import { CompressionMiddleware } from "@aibos/api-gateway";

const compressionMiddleware = new CompressionMiddleware({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
});

// Use middleware
apiGateway.use(compressionMiddleware);
```

## Request/Response Transformation

### Request Transformation

```typescript
import { RequestTransformer } from "@aibos/api-gateway";

const requestTransformer = new RequestTransformer({
  transforms: [
    {
      path: '/api/invoices',
      method: 'POST',
      transform: (req) => {
        // Add tenant context
        req.body.tenantId = req.user.tenantId;
        req.body.createdBy = req.user.id;
        return req;
      }
    }
  ]
});

// Use transformer
apiGateway.use(requestTransformer);
```

### Response Transformation

```typescript
import { ResponseTransformer } from "@aibos/api-gateway";

const responseTransformer = new ResponseTransformer({
  transforms: [
    {
      path: '/api/invoices',
      transform: (res) => {
        // Add metadata
        res.data.metadata = {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        };
        return res;
      }
    }
  ]
});

// Use transformer
apiGateway.use(responseTransformer);
```

## Error Handling

### Global Error Handler

```typescript
import { ErrorHandler } from "@aibos/api-gateway";

const errorHandler = new ErrorHandler({
  enableLogging: true,
  enableMetrics: true,
  customErrors: {
    'VALIDATION_ERROR': {
      status: 400,
      message: 'Validation failed'
    },
    'AUTHENTICATION_ERROR': {
      status: 401,
      message: 'Authentication failed'
    },
    'AUTHORIZATION_ERROR': {
      status: 403,
      message: 'Authorization failed'
    }
  }
});

// Use error handler
apiGateway.use(errorHandler);
```

### Circuit Breaker

```typescript
import { CircuitBreaker } from "@aibos/api-gateway";

const circuitBreaker = new CircuitBreaker({
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  monitoringPeriod: 10000
});

// Use circuit breaker
apiGateway.use(circuitBreaker);
```

## Monitoring

### Request Metrics

```typescript
import { MetricsCollector } from "@aibos/api-gateway";

const metricsCollector = new MetricsCollector({
  enableMetrics: true,
  metrics: [
    'request_count',
    'request_duration',
    'response_size',
    'error_rate'
  ]
});

// Use metrics collector
apiGateway.use(metricsCollector);

// Get metrics
const metrics = await metricsCollector.getMetrics();
console.log('Request count:', metrics.requestCount);
console.log('Average duration:', metrics.avgDuration);
console.log('Error rate:', metrics.errorRate);
```

### Health Checks

```typescript
import { HealthChecker } from "@aibos/api-gateway";

const healthChecker = new HealthChecker({
  checks: [
    {
      name: 'database',
      check: async () => {
        // Check database connection
        return await checkDatabaseConnection();
      }
    },
    {
      name: 'redis',
      check: async () => {
        // Check Redis connection
        return await checkRedisConnection();
      }
    }
  ]
});

// Use health checker
apiGateway.use(healthChecker);

// Get health status
const health = await healthChecker.getHealth();
console.log('Health status:', health.status);
```

## Caching

### Response Caching

```typescript
import { ResponseCache } from "@aibos/api-gateway";

const responseCache = new ResponseCache({
  cache: redisCache,
  ttl: 3600,
  keyGenerator: (req) => {
    return `cache:${req.method}:${req.path}:${req.query}`;
  },
  shouldCache: (req, res) => {
    return req.method === 'GET' && res.statusCode === 200;
  }
});

// Use response cache
apiGateway.use(responseCache);
```

### Cache Invalidation

```typescript
import { CacheInvalidator } from "@aibos/api-gateway";

const cacheInvalidator = new CacheInvalidator({
  cache: redisCache,
  patterns: [
    {
      path: '/api/invoices',
      method: 'POST',
      invalidate: ['cache:GET:/api/invoices:*']
    },
    {
      path: '/api/bills',
      method: 'PUT',
      invalidate: ['cache:GET:/api/bills:*']
    }
  ]
});

// Use cache invalidator
apiGateway.use(cacheInvalidator);
```

## Security

### Security Headers

```typescript
import { SecurityHeaders } from "@aibos/api-gateway";

const securityHeaders = new SecurityHeaders({
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'"
  }
});

// Use security headers
apiGateway.use(securityHeaders);
```

### Request Validation

```typescript
import { RequestValidator } from "@aibos/api-gateway";

const requestValidator = new RequestValidator({
  schemas: {
    '/api/invoices': {
      POST: invoiceCreateSchema,
      PUT: invoiceUpdateSchema
    },
    '/api/bills': {
      POST: billCreateSchema,
      PUT: billUpdateSchema
    }
  }
});

// Use request validator
apiGateway.use(requestValidator);
```

## Configuration

### Environment Variables

```env
# Gateway Configuration
GATEWAY_PORT=3000
GATEWAY_HOST=0.0.0.0
GATEWAY_TIMEOUT=30000
GATEWAY_RETRIES=3

# Service Configuration
INVOICE_SERVICE_URL=http://localhost:3001
BILL_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003

# Middleware Configuration
ENABLE_AUTH=true
ENABLE_RATE_LIMIT=true
ENABLE_CORS=true
ENABLE_COMPRESSION=true

# Monitoring Configuration
ENABLE_METRICS=true
ENABLE_HEALTH_CHECKS=true
ENABLE_CIRCUIT_BREAKER=true
```

### Gateway Configuration

```typescript
const gatewayConfig = {
  port: parseInt(process.env.GATEWAY_PORT || '3000'),
  host: process.env.GATEWAY_HOST || '0.0.0.0',
  timeout: parseInt(process.env.GATEWAY_TIMEOUT || '30000'),
  retries: parseInt(process.env.GATEWAY_RETRIES || '3'),
  routes: [
    {
      path: '/api/invoices',
      target: process.env.INVOICE_SERVICE_URL || 'http://localhost:3001',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    },
    {
      path: '/api/bills',
      target: process.env.BILL_SERVICE_URL || 'http://localhost:3002',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  ],
  middleware: [
    'auth',
    'rateLimit',
    'cors',
    'compression',
    'security',
    'validation'
  ]
};
```

## Testing

```bash
# Run gateway tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration
```

## Dependencies

- **express**: Web framework
- **cors**: CORS middleware
- **compression**: Compression middleware
- **helmet**: Security middleware
- **express-rate-limit**: Rate limiting
- **circuit-breaker**: Circuit breaker pattern
- **redis**: Caching layer

## Performance Considerations

- **Connection Pooling**: HTTP connections are pooled
- **Request Batching**: Requests are batched for efficiency
- **Response Compression**: Responses are compressed
- **Caching**: Responses are cached when appropriate
- **Load Balancing**: Requests are load balanced

## Security Considerations

- **Input Validation**: All inputs are validated
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Rate Limiting**: API abuse prevention
- **Security Headers**: Comprehensive security headers
- **CORS**: Cross-origin resource sharing

## Error Handling

```typescript
import { 
  GatewayError, 
  RoutingError, 
  MiddlewareError 
} from "@aibos/api-gateway";

try {
  const result = await apiGateway.route(request);
} catch (error) {
  if (error instanceof RoutingError) {
    // Handle routing errors
    console.error("Routing failed:", error.message);
  } else if (error instanceof MiddlewareError) {
    // Handle middleware errors
    console.error("Middleware failed:", error.message);
  } else if (error instanceof GatewayError) {
    // Handle gateway errors
    console.error("Gateway error:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new middleware
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.
