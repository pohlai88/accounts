# DOC-287: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/config

Configuration management for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/config
```

## Core Features

- **Environment Configuration**: Multi-environment config management
- **Configuration Validation**: Schema-based configuration validation
- **Secrets Management**: Secure secrets handling
- **Configuration Hot Reload**: Runtime configuration updates
- **Configuration Merging**: Hierarchical configuration merging
- **Type Safety**: TypeScript configuration types
- **Configuration Templates**: Reusable configuration templates
- **Configuration Documentation**: Auto-generated config docs

## Quick Start

```typescript
import { ConfigManager, EnvironmentConfig } from "@aibos/config";

// Initialize config manager
const configManager = new ConfigManager({
  environment: process.env.NODE_ENV || 'development',
  configPath: './config',
  secretsPath: './secrets',
  validation: true
});

// Load configuration
const config = await configManager.loadConfig();

// Get configuration value
const databaseUrl = config.get('database.url');
const apiPort = config.get('api.port', 3000);
```

## Configuration Structure

### Environment-based Configuration

```typescript
import { EnvironmentConfig } from "@aibos/config";

const environmentConfig = new EnvironmentConfig({
  development: {
    api: {
      port: 3000,
      host: 'localhost',
      timeout: 30000
    },
    database: {
      url: 'postgresql://dev:dev@localhost:5432/aibos_dev',
      poolSize: 5,
      ssl: false
    },
    redis: {
      url: 'redis://localhost:6379/0',
      ttl: 3600
    },
    monitoring: {
      enabled: false,
      level: 'debug'
    }
  },
  staging: {
    api: {
      port: 3000,
      host: '0.0.0.0',
      timeout: 30000
    },
    database: {
      url: process.env.STAGING_DATABASE_URL,
      poolSize: 10,
      ssl: true
    },
    redis: {
      url: process.env.STAGING_REDIS_URL,
      ttl: 3600
    },
    monitoring: {
      enabled: true,
      level: 'info'
    }
  },
  production: {
    api: {
      port: 3000,
      host: '0.0.0.0',
      timeout: 30000
    },
    database: {
      url: process.env.PRODUCTION_DATABASE_URL,
      poolSize: 20,
      ssl: true
    },
    redis: {
      url: process.env.PRODUCTION_REDIS_URL,
      ttl: 3600
    },
    monitoring: {
      enabled: true,
      level: 'warn'
    }
  }
});
```

### Configuration Files

```typescript
// config/default.json
{
  "api": {
    "port": 3000,
    "host": "0.0.0.0",
    "timeout": 30000,
    "cors": {
      "origin": ["https://app.aibos.com"],
      "credentials": true
    }
  },
  "database": {
    "poolSize": 10,
    "ssl": false,
    "timeout": 30000
  },
  "redis": {
    "ttl": 3600,
    "retryAttempts": 3,
    "retryDelay": 1000
  },
  "monitoring": {
    "enabled": true,
    "level": "info",
    "sampleRate": 1.0
  }
}

// config/development.json
{
  "api": {
    "port": 3000,
    "host": "localhost"
  },
  "database": {
    "url": "postgresql://dev:dev@localhost:5432/aibos_dev",
    "ssl": false
  },
  "redis": {
    "url": "redis://localhost:6379/0"
  },
  "monitoring": {
    "enabled": false,
    "level": "debug"
  }
}

// config/production.json
{
  "api": {
    "host": "0.0.0.0"
  },
  "database": {
    "url": "${DATABASE_URL}",
    "ssl": true
  },
  "redis": {
    "url": "${REDIS_URL}"
  },
  "monitoring": {
    "enabled": true,
    "level": "warn"
  }
}
```

## Configuration Validation

### Schema Definition

```typescript
import { ConfigSchema, ConfigValidator } from "@aibos/config";

const configSchema = new ConfigSchema({
  api: {
    port: {
      type: 'number',
      min: 1,
      max: 65535,
      default: 3000
    },
    host: {
      type: 'string',
      pattern: '^[a-zA-Z0-9.-]+$',
      default: '0.0.0.0'
    },
    timeout: {
      type: 'number',
      min: 1000,
      max: 300000,
      default: 30000
    },
    cors: {
      origin: {
        type: 'array',
        items: { type: 'string' },
        default: ['https://app.aibos.com']
      },
      credentials: {
        type: 'boolean',
        default: true
      }
    }
  },
  database: {
    url: {
      type: 'string',
      pattern: '^postgresql://',
      required: true
    },
    poolSize: {
      type: 'number',
      min: 1,
      max: 100,
      default: 10
    },
    ssl: {
      type: 'boolean',
      default: false
    },
    timeout: {
      type: 'number',
      min: 1000,
      max: 300000,
      default: 30000
    }
  },
  redis: {
    url: {
      type: 'string',
      pattern: '^redis://',
      required: true
    },
    ttl: {
      type: 'number',
      min: 60,
      max: 86400,
      default: 3600
    },
    retryAttempts: {
      type: 'number',
      min: 1,
      max: 10,
      default: 3
    },
    retryDelay: {
      type: 'number',
      min: 100,
      max: 10000,
      default: 1000
    }
  },
  monitoring: {
    enabled: {
      type: 'boolean',
      default: true
    },
    level: {
      type: 'string',
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info'
    },
    sampleRate: {
      type: 'number',
      min: 0,
      max: 1,
      default: 1.0
    }
  }
});

