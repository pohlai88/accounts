[**AI-BOS Accounts API Documentation (Source)**](../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../README.md) / @aibos/realtime

# DOC-292: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/realtime

WebSocket and real-time features for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/realtime
```

## Core Features

- **WebSocket Server**: Real-time bidirectional communication
- **Room Management**: User room subscriptions and management
- **Event Broadcasting**: Real-time event broadcasting
- **Message Queuing**: Reliable message delivery
- **Connection Management**: Connection pooling and management
- **Authentication**: WebSocket authentication and authorization
- **Scaling**: Horizontal scaling support
- **Monitoring**: Connection and message monitoring

## Quick Start

```typescript
import { RealtimeServer, RealtimeClient } from "@aibos/realtime";

// Initialize server
const realtimeServer = new RealtimeServer({
  port: 3001,
  cors: {
    origin: ['https://app.aibos.com'],
    credentials: true
  },
  authentication: {
    jwtSecret: process.env.JWT_SECRET
  }
});

// Start server
await realtimeServer.start();

// Initialize client
const realtimeClient = new RealtimeClient({
  url: 'ws://localhost:3001',
  token: 'your_jwt_token'
});

// Connect client
await realtimeClient.connect();
```

## WebSocket Server

### Server Configuration

```typescript
import { RealtimeServer } from "@aibos/realtime";

const realtimeServer = new RealtimeServer({
  port: 3001,
  host: '0.0.0.0',
  cors: {
    origin: ['https://app.aibos.com', 'https://admin.aibos.com'],
    credentials: true
  },
  authentication: {
    jwtSecret: process.env.JWT_SECRET,
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer '
  },
  rooms: {
    maxRooms: 1000,
    maxUsersPerRoom: 100
  },
  heartbeat: {
    interval: 30000,
    timeout: 60000
  }
});

// Start server
await realtimeServer.start();
```

### Event Handlers

```typescript
import { EventHandler } from "@aibos/realtime";

// Connection event handler
realtimeServer.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle authentication
  socket.on('authenticate', async (token) => {
    try {
      const user = await verifyToken(token);
      socket.user = user;
      socket.emit('authenticated', { success: true });
    } catch (error) {
      socket.emit('authenticated', { success: false, error: error.message });
    }
  });
  
  // Handle room joining
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.emit('joined-room', { roomId });
  });
  
  // Handle room leaving
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    socket.emit('left-room', { roomId });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});
```

## WebSocket Client

### Client Configuration

```typescript
import { RealtimeClient } from "@aibos/realtime";

const realtimeClient = new RealtimeClient({
  url: 'ws://localhost:3001',
  token: 'your_jwt_token',
  reconnect: true,
  reconnectAttempts: 5,
  reconnectInterval: 5000,
  heartbeat: {
    interval: 30000,
    timeout: 60000
  }
});

// Connect client
await realtimeClient.connect();

// Handle connection events
realtimeClient.on('connect', () => {
  console.log('Connected to realtime server');
});

realtimeClient.on('disconnect', () => {
  console.log('Disconnected from realtime server');
});

realtimeClient.on('error', (error) => {
  console.error('Realtime error:', error);
});
```

### Event Handling

```typescript
// Join room
await realtimeClient.joinRoom('tenant_123');

// Leave room
await realtimeClient.leaveRoom('tenant_123');

// Send message
await realtimeClient.sendMessage('invoice.created', {
  invoiceId: 'inv_001',
  amount: 1000,
  currency: 'USD'
});

// Listen for events
realtimeClient.on('invoice.created', (data) => {
  console.log('Invoice created:', data);
});

realtimeClient.on('bill.updated', (data) => {
  console.log('Bill updated:', data);
});

realtimeClient.on('payment.processed', (data) => {
  console.log('Payment processed:', data);
});
```

## Room Management

### Room Operations

```typescript
import { RoomManager } from "@aibos/realtime";

const roomManager = new RoomManager({
  maxRooms: 1000,
  maxUsersPerRoom: 100,
  roomTimeout: 300000 // 5 minutes
});

// Create room
const room = await roomManager.createRoom('tenant_123', {
  name: 'Tenant 123',
  type: 'tenant',
  settings: {
    maxUsers: 50,
    allowGuests: false
  }
});

// Join room
await roomManager.joinRoom('tenant_123', 'user_123');

// Leave room
await roomManager.leaveRoom('tenant_123', 'user_123');

// Get room info
const roomInfo = await roomManager.getRoomInfo('tenant_123');

