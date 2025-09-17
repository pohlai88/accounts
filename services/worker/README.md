# DOC-300: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/worker

Background worker service for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/worker
```

## Core Features

- **Background Processing**: Asynchronous task processing
- **Job Queues**: Redis-based job queuing
- **Workflow Management**: Complex workflow orchestration
- **Task Scheduling**: Cron-based task scheduling
- **Error Handling**: Robust error handling and retry logic
- **Monitoring**: Worker performance monitoring
- **Scaling**: Horizontal worker scaling
- **Persistence**: Job persistence and recovery

## Quick Start

```typescript
import { WorkerManager, JobQueue, WorkflowEngine } from "@aibos/worker";

// Initialize worker manager
const workerManager = new WorkerManager({
  redis: {
    url: process.env.REDIS_URL
  },
  concurrency: 5,
  retryAttempts: 3,
  retryDelay: 1000
});

// Initialize job queue
const jobQueue = new JobQueue({
  redis: {
    url: process.env.REDIS_URL
  },
  queues: ['invoices', 'bills', 'payments', 'reports']
});

// Start worker
await workerManager.start();
```

## Job Processing

### Job Definition

```typescript
import { Job, JobProcessor } from "@aibos/worker";

// Define job
interface InvoiceProcessingJob extends Job {
  type: 'invoice.processing';
  data: {
    invoiceId: string;
    tenantId: string;
    companyId: string;
  };
  priority: number;
  delay?: number;
  attempts?: number;
}

// Job processor
class InvoiceProcessor extends JobProcessor<InvoiceProcessingJob> {
  async process(job: InvoiceProcessingJob): Promise<void> {
    const { invoiceId, tenantId, companyId } = job.data;
    
    try {
      // Process invoice
      await this.processInvoice(invoiceId, tenantId, companyId);
      
      // Update job status
      await this.updateJobStatus(job.id, 'completed');
    } catch (error) {
      // Handle error
      await this.handleJobError(job.id, error);
      throw error;
    }
  }
  
  private async processInvoice(invoiceId: string, tenantId: string, companyId: string) {
    // Invoice processing logic
    console.log(`Processing invoice ${invoiceId} for tenant ${tenantId}`);
  }
}
```

### Job Queue Management

```typescript
import { JobQueue } from "@aibos/worker";

const jobQueue = new JobQueue({
  redis: {
    url: process.env.REDIS_URL
  },
  queues: [
    {
      name: 'invoices',
      priority: 1,
      concurrency: 3
    },
    {
      name: 'bills',
      priority: 2,
      concurrency: 2
    },
    {
      name: 'payments',
      priority: 3,
      concurrency: 5
    },
    {
      name: 'reports',
      priority: 4,
      concurrency: 1
    }
  ]
});

// Add job to queue
await jobQueue.add('invoices', {
  type: 'invoice.processing',
  data: {
    invoiceId: 'inv_001',
    tenantId: 'tenant_123',
    companyId: 'company_123'
  },
  priority: 1,
  delay: 0,
  attempts: 3
});

// Process jobs
await jobQueue.process('invoices', new InvoiceProcessor());
```

## Workflow Management

### Workflow Definition

```typescript
import { Workflow, WorkflowStep, WorkflowEngine } from "@aibos/worker";

// Define workflow
interface InvoiceWorkflow extends Workflow {
  name: 'invoice.processing';
  steps: WorkflowStep[];
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

// Workflow steps
const invoiceWorkflow: InvoiceWorkflow = {
  name: 'invoice.processing',
  steps: [
    {
      name: 'validate-invoice',
      processor: 'InvoiceValidator',
      retryAttempts: 3,
      retryDelay: 1000
    },
    {
      name: 'calculate-totals',
      processor: 'InvoiceCalculator',
      retryAttempts: 2,
      retryDelay: 500
    },
    {
      name: 'post-to-ledger',
      processor: 'LedgerPoster',
      retryAttempts: 5,
      retryDelay: 2000
    },
    {
      name: 'send-notifications',
      processor: 'NotificationSender',
      retryAttempts: 2,
      retryDelay: 1000
    }
  ],
  onSuccess: (result) => {
    console.log('Invoice workflow completed:', result);
  },
  onError: (error) => {
    console.error('Invoice workflow failed:', error);
  }
};

// Workflow engine
const workflowEngine = new WorkflowEngine({
  redis: {
    url: process.env.REDIS_URL
  },
  workflows: [invoiceWorkflow]
});

// Execute workflow
await workflowEngine.execute('invoice.processing', {
  invoiceId: 'inv_001',
  tenantId: 'tenant_123',
  companyId: 'company_123'
});
```

### Workflow Steps

```typescript
import { WorkflowStep, StepProcessor } from "@aibos/worker";

// Step processor
class InvoiceValidator extends StepProcessor {
  async process(step: WorkflowStep, data: any): Promise<any> {
    const { invoiceId, tenantId, companyId } = data;
    
    // Validate invoice
    const validation = await this.validateInvoice(invoiceId, tenantId, companyId);
    
    if (!validation.isValid) {
      throw new Error(`Invoice validation failed: ${validation.errors.join(', ')}`);
    }
    
    return {
      ...data,
      validation: validation
    };
  }
  
