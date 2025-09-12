# Environment Configuration Guide

## V1 Compliance Environment Setup

This guide covers the environment configuration required for V1 compliance features including monitoring, audit logging, and performance tracking.

## Required Environment Variables

### Core Application

```bash
NODE_ENV=production
APP_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
```

### Supabase Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### Axiom Monitoring (V1 Requirement)

```bash
AXIOM_TOKEN=xaat-your-axiom-token
AXIOM_PERSONAL_TOKEN=xapt-your-personal-token
AXIOM_ORG_ID=your-org-id
AXIOM_DATASET=accounts-logs
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=1.0
LOG_LEVEL=info
```

### V1 Compliance Features

```bash
ENABLE_AUDIT_LOGGING=true
ENABLE_SOD_CHECKS=true
ENABLE_IDEMPOTENCY=true
ENABLE_REPORT_CACHING=true
CACHE_TTL_SECONDS=3600
```

### External Services

```bash
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

### File Upload Configuration

```bash
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,csv,xlsx
STORAGE_BUCKET=attachments
```

## Local Development Setup

For local development, copy `.env .local` to `.env.local` and ensure local Supabase is running:

```bash
npx supabase start
```

## Production Deployment

1. Configure all environment variables in your deployment platform
2. Ensure Axiom is properly configured for monitoring
3. Set up proper CORS origins for your frontend
4. Configure file upload limits based on your infrastructure

## Monitoring Setup

The V1 implementation includes comprehensive monitoring via Axiom:

- **Performance Metrics**: API response times, database query performance
- **Error Tracking**: Automatic error capture with stack traces
- **Audit Logging**: All financial operations are logged
- **Security Events**: SoD violations and authentication events

## Verification

After setup, verify monitoring is working:

1. Make an API request to `/api/journals`
2. Check Axiom dashboard for performance metrics
3. Verify audit logs are being created
4. Test error tracking with an invalid request
