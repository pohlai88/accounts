# DOC-090: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Auth — Authentication Utilities Module

> **TL;DR**: Enhanced authentication utilities with React hooks and context management for
> comprehensive auth integration.  
> **Owner**: @aibos/utils-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Enhanced authentication context management
- React hooks for authentication
- User context extraction and validation
- Authentication state management
- Role-based access control utilities
- Session management helpers

**Does NOT**:

- Handle core authentication logic (delegated to @aibos/auth)
- Manage database operations (delegated to @aibos/db)
- Process business logic (delegated to @aibos/accounting)
- Generate financial reports (delegated to @aibos/accounting/src/reports)

**Consumers**: @aibos/web, @aibos/web-api, @aibos/accounting, external auth systems

## 2) Quick Links

- **Enhanced Context**: `enhanced-context.ts`
- **React Hooks**: `react-hooks.ts`
- **Main Utils**: `../README.md`
- **Context Module**: `../context/README.md`
- **Audit Module**: `../audit/README.md`

## 3) Getting Started

```typescript
import { useAuth, useUserContext, useRoleCheck } from "@aibos/utils/auth";
import {
  createEnhancedAuthContext,
  validateUserPermissions,
} from "@aibos/utils/auth";

// React hook usage
function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const userContext = useUserContext();
  const canPostJournals = useRoleCheck("accountant");

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <h1>
        Welcome, {user?.firstName} {user?.lastName}
      </h1>
      <p>Role: {userContext?.userRole}</p>
      {canPostJournals && <button>Post Journal</button>}
    </div>
  );
}

// Enhanced context creation
const authContext = createEnhancedAuthContext({
  userId: "user-123",
  userRole: "accountant",
  tenantId: "tenant-456",
  companyId: "company-789",
  permissions: ["journal:post", "report:view"],
  sessionId: "session-abc",
});
```

## 4) Architecture & Dependencies

**Dependencies**:

- React for hooks and context
- Context management for auth context
- Audit service for auth logging

**Dependents**:

- @aibos/web for frontend auth integration
- @aibos/web-api for API auth integration
- @aibos/accounting for business logic auth

**Build Order**: After context and audit modules, before web integration

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/utils dev
pnpm --filter @aibos/utils test
```

**Testing**:

```bash
pnpm --filter @aibos/utils test src/auth/
```

**Linting**:

```bash
pnpm --filter @aibos/utils lint src/auth/
```

**Type Checking**:

```bash
pnpm --filter @aibos/utils typecheck
```

## 6) API Surface

**Exports**:

### Enhanced Context (`enhanced-context.ts`)

- `createEnhancedAuthContext()` - Create enhanced auth context
- `validateUserPermissions()` - Validate user permissions
- `getUserPermissions()` - Get user permissions
- `checkRoleAccess()` - Check role-based access

### React Hooks (`react-hooks.ts`)

- `useAuth()` - Main authentication hook
- `useUserContext()` - User context hook
- `useRoleCheck()` - Role check hook
- `usePermissionCheck()` - Permission check hook

**Public Types**:

- `EnhancedAuthContext` - Enhanced auth context interface
- `UserPermissions` - User permissions interface
- `RoleAccess` - Role access interface
- `AuthState` - Authentication state interface

**Configuration**:

- Configurable permission system
- Role-based access control
- Session management

## 7) Performance & Monitoring

**Bundle Size**: ~12KB minified  
**Performance Budget**: <50ms for auth context creation, <10ms for permission checks  
**Monitoring**: Axiom telemetry integration for auth operations

## 8) Security & Compliance

**Permissions**:

- Auth context creation requires valid user session
- Permission checks require authenticated user
- Role validation enforced

**Data Handling**:

- All auth data validated and sanitized
- Secure session management
- Audit trail for auth operations

**Compliance**:

- V1 compliance for auth operations
- SoD enforcement for auth access
- Security audit compliance

## 9) Usage Examples

### Basic Authentication Hooks

```typescript
import { useAuth, useUserContext, useRoleCheck } from "@aibos/utils/auth";

function Dashboard() {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  const userContext = useUserContext();

  // Role-based access
  const canPostJournals = useRoleCheck("accountant");
  const canViewReports = useRoleCheck("manager");
  const canManageUsers = useRoleCheck("admin");

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        Welcome, {user?.firstName} {user?.lastName}
      </p>
      <p>Role: {userContext?.userRole}</p>
      <p>Tenant: {userContext?.tenantId}</p>
      <p>Company: {userContext?.companyId}</p>

      {canPostJournals && <button>Post Journal Entry</button>}

      {canViewReports && <button>View Financial Reports</button>}

      {canManageUsers && <button>Manage Users</button>}
    </div>
  );
}
```

### Permission-Based Access Control

```typescript
import { usePermissionCheck, useRoleCheck } from "@aibos/utils/auth";