// Validate configuration
const validator = new ConfigValidator(configSchema);
const validation = validator.validate(config);

if (!validation.isValid) {
  console.error('Configuration validation failed:', validation.errors);
}
```

### Runtime Validation

```typescript
import { RuntimeValidator } from "@aibos/config";

const runtimeValidator = new RuntimeValidator({
  schema: configSchema,
  strict: true,
  abortEarly: false
});

// Validate at runtime
const config = await configManager.loadConfig();
const validatedConfig = runtimeValidator.validate(config);
```

## Secrets Management

### Secrets Configuration

```typescript
import { SecretsManager } from "@aibos/config";

const secretsManager = new SecretsManager({
  provider: 'aws-secrets-manager',
  region: 'us-east-1',
  secrets: [
    'aibos/database/password',
    'aibos/jwt/secret',
    'aibos/redis/password',
    'aibos/email/api-key'
  ],
  cache: {
    enabled: true,
    ttl: 300000 // 5 minutes
  }
});

// Load secrets
const secrets = await secretsManager.loadSecrets();

// Get secret value
const databasePassword = secrets.get('aibos/database/password');
const jwtSecret = secrets.get('aibos/jwt/secret');
```

### Environment Variables

```typescript
import { EnvironmentSecrets } from "@aibos/config";

const environmentSecrets = new EnvironmentSecrets({
  prefix: 'AIBOS_',
  secrets: {
    'DATABASE_PASSWORD': 'database.password',
    'JWT_SECRET': 'jwt.secret',
    'REDIS_PASSWORD': 'redis.password',
    'EMAIL_API_KEY': 'email.apiKey'
  }
});

// Load from environment
const secrets = await environmentSecrets.loadSecrets();
```

## Configuration Hot Reload

### Hot Reload Manager

```typescript
import { HotReloadManager } from "@aibos/config";

const hotReloadManager = new HotReloadManager({
  configPath: './config',
  watchFiles: ['*.json', '*.yaml', '*.yml'],
  debounceMs: 1000,
  onReload: (newConfig) => {
    console.log('Configuration reloaded:', newConfig);
    // Update application configuration
    updateApplicationConfig(newConfig);
  }
});

// Start hot reload
await hotReloadManager.start();

// Stop hot reload
await hotReloadManager.stop();
```

### Configuration Updates

```typescript
import { ConfigUpdater } from "@aibos/config";

const configUpdater = new ConfigUpdater({
  configManager,
  hotReloadManager,
  validation: true
});

// Update configuration
await configUpdater.updateConfig({
  'api.port': 3001,
  'monitoring.level': 'debug'
});

// Rollback configuration
await configUpdater.rollbackConfig();
```

## Configuration Merging

### Hierarchical Merging

```typescript
import { ConfigMerger } from "@aibos/config";

const configMerger = new ConfigMerger({
  strategy: 'deep-merge',
  arrays: 'replace',
  objects: 'merge'
});

// Merge configurations
const mergedConfig = configMerger.merge([
  defaultConfig,
  environmentConfig,
  localConfig,
  runtimeConfig
]);
```

### Configuration Override

```typescript
import { ConfigOverride } from "@aibos/config";

const configOverride = new ConfigOverride({
  overrides: {
    'api.port': process.env.API_PORT,
    'database.url': process.env.DATABASE_URL,
    'redis.url': process.env.REDIS_URL,
    'monitoring.enabled': process.env.MONITORING_ENABLED === 'true'
  }
});

// Apply overrides
const overriddenConfig = configOverride.applyOverrides(baseConfig);
```

## Type Safety

### TypeScript Types

```typescript
import { ConfigTypes } from "@aibos/config";

// Configuration interface
interface AppConfig {
  api: {
    port: number;
    host: string;
    timeout: number;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
  database: {
    url: string;
    poolSize: number;
    ssl: boolean;
    timeout: number;
  };
  redis: {
    url: string;
    ttl: number;
    retryAttempts: number;
    retryDelay: number;
  };
  monitoring: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    sampleRate: number;
  };
}

// Type-safe configuration
const config: AppConfig = await configManager.loadConfig();
```

### Configuration Generators

```typescript
import { ConfigGenerator } from "@aibos/config";

const configGenerator = new ConfigGenerator({
  schema: configSchema,
  outputPath: './generated',
  formats: ['typescript', 'json', 'yaml']
});

// Generate configuration types
await configGenerator.generateTypes();

// Generate configuration documentation
await configGenerator.generateDocs();
```

## Configuration Templates

### Template Engine

```typescript
import { ConfigTemplate } from "@aibos/config";

const configTemplate = new ConfigTemplate({
  templatePath: './templates',
  variables: {
    environment: process.env.NODE_ENV,
    region: process.env.AWS_REGION,
    cluster: process.env.KUBERNETES_CLUSTER
  }
});

