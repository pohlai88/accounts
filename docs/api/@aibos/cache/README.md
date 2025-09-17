[**AI-BOS Accounts API Documentation**](../../README.md)

***

[AI-BOS Accounts API Documentation](../../README.md) / @aibos/cache

# DOC-286: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/cache

Redis-based caching layer for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/cache
```

## Core Features

- **Redis Integration**: High-performance Redis caching
- **Multi-level Caching**: L1 (Memory) + L2 (Redis) + L3 (Database)
- **Cache Invalidation**: Smart cache invalidation strategies
- **Cache Warming**: Pre-loading frequently accessed data
- **Distributed Caching**: Multi-instance cache synchronization
- **Performance Monitoring**: Cache hit/miss metrics
- **TTL Management**: Automatic expiration handling
- **Serialization**: JSON serialization with compression

## Quick Start

```typescript
import { CacheManager, RedisCache, MemoryCache } from "@aibos/cache";

// Initialize cache manager
const cacheManager = new CacheManager({
  redis: {
    url: process.env.REDIS_URL,
    ttl: 3600 // 1 hour
  },
  memory: {
    maxSize: 1000,
    ttl: 300 // 5 minutes
  }
});

// Set cache
await cacheManager.set('user:123', userData, 3600);

// Get cache
const userData = await cacheManager.get('user:123');

// Delete cache
await cacheManager.delete('user:123');
```

## Cache Types

### Redis Cache

```typescript
import { RedisCache } from "@aibos/cache";

const redisCache = new RedisCache({
  url: process.env.REDIS_URL,
  ttl: 3600,
  compression: true,
  serialization: 'json'
});

// Set with TTL
await redisCache.set('invoice:123', invoiceData, 3600);

// Get with fallback
const invoice = await redisCache.get('invoice:123', async () => {
  return await fetchInvoiceFromDatabase('123');
});

// Set multiple keys
await redisCache.mset({
  'user:123': userData,
  'tenant:456': tenantData,
  'company:789': companyData
});

// Get multiple keys
const data = await redisCache.mget(['user:123', 'tenant:456', 'company:789']);
```

### Memory Cache

```typescript
import { MemoryCache } from "@aibos/cache";

const memoryCache = new MemoryCache({
  maxSize: 1000,
  ttl: 300,
  evictionPolicy: 'lru'
});

// Set cache
await memoryCache.set('session:123', sessionData, 300);

// Get cache
const session = await memoryCache.get('session:123');

// Check if exists
const exists = await memoryCache.exists('session:123');

// Get all keys
const keys = await memoryCache.keys();
```

### Multi-level Cache

```typescript
import { MultiLevelCache } from "@aibos/cache";

const multiLevelCache = new MultiLevelCache({
  levels: [
    {
      type: 'memory',
      config: { maxSize: 1000, ttl: 300 }
    },
    {
      type: 'redis',
      config: { url: process.env.REDIS_URL, ttl: 3600 }
    }
  ]
});

// Set cache (stored in all levels)
await multiLevelCache.set('report:123', reportData, 3600);

// Get cache (checks levels in order)
const report = await multiLevelCache.get('report:123');

// Invalidate cache (removes from all levels)
await multiLevelCache.invalidate('report:123');
```

## Cache Strategies

### Cache-aside Pattern

```typescript
import { CacheAsideStrategy } from "@aibos/cache";

const cacheAside = new CacheAsideStrategy({
  cache: redisCache,
  fallback: async (key: string) => {
    // Fetch from database
    return await fetchFromDatabase(key);
  }
});

// Get with cache-aside
const data = await cacheAside.get('invoice:123');

// Set with cache-aside
await cacheAside.set('invoice:123', invoiceData);
```

### Write-through Pattern

```typescript
import { WriteThroughStrategy } from "@aibos/cache";

const writeThrough = new WriteThroughStrategy({
  cache: redisCache,
  write: async (key: string, value: any) => {
    // Write to database
    await writeToDatabase(key, value);
  }
});

// Write with write-through
await writeThrough.set('invoice:123', invoiceData);
```

### Write-behind Pattern

```typescript
import { WriteBehindStrategy } from "@aibos/cache";

const writeBehind = new WriteBehindStrategy({
  cache: redisCache,
  write: async (key: string, value: any) => {
    // Write to database
    await writeToDatabase(key, value);
  },
  batchSize: 100,
  flushInterval: 5000
});

// Write with write-behind
await writeBehind.set('invoice:123', invoiceData);
```

## Cache Invalidation

### Time-based Invalidation

```typescript
import { TimeBasedInvalidation } from "@aibos/cache";

const timeInvalidation = new TimeBasedInvalidation({
  cache: redisCache,
  defaultTtl: 3600
});

// Set with TTL
await timeInvalidation.set('user:123', userData, 1800); // 30 minutes

// Set with default TTL
await timeInvalidation.set('tenant:456', tenantData);
```

### Event-based Invalidation

```typescript
import { EventBasedInvalidation } from "@aibos/cache";

const eventInvalidation = new EventBasedInvalidation({
  cache: redisCache,
  events: {
    'user.updated': ['user:*'],
    'tenant.updated': ['tenant:*', 'user:*'],
    'invoice.created': ['invoices:*', 'reports:*']
  }
});

