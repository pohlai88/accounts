# Services — Background Processing & Workflows

> **TL;DR**: Background processing services powered by Inngest for FX rate ingestion, PDF
> generation, email workflows, OCR processing, document management, and automated business
> processes.  
> **Owner**: @aibos/platform-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Provides background processing and workflow automation
- Handles FX rate ingestion and currency data management
- Manages PDF generation with Puppeteer pooling
- Processes email workflows and notifications
- Performs OCR processing and document analysis
- Manages document approval and retention workflows
- Handles invoice processing and business automation

**Does NOT**:

- Implement business logic (delegated to @aibos/accounting)
- Handle UI components (delegated to @aibos/ui)
- Manage database operations (delegated to @aibos/db)
- Provide API endpoints (implemented by @aibos/web-api)

**Consumers**: @aibos/web-api, @aibos/accounting, @aibos/worker, external systems

## 2) Quick Links

- **Worker Service**: `worker/`
- **Main Entry**: `worker/src/index.ts`
- **Inngest Client**: `worker/src/inngestClient.ts`
- **Workflows**: `worker/src/workflows/`
- **FX Services**: `worker/src/fx-ingest.ts`, `worker/src/fx-storage.ts`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Build the worker service
cd services/worker
pnpm build

# Start development mode
pnpm dev

# Start production mode
pnpm start

