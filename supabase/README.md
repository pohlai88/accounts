# DOC-301: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Supabase Configuration

Supabase configuration and functions for the AI-BOS Accounting SaaS platform.

## Overview

This directory contains the Supabase configuration, database migrations, and edge functions for the AI-BOS Accounting SaaS platform. Supabase serves as our primary database and backend-as-a-service provider, offering PostgreSQL database, authentication, real-time subscriptions, and edge functions.

## Structure

```
supabase/
├── config.toml          # Supabase configuration
├── migrations/          # Database migrations
├── functions/           # Edge functions
├── seed.sql            # Seed data
├── types/              # Generated TypeScript types
└── README.md           # This file
```

## Core Features

- **PostgreSQL Database**: Robust relational database with advanced features
- **Row Level Security**: Multi-tenant data isolation and security
- **Authentication**: Built-in user management and JWT tokens
- **Real-time**: Live data subscriptions and updates
- **Edge Functions**: Serverless functions for business logic
- **Storage**: File storage with CDN integration
- **API Generation**: Auto-generated REST and GraphQL APIs

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase CLI installed globally
- Docker Desktop for local development

### Local Development

```bash
# Start Supabase locally
supabase start

# Run migrations
supabase db reset

# Deploy functions
supabase functions deploy

# Generate TypeScript types
supabase gen types typescript --local > types/database.types.ts

# Stop Supabase
supabase stop
```

### Database Management

```bash
# Generate migration from schema changes
supabase db diff --file new_migration

# Apply migration to remote database
supabase db push

# Reset local database
supabase db reset

# Open database studio
supabase studio

# View database logs
supabase db logs
```

### Function Development

```bash
# Deploy specific function
supabase functions deploy function-name

# Test function locally
supabase functions serve

# View function logs
supabase functions logs function-name

# Delete function
supabase functions delete function-name
```

## Configuration

### Supabase Config (config.toml)

```toml
# Supabase configuration
project_id = "your-project-id"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324

[storage]
enabled = true
file_size_limit = "50Mi"
buckets = [
  { name = "invoices", public = false },
  { name = "bills", public = false },
  { name = "attachments", public = false },
  { name = "reports", public = false },
  { name = "avatars", public = true }
]

[edge_functions]
enabled = true
port = 54325

[auth]
enabled = true
port = 54324
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://your-domain.com"]
```

### Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
DATABASE_POOL_SIZE=10
DATABASE_TIMEOUT=30000
DATABASE_SSL_MODE=require

# Storage Configuration
STORAGE_URL=https://your-project.supabase.co/storage/v1
STORAGE_BUCKET=invoices
STORAGE_MAX_FILE_SIZE=52428800

# Auth Configuration
AUTH_JWT_SECRET=your_jwt_secret
AUTH_JWT_EXPIRY=3600
```

## Database Schema

### Core Tables

#### Tenants

Multi-tenant architecture with tenant isolation:

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Companies

Business entities within tenants:

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  fiscal_year_start DATE DEFAULT '01-01',
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Users

User management with role-based access:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  last_login TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Accounting Tables

#### Chart of Accounts

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  parent_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Invoices

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft',
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Edge Functions

### Invoice Processing Function

```typescript
// functions/process-invoice/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { invoiceId, tenantId, companyId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Process invoice
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .single();

    if (invoiceError) {
      throw invoiceError;
    }

    // Calculate totals
    const { data: lines, error: linesError } = await supabaseClient
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", invoiceId);

    if (linesError) {
      throw linesError;
    }

    const totalAmount = lines.reduce((sum, line) => sum + parseFloat(line.line_total), 0);

    // Update invoice total
    const { error: updateError } = await supabaseClient
      .from("invoices")
      .update({ total_amount: totalAmount })
      .eq("id", invoiceId);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, totalAmount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```

### Payment Processing Function

```typescript
// functions/process-payment/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async req => {
  try {
    const { paymentId, allocations } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Process payment allocations
    for (const allocation of allocations) {
      await supabaseClient.from("payment_allocations").insert({
        payment_id: paymentId,
        invoice_id: allocation.invoiceId,
        allocated_amount: allocation.amount,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

## Security

### Row Level Security (RLS)

All tables implement RLS policies for tenant isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "Users can only access their tenant data" ON users
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Company isolation policy
CREATE POLICY "Users can only access their company data" ON companies
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Authentication

- JWT-based authentication with Supabase Auth
- Role-based access control (RBAC)
- Session management with refresh tokens
- Multi-factor authentication support

### Data Protection

- Data encryption at rest and in transit
- Secure connections (SSL/TLS)
- Input validation and sanitization
- SQL injection prevention
- GDPR compliance features

## Monitoring and Observability

### Database Monitoring

- Query performance tracking
- Connection pool monitoring
- Error rate monitoring
- Resource usage tracking
- Slow query identification

### Function Monitoring

- Execution time tracking
- Error rate monitoring
- Memory usage tracking
- Invocation counting
- Cold start metrics

### Health Checks

```typescript
// Health check endpoint
export async function healthCheck() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data, error } = await supabase.from("tenants").select("count").limit(1);

    return {
      status: error ? "unhealthy" : "healthy",
      timestamp: new Date().toISOString(),
      database: error ? "disconnected" : "connected",
    };
  } catch (error) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}
```

## Performance Optimization

### Database Optimization

- Proper indexing strategy
- Query optimization
- Connection pooling
- Read replicas for scaling
- Partitioning for large tables

### Caching Strategy

- Redis caching for frequently accessed data
- Query result caching
- Session caching
- CDN integration for static assets

## Backup and Recovery

### Automated Backups

- Daily automated backups
- Point-in-time recovery
- Cross-region backup replication
- Backup encryption

### Disaster Recovery

- Multi-region deployment
- Automated failover
- Data replication
- Recovery time objectives (RTO)

## Contributing

1. Follow the coding standards
2. Add tests for new functions
3. Update documentation
4. Run quality checks: `pnpm quality:check`
5. Ensure RLS policies are properly implemented
6. Test with multiple tenants

## Troubleshooting

### Common Issues

1. **Connection Timeouts**: Check database pool size and timeout settings
2. **RLS Policy Errors**: Verify tenant context is properly set
3. **Function Deployment Failures**: Check function syntax and dependencies
4. **Migration Conflicts**: Resolve schema conflicts before applying

### Debug Commands

```bash
# Check Supabase status
supabase status

# View logs
supabase logs

# Test database connection
supabase db ping

# Validate migrations
supabase db lint
```

## License

MIT License - see LICENSE file for details.