// List room users
const users = await roomManager.getRoomUsers('tenant_123');
```

### Room Events

```typescript
// Room event handlers
roomManager.on('room.created', (room) => {
  console.log('Room created:', room.id);
});

roomManager.on('user.joined', (roomId, userId) => {
  console.log(`User ${userId} joined room ${roomId}`);
});

roomManager.on('user.left', (roomId, userId) => {
  console.log(`User ${userId} left room ${roomId}`);
});

roomManager.on('room.destroyed', (roomId) => {
  console.log('Room destroyed:', roomId);
});
```

## Event Broadcasting

### Broadcast Events

```typescript
import { EventBroadcaster } from "@aibos/realtime";

const eventBroadcaster = new EventBroadcaster({
  server: realtimeServer,
  rooms: roomManager
});

// Broadcast to room
await eventBroadcaster.broadcastToRoom('tenant_123', 'invoice.created', {
  invoiceId: 'inv_001',
  amount: 1000,
  currency: 'USD'
});

// Broadcast to user
await eventBroadcaster.broadcastToUser('user_123', 'notification', {
  type: 'info',
  message: 'Invoice created successfully'
});

// Broadcast to all users
await eventBroadcaster.broadcastToAll('system.maintenance', {
  message: 'System maintenance scheduled',
  startTime: '2024-01-01T00:00:00Z',
  duration: '2 hours'
});
```

### Event Filtering

```typescript
// Filtered broadcasting
await eventBroadcaster.broadcastToRoom('tenant_123', 'invoice.created', {
  invoiceId: 'inv_001',
  amount: 1000,
  currency: 'USD'
}, {
  filter: (user) => user.role === 'admin' || user.role === 'user',
  exclude: ['user_456']
});
```

## Message Queuing

### Message Queue

```typescript
import { MessageQueue } from "@aibos/realtime";

const messageQueue = new MessageQueue({
  redis: {
    url: process.env.REDIS_URL
  },
  queues: {
    'realtime.events': {
      maxSize: 10000,
      ttl: 3600000 // 1 hour
    }
  }
});

// Send message to queue
await messageQueue.send('realtime.events', {
  type: 'invoice.created',
  roomId: 'tenant_123',
  data: {
    invoiceId: 'inv_001',
    amount: 1000
  }
});

// Process messages
messageQueue.process('realtime.events', async (message) => {
  const { type, roomId, data } = message;
  
  // Broadcast to room
  await eventBroadcaster.broadcastToRoom(roomId, type, data);
});
```

### Message Persistence

```typescript
import { MessagePersistence } from "@aibos/realtime";

const messagePersistence = new MessagePersistence({
  database: {
    url: process.env.DATABASE_URL
  },
  retention: {
    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxMessages: 100000
  }
});

// Store message
await messagePersistence.storeMessage({
  id: 'msg_001',
  roomId: 'tenant_123',
  userId: 'user_123',
  type: 'invoice.created',
  data: { invoiceId: 'inv_001' },
  timestamp: new Date()
});

// Retrieve messages
const messages = await messagePersistence.getMessages('tenant_123', {
  limit: 50,
  offset: 0
});
```

## Connection Management

### Connection Pool

```typescript
import { ConnectionPool } from "@aibos/realtime";

const connectionPool = new ConnectionPool({
  maxConnections: 1000,
  connectionTimeout: 30000,
  heartbeatInterval: 30000,
  heartbeatTimeout: 60000
});

// Add connection
connectionPool.addConnection(socket);

// Remove connection
connectionPool.removeConnection(socket.id);

// Get connection
const connection = connectionPool.getConnection(socket.id);

// Get all connections
const connections = connectionPool.getAllConnections();
```

### Connection Monitoring

```typescript
import { ConnectionMonitor } from "@aibos/realtime";

const connectionMonitor = new ConnectionMonitor({
  pool: connectionPool,
  metrics: {
    enableMetrics: true,
    sampleRate: 1.0
  }
});

// Get connection metrics
const metrics = await connectionMonitor.getMetrics();

console.log('Active connections:', metrics.activeConnections);
console.log('Total connections:', metrics.totalConnections);
console.log('Average connection duration:', metrics.avgDuration);
console.log('Connection error rate:', metrics.errorRate);
```

## Authentication

### WebSocket Authentication

```typescript
import { WebSocketAuth } from "@aibos/realtime";

const webSocketAuth = new WebSocketAuth({
  jwtSecret: process.env.JWT_SECRET,
  tokenHeader: 'Authorization',
  tokenPrefix: 'Bearer ',
  excludePaths: ['/health', '/status']
});

