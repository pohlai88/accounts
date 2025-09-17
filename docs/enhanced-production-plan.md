# Enhanced Production-Ready Development Plan

## AI-BOS Accounting SaaS Platform

**Version**: 2.0  
**Date**: 2025-01-17  
**Status**: Active  
**Owner**: Development Team  
**SSOT**: This document is the single source of truth for production development planning

---

## Executive Summary

This enhanced development plan provides detailed implementation guidance with code snippets, SSOT references, DoD criteria, anti-drift measures, KPIs, and specific object counts for building a production-ready accounting SaaS platform.

### Key Metrics

- **Total Objects to Develop**: 247 specific deliverables
- **API Endpoints**: 47 core endpoints
- **Database Tables**: 23 production tables
- **UI Components**: 89 React components
- **Integration Points**: 156 critical connections
- **Test Coverage Target**: 95%

---

## Phase 1: Foundation & Core Integration (3 weeks)

### Week 1: Database & API Foundation

#### 1.1 Database Migration Implementation

**SSOT**: `packages/db/src/schema.ts`  
**DoD**: All tables created, RLS policies active, seed data loaded

**Objects to Develop**: 23 tables + 15 seed files

```typescript
// packages/db/src/migrations/001_core_schema.sql
-- Core tenant and company tables
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  feature_flags JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (id = (auth.jwt() ->> 'tenant_id')::uuid);
```

**KPI**:

- Migration success rate: 100%
- RLS policy coverage: 100%
- Seed data completeness: 100%

**Anti-Drift**:

- Automated migration validation
- Schema versioning with checksums
- Rollback procedures documented

#### 1.2 Core API Routes Implementation

**SSOT**: `apps/web-api/app/api/`  
**DoD**: All endpoints return proper responses, error handling complete

**Objects to Develop**: 47 API endpoints

```typescript
// apps/web-api/app/api/invoices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { insertInvoice, getInvoice, listInvoices } from "@aibos/db";
import { validateInvoicePosting } from "@aibos/accounting";
import { verifyAccessToken } from "@aibos/security";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAccessToken(request.headers.get("authorization"));
    const { searchParams } = new URL(request.url);

    const scope = {
      tenantId: auth.tenantId,
      companyId: auth.companyId,
      userId: auth.userId,
      userRole: auth.role,
    };

    const invoices = await listInvoices(scope, {
      limit: parseInt(searchParams.get("limit") || "20"),
      offset: parseInt(searchParams.get("offset") || "0"),
    });

    return NextResponse.json({
      success: true,
      data: invoices,
      meta: {
        total: invoices.total,
        hasMore: invoices.hasMore,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: "INVOICE_FETCH_ERROR",
      },
      { status: 500 },
    );
  }
}
```

**Integration Route**: Frontend → API Gateway → Business Logic → Database

```
Frontend Store → /api/invoices → validateInvoicePosting() → insertInvoice() → PostgreSQL
```

**KPI**:

- API response time: <200ms
- Error rate: <1%
- Success rate: 99.9%

### Week 2: Frontend-Backend Integration

#### 2.1 Store Integration Enhancement

**SSOT**: `packages/ui/src/store/index.ts`  
**DoD**: All store methods connect to real APIs, error handling complete

**Objects to Develop**: 12 store hooks + 47 API integrations

```typescript
// packages/ui/src/store/api-client.ts
import { TCreateInvoiceReq, TCreateInvoiceRes } from "@aibos/contracts";

export class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async createInvoice(data: TCreateInvoiceReq): Promise<TCreateInvoiceRes> {
    const response = await fetch(`${this.baseUrl}/api/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        "X-Tenant-ID": data.tenantId,
        "X-Request-ID": crypto.randomUUID(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create invoice");
    }

    return response.json();
  }
}
```

**Integration Route**: UI Component → Store → API Client → Backend

```
InvoiceForm → useInvoiceStore → ApiClient → /api/invoices → Business Logic
```

**KPI**:

- Store-API integration: 100%
- Error handling coverage: 100%
- Loading state management: 100%

#### 2.2 Form Validation Implementation

**SSOT**: `packages/ui/src/components/forms/`  
**DoD**: All forms validate against business rules, user feedback complete

**Objects to Develop**: 15 form components + validation schemas

```typescript
// packages/ui/src/components/forms/InvoiceFormValidation.ts
import { z } from "zod";
import { TCreateInvoiceReq } from "@aibos/contracts";

export const invoiceFormSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  invoiceNumber: z.string().min(1, "Invoice number required"),
  invoiceDate: z.string().refine(date => {
    return new Date(date) <= new Date();
  }, "Invoice date cannot be in the future"),
  lines: z
    .array(
      z.object({
        description: z.string().min(1, "Description required"),
        quantity: z.number().positive("Quantity must be positive"),
        unitPrice: z.number().nonnegative("Unit price cannot be negative"),
        lineAmount: z.number().nonnegative("Line amount cannot be negative"),
      }),
    )
    .min(1, "At least one line item required"),
});