function JournalEntryForm() {
  const canPostJournals = usePermissionCheck("journal:post");
  const canEditJournals = usePermissionCheck("journal:edit");
  const canDeleteJournals = usePermissionCheck("journal:delete");
  const isAccountant = useRoleCheck("accountant");
  const isManager = useRoleCheck("manager");

  return (
    <form>
      <h2>Journal Entry</h2>

      {canPostJournals && (
        <div>
          <label>Journal Number</label>
          <input type="text" name="journalNumber" />
        </div>
      )}

      {canEditJournals && (
        <div>
          <label>Description</label>
          <textarea name="description" />
        </div>
      )}

      <div>
        <button type="submit" disabled={!canPostJournals}>
          Post Journal
        </button>

        {canEditJournals && <button type="button">Edit</button>}

        {canDeleteJournals && (
          <button type="button" className="danger">
            Delete
          </button>
        )}
      </div>

      {isManager && (
        <div className="manager-actions">
          <button>Approve</button>
          <button>Reject</button>
        </div>
      )}
    </form>
  );
}
```

### Enhanced Auth Context

```typescript
import { createEnhancedAuthContext, validateUserPermissions } from "@aibos/utils/auth";

// Create enhanced auth context
const authContext = createEnhancedAuthContext({
  userId: "user-123",
  userRole: "accountant",
  tenantId: "tenant-456",
  companyId: "company-789",
  permissions: ["journal:post", "journal:view", "report:view", "customer:view"],
  sessionId: "session-abc",
  lastLogin: new Date(),
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
});

// Validate user permissions
const canPostJournals = validateUserPermissions(authContext, "journal:post");
const canManageUsers = validateUserPermissions(authContext, "user:manage");

console.log("Can post journals:", canPostJournals); // true
console.log("Can manage users:", canManageUsers); // false

// Check role access
const roleAccess = checkRoleAccess(authContext, "accountant");
console.log("Has accountant role:", roleAccess); // true

// Get user permissions
const permissions = getUserPermissions(authContext);
console.log("User permissions:", permissions);
// ['journal:post', 'journal:view', 'report:view', 'customer:view']
```

### Advanced Permission Management

```typescript
import { createEnhancedAuthContext, validateUserPermissions } from "@aibos/utils/auth";

// Create context with complex permissions
const authContext = createEnhancedAuthContext({
  userId: "user-123",
  userRole: "manager",
  tenantId: "tenant-456",
  companyId: "company-789",
  permissions: [
    "journal:post",
    "journal:view",
    "journal:edit",
    "journal:delete",
    "report:view",
    "report:export",
    "customer:view",
    "customer:edit",
    "user:view",
    "user:edit",
  ],
  sessionId: "session-abc",
});

// Check multiple permissions
const canManageJournals = validateUserPermissions(authContext, [
  "journal:post",
  "journal:edit",
  "journal:delete",
]);

const canManageUsers = validateUserPermissions(authContext, ["user:view", "user:edit"]);

const canExportReports = validateUserPermissions(authContext, ["report:view", "report:export"]);

console.log("Can manage journals:", canManageJournals); // true
console.log("Can manage users:", canManageUsers); // true
console.log("Can export reports:", canExportReports); // true

// Check specific permission
const canDeleteJournals = validateUserPermissions(authContext, "journal:delete");
console.log("Can delete journals:", canDeleteJournals); // true
```

### Auth State Management

```typescript
import { useAuth } from "@aibos/utils/auth";

function AuthProvider() {
  const { user, isAuthenticated, isLoading, error, login, logout } = useAuth();

  const handleLogin = async (credentials: {
    email: string;
    password: string;
  }) => {
    try {
      await login(credentials);
      console.log("Login successful");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <h2>Authentication Error</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Please Log In</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            handleLogin({
              email: formData.get("email") as string,
              password: formData.get("password") as string,
            });
          }}
        >
          <input type="email" name="email" placeholder="Email" required />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2>
        Welcome, {user?.firstName} {user?.lastName}
      </h2>
      <p>Role: {user?.role}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

## 10) Troubleshooting

**Common Issues**:

- **Auth Context Missing**: Ensure auth context is created before use
- **Permission Denied**: Check user permissions and roles
- **Session Expired**: Handle session expiration gracefully
- **Role Mismatch**: Verify user role assignments

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_AUTH = "true";
```

**Logs**: Check Axiom telemetry for auth operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex auth logic

**Testing**:

- Test all auth hooks and context
- Test permission validation
- Test role-based access control
- Test session management

**Review Process**:

- All auth operations must be validated
- Security requirements must be met
- Permission system must be comprehensive
- Performance must be optimized

---

## 📚 **Additional Resources**

- [Utils Package README](../README.md)
- [Context Module](../context/README.md)
- [Audit Module](../audit/README.md)
- [Web Package](../../web/README.md)
- [Web API Package](../../web-api/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
