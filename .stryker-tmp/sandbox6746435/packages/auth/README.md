# DOC-201: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Auth — Authentication & Authorization

> **TL;DR**: Comprehensive RBAC + ABAC + Feature Flag system with SoD compliance, governance packs,
> and multi-tenant security. Implements V1 authentication requirements with enhanced permission
> matrix.  
> **Owner**: @aibos/security-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Implements comprehensive Role-Based Access Control (RBAC)
- Provides Attribute-Based Access Control (ABAC) with amount thresholds
- Enforces Separation of Duties (SoD) compliance
- Manages feature flags and policy settings
- Offers pre-configured governance packs for different organization types
- Handles multi-tenant user context and permissions
- Validates user actions against business rules and security policies

**Does NOT**:

- Handle user authentication (login/logout) - delegated to Supabase
- Manage user sessions - handled by session management layer
- Store user data - uses external user management system
- Handle password management - delegated to authentication provider

**Consumers**: @aibos/accounting, @aibos/web-api, @aibos/web

## 2) Quick Links

- **Types & Interfaces**: `src/types.ts`
- **SoD Matrix**: `src/sod.ts`
- **Governance Packs**: `src/governance-packs.ts`
- **Tests**: `tests/admin-permissions.test.ts`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`
- **Integration Strategy**: `../DRAFT_INTEGRATION STRATEGY.md`

## 3) Getting Started

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Watch mode for development
pnpm dev
```

## 4) Architecture & Dependencies

**Dependencies**:

- `zod` - Schema validation and type safety

**Dependents**:

- `@aibos/accounting` - SoD compliance for journal posting
- `@aibos/web-api` - Permission validation for API endpoints
- `@aibos/web` - UI permission checks and feature flags

**Build Order**: No dependencies, can be built independently

## 5) Development Workflow

**Local Dev**:

```bash
# Build with watch mode
pnpm dev

# Run specific tests
pnpm test admin-permissions.test.ts
```

**Testing**:

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test --grep "RBAC"
```

**Linting**:

```bash
# Check for linting errors
pnpm lint

