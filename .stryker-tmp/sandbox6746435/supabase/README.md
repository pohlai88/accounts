# Supabase — Database Configuration & Local Development

> **TL;DR**: Supabase configuration and local development setup for AI-BOS Accounts, including
> database schema, authentication, storage, and test data seeding.  
> **Owner**: @aibos/platform-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Provides Supabase configuration for local development
- Manages database schema and migrations
- Configures authentication and authorization
- Sets up storage and file management
- Provides test data seeding for development
- Manages local development environment

**Does NOT**:

- Implement business logic (delegated to @aibos/accounting)
- Handle UI components (delegated to @aibos/ui)
- Manage database operations (delegated to @aibos/db)
- Provide API endpoints (implemented by @aibos/web-api)

**Consumers**: Local development, testing, CI/CD pipelines

## 2) Quick Links

- **Configuration**: `config.toml`
- **Test Data**: `seed.sql`
- **Local Setup**: `../scripts/setup-local-supabase.ps1` (Windows)
- **Local Setup**: `../scripts/setup-local-supabase.sh` (Unix)
- **Database Package**: `../packages/db/README.md`
- **Architecture Guide**: `../docs/ARCHITECTURE.md`

## 3) Getting Started

```bash
# Prerequisites
# 1. Install Supabase CLI
npm install -g supabase

# 2. Start Docker Desktop

# 3. Setup local Supabase (Windows)
.\scripts\setup-local-supabase.ps1

# 3. Setup local Supabase (Unix)
./scripts/setup-local-supabase.sh

# 4. Access Supabase Studio
# Open http://localhost:54323 in your browser
```

## 4) Configuration Overview

### **Project Configuration (`config.toml`)**

**Project ID**: `aibos-accounts` **Database Version**: PostgreSQL 15 **API Port**: 54321 **Database
Port**: 54322 **Studio Port**: 54323

### **Service Configuration**

- **API**: Enabled with 1000 row limit
- **Database**: PostgreSQL 15 with shadow database
- **Realtime**: Enabled for live updates
- **Studio**: Web interface for database management
- **Storage**: 50MiB file size limit
- **Auth**: JWT tokens with 1-hour expiry
- **Email Testing**: Inbucket for email testing

## 5) Database Configuration

