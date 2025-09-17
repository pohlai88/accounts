# DOC-283: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/api

Standalone API server for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/api
```

## Core Features

- **Standalone Server**: Independent API server
- **Express Framework**: Fast and lightweight web framework
- **Middleware Support**: Comprehensive middleware stack
- **Route Management**: Organized route handling
- **Error Handling**: Centralized error handling
- **Security**: Security headers and protection
- **Monitoring**: Request/response monitoring
- **Documentation**: Auto-generated API documentation

## Quick Start

```typescript
import { ApiServer, Router } from "@aibos/api";

// Initialize API server
const apiServer = new ApiServer({
  port: 3000,
  host: '0.0.0.0',
  middleware: [
    'cors',
    'helmet',
    'compression',
    'rateLimit',
    'auth',
    'validation'
  ]
});

// Add routes
const router = new Router();
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

apiServer.use('/api', router);

// Start server
await apiServer.start();
```

## Server Configuration

### Basic Configuration

```typescript
import { ApiServer } from "@aibos/api";

const apiServer = new ApiServer({
  port: 3000,
  host: '0.0.0.0',
  timeout: 30000,
  keepAlive: true,
  keepAliveTimeout: 5000,
  maxKeepAliveRequests: 100
});

// Start server
await apiServer.start();
```

### Advanced Configuration

```typescript
const apiServer = new ApiServer({
  port: 3000,
  host: '0.0.0.0',
  timeout: 30000,
  keepAlive: true,
  keepAliveTimeout: 5000,
  maxKeepAliveRequests: 100,
  middleware: [
    'cors',
    'helmet',
    'compression',
    'rateLimit',
    'auth',
    'validation',
    'logging',
    'metrics'
  ],
  security: {
    enableCORS: true,
    enableHelmet: true,
    enableRateLimit: true,
    enableCompression: true
  },
  monitoring: {
    enableMetrics: true,
    enableLogging: true,
    enableHealthChecks: true
  }
});
```

## Route Management

### Basic Routes

```typescript
import { Router } from "@aibos/api";

const router = new Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Status route
router.get('/status', (req, res) => {
  res.json({ 
    status: 'running',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  });
});

// Use router
apiServer.use('/api', router);
```

### Resource Routes

```typescript
import { ResourceRouter } from "@aibos/api";

const invoiceRouter = new ResourceRouter({
  basePath: '/invoices',
  controller: invoiceController,
  middleware: ['auth', 'validation'],
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'getInvoices',
      middleware: ['pagination', 'filtering']
    },
    {
      method: 'POST',
      path: '/',
      handler: 'createInvoice',
      middleware: ['validation', 'auth']
    },
    {
      method: 'GET',
      path: '/:id',
      handler: 'getInvoice',
      middleware: ['auth']
    },
    {
      method: 'PUT',
      path: '/:id',
      handler: 'updateInvoice',
      middleware: ['validation', 'auth']
    },
    {
      method: 'DELETE',
      path: '/:id',
      handler: 'deleteInvoice',
      middleware: ['auth']
    }
  ]
});

// Use resource router
apiServer.use('/api', invoiceRouter);
```

## Middleware

### CORS Middleware

```typescript
import { CorsMiddleware } from "@aibos/api";

