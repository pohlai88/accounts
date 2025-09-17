[**AI-BOS Accounts API Documentation**](../../README.md)

***

[AI-BOS Accounts API Documentation](../../README.md) / @aibos/monitoring

# DOC-291: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/monitoring

Performance monitoring, metrics collection, and health checking for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/monitoring
```

## Core Features

- **Metrics Collection**: Performance, business, and system metrics
- **Health Checking**: System health monitoring and alerts
- **Logging**: Structured logging with correlation IDs
- **Tracing**: Distributed tracing and observability
- **Axiom Integration**: Log aggregation and analysis
- **Real-time Monitoring**: Live metrics and dashboards
- **Alert Management**: Configurable alerts and notifications

## Quick Start

```typescript
import { 
  MetricsCollector,
  HealthChecker,
  Logger,
  TracingManager
} from "@aibos/monitoring";

// Metrics collection
const metricsCollector = new MetricsCollector({
  axiom: {
    dataset: 'production-metrics',
    token: process.env.AXIOM_TOKEN,
    orgId: process.env.AXIOM_ORG_ID
  }
});

// Record metrics
metricsCollector.recordMetric('api.response_time', 150, 'milliseconds');
metricsCollector.recordMetric('user.actions', 1, 'count');

// Health checking
const healthChecker = new HealthChecker();
const health = await healthChecker.checkHealth();

// Logging
const logger = new Logger({
  level: 'info',
  enableConsole: true,
  enableFile: true
});

logger.info('Application started', { version: '1.0.0' });
```

## Metrics Collection

### Performance Metrics

```typescript
import { MetricsCollector } from "@aibos/monitoring";

const metricsCollector = new MetricsCollector({
  axiom: {
    dataset: 'production-metrics',
    token: process.env.AXIOM_TOKEN,
    orgId: process.env.AXIOM_ORG_ID
  },
  metrics: {
    sampleRate: 1.0,
    retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
    enableRealTime: true
  }
});

// Record performance metrics
metricsCollector.recordMetric('api.response_time', 150, 'milliseconds', {
  endpoint: '/api/invoices',
  method: 'POST'
});

// Record business metrics
metricsCollector.recordMetric('invoice.created', 1, 'count', {
  tenantId: 'tenant_123',
  amount: 1000,
  currency: 'USD'
});

// Record system metrics
metricsCollector.recordMetric('system.cpu_usage', 45.2, 'percent');
metricsCollector.recordMetric('system.memory_usage', 1024, 'mb');
```

### Custom Metrics

```typescript
import { CustomMetricsCollector } from "@aibos/monitoring";

const customCollector = new CustomMetricsCollector({
  enableHistograms: true,
  enableCounters: true,
  enableGauges: true
});

// Histogram for response times
customCollector.recordHistogram('api.response_time_histogram', 150, {
  endpoint: '/api/invoices',
  method: 'POST'
});

// Counter for events
customCollector.incrementCounter('user.login', {
  tenantId: 'tenant_123',
  userType: 'admin'
});

// Gauge for current values
customCollector.setGauge('active.users', 42, {
  tenantId: 'tenant_123'
});
```

## Health Checking

### System Health

```typescript
import { HealthChecker } from "@aibos/monitoring";

const healthChecker = new HealthChecker({
  checks: [
    'database',
    'redis',
    'external_apis',
    'disk_space',
    'memory'
  ],
  timeout: 5000,
  interval: 30000
});

// Check overall health
const health = await healthChecker.checkHealth();

if (health.status === 'healthy') {
  console.log('System is healthy');
} else {
  console.error('System health issues:', health.issues);
}

// Check specific component
const dbHealth = await healthChecker.checkComponent('database');

// Register custom health check
healthChecker.registerCheck('custom_service', async () => {
  try {
    await customService.ping();
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
});
```

### Application Health

```typescript
import { ApplicationHealthChecker } from "@aibos/monitoring";

const appHealthChecker = new ApplicationHealthChecker({
  enableReadinessCheck: true,
  enableLivenessCheck: true,
  enableStartupCheck: true
});

// Readiness check
const readiness = await appHealthChecker.checkReadiness();

// Liveness check
const liveness = await appHealthChecker.checkLiveness();

// Startup check
const startup = await appHealthChecker.checkStartup();
```

## Logging

### Structured Logging

```typescript
import { Logger } from "@aibos/monitoring";

const logger = new Logger({
  level: 'info',
  enableConsole: true,
  enableFile: true,
  enableAxiom: true,
  correlationId: true
});

// Basic logging
logger.info('User logged in', {
  userId: 'user_123',
  tenantId: 'tenant_123',
  ipAddress: '192.168.1.1'
});

// Error logging
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  context: 'database_connection'
});

// Performance logging
logger.info('API request completed', {
  endpoint: '/api/invoices',
  method: 'POST',
  duration: 150,
  statusCode: 200
});
```

### Log Aggregation

```typescript
import { LogAggregator } from "@aibos/monitoring";

const logAggregator = new LogAggregator({
  axiom: {
    dataset: 'application-logs',
    token: process.env.AXIOM_TOKEN,
    orgId: process.env.AXIOM_ORG_ID
  },
  batchSize: 100,
  flushInterval: 5000
});

// Send logs to Axiom
await logAggregator.sendLogs([
  {
    timestamp: new Date(),
    level: 'info',
    message: 'User action completed',
    metadata: { userId: 'user_123' }
  }
]);
```

## Tracing

### Distributed Tracing

```typescript
import { TracingManager } from "@aibos/monitoring";

const tracingManager = new TracingManager({
  serviceName: 'aibos-accounts',
  enableSampling: true,
  sampleRate: 0.1,
  enableAxiom: true
});