### **API Configuration**

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000
```

**Features**:

- RESTful API endpoints for all tables
- GraphQL API support
- Row-level security (RLS) enforcement
- Automatic API documentation

### **Database Configuration**

```toml
[db]
port = 54322
shadow_port = 54320
major_version = 15
```

**Features**:

- PostgreSQL 15 compatibility
- Shadow database for migrations
- Connection pooling support
- Local development database

### **Connection Pooler**

```toml
[db.pooler]
enabled = false
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100
```

**Features**:

- Transaction-level connection pooling
- Configurable pool sizes
- Connection reuse optimization
- Performance monitoring

## 6) Authentication Configuration

### **Auth Settings**

```toml
[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
```

**Features**:

- JWT token authentication
- Refresh token rotation
- Signup enabled for development
- Localhost redirect support

### **Email Authentication**

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
```

**Features**:

- Email-based authentication
- Double confirmation for email changes
- Email confirmations disabled for development
- Custom email templates support

### **SMS Authentication**

```toml
[auth.sms]
enable_signup = true
enable_confirmations = false
```

**Features**:

- SMS-based authentication
- Twilio integration support
- Test OTP for development
- Phone number confirmation

## 7) Storage Configuration

### **File Storage**

```toml
[storage]
enabled = true
file_size_limit = "50MiB"
```

**Features**:

- File upload and storage
- 50MiB file size limit
- Bucket-based organization
- CDN integration support

### **Storage Buckets**

- **Attachments**: Document and file attachments
- **Exports**: Generated reports and exports
- **Templates**: PDF and email templates
- **Backups**: Database and system backups

## 8) Development Services

### **Supabase Studio**

```toml
[studio]
enabled = true
port = 54323
api_url = "http://localhost:54321"
```

**Features**:

- Web-based database management
- Table editor and query interface
- Authentication user management
- Storage file browser
- API documentation

### **Email Testing (Inbucket)**

```toml
[inbucket]
enabled = true
port = 54324
```

**Features**:

- Email testing without sending real emails
- Web interface for viewing test emails
- SMTP and POP3 testing ports
- Email template testing

### **Realtime**

```toml
[realtime]
enabled = true
```

**Features**:

- Real-time database updates
- WebSocket connections
- Live data synchronization
- Event streaming

## 9) Test Data Seeding

### **Seed Data (`seed.sql`)**

**Purpose**: Provides test data for local development and testing

**Test Data Includes**:

- Test tenant and company
- Test user and membership
- Sample currencies (MYR, USD, SGD)
- Basic chart of accounts
- Required reference data

### **Test Entities**

```sql
-- Test Tenant
INSERT INTO tenants (id, name, slug) VALUES
('tenant-123', 'Test Tenant', 'test-tenant');

-- Test Company
INSERT INTO companies (id, tenant_id, name, code, base_currency) VALUES
('company-456', 'tenant-123', 'Test Company', 'TEST', 'MYR');

-- Test User
INSERT INTO users (id, email, first_name, last_name) VALUES
('user-789', 'test@example.com', 'Test', 'User');

-- Test Membership
INSERT INTO memberships (user_id, tenant_id, company_id, role) VALUES
('user-789', 'tenant-123', 'company-456', 'manager');
```

### **Chart of Accounts**

```sql
-- Basic Chart of Accounts
INSERT INTO chart_of_accounts (id, tenant_id, company_id, code, name, account_type, currency) VALUES
('00000000-0000-0000-0000-000000000001', 'tenant-123', 'company-456', '1000', 'Cash', 'ASSET', 'MYR'),
('00000000-0000-0000-0000-000000000002', 'tenant-123', 'company-456', '2000', 'Accounts Payable', 'LIABILITY', 'MYR'),
('00000000-0000-0000-0000-000000000003', 'tenant-123', 'company-456', '3000', 'Revenue', 'REVENUE', 'MYR'),
('00000000-0000-0000-0000-000000000004', 'tenant-123', 'company-456', '4000', 'Expenses', 'EXPENSE', 'MYR');
```

## 10) Local Development Workflow

### **Starting Local Supabase**

```bash
# Start all services
supabase start

# Check status
supabase status

# Stop services
supabase stop
```

### **Database Management**

```bash
# Reset database with seed data
supabase db reset

# Apply migrations
supabase db push

# Generate migration from schema changes
supabase db diff --schema public > migrations/new_migration.sql

# Open database in psql
supabase db connect
```

### **Schema Management**

```bash
# Generate TypeScript types
supabase gen types typescript --local > packages/db/src/types.ts

# Generate API types
supabase gen types typescript --local --schema public > packages/contracts/src/database.ts
```

## 11) Environment Variables

### **Required Environment Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Inngest Configuration
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### **Getting Keys**

```bash
# Get local Supabase keys
supabase status

# Copy the keys to your .env.local file
# API URL: http://localhost:54321
# anon key: (from supabase status output)
# service_role key: (from supabase status output)
```

## 12) Service URLs

### **Local Development URLs**

- **API**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio**: http://localhost:54323
- **Email Testing**: http://localhost:54324
- **Realtime**: ws://localhost:54321/realtime/v1/

### **Service Endpoints**

- **REST API**: http://localhost:54321/rest/v1/
- **GraphQL**: http://localhost:54321/graphql/v1/
- **Auth**: http://localhost:54321/auth/v1/
- **Storage**: http://localhost:54321/storage/v1/

## 13) Database Schema

### **Core Tables**

- **tenants**: Multi-tenant organization data
- **companies**: Company entities within tenants
- **users**: User accounts and profiles
- **memberships**: User-tenant-company relationships
- **currencies**: Supported currency codes
- **chart_of_accounts**: Accounting chart of accounts

### **Accounting Tables**

- **journals**: Journal entries and transactions
- **journal_lines**: Individual journal line items
- **fx_rates**: Foreign exchange rates
- **invoices**: Customer invoices (AR)
- **bills**: Vendor bills (AP)
- **payments**: Payment transactions

### **System Tables**

- **audit_logs**: System audit trail
- **idempotency_keys**: Request deduplication
- **attachments**: File attachments
- **exports**: Export history and metadata

## 14) Security Configuration

### **Row Level Security (RLS)**

- **Tenant Isolation**: All data scoped to tenant
- **Company Isolation**: Data scoped to company within tenant
- **User Access**: Role-based access control
- **API Security**: JWT token validation

### **Authentication Policies**

- **User Registration**: Email-based signup
- **Password Requirements**: Configurable complexity
- **Session Management**: JWT with refresh tokens
- **Multi-Factor**: SMS and email support

### **Data Protection**

- **Encryption**: Data encrypted at rest
- **Backups**: Automated backup retention
- **Audit Logging**: Complete operation tracking
- **Compliance**: GDPR and data protection ready

## 15) Troubleshooting

**Common Issues**:

- **Docker Not Running**: Start Docker Desktop before running Supabase
- **Port Conflicts**: Check if ports 54321-54324 are available
- **Database Connection**: Verify DATABASE_URL in environment
- **Migration Failures**: Check schema compatibility and dependencies

**Debug Mode**:

```bash
# Start with debug logging
supabase start --debug

# Check service logs
supabase logs

# Verify database connection
supabase db connect
```

**Logs**:

- Supabase service logs
- Database query logs
- Authentication logs
- Storage operation logs

## 16) Contributing

**Code Style**:

- Follow SQL best practices
- Use consistent naming conventions
- Document all schema changes
- Maintain backward compatibility

**Testing**:

- Test all seed data
- Validate schema migrations
- Test authentication flows
- Verify storage operations

**Review Process**:

- All changes must maintain data integrity
- Breaking changes require migration scripts
- New features need comprehensive testing
- Documentation must be updated

---

## 📚 **Additional Resources**

- [Project README](../README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [Database Package](../packages/db/README.md)
- [Setup Scripts](../scripts/README.md)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🔗 **Configuration Principles**

### **Development First**

- Local development environment optimization
- Easy setup and configuration
- Comprehensive test data
- Developer-friendly tooling

### **Security by Default**

- Row-level security enabled
- Authentication required
- Data encryption at rest
- Audit logging enabled

### **Performance Optimized**

- Connection pooling configured
- Query optimization
- Caching strategies
- Resource limits set

### **Production Ready**

- Scalable configuration
- Monitoring and alerting
- Backup and recovery
- Compliance features

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
