# Monitoring — Performance & Error Monitoring Module

> **TL;DR**: V1 compliance monitoring utilities with performance tracking, error monitoring, and
> comprehensive observability.  
> **Owner**: @aibos/utils-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Performance monitoring and metrics collection
- Error tracking and reporting
- API metrics and response time tracking
- UI metrics and user interaction tracking
- Monitoring alerts and notifications
- V1 compliance monitoring

**Does NOT**:

- Handle authentication (delegated to @aibos/auth)
- Manage database operations (delegated to @aibos/db)
- Process business logic (delegated to @aibos/accounting)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web, @aibos/web-api, @aibos/accounting, external monitoring systems

## 2) Quick Links

- **Performance Monitor**: `performance-monitor.ts`
- **Error Tracker**: `error-tracker.ts`
- **Main Utils**: `../README.md`
- **Context Module**: `../context/README.md`
- **Audit Module**: `../audit/README.md`

## 3) Getting Started

```typescript
import {
  performanceMonitor,
  errorTracker,
  PerformanceMetrics,
  APIMetrics,
  UIMetrics,
  ErrorContext,
  ErrorEvent,
} from "@aibos/utils/monitoring";

// Performance monitoring
const metrics = performanceMonitor.startTimer("api-request");
// ... perform operation
metrics.endTimer();

// Error tracking
errorTracker.trackError({
  message: "Database connection failed",
  stack: error.stack,
  context: {
    userId: "user-123",
    operation: "create-journal",
    tenantId: "tenant-456",
  },
});
```

## 4) Architecture & Dependencies

**Dependencies**:

- Axiom for telemetry and monitoring
- Context management for monitoring context
- Audit service for monitoring logging

**Dependents**:

- @aibos/web for frontend monitoring
- @aibos/web-api for API monitoring
- @aibos/accounting for business logic monitoring

**Build Order**: After context and audit modules, before web integration

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/utils dev
pnpm --filter @aibos/utils test
```

**Testing**:

```bash
pnpm --filter @aibos/utils test src/monitoring/
```

**Linting**:

```bash
pnpm --filter @aibos/utils lint src/monitoring/
```

**Type Checking**:

```bash
pnpm --filter @aibos/utils typecheck
```

## 6) API Surface

**Exports**:

### Performance Monitor (`performance-monitor.ts`)

- `performanceMonitor` - Main performance monitoring instance
- `PerformanceMetrics` - Performance metrics interface
- `APIMetrics` - API metrics interface
- `UIMetrics` - UI metrics interface

### Error Tracker (`error-tracker.ts`)

- `errorTracker` - Main error tracking instance
- `ErrorContext` - Error context interface
- `ErrorEvent` - Error event interface
- `ErrorSummary` - Error summary interface

**Public Types**:

- `PerformanceMetrics` - Performance metrics
- `APIMetrics` - API metrics
- `UIMetrics` - UI metrics
- `ErrorContext` - Error context
- `ErrorEvent` - Error event
- `ErrorSummary` - Error summary

**Configuration**:

- Configurable monitoring thresholds
- Error tracking policies
- Performance alerting rules

## 7) Performance & Monitoring

**Bundle Size**: ~15KB minified  
**Performance Budget**: <5ms for performance tracking, <10ms for error tracking  
**Monitoring**: Axiom telemetry integration for monitoring operations

## 8) Security & Compliance

**Permissions**:

- Monitoring requires 'system' or 'admin' role
- Error tracking requires 'system' or 'admin' role
- Performance monitoring requires 'system' or 'admin' role

**Data Handling**:

- All monitoring data validated and sanitized
- Secure error context handling
- Audit trail for monitoring operations

**Compliance**:

- V1 compliance for monitoring operations
- SoD enforcement for monitoring access
- Security audit compliance

## 9) Usage Examples

### Performance Monitoring

```typescript
import { performanceMonitor, PerformanceMetrics } from "@aibos/utils/monitoring";

