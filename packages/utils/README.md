# DOC-296: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/utils

Shared utilities and helper functions for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/utils
```

## Core Features

- **HTTP Client**: Retry logic, error handling, request/response interceptors
- **Email Service**: Multi-provider email integration
- **File Storage**: Attachment handling and management
- **Export Services**: CSV, Excel, JSON export functionality
- **Performance Monitoring**: Metrics collection and error tracking
- **Context Management**: Request context and user context handling
- **State Management**: Zustand-based state management utilities

## Quick Start

```typescript
import { 
  createApiClient,
  sendEmail,
  exportToCsv,
  performanceMonitor,
  errorTracker,
  createRequestContext
} from "@aibos/utils";

// HTTP Client
const apiClient = createApiClient({
  baseURL: 'https://api.example.com',
  retries: 3
});

// Email Service
await sendEmail({
  to: 'user@example.com',
  subject: 'Invoice Created',
  html: '<h1>Your invoice has been created</h1>'
});

// Export Services
const csvData = await exportToCsv(data, {
  filename: 'invoices.csv',
  headers: ['id', 'amount', 'date']
});

// Performance Monitoring
performanceMonitor.recordMetric('api.response_time', 150, 'milliseconds');

// Error Tracking
errorTracker.captureException(error, {
  context: 'invoice-creation',
  userId: 'user_123'
});
```

## HTTP Client

```typescript
import { createApiClient } from "@aibos/utils";

const client = createApiClient({
  baseURL: process.env.API_URL,
  timeout: 10000,
  retries: 3,
  retryDelay: 1000
});

// GET request
const invoices = await client.get('/invoices');

// POST request
const newInvoice = await client.post('/invoices', invoiceData);

// Request with retry
const result = await client.request({
  method: 'POST',
  url: '/invoices',
  data: invoiceData,
  retries: 5
});
```

## Email Service

```typescript
import { sendEmail } from "@aibos/utils";

// Simple email
await sendEmail({
  to: 'customer@example.com',
  subject: 'Invoice Created',
  html: '<h1>Your invoice has been created</h1>',
  text: 'Your invoice has been created'
});

// Email with attachments
await sendEmail({
  to: 'customer@example.com',
  subject: 'Invoice with Attachment',
  html: '<h1>Please find your invoice attached</h1>',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    }
  ]
});

// Bulk email
await sendEmail({
  to: ['customer1@example.com', 'customer2@example.com'],
  subject: 'Monthly Statement',
  html: '<h1>Your monthly statement is ready</h1>'
});
```

## Export Services

```typescript
import { exportToCsv, exportToXlsx, exportToJson } from "@aibos/utils";

// CSV Export
const csvData = await exportToCsv(invoices, {
  filename: 'invoices.csv',
  headers: ['id', 'customer', 'amount', 'date'],
  delimiter: ','
});

// Excel Export
const xlsxData = await exportToXlsx(invoices, {
  filename: 'invoices.xlsx',
  sheetName: 'Invoices',
  headers: ['id', 'customer', 'amount', 'date']
});

// JSON Export
const jsonData = await exportToJson(invoices, {
  filename: 'invoices.json',
  pretty: true
});
```

## Performance Monitoring

```typescript
import { performanceMonitor } from "@aibos/utils";

// Record performance metrics
performanceMonitor.recordMetric('api.response_time', 150, 'milliseconds');
performanceMonitor.recordMetric('user.actions', 1, 'count');

// Record business metrics
performanceMonitor.recordBusinessMetric('invoice.created', {
  tenantId: 'tenant_123',
  amount: 1000,
  currency: 'USD'
});

// Record custom metrics
performanceMonitor.recordCustomMetric('custom.metric', {
  value: 42,
  tags: ['environment:production', 'service:api']
});
```

## Error Tracking

```typescript
import { errorTracker } from "@aibos/utils";

// Capture exceptions
errorTracker.captureException(error, {
  context: 'invoice-creation',
  userId: 'user_123',
  tenantId: 'tenant_123',
  metadata: {
    invoiceId: 'inv_001',
    amount: 1000
  }
});

// Capture messages
errorTracker.captureMessage('User action completed', {
  level: 'info',
  context: 'user-action',
  userId: 'user_123'
});

