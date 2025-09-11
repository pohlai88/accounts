Perfect — here is your **fully integrated, non-optional final plan** with the additional comments and mitigations baked in. This is now the authoritative SSOT for v1 delivery.

---

# 1) Product & Engineering Success Criteria

* **Performance:**

  * API P95 ≤ **500ms**
  * UI TTFB ≤ **200ms**
  * Error rate ≤ **1%**
* **Quality:**

  * Posting engine unit coverage ≥ **95%**
  * E2E coverage ≥ **80%** for core flows
* **Security & Tenancy:**

  * **RLS ON by default** on all tables
  * **SoD enforced** in DB + services
  * **Idempotency enforced** on payments/postings
* **Accounting correctness:**

  * Multi-company, multi-currency, period close/lock
  * Immutable audit logs
  * TB/BS/P\&L/CF reconcile 1:1 with GL
* **Compliance:**

  * PDPA/PII safe logging
  * Export in CSV/XLSX/JSONL
  * Attachments + data-at-rest in Supabase region

---

# 2) Locked Tech Stack

* **Repo:** Monorepo (pnpm + Turborepo)
* **Runtime:** Next.js App Router (Node runtime only)
* **API/BFF:** Next.js Route Handlers v1

  * Execution budget <1s CPU
  * Heavy endpoints return 202 + status URL via Inngest
  * Postgres pooling; no per-request clients
* **Jobs/Workflows:** Inngest (webhooks, FX, PDFs, emails, retries, DLQ)
* **DB:** Supabase Postgres (+ Storage); Drizzle ORM; RLS mandatory
* **Auth:** Supabase Auth (JWT with `tenant_id`, `company_id`, `role`)
* **Contracts:** Zod for all IO; versioned in `packages/contracts`
* **UI:** React 18, Tailwind, Radix, shadcn/ui (tokens only, no raw CSS)
* **Localization:** Default Malaysia; pre-wired SG/TH/VN/ID/PH
* **Currency:**

  * Base MYR
  * SEA set + Top 10 traded + Top 5 regional
* **Telemetry:** Axiom (org: `aibos`)

  * Datasets: `app_web_prod`, `api_prod`, `jobs_prod` (+ staging equivalents)
  * Labels on all logs `{env, tenant_id, company_id, request_id, user_id?, region}`
* **PDF Engine:** Puppeteer in long-lived worker container

  * Pool with retries + time caps + health checks
* **Email:** Resend (system/billing/support)

  * Dev fallback: `jackwee2020@gmail.com`
* **Testing:** Vitest + Testing Library + Playwright
* **Perf testing:** k6 smoke tests (p95<500ms, err<1%) in nightly CI
* **CI/CD:** GitHub Actions → Vercel (web) + Railway (jobs)

  * Blue/green + smoke tests
  * SAST (CodeQL) + deps scan (Trivy)

---

# 3) Monorepo Structure

```
aibos/
├─ apps/
│  ├─ web/                  # Next.js UI
│  └─ web-api/              # Next.js route handlers (/app/api/*)
├─ services/
│  └─ worker/               # Inngest jobs (FX, PDF, email, DLQ)
├─ packages/
│  ├─ contracts/            # Zod schemas (req/res/events/enums)
│  ├─ db/                   # Drizzle schema, migrations, repos, RLS SQL
│  ├─ accounting/           # Pure TS (posting engine, FX, tax, reports)
│  ├─ auth/                 # RBAC, SoD rules, guards
│  ├─ ui/                   # shadcn components refactored to tokens
│  └─ utils/                # logger, email, pdf, storage, Temporal
├─ tests/
│  ├─ e2e/                  # Playwright scenarios
│  └─ contracts/            # Cross-layer contract tests
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ ACCOUNTING.md         # MFRS baseline, FX policies
│  ├─ SECURITY.md           # RLS, SoD, idempotency, PDPA
│  └─ RUNBOOKS.md           # Rollback + Switch Plan to Fastify
└─ .github/workflows/       # CI pipelines
```

---

# 4) Core Data Model