# Lint
pnpm lint
```

## 4) Service Architecture

### **Inngest-Powered Workflows**

- **Event-Driven**: Asynchronous processing based on events
- **Retry Logic**: Built-in retry policies with exponential backoff
- **Concurrency Control**: Configurable concurrency limits per workflow
- **Dead Letter Queue**: Failed message handling and recovery
- **Step Functions**: Complex workflows with step-by-step execution

### **Background Processing**

- **FX Rate Ingestion**: Automated currency rate updates
- **PDF Generation**: Document generation with Puppeteer pooling
- **Email Workflows**: Template-based email processing
- **OCR Processing**: Document text and table extraction
- **Document Management**: Approval and retention workflows

### **Resource Management**

- **Puppeteer Pool**: PDF generation resource pooling
- **Health Checks**: Service health monitoring
- **Concurrency Limits**: Resource usage optimization
- **Error Handling**: Comprehensive error tracking and recovery

## 5) Core Services

### **Worker Service (`worker/`)**

**Purpose**: Main background processing service powered by Inngest

**Features**:

- Event-driven workflow execution
- Retry policies and error handling
- Concurrency control and resource management
- Dead letter queue processing
- Health monitoring and metrics

**Dependencies**:

- `@aibos/accounting` - Business logic integration
- `@aibos/contracts` - Type definitions and schemas
- `@aibos/db` - Database operations
- `@aibos/utils` - Shared utilities and services
- `inngest` - Workflow orchestration
- `puppeteer` - PDF generation

## 6) Workflow Categories

### **Financial Processing**

- **FX Rate Ingestion**: Automated currency rate updates every 4 hours
- **FX Rate Storage**: Database operations for currency data
- **FX Staleness Monitoring**: Rate freshness validation and alerts
- **Invoice Processing**: Automated invoice approval workflows

### **Document Management**

- **PDF Generation**: Template-based document generation
- **OCR Processing**: Text and table extraction from documents
- **Document Approval**: Multi-step approval workflows
- **Document Retention**: Automated retention policy enforcement
- **Legal Hold**: Document preservation for compliance

### **Communication**

- **Email Workflows**: Template-based email processing
- **Notification Systems**: User and system notifications
- **Template Processing**: Dynamic content generation

### **System Operations**

- **Dead Letter Queue**: Failed message handling and recovery
- **Health Checks**: Service monitoring and diagnostics
- **Resource Pooling**: Puppeteer instance management
- **Error Tracking**: Comprehensive error logging and recovery

## 7) Workflow Implementations

### **FX Rate Ingestion (`fxRateIngestion.ts`)**

**Purpose**: Automated currency rate updates with dual-source fallback

**Features**:

- Primary and secondary data source support
- Rate validation and staleness checking
- Database storage with audit logging
- Error handling and retry logic
- Multi-currency support (SEA, major, regional)

**Event**: `fx/rates.ingest` **Schedule**: Every 4 hours via cron **Retries**: 3 attempts with
exponential backoff

### **PDF Generation (`pdfGeneration.ts`)**

**Purpose**: Template-based PDF document generation

**Features**:

- Puppeteer-based PDF generation
- Template system for different document types
- Resource pooling for performance
- Health checks and monitoring
- Multi-tenant support

**Event**: `pdf/generate` **Concurrency**: 5 concurrent generations **Retries**: 3 attempts with
error recovery

### **Email Workflow (`emailWorkflow.ts`)**

**Purpose**: Template-based email processing and delivery

**Features**:

- Resend integration for email delivery
- Template-based content generation
- Attachment support
- Priority handling
- Delivery tracking and logging

**Event**: `email/send` **Retries**: 3 attempts with exponential backoff **Templates**: Invoice,
bill, report, notification templates

### **OCR Processing (`ocrProcessing.ts`)**

**Purpose**: Document text and table extraction

**Features**:

- Text extraction from images and PDFs
- Table structure recognition
- Metadata extraction
- Multi-language support
- Structured data output

**Event**: `ocr/process` **Concurrency**: 3 concurrent processes **Languages**: English, Chinese,
Malay, Tamil

### **Document Approval (`documentApproval.ts`)**

**Purpose**: Multi-step document approval workflows

**Features**:

- Approval workflow orchestration
- Decision tracking and logging
- Reminder notifications
- Escalation handling
- Audit trail maintenance

**Events**: `document/approval.start`, `document/approval.decide` **Workflow**: Start → Review →
Decision → Notification

### **Document Retention (`documentRetention.ts`)**

**Purpose**: Automated document retention policy enforcement

**Features**:

- Retention policy monitoring
- Automated document archiving
- Legal hold management
- Compliance reporting
- Data lifecycle management

**Events**: `document/retention.policy`, `document/retention.monitor` **Schedule**: Daily monitoring
and policy enforcement

## 8) FX Rate Management

### **Ingestion Services**

- **Automated Ingestion**: Every 4 hours via cron job
- **Manual Ingestion**: On-demand rate updates
- **Staleness Monitoring**: Rate freshness validation
- **Multi-Source Support**: Primary and fallback data sources
- **Currency Coverage**: SEA, major, and regional currencies

### **Storage Services**

- **Database Operations**: Rate storage and retrieval
- **Staleness Tracking**: Age monitoring and alerts
- **Historical Data**: Rate history and trends
- **Audit Logging**: Complete operation tracking

### **Supported Currencies**

- **SEA Currencies**: SGD, THB, VND, IDR, PHP
- **Major Trading**: USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY
- **Regional**: HKD, TWD, KRW, INR
- **Base Currency**: MYR (Malaysian Ringgit)

## 9) PDF Generation System

### **Template System**

- **Invoice Templates**: Customer invoice generation
- **Bill Templates**: Vendor bill processing
- **Report Templates**: Financial report generation
- **Custom Templates**: User-defined document types

### **Resource Management**

- **Puppeteer Pool**: Instance pooling for performance
- **Health Checks**: Pool monitoring and recovery
- **Concurrency Control**: Resource usage optimization
- **Error Handling**: Graceful failure recovery

### **Generation Process**

1. **Template Preparation**: HTML template generation
2. **Data Binding**: Dynamic content insertion
3. **PDF Rendering**: Puppeteer-based generation
4. **Storage**: File storage and metadata
5. **Notification**: Completion notifications

## 10) Email Workflow System

### **Template Processing**

- **Dynamic Content**: Variable substitution
- **Multi-Format**: HTML and text support
- **Attachment Handling**: File attachment processing
- **Priority Queuing**: High and normal priority queues

### **Delivery Management**

- **Resend Integration**: Reliable email delivery
- **Delivery Tracking**: Status monitoring and logging
- **Retry Logic**: Failed delivery retry
- **Bounce Handling**: Email bounce processing

### **Email Types**

- **Invoice Notifications**: Customer invoice emails
- **Bill Alerts**: Vendor bill notifications
- **Report Delivery**: Financial report emails
- **System Notifications**: System status and alerts

## 11) OCR Processing System

### **Text Extraction**

- **Document Types**: PDF, images, scanned documents
- **Text Recognition**: High-accuracy text extraction
- **Language Support**: Multi-language processing
- **Format Preservation**: Original formatting retention

### **Table Extraction**

- **Structure Recognition**: Table layout detection
- **Data Extraction**: Cell content extraction
- **Format Conversion**: Structured data output
- **Validation**: Data accuracy verification

### **Metadata Extraction**

- **Document Properties**: Creation date, author, etc.
- **Content Analysis**: Document type classification
- **Quality Metrics**: Processing quality scores
- **Error Reporting**: Processing issue identification

## 12) Usage Examples

### **FX Rate Ingestion**

```typescript
// Trigger FX rate ingestion
await inngest.send({
  name: 'fx/rates.ingest',
  data: {
    currencyPairs: ['USD/MYR', 'EUR/MYR', 'SGD/MYR'],
    source: 'primary',
  },
});