// API performance monitoring
const apiMetrics = performanceMonitor.startTimer("api-request", {
  endpoint: "/api/journals",
  method: "POST",
  userId: "user-123",
  tenantId: "tenant-456",
});

try {
  // Perform API operation
  const result = await createJournal(journalData);
  apiMetrics.endTimer({ success: true, recordCount: result.lines.length });
} catch (error) {
  apiMetrics.endTimer({ success: false, error: error.message });
  throw error;
}

// UI performance monitoring
const uiMetrics = performanceMonitor.startTimer("ui-interaction", {
  component: "JournalForm",
  action: "submit",
  userId: "user-123",
});

// Perform UI operation
await handleFormSubmit(formData);
uiMetrics.endTimer({ success: true });

// Database performance monitoring
const dbMetrics = performanceMonitor.startTimer("database-query", {
  query: "SELECT * FROM gl_journal",
  table: "gl_journal",
  operation: "SELECT",
});

const results = await db.query("SELECT * FROM gl_journal");
dbMetrics.endTimer({ success: true, recordCount: results.length });
```

### Error Tracking

```typescript
import { errorTracker, ErrorContext } from "@aibos/utils/monitoring";

// Basic error tracking
try {
  await riskyOperation();
} catch (error) {
  errorTracker.trackError({
    message: error.message,
    stack: error.stack,
    context: {
      userId: "user-123",
      operation: "create-journal",
      tenantId: "tenant-456",
      companyId: "company-789",
    },
  });
  throw error;
}

// Advanced error tracking with custom context
const errorContext: ErrorContext = {
  userId: "user-123",
  userRole: "accountant",
  tenantId: "tenant-456",
  companyId: "company-789",
  sessionId: "session-abc",
  requestId: "req-xyz",
  operation: "journal-posting",
  metadata: {
    journalNumber: "JE-001",
    lineCount: 2,
    totalAmount: 1000.0,
  },
};

errorTracker.trackError({
  message: "Journal posting failed",
  stack: error.stack,
  context: errorContext,
  severity: "high",
  category: "business-logic",
});

// Error summary and analytics
const errorSummary = await errorTracker.getErrorSummary({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
  userId: "user-123",
});

console.log("Error summary:", errorSummary);
console.log("Total errors:", errorSummary.totalErrors);
console.log("Error rate:", errorSummary.errorRate);
console.log("Most common errors:", errorSummary.commonErrors);
```

### API Metrics Tracking

```typescript
import { performanceMonitor, APIMetrics } from "@aibos/utils/monitoring";

// Track API endpoint performance
app.post("/api/journals", async (req, res) => {
  const apiMetrics = performanceMonitor.startTimer("api-endpoint", {
    endpoint: "/api/journals",
    method: "POST",
    userId: req.user?.id,
    tenantId: req.headers["x-tenant-id"],
  });

  try {
    const journal = await createJournal(req.body);

    apiMetrics.endTimer({
      success: true,
      statusCode: 201,
      responseTime: Date.now() - apiMetrics.startTime,
      recordCount: journal.lines.length,
    });

    res.status(201).json({ success: true, data: journal });
  } catch (error) {
    apiMetrics.endTimer({
      success: false,
      statusCode: 500,
      error: error.message,
    });

    res.status(500).json({ error: error.message });
  }
});

// Track API response times
const responseTimeMetrics = performanceMonitor.trackResponseTime("api-request", {
  endpoint: "/api/journals",
  method: "GET",
  userId: "user-123",
});

// Track API throughput
const throughputMetrics = performanceMonitor.trackThroughput("api-requests", {
  endpoint: "/api/journals",
  timeWindow: 60000, // 1 minute
});
```

### UI Metrics Tracking

```typescript
import { performanceMonitor, UIMetrics } from '@aibos/utils/monitoring';