// Authenticate connection
const authResult = await webSocketAuth.authenticate(socket, token);

if (authResult.success) {
  socket.user = authResult.user;
  socket.authenticated = true;
} else {
  socket.emit('auth_error', { error: authResult.error });
  socket.disconnect();
}
```

### Authorization

```typescript
import { WebSocketAuthorization } from "@aibos/realtime";

const webSocketAuthz = new WebSocketAuthorization({
  permissions: {
    'tenant_123': ['read', 'write'],
    'tenant_456': ['read']
  }
});

// Check permission
const hasPermission = await webSocketAuthz.checkPermission(
  socket.user,
  'tenant_123',
  'write'
);

if (!hasPermission) {
  socket.emit('permission_denied', { 
    resource: 'tenant_123',
    action: 'write'
  });
  return;
}
```

## Scaling

### Horizontal Scaling

```typescript
import { ScalingManager } from "@aibos/realtime";

const scalingManager = new ScalingManager({
  redis: {
    url: process.env.REDIS_URL
  },
  instances: [
    'ws://instance1:3001',
    'ws://instance2:3001',
    'ws://instance3:3001'
  ],
  loadBalancer: {
    algorithm: 'round-robin',
    healthCheck: true
  }
});

// Register instance
await scalingManager.registerInstance('ws://localhost:3001');

// Unregister instance
await scalingManager.unregisterInstance('ws://localhost:3001');

// Get available instances
const instances = await scalingManager.getAvailableInstances();
```

### Load Balancing

```typescript
import { LoadBalancer } from "@aibos/realtime";

const loadBalancer = new LoadBalancer({
  algorithm: 'round-robin',
  healthCheck: {
    interval: 30000,
    timeout: 5000
  },
  instances: [
    'ws://instance1:3001',
    'ws://instance2:3001',
    'ws://instance3:3001'
  ]
});

// Get next instance
const instance = await loadBalancer.getNextInstance();

// Check instance health
const isHealthy = await loadBalancer.checkHealth(instance);
```

## Configuration

### Environment Variables

```env
# Realtime Configuration
REALTIME_PORT=3001
REALTIME_HOST=0.0.0.0
REALTIME_CORS_ORIGIN=https://app.aibos.com

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_DB=1

# Scaling Configuration
ENABLE_SCALING=true
INSTANCE_ID=instance-1
INSTANCE_URL=ws://localhost:3001
```

### Realtime Configuration

```typescript
const realtimeConfig = {
  server: {
    port: parseInt(process.env.REALTIME_PORT || '3001'),
    host: process.env.REALTIME_HOST || '0.0.0.0',
    cors: {
      origin: process.env.REALTIME_CORS_ORIGIN?.split(',') || ['https://app.aibos.com'],
      credentials: true
    }
  },
  authentication: {
    jwtSecret: process.env.JWT_SECRET,
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer '
  },
  rooms: {
    maxRooms: 1000,
    maxUsersPerRoom: 100,
    roomTimeout: 300000
  },
  heartbeat: {
    interval: 30000,
    timeout: 60000
  },
  scaling: {
    enabled: process.env.ENABLE_SCALING === 'true',
    instanceId: process.env.INSTANCE_ID || 'instance-1',
    instanceUrl: process.env.INSTANCE_URL || 'ws://localhost:3001'
  }
};
```

## Testing

```bash
# Run realtime tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run integration tests
pnpm test:integration
```

## Dependencies

- **ws**: WebSocket library
- **redis**: Redis client
- **jose**: JWT handling
- **ioredis**: Redis client with advanced features

## Performance Considerations

- **Connection Pooling**: WebSocket connections are pooled
- **Message Batching**: Messages are batched for efficiency
- **Room Management**: Efficient room operations
- **Memory Management**: Automatic memory cleanup
- **Scaling**: Horizontal scaling support

## Security

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Message rate limiting
- **Input Validation**: Message validation

## Error Handling

```typescript
import { 
  RealtimeError, 
  ConnectionError, 
  AuthenticationError 
} from "@aibos/realtime";

try {
  const result = await realtimeClient.sendMessage('test', {});
} catch (error) {
  if (error instanceof ConnectionError) {
    // Handle connection errors
    console.error("Connection failed:", error.message);
  } else if (error instanceof AuthenticationError) {
    // Handle authentication errors
    console.error("Authentication failed:", error.message);
  } else if (error instanceof RealtimeError) {
    // Handle realtime errors
    console.error("Realtime error:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new realtime features
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.

## Modules

- [](README.md)
- [types](types/README.md)