// Manual FX rate ingestion
await inngest.send({
  name: 'fx/rates.ingest.manual',
  data: {
    baseCurrency: 'MYR',
    targetCurrencies: ['USD', 'EUR', 'SGD'],
  },
});
```

### **PDF Generation**

```typescript
// Generate invoice PDF
await inngest.send({
  name: 'pdf/generate',
  data: {
    templateType: 'invoice',
    data: {
      invoiceNumber: 'INV-001',
      customerName: 'Acme Corp',
      amount: 1000.0,
      currency: 'MYR',
    },
    tenantId: 'tenant-123',
    companyId: 'company-456',
    entityId: 'invoice-789',
    entityType: 'invoice',
  },
});
```

### **Email Workflow**

```typescript
// Send invoice email
await inngest.send({
  name: 'email/send',
  data: {
    to: 'customer@example.com',
    subject: 'Invoice INV-001',
    template: 'invoice-notification',
    data: {
      invoiceNumber: 'INV-001',
      amount: 1000.0,
      dueDate: '2024-12-31',
    },
    tenantId: 'tenant-123',
    companyId: 'company-456',
    priority: 'normal',
    attachments: ['invoice-001.pdf'],
  },
});
```

### **OCR Processing**

```typescript
// Process document OCR
await inngest.send({
  name: 'ocr/process',
  data: {
    tenantId: 'tenant-123',
    attachmentId: 'attachment-456',
    extractText: true,
    extractTables: true,
    extractMetadata: true,
    documentType: 'invoice',
    languages: ['en', 'ms'],
    priority: 'normal',
  },
});
```

## 13) Monitoring & Health Checks

### **Service Health**

- **Puppeteer Pool**: Instance availability and performance
- **Database Connections**: Connection health and performance
- **External APIs**: FX rate source availability
- **Email Delivery**: Resend service status

### **Workflow Monitoring**

- **Execution Metrics**: Success rates and performance
- **Error Tracking**: Failure patterns and recovery
- **Queue Status**: Message processing and backlog
- **Resource Usage**: CPU, memory, and storage utilization

### **Alerting**

- **FX Rate Staleness**: Rate age monitoring and alerts
- **PDF Generation Failures**: Processing error notifications
- **Email Delivery Issues**: Delivery failure alerts
- **OCR Processing Errors**: Document processing alerts

## 14) Troubleshooting

**Common Issues**:

- **FX Rate Failures**: Check external API availability and credentials
- **PDF Generation Errors**: Verify Puppeteer installation and pool health
- **Email Delivery Issues**: Check Resend API key and configuration
- **OCR Processing Failures**: Verify document format and language support

**Debug Mode**:

```bash
# Enable debug logging
DEBUG=inngest,worker pnpm start

# Check service health
curl http://localhost:3000/api/health
```

**Logs**:

- Inngest workflow execution logs
- Puppeteer pool health logs
- Email delivery status logs
- OCR processing result logs

## 15) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use Inngest step functions for complex workflows
- Implement proper error handling and retry logic
- Document all workflow parameters and events

**Testing**:

- Test all workflow functions
- Validate error handling scenarios
- Test retry logic and recovery
- Verify resource management

**Review Process**:

- All changes must maintain workflow reliability
- Breaking changes require major version bump
- New workflows need comprehensive testing
- Documentation must be updated

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [Worker Package](../packages/worker/README.md)
- [Utils Package](../packages/utils/README.md)

---

## 🔗 **Service Principles**

### **Reliability First**

- Comprehensive error handling and retry logic
- Dead letter queue for failed messages
- Health checks and monitoring
- Graceful degradation and recovery

### **Performance Optimization**

- Resource pooling and concurrency control
- Efficient workflow orchestration
- Caching and optimization strategies
- Scalable architecture design

### **Business Process Automation**

- Event-driven workflow execution
- Multi-step business process support
- Audit logging and compliance
- Integration with business logic

### **Operational Excellence**

- Comprehensive monitoring and alerting
- Detailed logging and debugging
- Health checks and diagnostics
- Maintenance and troubleshooting tools

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