// Set user context
errorTracker.setUserContext({
  id: 'user_123',
  email: 'user@example.com',
  tenantId: 'tenant_123'
});
```

## Context Management

```typescript
import { createRequestContext, getRequestContext } from "@aibos/utils";

// Create request context
const context = createRequestContext({
  requestId: 'req_123',
  userId: 'user_123',
  tenantId: 'tenant_123',
  correlationId: 'corr_123'
});

// Get current context
const currentContext = getRequestContext();

// Use context in async operations
async function processInvoice(invoiceData: any) {
  const context = getRequestContext();
  
  // All operations will include the context
  const result = await apiClient.post('/invoices', invoiceData);
  
  return result;
}
```

## State Management

```typescript
import { createStore, useStore } from "@aibos/utils";

// Create store
const invoiceStore = createStore((set) => ({
  invoices: [],
  loading: false,
  error: null,
  
  setInvoices: (invoices) => set({ invoices }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const invoices = await apiClient.get('/invoices');
      set({ invoices, loading: false });
    } catch (error) {
      set({ error, loading: false });
    }
  }
}));

// Use store in component
function InvoiceList() {
  const { invoices, loading, fetchInvoices } = useStore(invoiceStore);
  
  useEffect(() => {
    fetchInvoices();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {invoices.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
}
```

## File Storage

```typescript
import { uploadFile, downloadFile, deleteFile } from "@aibos/utils";

// Upload file
const uploadResult = await uploadFile(file, {
  bucket: 'invoices',
  path: 'tenant_123/invoice_001.pdf',
  metadata: {
    tenantId: 'tenant_123',
    invoiceId: 'inv_001'
  }
});

// Download file
const fileData = await downloadFile('tenant_123/invoice_001.pdf');

// Delete file
await deleteFile('tenant_123/invoice_001.pdf');
```

## Validation Utilities

```typescript
import { validateEmail, validatePhone, validateCurrency } from "@aibos/utils";

// Email validation
const isValidEmail = validateEmail('user@example.com');

// Phone validation
const isValidPhone = validatePhone('+1234567890');

// Currency validation
const isValidCurrency = validateCurrency('USD');
```

## Date Utilities

```typescript
import { formatDate, parseDate, addDays, isBusinessDay } from "@aibos/utils";

// Format date
const formattedDate = formatDate(new Date(), 'YYYY-MM-DD');

// Parse date
const parsedDate = parseDate('2024-01-01', 'YYYY-MM-DD');

// Add days
const futureDate = addDays(new Date(), 30);

// Check business day
const isBusiness = isBusinessDay(new Date());
```

## Configuration

### Environment Variables

```env
# Email Service
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key

# File Storage
STORAGE_PROVIDER=supabase
SUPABASE_STORAGE_URL=your_storage_url
SUPABASE_STORAGE_KEY=your_storage_key

# Performance Monitoring
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_SAMPLE_RATE=1.0

# Error Tracking
ERROR_TRACKING_ENABLED=true
ERROR_TRACKING_DSN=your_error_tracking_dsn
```

### Feature Flags

```typescript
const utilsFeatures = {
  emailService: true,
  fileStorage: true,
  performanceMonitoring: true,
  errorTracking: true,
  exportServices: true
};
```

## Testing

```bash
# Run utility tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test:utils:http
```

## Dependencies

- **axios**: HTTP client
- **resend**: Email service
- **xlsx**: Excel export
- **csv-parser**: CSV parsing
- **zustand**: State management
- **date-fns**: Date utilities
- **zod**: Validation

## Performance Considerations

- **Caching**: HTTP responses are cached for 5 minutes
- **Retry Logic**: Failed requests are retried with exponential backoff
- **Batch Operations**: Bulk operations are batched for efficiency
- **Memory Management**: Large datasets are processed in chunks

## Security

- **Input Validation**: All inputs are validated with Zod schemas
- **Sanitization**: User inputs are sanitized before processing
- **Encryption**: Sensitive data is encrypted at rest
- **Rate Limiting**: API calls are rate-limited to prevent abuse

## Error Handling

```typescript
import { UtilsError, ValidationError } from "@aibos/utils";

try {
  const result = await createApiClient(config);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.error("Validation failed:", error.details);
  } else if (error instanceof UtilsError) {
    // Handle utility errors
    console.error("Utility error:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new utilities
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.