* `tenants`, `companies`, `users`, `memberships`
* `currencies`, `fx_rates`, `fiscal_calendars`, `periods`
* `chart_of_accounts` (tree + flags)
* `journals`, `journal_lines` (CHECK balanced)
* `customers`, `suppliers`, `invoices`, `bills`, `payments`
* `credit_notes`, `tax_codes`, `tax_journal`
* `attachments`, `audit_logs`
* `idempotency_keys` table (see §5)

---

# 5) Locked Governance & Mitigations

## Contracts + Boundaries

* Pure `packages/accounting` (no framework)
* Zod for req/res/events/enums in `packages/contracts`
* Repo helpers in `packages/db` enforce tenant scope

## RLS & SoD

* Scoped repos **require** `{tenantId, companyId}`
* SQL RLS policies tested with edge-case queries
* SoD matrix enforced via `packages/auth/sod.ts`

## Idempotency

* `idempotency_keys(key pk, request_hash, response, created_at)`
* Middleware reads `X-Idempotency-Key`, returns cached response if hit

## FX module

* First-class in `packages/accounting/fx`
* Explicit policy file (spot source, rounding rules, valuation date)
* Dual source ingest; staleness watermark on fallback
* Realized/unrealized derived from GL; nightly reval idempotent + reversible
* ≥98% coverage with golden-file tests

## Puppeteer

* Worker container only; persistent browser pool
* 3 retries with backoff, 45s timeout cap
* Health check `page.create()` every 60s, auto-restart pool on fail

## Jobs (Inngest)

* Step retries: max 3, backoff 2^n
* Failures → DLQ topic with payload + reason
* Admin view `/admin/jobs/dlq` with requeue (role-guarded)

## CI Gates

* PR fails if:

  * Missing idempotency in mutation route
  * Direct DB import outside repos
  * New route without Zod parse
  * Perf budgets violated (`perf.budgets.json`)

---

# 6) Anti-Drift Enforcement

**`.cursorrules.json` (mirrored in `.copilot.json`)**

* Governance: diff-only, block on type/lint errors, require tests
* Allowed: `apps/**`, `services/**`, `packages/**`, `tests/**`
* Forbidden: `**/*.css`, `apps/web/**/styles/**`, `**/*.any.ts`, `**/fetch-from-ui/**`, `apps/web/**/server-direct-db-access/**`
* Hard rules:

  1. No inline styles/raw CSS — tokens only
  2. No direct DB in UI — typed hooks only
  3. Zod parse req/res mandatory
  4. All mutations scoped with RLS + SoD
  5. Temporal for dates only
  6. Logs must include `requestId` + `tenantId`
  7. Posting rules require unit tests

---

# 7) D0–D5 Execution (tightened DoD)

* **D0 (Micro-spike):** Journal post flow

  * Contracts (Zod), posting engine call, repo write under RLS
  * UI hook, error mapping
  * Playwright green path + RLS negative proof
* **D1:** Posting engine 100% tested; COA flags enforced; idempotency table live
* **D2:** AR invoice → GL; FX ingest (primary+fallback); audit entries recorded
* **D3:** AP bills/payments; bank CSV import + matcher; Puppeteer pool + health check running
* **D4:** TB/BS/P\&L/CF from GL only; period open/close/reversal with approval flow
* **D5:** Playwright happy-paths; K6 perf check (p95<500ms, err<1%); canary deploy; rollback drill in RUNBOOKS

---

# 8) Switch Plan (Fastify Runbook)

**docs/RUNBOOKS.md** must include a 5-step plan:

1. Scaffold `apps/api` (Fastify)
2. Mirror 1 pilot route (contracts reused)
3. Add gateway rewrite rule
4. Dual-run logs compare outputs
5. Cutover checklist + decommission

---

# 9) Why Decisions Hold

* **Route Handlers:** Safe if bounded to <1s + events; seams make Fastify split surgical
* **Puppeteer:** Only way to satisfy finance-grade PDFs; containerized pooling neutralizes risk
* **Zod + RLS + SoD:** Guarantees multi-tenant safety + evolvability
* **Inngest:** Deterministic retries, tracing, DLQ → perfect for financial workflows

---

✅ This is the **final, non-optional v1 plan**.