# Auto-fix where possible
pnpm lint --fix
```

**Type Checking**:

```bash
# TypeScript compilation check
pnpm build
```

## 6) API Surface

**Exports**:

- `canPerformAction()` - Main permission checking function
- `isFeatureEnabled()` - Feature flag validation
- `checkSoDCompliance()` - Legacy SoD compliance check
- `SOD_MATRIX` - Complete SoD rule matrix
- `GOVERNANCE_PACKS` - Pre-configured governance packs
- `applyGovernancePack()` - Apply governance pack configuration
- `getRecommendedPack()` - Get recommended pack based on org size

**Public Types**:

- `UserContext` - User context with roles and permissions
- `ActionContext` - Action context with amount and module info
- `Decision` - Permission decision result
- `FeatureFlags` - Feature flag configuration
- `PolicySettings` - Policy configuration
- `GovernancePack` - Complete governance pack structure

**Configuration**:

- SoD matrix with business rules
- Feature flag definitions
- Policy settings and thresholds
- Governance pack configurations

## 7) Performance & Monitoring

**Bundle Size**:

- Target: <50KB for core auth logic
- Optimized for tree-shaking
- Minimal dependencies for fast loading

**Performance Budget**:

- Permission check: <1ms per request
- Feature flag check: <0.1ms per check
- Governance pack lookup: <0.5ms per lookup

**Monitoring**:

- Permission check metrics
- SoD violation tracking
- Feature flag usage analytics
- Governance pack adoption metrics

## 8) Security & Compliance

**Permissions**:

- Multi-layered permission system (RBAC + ABAC)
- SoD compliance enforcement
- Amount-based access control
- Feature flag-based restrictions

**Data Handling**:

- No sensitive data storage
- Immutable permission structures
- Type-safe permission checking
- Audit trail integration

**Compliance**:

- SoD compliance for accounting operations
- SOX/MFRS compliance support
- Multi-tenant security isolation
- Role-based access control

## 9) Core Modules

### **SoD Matrix (`sod.ts`)**

- `SOD_MATRIX` - Complete separation of duties rule matrix
- `canPerformAction()` - Main permission checking function
- `isFeatureEnabled()` - Feature flag validation
- `checkSoDCompliance()` - Legacy compatibility function

### **Governance Packs (`governance-packs.ts`)**

- `STARTER_PACK` - Small teams (≤10 users)
- `BUSINESS_PACK` - Growing companies (11-200 users)
- `ENTERPRISE_PACK` - Large enterprises (200+ users)
- `REGULATED_FINANCE_PACK` - SOX/MFRS compliance
- `FRANCHISE_PACK` - Multi-brand operations

### **Types (`types.ts`)**

- `UserContext` - User context structure
- `ActionContext` - Action context structure
- `FeatureFlags` - Feature flag configuration
- `PolicySettings` - Policy configuration
- `AuthUser` - Authentication user structure

## 10) Permission System

### **RBAC (Role-Based Access Control)**

- **Roles**: admin, manager, accountant, clerk, viewer, auditor
- **Role Hierarchy**: admin > manager > accountant > clerk > viewer
- **Module-based Access**: GL, AR, AP, REPORTS, ADMIN, ATTACHMENTS

### **ABAC (Attribute-Based Access Control)**

- **Amount Thresholds**: Configurable approval thresholds
- **Module Restrictions**: Module-specific access control
- **Creator Role Checks**: SoD violation prevention
- **IP Allowlisting**: Network-based restrictions

### **Feature Flags**

- **Global Flags**: System-wide feature enablement
- **Role-based Flags**: Role-specific feature access
- **Module Flags**: Module-specific feature control
- **Compliance Flags**: Regulatory compliance features

### **SoD Compliance**

- **Creator-Approver Separation**: Users cannot approve their own work
- **Amount-based Approval**: High-value transactions require approval
- **Module Isolation**: Separate access for different modules
- **Audit Trail**: Complete permission decision logging

## 11) Governance Packs

### **Starter Pack**

- **Use Case**: Small teams (≤10 users, single company)
- **Features**: Basic AR, reports, attachments
- **Roles**: owner, accountant, viewer
- **Thresholds**: 50,000 RM approval threshold

### **Business Pack**

- **Use Case**: Growing companies (11-200 users, multi-dept)
- **Features**: Full AR/AP, journal entries, reports
- **Roles**: owner, admin, manager, accountant, clerk, viewer
- **Thresholds**: 30,000 RM approval threshold

### **Enterprise Pack**

- **Use Case**: Large enterprises (200+ users, audit scrutiny)
- **Features**: All features + regulated mode
- **Roles**: owner, admin, manager, accountant, clerk, auditor, viewer
- **Thresholds**: 10,000 RM approval threshold

### **Regulated Finance Pack**

- **Use Case**: Listed companies, IPO-track, external audit
- **Features**: SOX/MFRS compliance, strict SoD
- **Roles**: owner, cfo, controller, accountant, clerk, auditor, viewer
- **Thresholds**: 5,000 RM approval threshold

### **Franchise Pack**

- **Use Case**: Multi-brand operations, delegated administration
- **Features**: Multi-entity support, regional management
- **Roles**: hq_admin, regional_manager, franchise_admin, store_manager, cashier, viewer
- **Thresholds**: 20,000 RM approval threshold

## 12) Troubleshooting

**Common Issues**:

- **Permission Denied**: Check user roles and feature flags
- **SoD Violations**: Verify creator-approver separation
- **Feature Disabled**: Check feature flag configuration
- **Threshold Exceeded**: Verify amount thresholds and approver roles

**Debug Mode**:

```bash
# Enable detailed permission logging
LOG_LEVEL=debug pnpm test

# Test specific permission scenarios
pnpm test --grep "SoD violation"
```

**Logs**:

- Permission decision details
- SoD violation warnings
- Feature flag check results
- Governance pack application logs

## 13) Contributing

**Code Style**:

- Follow functional programming principles
- Use immutable data structures
- Implement comprehensive error handling
- Maintain SoD compliance integrity

**Testing**:

- Write unit tests for all permission scenarios
- Test SoD compliance edge cases
- Validate governance pack configurations
- Test multi-tenant isolation

**Review Process**:

- All changes must maintain SoD compliance
- Security review required for permission changes
- Governance pack changes need business validation
- Performance impact must be considered

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Integration Strategy](../DRAFT_INTEGRATION STRATEGY.md)
- [Accounting Package](../packages/accounting/README.md)
- [Web API Package](../apps/web-api/README.md)

---

## 🔐 **Security Principles**

### **Separation of Duties (SoD)**

- Users cannot approve their own work
- High-value transactions require approval
- Different roles for different operations
- Audit trail for all permission decisions

### **Principle of Least Privilege**

- Users get minimum required permissions
- Feature flags control access granularity
- Role-based access with explicit overrides
- Regular permission audits and reviews

### **Defense in Depth**

- Multiple layers of permission checking
- RBAC + ABAC + Feature Flags
- Amount-based access control
- Network and session restrictions

### **Compliance by Design**

- Built-in SOX/MFRS compliance
- Configurable governance packs
- Audit trail for all decisions
- Multi-tenant security isolation

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