// Render template
const renderedConfig = await configTemplate.render('production.json.template');
```

### Template Variables

```typescript
// templates/production.json.template
{
  "api": {
    "port": {{ api.port | default(3000) }},
    "host": "{{ api.host | default('0.0.0.0') }}",
    "timeout": {{ api.timeout | default(30000) }}
  },
  "database": {
    "url": "{{ database.url | required }}",
    "poolSize": {{ database.poolSize | default(20) }},
    "ssl": {{ database.ssl | default(true) }}
  },
  "redis": {
    "url": "{{ redis.url | required }}",
    "ttl": {{ redis.ttl | default(3600) }}
  },
  "monitoring": {
    "enabled": {{ monitoring.enabled | default(true) }},
    "level": "{{ monitoring.level | default('warn') }}"
  }
}
```

## Configuration Documentation

### Auto-generated Docs

```typescript
import { ConfigDocumentation } from "@aibos/config";

const configDocumentation = new ConfigDocumentation({
  schema: configSchema,
  outputPath: './docs',
  formats: ['markdown', 'html', 'json'],
  includeExamples: true,
  includeDefaults: true
});

// Generate documentation
await configDocumentation.generateDocs();
```

### Configuration Examples

```typescript
import { ConfigExamples } from "@aibos/config";

const configExamples = new ConfigExamples({
  schema: configSchema,
  examples: [
    {
      name: 'development',
      description: 'Development environment configuration',
      config: {
        api: { port: 3000, host: 'localhost' },
        database: { url: 'postgresql://dev:dev@localhost:5432/aibos_dev' },
        redis: { url: 'redis://localhost:6379/0' },
        monitoring: { enabled: false, level: 'debug' }
      }
    },
    {
      name: 'production',
      description: 'Production environment configuration',
      config: {
        api: { port: 3000, host: '0.0.0.0' },
        database: { url: '${DATABASE_URL}', ssl: true },
        redis: { url: '${REDIS_URL}' },
        monitoring: { enabled: true, level: 'warn' }
      }
    }
  ]
});

// Generate examples
await configExamples.generateExamples();
```

## Configuration

### Environment Variables

```env
# Configuration Management
CONFIG_ENVIRONMENT=development
CONFIG_PATH=./config
CONFIG_SECRETS_PATH=./secrets
CONFIG_VALIDATION=true
CONFIG_HOT_RELOAD=true

# Configuration Overrides
API_PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/aibos
REDIS_URL=redis://localhost:6379/0
MONITORING_ENABLED=true
MONITORING_LEVEL=info

# Secrets Management
SECRETS_PROVIDER=aws-secrets-manager
SECRETS_REGION=us-east-1
SECRETS_CACHE_ENABLED=true
SECRETS_CACHE_TTL=300000
```

### Configuration Manager

```typescript
const configManagerConfig = {
  environment: process.env.CONFIG_ENVIRONMENT || 'development',
  configPath: process.env.CONFIG_PATH || './config',
  secretsPath: process.env.CONFIG_SECRETS_PATH || './secrets',
  validation: process.env.CONFIG_VALIDATION === 'true',
  hotReload: process.env.CONFIG_HOT_RELOAD === 'true',
  overrides: {
    'api.port': process.env.API_PORT,
    'database.url': process.env.DATABASE_URL,
    'redis.url': process.env.REDIS_URL,
    'monitoring.enabled': process.env.MONITORING_ENABLED === 'true',
    'monitoring.level': process.env.MONITORING_LEVEL
  },
  secrets: {
    provider: process.env.SECRETS_PROVIDER || 'environment',
    region: process.env.SECRETS_REGION || 'us-east-1',
    cache: {
      enabled: process.env.SECRETS_CACHE_ENABLED === 'true',
      ttl: parseInt(process.env.SECRETS_CACHE_TTL || '300000')
    }
  }
};
```

## Testing

```bash
# Run config tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run validation tests
pnpm test:validation
```

## Dependencies

- **zod**: Schema validation
- **yaml**: YAML parsing
- **dotenv**: Environment variables
- **aws-sdk**: AWS Secrets Manager
- **chokidar**: File watching

## Performance Considerations

- **Configuration Caching**: Configurations are cached
- **Lazy Loading**: Configurations are loaded on demand
- **Validation Optimization**: Validation is optimized
- **Hot Reload Efficiency**: Hot reload is efficient

## Security

- **Secrets Encryption**: Secrets are encrypted
- **Access Control**: Configuration access is controlled
- **Validation**: All configurations are validated
- **Audit Logging**: Configuration changes are logged

## Error Handling

```typescript
import { 
  ConfigError, 
  ValidationError, 
  SecretsError 
} from "@aibos/config";

try {
  const config = await configManager.loadConfig();
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors
    console.error("Configuration validation failed:", error.details);
  } else if (error instanceof SecretsError) {
    // Handle secrets errors
    console.error("Secrets loading failed:", error.message);
  } else if (error instanceof ConfigError) {
    // Handle configuration errors
    console.error("Configuration error:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new configuration features
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.