export function validateInvoiceForm(data: unknown): TCreateInvoiceReq {
  return invoiceFormSchema.parse(data);
}
```

**KPI**:

- Form validation coverage: 100%
- User error feedback: 100%
- Business rule compliance: 100%

### Week 3: Security & Performance

#### 3.1 Authentication Flow Implementation

**SSOT**: `packages/security/src/auth.ts`  
**DoD**: Complete auth flow, token management, session handling

**Objects to Develop**: 8 auth components + 12 security functions

```typescript
// packages/security/src/auth-provider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { verifyAccessToken, buildSecurityContext } from './auth';

interface AuthContextType {
  user: SecurityContext | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SecurityContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyAccessToken(`Bearer ${token}`)
        .then(payload => {
          const context = buildSecurityContext(payload, crypto.randomUUID());
          setUser(context);
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    const payload = await verifyAccessToken(`Bearer ${token}`);
    const context = buildSecurityContext(payload, crypto.randomUUID());
    setUser(context);
    localStorage.setItem('auth_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Integration Route**: Auth Provider → Security Package → Supabase → Frontend

```
AuthProvider → verifyAccessToken() → Supabase Auth → SecurityContext → UI
```

**KPI**:

- Authentication success rate: 99.9%
- Token validation accuracy: 100%
- Session security: 100%

---

## Phase 2: Feature Completion (4 weeks)

### Week 4-5: Core Accounting Features

#### 4.1 Invoice Management Workflow

**SSOT**: `packages/accounting/src/ar/invoice-posting.ts`  
**DoD**: Complete invoice lifecycle, GL posting, approval workflow

**Objects to Develop**: 23 invoice functions + 8 UI components

```typescript
// apps/web-api/app/api/invoices/post/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateInvoicePosting } from "@aibos/accounting";
import { insertInvoice, updateInvoicePosting } from "@aibos/db";
import { verifyAccessToken } from "@aibos/security";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAccessToken(request.headers.get("authorization"));
    const body = await request.json();

    const scope = {
      tenantId: auth.tenantId,
      companyId: auth.companyId,
      userId: auth.userId,
      userRole: auth.role,
    };

    // Validate invoice posting
    const validation = await validateInvoicePosting(body, auth.userId, auth.role);

    if (!validation.validated) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          code: validation.code,
        },
        { status: 400 },
      );
    }

    // Create invoice
    const invoice = await insertInvoice(scope, body);

    // Post to GL if auto-posting enabled
    if (body.autoPost) {
      await updateInvoicePosting(scope, invoice.id, "posted");
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: "INVOICE_CREATE_ERROR",
      },
      { status: 500 },
    );
  }
}
```

**Integration Route**: Frontend → API → Business Logic → Database → GL

```
InvoiceForm → POST /api/invoices → validateInvoicePosting() → insertInvoice() → GL Posting
```

**KPI**:

- Invoice creation success: 99.9%
- GL posting accuracy: 100%
- Approval workflow efficiency: 95%

#### 4.2 Payment Processing Implementation

**SSOT**: `packages/accounting/src/ap/payment-processing.ts`  
**DoD**: Complete payment workflow, bank integration, allocation handling

**Objects to Develop**: 18 payment functions + 12 UI components

```typescript
// packages/accounting/src/ap/payment-processing-enhanced.ts
export async function processPaymentWithCharges(
  input: PaymentProcessingInput,
  bankCharges: BankChargeInput[],
  withholdingTax: WithholdingTaxInput[],
): Promise<PaymentProcessingResult> {
  const journalLines = [];

  // Process main payment
  const mainPayment = await validatePaymentProcessing(input, input.userId, input.userRole);

  // Add bank charges
  for (const charge of bankCharges) {
    journalLines.push({
      accountId: charge.expenseAccountId,
      debit: charge.amount,
      credit: 0,
      description: `Bank charge - ${charge.description}`,
    });
  }

  // Add withholding tax
  for (const tax of withholdingTax) {
    journalLines.push({
      accountId: tax.payableAccountId,
      debit: 0,
      credit: tax.amount,
      description: `Withholding tax - ${tax.taxName}`,
    });
  }

  return {
    success: true,
    journalId: mainPayment.journalId,
    journalNumber: mainPayment.journalNumber,
    totalAmount: mainPayment.totalAmount,
    allocationsProcessed: mainPayment.allocationsProcessed,
    lines: [...mainPayment.lines, ...journalLines],
  };
}
```

**Integration Route**: Payment Form → API → Payment Processing → Bank Charges → GL

```
PaymentForm → POST /api/payments → processPaymentWithCharges() → Bank Integration → GL
```

**KPI**:

- Payment processing success: 99.8%
- Bank charge accuracy: 100%
- Tax calculation precision: 100%

### Week 6-7: Advanced Features

#### 6.1 Multi-Currency Support

**SSOT**: `packages/accounting/src/fx/`  
**DoD**: FX rate management, currency conversion, multi-currency reporting

**Objects to Develop**: 12 FX functions + 8 UI components

```typescript
// packages/accounting/src/fx/rate-manager.ts
export class FxRateManager {
  private cache: Map<string, FxRate> = new Map();

  async getRate(fromCurrency: string, toCurrency: string, date: Date): Promise<number> {
    const key = `${fromCurrency}-${toCurrency}-${date.toISOString().split("T")[0]}`;

    if (this.cache.has(key)) {
      return this.cache.get(key)!.rate;
    }

    const rate = await this.fetchRate(fromCurrency, toCurrency, date);
    this.cache.set(key, rate);

    return rate.rate;
  }

  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date: Date,
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const rate = await this.getRate(fromCurrency, toCurrency, date);
    return amount * rate;
  }
}
```

**Integration Route**: Currency Selector → FX Manager → Rate API → Conversion → Display

```
CurrencySelector → FxRateManager → External API → convertAmount() → UI Display
```

**KPI**:

- FX rate accuracy: 99.9%
- Conversion precision: 100%
- Rate update frequency: Real-time

#### 6.2 Advanced Reporting System

**SSOT**: `packages/accounting/src/reports/`  
**DoD**: Complete reporting suite, export functionality, real-time updates

**Objects to Develop**: 15 report functions + 20 UI components

```typescript
// packages/accounting/src/reports/report-generator.ts
export class ReportGenerator {
  async generateTrialBalance(input: TrialBalanceInput): Promise<TrialBalanceResult> {
    const accounts = await this.getChartOfAccounts(input.tenantId, input.companyId);
    const balances = await this.calculateAccountBalances(input, accounts);

    return {
      success: true,
      asOfDate: input.asOfDate,
      generatedAt: new Date(),
      currency: input.currency || "MYR",
      accounts: this.buildTrialBalanceAccounts(accounts, balances),
      totals: this.calculateTotals(balances),
      isBalanced: this.validateBalance(balances),
      metadata: {
        totalAccounts: accounts.length,
        accountsWithActivity: balances.filter(b => b.closingBalance !== 0).length,
        generationTime: Date.now() - input.startTime,
      },
    };
  }

  async exportReport(report: TrialBalanceResult, format: "PDF" | "XLSX" | "CSV"): Promise<Buffer> {
    switch (format) {
      case "PDF":
        return this.generatePDF(report);
      case "XLSX":
        return this.generateXLSX(report);
      case "CSV":
        return this.generateCSV(report);
    }
  }
}
```

**Integration Route**: Report UI → Report Generator → Database → Export Engine → Download

```
ReportUI → generateTrialBalance() → Database Query → Export Engine → File Download
```

**KPI**:

- Report generation speed: <5 seconds
- Export format support: 100%
- Data accuracy: 100%

---

## Phase 3: Production Readiness (3 weeks)

### Week 8-9: Infrastructure & Deployment

#### 8.1 CI/CD Pipeline Implementation

**SSOT**: `.github/workflows/`  
**DoD**: Automated testing, building, deployment, rollback capability

**Objects to Develop**: 8 workflow files + 12 deployment scripts

```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm run test:unit
      - run: pnpm run test:integration
      - run: pnpm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm run build

      - name: Build Docker image
        run: docker build -t aibos-accounts:${{ github.sha }} .

      - name: Push to registry
        run: docker push aibos-accounts:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/aibos-accounts \
            aibos-accounts=aibos-accounts:${{ github.sha }}
```

**Integration Route**: Code Push → GitHub Actions → Tests → Build → Deploy → Production

```
Code Push → GitHub Actions → Test Suite → Docker Build → Kubernetes Deploy → Production
```

**KPI**:

- Deployment success rate: 99.9%
- Rollback time: <2 minutes
- Test coverage: 95%

#### 8.2 Monitoring & Observability

**SSOT**: `packages/monitoring/`  
**DoD**: Complete monitoring stack, alerting, performance tracking

**Objects to Develop**: 15 monitoring functions + 8 dashboard components

```typescript
// packages/monitoring/src/metrics-collector.ts
export class MetricsCollector {
  private metrics: Map<string, number> = new Map();

  incrementCounter(name: string, labels: Record<string, string> = {}) {
    const key = `${name}:${JSON.stringify(labels)}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}) {
    const key = `${name}:${JSON.stringify(labels)}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, Math.max(current, value));
  }

  async exportMetrics(): Promise<MetricData[]> {
    const metrics: MetricData[] = [];

    for (const [key, value] of this.metrics.entries()) {
      const [name, labelsStr] = key.split(":");
      const labels = JSON.parse(labelsStr);

      metrics.push({
        name,
        value,
        labels,
        timestamp: Date.now(),
      });
    }

    return metrics;
  }
}
```

**Integration Route**: Application → Metrics Collector → Monitoring Service → Dashboard

```
Application Code → MetricsCollector → Prometheus → Grafana Dashboard
```

**KPI**:

- Uptime monitoring: 99.9%
- Error tracking: 100%
- Performance metrics: Real-time

### Week 10: Testing & Launch

#### 10.1 Comprehensive Testing Suite

**SSOT**: `tests/` directory  
**DoD**: 95% test coverage, all critical paths tested, performance benchmarks

**Objects to Develop**: 156 test files + 23 test utilities

```typescript
// tests/integration/invoice-workflow.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTestClient } from "./test-utils";
import { TCreateInvoiceReq } from "@aibos/contracts";

describe("Invoice Workflow Integration", () => {
  let client: TestClient;

  beforeEach(async () => {
    client = await createTestClient();
    await client.seedTestData();
  });

  it("should create invoice and post to GL", async () => {
    const invoiceData: TCreateInvoiceReq = {
      customerId: "test-customer-1",
      invoiceNumber: "INV-2024-001",
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currency: "MYR",
      lines: [
        {
          lineNumber: 1,
          description: "Test service",
          quantity: 1,
          unitPrice: 100,
          lineAmount: 100,
          revenueAccountId: "test-revenue-account",
        },
      ],
    };

    // Create invoice
    const response = await client.post("/api/invoices", invoiceData);
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);

    // Verify GL posting
    const glEntries = await client.getGLEntries(response.data.data.id);
    expect(glEntries).toHaveLength(2); // AR debit, Revenue credit

    // Verify totals balance
    const totalDebits = glEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = glEntries.reduce((sum, entry) => sum + entry.credit, 0);
    expect(totalDebits).toBe(totalCredits);
  });
});
```

**Integration Route**: Test Suite → Test Database → Application → Assertions

```
Test Suite → Test Database → Application Logic → Assertions → Test Results
```

**KPI**:

- Test coverage: 95%
- Test execution time: <5 minutes
- Test reliability: 99.9%

---

## Critical Integration Points

### Frontend → Middleware → Backend → Database

#### 1. Authentication Flow

```
Login Form → AuthProvider → verifyAccessToken() → Supabase Auth → SecurityContext → Protected Routes
```

#### 2. Invoice Creation

```
InvoiceForm → useInvoiceStore → ApiClient → POST /api/invoices → validateInvoicePosting() → insertInvoice() → PostgreSQL
```

#### 3. Payment Processing

```
PaymentForm → usePaymentStore → ApiClient → POST /api/payments → processPaymentWithCharges() → GL Posting → Database
```

#### 4. Report Generation

```
ReportUI → ReportGenerator → Database Query → Data Processing → Export Engine → File Download
```

### Anti-Drift Measures

#### 1. Type Safety

- All API contracts defined in `@aibos/contracts`
- TypeScript strict mode enabled
- Runtime validation with Zod schemas

#### 2. Testing

- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user flows

#### 3. Documentation

- API documentation auto-generated from code
- Architecture decisions documented
- Deployment procedures documented

#### 4. Monitoring

- Performance metrics tracked
- Error rates monitored
- User behavior analyzed

### Success Metrics

#### Performance KPIs

- Page load time: <2 seconds
- API response time: <200ms
- Database query time: <100ms
- Report generation: <5 seconds

#### Reliability KPIs

- Uptime: 99.9%
- Error rate: <1%
- Test coverage: 95%
- Security vulnerabilities: 0

#### User Experience KPIs

- Task completion rate: 95%
- User satisfaction: 4.5/5
- Support ticket volume: <5% of users
- Feature adoption: 80%

### Object Count Summary

| Category           | Count   | Description                        |
| ------------------ | ------- | ---------------------------------- |
| API Endpoints      | 47      | Core business operations           |
| Database Tables    | 23      | Data persistence layer             |
| UI Components      | 89      | User interface elements            |
| Business Functions | 156     | Core accounting logic              |
| Test Files         | 156     | Comprehensive test coverage        |
| Integration Points | 156     | Critical system connections        |
| **Total Objects**  | **627** | **Complete system implementation** |

This enhanced development plan provides the detailed roadmap needed to build a production-ready accounting SaaS platform with specific deliverables, clear success criteria, and comprehensive integration guidance.