// Track component render performance
const componentMetrics = performanceMonitor.startTimer('component-render', {
  component: 'JournalForm',
  userId: 'user-123',
  tenantId: 'tenant-456'
});

// Component render logic
const JournalForm = () => {
  useEffect(() => {
    componentMetrics.endTimer({ success: true });
  }, []);

  return <div>Journal Form</div>;
};

// Track user interaction performance
const interactionMetrics = performanceMonitor.startTimer('user-interaction', {
  component: 'JournalForm',
  action: 'form-submit',
  userId: 'user-123'
});

const handleSubmit = async (formData) => {
  try {
    await submitJournal(formData);
    interactionMetrics.endTimer({ success: true });
  } catch (error) {
    interactionMetrics.endTimer({ success: false, error: error.message });
  }
};

// Track page load performance
const pageLoadMetrics = performanceMonitor.startTimer('page-load', {
  page: '/journals',
  userId: 'user-123'
});

// Page load logic
useEffect(() => {
  pageLoadMetrics.endTimer({ success: true });
}, []);
```

### Monitoring Alerts and Notifications

```typescript
import { performanceMonitor, errorTracker } from "@aibos/utils/monitoring";

// Set up performance alerts
performanceMonitor.setAlertThreshold("api-response-time", {
  threshold: 5000, // 5 seconds
  condition: "greater-than",
  action: "notify",
  recipients: ["admin@company.com"],
});

// Set up error rate alerts
errorTracker.setAlertThreshold("error-rate", {
  threshold: 0.05, // 5% error rate
  timeWindow: 300000, // 5 minutes
  condition: "greater-than",
  action: "notify",
  recipients: ["dev-team@company.com"],
});

// Custom alert handling
performanceMonitor.onAlert("api-response-time", alert => {
  console.log("Performance alert triggered:", alert);
  // Send notification to monitoring system
  sendSlackNotification(`API response time exceeded threshold: ${alert.value}ms`);
});

errorTracker.onAlert("error-rate", alert => {
  console.log("Error rate alert triggered:", alert);
  // Send notification to dev team
  sendEmailNotification(`Error rate exceeded threshold: ${alert.value}%`);
});
```

### Monitoring Dashboard Integration

```typescript
import { performanceMonitor, errorTracker } from "@aibos/utils/monitoring";

// Get performance metrics for dashboard
const performanceData = await performanceMonitor.getMetrics({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
  metrics: ["response-time", "throughput", "error-rate"],
});

console.log("Performance data:", performanceData);

// Get error analytics for dashboard
const errorAnalytics = await errorTracker.getAnalytics({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
  groupBy: "category",
  includeStackTraces: false,
});

console.log("Error analytics:", errorAnalytics);

// Get real-time monitoring data
const realTimeData = await performanceMonitor.getRealTimeMetrics({
  timeWindow: 300000, // 5 minutes
  metrics: ["response-time", "throughput", "active-users"],
});

console.log("Real-time data:", realTimeData);
```

## 10) Troubleshooting

**Common Issues**:

- **Performance Metrics Missing**: Check monitoring configuration and thresholds
- **Error Tracking Failed**: Verify error context and tracking setup
- **Alert Notifications**: Check alert thresholds and notification settings
- **Monitoring Data**: Verify Axiom integration and data flow

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_MONITORING = "true";
```

**Logs**: Check Axiom telemetry for monitoring operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex monitoring logic

**Testing**:

- Test all monitoring functionality
- Test performance tracking
- Test error tracking
- Test alerting system

**Review Process**:

- All monitoring operations must be validated
- Performance requirements must be met
- Error tracking must be comprehensive
- Alerting must be reliable

---

## 📚 **Additional Resources**

- [Utils Package README](../README.md)
- [Context Module](../context/README.md)
- [Audit Module](../audit/README.md)
- [Web Package](../../web/README.md)
- [Web API Package](../../web-api/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