const corsMiddleware = new CorsMiddleware({
  origin: ['https://app.aibos.com', 'https://admin.aibos.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

apiServer.use(corsMiddleware);
```

### Helmet Middleware

```typescript
import { HelmetMiddleware } from "@aibos/api";

const helmetMiddleware = new HelmetMiddleware({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.axiom.co"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

apiServer.use(helmetMiddleware);
```

### Compression Middleware

```typescript
import { CompressionMiddleware } from "@aibos/api";

const compressionMiddleware = new CompressionMiddleware({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
});

apiServer.use(compressionMiddleware);
```

### Rate Limiting Middleware

```typescript
import { RateLimitMiddleware } from "@aibos/api";

const rateLimitMiddleware = new RateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

apiServer.use(rateLimitMiddleware);
```

### Authentication Middleware

```typescript
import { AuthMiddleware } from "@aibos/api";

const authMiddleware = new AuthMiddleware({
  jwtSecret: process.env.JWT_SECRET,
  excludePaths: ['/api/health', '/api/status', '/api/auth/login'],
  tokenHeader: 'Authorization',
  tokenPrefix: 'Bearer '
});

apiServer.use(authMiddleware);
```

### Validation Middleware

```typescript
import { ValidationMiddleware } from "@aibos/api";

const validationMiddleware = new ValidationMiddleware({
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

apiServer.use(validationMiddleware);
```

## Error Handling

### Global Error Handler

```typescript
import { ErrorHandler } from "@aibos/api";

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
    },
    'NOT_FOUND_ERROR': {
      status: 404,
      message: 'Resource not found'
    },
    'INTERNAL_ERROR': {
      status: 500,
      message: 'Internal server error'
    }
  }
});

apiServer.use(errorHandler);
```

### Custom Error Classes

```typescript
import { 
  ApiError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  NotFoundError 
} from "@aibos/api";

// Validation error
throw new ValidationError('Invalid input data', {
  field: 'email',
  value: 'invalid-email',
  constraint: 'email'
});

// Authentication error
throw new AuthenticationError('Invalid token', {
  reason: 'expired_token'
});

// Authorization error
throw new AuthorizationError('Insufficient permissions', {
  resource: 'invoices',
  action: 'create'
});

// Not found error
throw new NotFoundError('Invoice not found', {
  id: 'inv_001'
});
```

## Monitoring

### Metrics Collection

```typescript
import { MetricsCollector } from "@aibos/api";

const metricsCollector = new MetricsCollector({
  enableMetrics: true,
  metrics: [
    'request_count',
    'request_duration',
    'response_size',
    'error_rate',
    'active_connections'
  ]
});

apiServer.use(metricsCollector);

// Get metrics
const metrics = await metricsCollector.getMetrics();
console.log('Request count:', metrics.requestCount);
console.log('Average duration:', metrics.avgDuration);
console.log('Error rate:', metrics.errorRate);
```

### Health Checks

```typescript
import { HealthChecker } from "@aibos/api";

const healthChecker = new HealthChecker({
  checks: [
    {
      name: 'database',
      check: async () => {
        try {
          await database.ping();
          return { status: 'healthy' };
        } catch (error) {
          return { status: 'unhealthy', error: error.message };
        }
      }
    },
    {
      name: 'redis',
      check: async () => {
        try {
          await redis.ping();
          return { status: 'healthy' };
        } catch (error) {
          return { status: 'unhealthy', error: error.message };
        }
      }
    }
  ]
});

// Health check endpoint
router.get('/health', async (req, res) => {
  const health = await healthChecker.checkHealth();
  res.json(health);
});
```

### Logging

```typescript
import { Logger } from "@aibos/api";

const logger = new Logger({
  level: 'info',
  enableConsole: true,
  enableFile: true,
  enableAxiom: true,
  format: 'json'
});

// Use logger
logger.info('API server started', {
  port: 3000,
  environment: process.env.NODE_ENV
});

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack
});
```

## Security

### Security Headers

```typescript
import { SecurityHeaders } from "@aibos/api";

const securityHeaders = new SecurityHeaders({
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
});

apiServer.use(securityHeaders);
```

### Input Validation

```typescript
import { InputValidator } from "@aibos/api";

const inputValidator = new InputValidator({
  schemas: {
    '/api/invoices': {
      POST: invoiceCreateSchema,
      PUT: invoiceUpdateSchema
    }
  },
  options: {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  }
});

apiServer.use(inputValidator);
```

## Documentation

### API Documentation

```typescript
import { ApiDocumentation } from "@aibos/api";

const apiDocumentation = new ApiDocumentation({
  title: 'AI-BOS Accounting API',
  version: '1.0.0',
  description: 'Comprehensive accounting API for the AI-BOS platform',
  baseUrl: 'https://api.aibos.com',
  paths: [
    '/api/invoices',
    '/api/bills',
    '/api/payments',
    '/api/reports'
  ]
});

// Generate OpenAPI spec
const openApiSpec = await apiDocumentation.generateOpenApiSpec();

// Serve documentation
router.get('/docs', (req, res) => {
  res.json(openApiSpec);
});
```

### Route Documentation

```typescript
import { RouteDocumentation } from "@aibos/api";

const routeDocumentation = new RouteDocumentation({
  enableAutoGeneration: true,
  includeExamples: true,
  includeSchemas: true
});

// Document route
routeDocumentation.documentRoute({
  method: 'POST',
  path: '/api/invoices',
  summary: 'Create a new invoice',
  description: 'Creates a new invoice with the provided data',
  tags: ['Invoices'],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: invoiceCreateSchema,
        example: {
          customerId: 'cust_123',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-01',
          dueDate: '2024-01-31',
          currency: 'USD',
          lines: [
            {
              accountId: 'acc_001',
              description: 'Services rendered',
              quantity: 1,
              unitPrice: 1000,
              taxRate: 0.1
            }
          ]
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Invoice created successfully',
      content: {
        'application/json': {
          schema: invoiceSchema
        }
      }
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: validationErrorSchema
        }
      }
    }
  }
});
```

## Configuration

### Environment Variables

```env
# Server Configuration
API_PORT=3000
API_HOST=0.0.0.0
API_TIMEOUT=30000
API_KEEP_ALIVE=true

# Security Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://app.aibos.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring Configuration
ENABLE_METRICS=true
ENABLE_LOGGING=true
ENABLE_HEALTH_CHECKS=true
LOG_LEVEL=info

# Documentation Configuration
ENABLE_DOCS=true
DOCS_PATH=/docs
OPENAPI_SPEC_PATH=/api-docs
```

### API Configuration

```typescript
const apiConfig = {
  server: {
    port: parseInt(process.env.API_PORT || '3000'),
    host: process.env.API_HOST || '0.0.0.0',
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    keepAlive: process.env.API_KEEP_ALIVE === 'true'
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['https://app.aibos.com'],
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    }
  },
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableLogging: process.env.ENABLE_LOGGING === 'true',
    enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS === 'true',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  documentation: {
    enableDocs: process.env.ENABLE_DOCS === 'true',
    docsPath: process.env.DOCS_PATH || '/docs',
    openApiSpecPath: process.env.OPENAPI_SPEC_PATH || '/api-docs'
  }
};
```

## Testing

```bash
# Run API tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration
```

## Dependencies

- **express**: Web framework
- **cors**: CORS middleware
- **helmet**: Security middleware
- **compression**: Compression middleware
- **express-rate-limit**: Rate limiting
- **jose**: JWT handling
- **zod**: Validation
- **winston**: Logging

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
  ApiError, 
  ValidationError, 
  AuthenticationError,
  AuthorizationError,
  NotFoundError 
} from "@aibos/api";

try {
  const result = await apiServer.handleRequest(request);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.error("Validation failed:", error.details);
  } else if (error instanceof AuthenticationError) {
    // Handle authentication errors
    console.error("Authentication failed:", error.message);
  } else if (error instanceof AuthorizationError) {
    // Handle authorization errors
    console.error("Authorization failed:", error.message);
  } else if (error instanceof NotFoundError) {
    // Handle not found errors
    console.error("Resource not found:", error.message);
  } else if (error instanceof ApiError) {
    // Handle API errors
    console.error("API error:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new API features
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.

