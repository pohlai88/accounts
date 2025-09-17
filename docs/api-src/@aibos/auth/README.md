[**AI-BOS Accounts API Documentation (Source)**](../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../README.md) / @aibos/auth

# DOC-285: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# @aibos/auth

Authentication and user management for the AI-BOS Accounting SaaS platform.

## Installation

```bash
pnpm add @aibos/auth
```

## Core Features

- **Supabase Integration**: Authentication with Supabase Auth
- **JWT Tokens**: Secure token-based authentication
- **User Management**: User registration, login, and profile management
- **Multi-tenant Support**: Tenant-based user isolation
- **Session Management**: Secure session handling
- **Password Management**: Password hashing and validation
- **Email Verification**: Email verification workflows
- **Password Reset**: Secure password reset functionality

## Quick Start

```typescript
import { AuthManager, UserManager } from "@aibos/auth";

// Initialize auth manager
const authManager = new AuthManager({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
});

// Initialize user manager
const userManager = new UserManager({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});
```

## Authentication

### User Registration

```typescript
import { AuthManager } from "@aibos/auth";

const authManager = new AuthManager({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
});

// Register new user
const { user, error } = await authManager.register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  tenantId: 'tenant_123'
});

if (error) {
  console.error('Registration failed:', error.message);
} else {
  console.log('User registered:', user.id);
}
```

### User Login

```typescript
// Login user
const { user, session, error } = await authManager.login({
  email: 'user@example.com',
  password: 'password123'
});

if (error) {
  console.error('Login failed:', error.message);
} else {
  console.log('User logged in:', user.id);
  console.log('Session:', session.access_token);
}
```

### Password Reset

```typescript
// Send password reset email
const { error } = await authManager.sendPasswordResetEmail({
  email: 'user@example.com',
  redirectTo: 'https://app.example.com/reset-password'
});

if (error) {
  console.error('Password reset failed:', error.message);
} else {
  console.log('Password reset email sent');
}

// Reset password
const { error } = await authManager.resetPassword({
  token: 'reset_token_here',
  newPassword: 'newpassword123'
});
```

## User Management

### User Profile

```typescript
import { UserManager } from "@aibos/auth";

const userManager = new UserManager({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

// Get user profile
const user = await userManager.getUser('user_123');

// Update user profile
const updatedUser = await userManager.updateUser('user_123', {
  name: 'John Smith',
  avatar: 'https://example.com/avatar.jpg'
});

// Delete user
await userManager.deleteUser('user_123');
```

### User Roles

```typescript
// Assign role to user
await userManager.assignRole('user_123', 'admin');

// Remove role from user
await userManager.removeRole('user_123', 'admin');

// Get user roles
const roles = await userManager.getUserRoles('user_123');
```

## Multi-tenant Support

### Tenant Management

```typescript
import { TenantManager } from "@aibos/auth";

const tenantManager = new TenantManager({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

// Create tenant
const tenant = await tenantManager.createTenant({
  name: 'Acme Corp',
  domain: 'acme.example.com',
  settings: {
    maxUsers: 100,
    features: ['invoices', 'bills', 'reports']
  }
});

// Get tenant
const tenantData = await tenantManager.getTenant('tenant_123');

// Update tenant
await tenantManager.updateTenant('tenant_123', {
  name: 'Acme Corporation',
  settings: {
    maxUsers: 200
  }
});
```

### User-Tenant Association

```typescript
// Add user to tenant
await userManager.addUserToTenant('user_123', 'tenant_123', {
  role: 'admin',
  permissions: ['read', 'write', 'admin']
});

// Remove user from tenant
await userManager.removeUserFromTenant('user_123', 'tenant_123');

// Get user tenants
const userTenants = await userManager.getUserTenants('user_123');
```

## Session Management

### Session Handling

```typescript
import { SessionManager } from "@aibos/auth";

const sessionManager = new SessionManager({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY
});

// Get current session
const session = await sessionManager.getSession();

// Refresh session
const newSession = await sessionManager.refreshSession();

// End session
await sessionManager.endSession();
```

### Token Management

```typescript
// Verify access token
const tokenData = await sessionManager.verifyToken(accessToken);

// Generate new token
const newToken = await sessionManager.generateToken({
  userId: 'user_123',
  tenantId: 'tenant_123',
  roles: ['admin', 'user']
});
```

## Configuration

### Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_ISSUER=aibos-accounts

# Email Configuration
EMAIL_FROM=noreply@aibos.com
EMAIL_TEMPLATES_PATH=./templates

# Security Configuration
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true
```

### Auth Configuration

```typescript
const authConfig = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'aibos-accounts'
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@aibos.com',
    templatesPath: process.env.EMAIL_TEMPLATES_PATH || './templates'
  }
};
```

## Testing

```bash
# Run auth tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test:auth:login
```

## Dependencies

- **@supabase/supabase-js**: Supabase client
- **jose**: JWT token handling
- **bcrypt**: Password hashing
- **zod**: Runtime validation

## Performance Considerations

- **Token Caching**: JWT tokens are cached for 5 minutes
- **Session Caching**: User sessions are cached in Redis
- **Connection Pooling**: Database connections are pooled
- **Batch Operations**: Bulk operations are batched

## Security

### Password Security

```typescript
import { PasswordValidator } from "@aibos/auth";

const passwordValidator = new PasswordValidator({
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true
});

// Validate password
const validation = passwordValidator.validate('Password123!');

if (!validation.isValid) {
  console.error('Password validation failed:', validation.errors);
}
```

### Token Security

```typescript
import { TokenValidator } from "@aibos/auth";

const tokenValidator = new TokenValidator({
  secret: process.env.JWT_SECRET,
  issuer: process.env.JWT_ISSUER
});

// Validate token
const tokenData = await tokenValidator.validate(accessToken);

if (!tokenData.isValid) {
  console.error('Token validation failed:', tokenData.error);
}
```

## Error Handling

```typescript
import { AuthError, UserError, TenantError } from "@aibos/auth";

try {
  const result = await authManager.login(credentials);
} catch (error) {
  if (error instanceof AuthError) {
    // Handle authentication errors
    console.error("Authentication failed:", error.message);
  } else if (error instanceof UserError) {
    // Handle user errors
    console.error("User operation failed:", error.message);
  } else if (error instanceof TenantError) {
    // Handle tenant errors
    console.error("Tenant operation failed:", error.message);
  }
}
```

## Contributing

1. Follow the coding standards
2. Add tests for new auth features
3. Update documentation
4. Run quality checks: `pnpm quality:check`

## License

MIT License - see LICENSE file for details.