// Start trace
const trace = tracingManager.startTrace('invoice_creation', {
  userId: 'user_123',
  tenantId: 'tenant_123'
});

// Add span
const span = trace.addSpan('validate_invoice', {
  invoiceId: 'inv_001'
});

// Add events
span.addEvent('validation_started');
span.addEvent('validation_completed');

// Finish span
span.finish();

// Finish trace
trace.finish();
```

### Performance Tracing

```typescript
import { PerformanceTracer } from "@aibos/monitoring";

const performanceTracer = new PerformanceTracer({
  enableWebVitals: true,
  enableCustomMetrics: true
});

// Trace function execution
const result = await performanceTracer.traceFunction(
  'processInvoice',
  async () => {
    return await processInvoice(invoiceData);
  },
  {
    invoiceId: 'inv_001',
    tenantId: 'tenant_123'
  }
);

// Trace database query
const queryResult = await performanceTracer.traceQuery(
  'getInvoices',
  async () => {
    return await db.select().from(invoices);
  },
  {
    tenantId: 'tenant_123',
    filters: { status: 'paid' }
  }
);
```

## Alert Management

### Alert Configuration

```typescript
import { AlertManager } from "@aibos/monitoring";

const alertManager = new AlertManager({
  enableSlack: true,
  enableEmail: true,
  enableWebhook: true
});

// Configure alert
alertManager.configureAlert({
  name: 'high_error_rate',
  condition: 'error_rate > 0.05',
  threshold: 0.05,
  duration: '5m',
  channels: ['slack', 'email'],
  severity: 'critical'
});

// Configure alert
alertManager.configureAlert({
  name: 'slow_response_time',
  condition: 'response_time > 1000',
  threshold: 1000,
  duration: '2m',
  channels: ['slack'],
  severity: 'warning'
});
```

### Alert Notifications

```typescript
import { AlertNotifier } from "@aibos/monitoring";

const alertNotifier = new AlertNotifier({
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: '#alerts'
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  }
});

// Send alert
await alertNotifier.sendAlert({
  alertName: 'high_error_rate',
  severity: 'critical',
  message: 'Error rate exceeded threshold',
  metadata: {
    currentRate: 0.08,
    threshold: 0.05,
    duration: '5m'
  }
});
```

## Real-time Monitoring

### Live Metrics Dashboard

```typescript
import { LiveMetricsDashboard } from "@aibos/monitoring";

const dashboard = new LiveMetricsDashboard({
  enableWebSocket: true,
  updateInterval: 1000,
  metrics: [
    'api.response_time',
    'user.actions',
    'system.cpu_usage',
    'system.memory_usage'
  ]
});

// Get live metrics
const liveMetrics = await dashboard.getLiveMetrics();

// Subscribe to metrics updates
dashboard.subscribeToMetrics((metrics) => {
  console.log('Live metrics:', metrics);
});
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from "@aibos/monitoring";

const performanceMonitor = new PerformanceMonitor({
  enableWebVitals: true,
  enableCustomMetrics: true,
  enableRealTimeAlerts: true
});

// Monitor page load
performanceMonitor.monitorPageLoad('/invoices', {
  tenantId: 'tenant_123',
  userId: 'user_123'
});

// Monitor API calls
performanceMonitor.monitorApiCall('/api/invoices', {
  method: 'POST',
  duration: 150,
  statusCode: 200
});
```

## Configuration

### Environment Variables

```env
# Axiom Configuration
AXIOM_DATASET=production-metrics
AXIOM_TOKEN=your_axiom_token
AXIOM_ORG_ID=your_org_id

# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_SAMPLE_RATE=1.0
HEALTH_CHECK_INTERVAL=30000
ALERT_ENABLED=true

# Logging Configuration
LOG_LEVEL=info
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
LOG_ENABLE_AXIOM=true

# Tracing Configuration
TRACING_ENABLED=true
TRACING_SAMPLE_RATE=0.1
TRACING_SERVICE_NAME=aibos-accounts
```

### Monitoring Policies

```typescript
const monitoringPolicies = {
  metrics: {
    retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
    sampleRate: 1.0,
    enableRealTime: true
  },
  alerts: {
    enableSlack: true,
    enableEmail: true,
    enableWebhook: true,
    escalationPolicy: {
      warning: ['slack'],
      critical: ['slack', 'email', 'webhook']
    }
  },
  healthChecks: {
    interval: 30000,
    timeout: 5000,
    retries: 3
  }
};
```

## Testing

```bash
# Run monitoring tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run performance tests
pnpm test:performance
```

## Dependencies

- **@axiomhq/js**: Axiom integration
- **@axiomhq/winston**: Winston integration
- **prom-client**: Prometheus metrics
- **winston**: Logging framework
- **opentelemetry**: Distributed tracing

## Performance Considerations

- **Metrics Batching**: Metrics are batched for efficiency
- **Log Aggregation**: Logs are aggregated to reduce overhead
- **Sampling**: Tracing uses sampling to reduce performance impact
- **Caching**: Health check results are cached

## Security

- **Data Privacy**: Sensitive data is filtered from logs
- **Access Control**: Monitoring data access is controlled
- **Encryption**: Logs and metrics are encrypted in transit
- **Audit Trail**: All monitoring activities are logged

## Error Handling

```typescript
import { MonitoringError, MetricsError, HealthCheckError } from "@aibos/monitoring";

try {
  const result = await metricsCollector.recordMetric('test.metric', 1);
} catch (error) {
  if (error instanceof MetricsError) {
    // Handle metrics errors
    console.error("Metrics error:", error.message);
  } else if (error instanceof HealthCheckError) {
    // Handle health check errors
    console.error("Health check error:", error.message);
  } else if (error instanceof MonitoringError) {
    // Handle monitoring errors
    console.error("Monitoring error:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new monitoring features
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.