// Subscribe to events
eventInvalidation.subscribe('user.updated', (userId: string) => {
  // Invalidate user-related caches
  eventInvalidation.invalidatePattern(`user:${userId}`);
});

// Trigger invalidation
eventInvalidation.trigger('user.updated', '123');
```

### Pattern-based Invalidation

```typescript
import { PatternInvalidation } from "@aibos/cache";

const patternInvalidation = new PatternInvalidation({
  cache: redisCache
});

// Invalidate by pattern
await patternInvalidation.invalidatePattern('user:*');
await patternInvalidation.invalidatePattern('tenant:456:*');
await patternInvalidation.invalidatePattern('invoice:*:draft');
```

## Cache Warming

### Pre-loading Strategy

```typescript
import { CacheWarmer } from "@aibos/cache";

const cacheWarmer = new CacheWarmer({
  cache: redisCache,
  strategies: [
    {
      key: 'popular_invoices',
      loader: async () => {
        return await fetchPopularInvoices();
      },
      ttl: 3600,
      interval: 300000 // 5 minutes
    },
    {
      key: 'user_sessions',
      loader: async () => {
        return await fetchActiveUserSessions();
      },
      ttl: 1800,
      interval: 60000 // 1 minute
    }
  ]
});

// Start warming
await cacheWarmer.start();

// Stop warming
await cacheWarmer.stop();
```

### Lazy Loading

```typescript
import { LazyLoader } from "@aibos/cache";

const lazyLoader = new LazyLoader({
  cache: redisCache,
  loader: async (key: string) => {
    // Load data based on key pattern
    if (key.startsWith('user:')) {
      return await fetchUser(key.replace('user:', ''));
    } else if (key.startsWith('invoice:')) {
      return await fetchInvoice(key.replace('invoice:', ''));
    }
    return null;
  }
});

// Get with lazy loading
const user = await lazyLoader.get('user:123');
const invoice = await lazyLoader.get('invoice:456');
```

## Performance Monitoring

### Cache Metrics

```typescript
import { CacheMetrics } from "@aibos/cache";

const cacheMetrics = new CacheMetrics({
  cache: redisCache,
  enableMetrics: true
});

// Get metrics
const metrics = await cacheMetrics.getMetrics();

console.log('Cache hit rate:', metrics.hitRate);
console.log('Cache miss rate:', metrics.missRate);
console.log('Average response time:', metrics.avgResponseTime);
console.log('Total operations:', metrics.totalOperations);
```

### Performance Tracking

```typescript
import { PerformanceTracker } from "@aibos/cache";

const performanceTracker = new PerformanceTracker({
  cache: redisCache,
  enableTracking: true
});

// Track operation
const startTime = Date.now();
const result = await performanceTracker.track('get', 'user:123', async () => {
  return await redisCache.get('user:123');
});
const duration = Date.now() - startTime;

console.log('Operation duration:', duration);
console.log('Result:', result);
```

## Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
REDIS_MAX_CONNECTIONS=10
REDIS_CONNECTION_TIMEOUT=5000

# Cache Configuration
CACHE_DEFAULT_TTL=3600
CACHE_MAX_SIZE=10000
CACHE_COMPRESSION=true
CACHE_SERIALIZATION=json

# Performance Configuration
CACHE_ENABLE_METRICS=true
CACHE_ENABLE_TRACKING=true
CACHE_WARMING_ENABLED=true
```

### Cache Configuration

```typescript
const cacheConfig = {
  redis: {
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxConnections: parseInt(process.env.REDIS_MAX_CONNECTIONS || '10'),
    connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000')
  },
  memory: {
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '10000'),
    ttl: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'),
    evictionPolicy: 'lru'
  },
  performance: {
    enableMetrics: process.env.CACHE_ENABLE_METRICS === 'true',
    enableTracking: process.env.CACHE_ENABLE_TRACKING === 'true',
    enableWarming: process.env.CACHE_WARMING_ENABLED === 'true'
  }
};
```

## Testing

```bash
# Run cache tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run performance tests
pnpm test:performance
```

## Dependencies

- **redis**: Redis client
- **ioredis**: Redis client with advanced features
- **lru-cache**: LRU cache implementation
- **compression**: Data compression utilities

## Performance Considerations

- **Connection Pooling**: Redis connections are pooled
- **Compression**: Large values are compressed
- **Serialization**: Efficient JSON serialization
- **Batch Operations**: Bulk operations for efficiency
- **Memory Management**: Automatic memory cleanup

## Security

- **Data Encryption**: Sensitive data is encrypted
- **Access Control**: Cache access is controlled
- **TTL Management**: Automatic data expiration
- **Input Validation**: All inputs are validated

## Error Handling

```typescript
import { 
  CacheError, 
  ConnectionError, 
  SerializationError 
} from "@aibos/cache";

try {
  const result = await redisCache.get('user:123');
} catch (error) {
  if (error instanceof ConnectionError) {
    // Handle connection errors
    console.error("Redis connection failed:", error.message);
  } else if (error instanceof SerializationError) {
    // Handle serialization errors
    console.error("Serialization failed:", error.message);
  } else if (error instanceof CacheError) {
    // Handle cache errors
    console.error("Cache operation failed:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new cache features
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.