  private async validateInvoice(invoiceId: string, tenantId: string, companyId: string) {
    // Validation logic
    return {
      isValid: true,
      errors: []
    };
  }
}

// Register step processor
workflowEngine.registerStepProcessor('InvoiceValidator', new InvoiceValidator());
```

## Task Scheduling

### Cron Scheduling

```typescript
import { CronScheduler } from "@aibos/worker";

const cronScheduler = new CronScheduler({
  redis: {
    url: process.env.REDIS_URL
  },
  timezone: 'UTC'
});

// Schedule recurring task
await cronScheduler.schedule('daily-reports', {
  cron: '0 2 * * *', // 2 AM daily
  job: {
    type: 'report.generation',
    data: {
      reportType: 'daily',
      tenantId: 'all'
    }
  }
});

// Schedule monthly task
await cronScheduler.schedule('monthly-cleanup', {
  cron: '0 0 1 * *', // 1st of every month
  job: {
    type: 'data.cleanup',
    data: {
      retentionDays: 90
    }
  }
});

// Start scheduler
await cronScheduler.start();
```

### One-time Scheduling

```typescript
import { OneTimeScheduler } from "@aibos/worker";

const oneTimeScheduler = new OneTimeScheduler({
  redis: {
    url: process.env.REDIS_URL
  }
});

// Schedule one-time task
await oneTimeScheduler.schedule('invoice-reminder', {
  executeAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  job: {
    type: 'invoice.reminder',
    data: {
      invoiceId: 'inv_001',
      customerId: 'cust_123'
    }
  }
});
```

## Error Handling

### Retry Logic

```typescript
import { RetryManager } from "@aibos/worker";

const retryManager = new RetryManager({
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true
});

// Retry job
await retryManager.retry(async () => {
  return await processInvoice(invoiceData);
}, {
  jobId: 'job_001',
  attempts: 3
});
```

### Error Recovery

```typescript
import { ErrorRecovery } from "@aibos/worker";

const errorRecovery = new ErrorRecovery({
  strategies: [
    {
      errorType: 'ValidationError',
      action: 'retry',
      maxAttempts: 3
    },
    {
      errorType: 'DatabaseError',
      action: 'retry',
      maxAttempts: 5,
      delay: 2000
    },
    {
      errorType: 'NetworkError',
      action: 'retry',
      maxAttempts: 10,
      delay: 5000
    },
    {
      errorType: 'BusinessLogicError',
      action: 'fail',
      notify: true
    }
  ]
});

// Handle job error
await errorRecovery.handleError(job, error);
```

## Monitoring

### Worker Metrics

```typescript
import { WorkerMetrics } from "@aibos/worker";

const workerMetrics = new WorkerMetrics({
  redis: {
    url: process.env.REDIS_URL
  },
  metrics: [
    'jobs.processed',
    'jobs.failed',
    'jobs.retried',
    'processing.time',
    'queue.length',
    'worker.utilization'
  ]
});

// Get metrics
const metrics = await workerMetrics.getMetrics();

console.log('Jobs processed:', metrics.jobsProcessed);
console.log('Jobs failed:', metrics.jobsFailed);
console.log('Average processing time:', metrics.avgProcessingTime);
console.log('Queue length:', metrics.queueLength);
```

### Health Checks

```typescript
import { WorkerHealthChecker } from "@aibos/worker";

const workerHealthChecker = new WorkerHealthChecker({
  redis: {
    url: process.env.REDIS_URL
  },
  checks: [
    {
      name: 'redis-connection',
      check: async () => {
        try {
          await redis.ping();
          return { status: 'healthy' };
        } catch (error) {
          return { status: 'unhealthy', error: error.message };
        }
      }
    },
    {
      name: 'queue-health',
      check: async () => {
        const queueLength = await jobQueue.getLength('invoices');
        if (queueLength > 1000) {
          return { status: 'unhealthy', error: 'Queue too long' };
        }
        return { status: 'healthy' };
      }
    }
  ]
});

// Check worker health
const health = await workerHealthChecker.checkHealth();
```

## Scaling

### Horizontal Scaling

```typescript
import { WorkerScaler } from "@aibos/worker";

const workerScaler = new WorkerScaler({
  redis: {
    url: process.env.REDIS_URL
  },
  scaling: {
    minWorkers: 1,
    maxWorkers: 10,
    scaleUpThreshold: 0.8,
    scaleDownThreshold: 0.2,
    scaleUpCooldown: 300000, // 5 minutes
    scaleDownCooldown: 600000 // 10 minutes
  }
});

// Start auto-scaling
await workerScaler.start();

// Manual scaling
await workerScaler.scaleTo(5);
```

### Load Balancing

```typescript
import { LoadBalancer } from "@aibos/worker";

const loadBalancer = new LoadBalancer({
  algorithm: 'round-robin',
  workers: [
    'worker-1:3001',
    'worker-2:3001',
    'worker-3:3001'
  ],
  healthCheck: {
    interval: 30000,
    timeout: 5000
  }
});

// Get next worker
const worker = await loadBalancer.getNextWorker();

// Check worker health
const isHealthy = await loadBalancer.checkHealth(worker);
```

## Configuration

### Environment Variables

```env
# Worker Configuration
WORKER_CONCURRENCY=5
WORKER_RETRY_ATTEMPTS=3
WORKER_RETRY_DELAY=1000
WORKER_TIMEOUT=300000

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_DB=2
REDIS_MAX_CONNECTIONS=10

# Queue Configuration
QUEUE_PREFIX=aibos:worker
QUEUE_DEFAULT_TTL=3600000
QUEUE_MAX_LENGTH=10000

# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_INTERVAL=60000
HEALTH_CHECK_INTERVAL=30000
```

### Worker Configuration

```typescript
const workerConfig = {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
  retryAttempts: parseInt(process.env.WORKER_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.WORKER_RETRY_DELAY || '1000'),
  timeout: parseInt(process.env.WORKER_TIMEOUT || '300000'),
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    db: parseInt(process.env.REDIS_DB || '2'),
    maxConnections: parseInt(process.env.REDIS_MAX_CONNECTIONS || '10')
  },
  queue: {
    prefix: process.env.QUEUE_PREFIX || 'aibos:worker',
    defaultTtl: parseInt(process.env.QUEUE_DEFAULT_TTL || '3600000'),
    maxLength: parseInt(process.env.QUEUE_MAX_LENGTH || '10000')
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000')
  }
};
```

## Testing

```bash
# Run worker tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration
```

## Dependencies

- **redis**: Redis client
- **ioredis**: Redis client with advanced features
- **cron**: Cron scheduling
- **winston**: Logging
- **prom-client**: Metrics collection

## Performance Considerations

- **Connection Pooling**: Redis connections are pooled
- **Job Batching**: Jobs are batched for efficiency
- **Memory Management**: Memory usage is optimized
- **Queue Optimization**: Queue operations are optimized

## Security

- **Job Validation**: All jobs are validated
- **Access Control**: Worker access is controlled
- **Audit Logging**: All worker activities are logged
- **Data Encryption**: Sensitive data is encrypted

## Error Handling

```typescript
import { 
  WorkerError, 
  JobError, 
  QueueError 
} from "@aibos/worker";

try {
  const result = await workerManager.processJob(job);
} catch (error) {
  if (error instanceof JobError) {
    // Handle job errors
    console.error("Job processing failed:", error.message);
  } else if (error instanceof QueueError) {
    // Handle queue errors
    console.error("Queue operation failed:", error.message);
  } else if (error instanceof WorkerError) {
    // Handle worker errors
    console.error("Worker error:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new worker features
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.

