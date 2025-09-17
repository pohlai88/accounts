# Accounting SaaS — Complete Development Plan v2

_Last updated: 16 Sep 2025 (Asia/Kuala_Lumpur)_

## 0) North Star & Success Criteria
**North Star:** “Close the books in hours, not weeks — with audit‑ready accuracy and delightful UX.”

**Must‑have outcomes for V1 (ship‑worthy):**
- End‑to‑end flows: **Invoice → Receipt → Post to GL → Trial Balance/FS** and **Bill → Payment → Post**
- Immutable, balanced ledger with **period close** and **audit trail**
- **Multi‑tenant** isolation + tenant provisioning; **subscription billing** integrated
- **Real APIs** wired to UI (no mocks in prod paths), offline‑resilient critical flows
- **CFO sign‑off** on TB/BS/PL accuracy for two real companies (multi‑currency sample)

**Quality Gates (every PR, enforced in CI):**
- Type‑safe (TS) ✔️  Lint ✔️  Unit/Integration tests ≥ **95%** cov for changed code ✔️
- RFC7807 errors; idempotency for POST/PUT; request tracing propagated ✔️
- Audit log writes for all financial mutations; RLS enforced ✔️
- A11y AA+, keyboard‑first; responsive; dark‑first tokens (SSOT) ✔️

---

## 1) MVP Scope (Functional)
**Core Accounting**
- Chart of Accounts (COA) with hierarchy & controls
- Journal Engine (double‑entry rules, validations, posting block, reversal)
- Fiscal Periods (open/close; soft/hard close; lock after audit)
- AR: Customer, Invoice, Credit Note, Receipt, Aging
- AP: Vendor, Bill, Debit Note, Payment, Aging
- Cash & Bank: Bank accounts, bank statement import (CSV), reconciliation (semi‑auto)
- Tax: SST/GST/VAT codes mapping at line‑level; output/input tax reports
- FX: Multi‑currency txn with daily rate, revaluation, realized/unrealized FX
- Reports: TB, BS, PL, GL, Sub‑ledgers, Tax reports, Cash book

**SaaS & Ops**
- Tenant provisioning (create org → seed COA → invite users)
- Subscription plans (basic/pro), metering for API/automation events, billing integration
- Approvals (2‑step min) for Bills > threshold; Journal approvals by role & amount
- Document store (attachments for invoice/bill), immutable link in audit trail

---

## 2) Non‑Functional Requirements (NFR)
- **Security:** RLS per tenant; least‑privilege roles; secrets via KMS; dependency scanning; OWASP ASVS L2
- **Reliability:** SLOs — API success ≥ 99.9%, P95 < 500ms; Error budget policy
- **Resilience:** At‑least‑once write path with idempotency keys; retries with jitter; circuit breakers
- **Observability:** OpenTelemetry traces, metrics, logs; golden signals dashboards; alerting
- **Data:** 3NF schema for core ledgers; soft‑delete for masters; immutable postings; PITR backups
- **Portability:** Provider‑agnostic abstractions for storage, queues, payments; infra as code

---

## 3) Architecture Anchors
- **API Pattern:** BFF (Next.js/Node) with modular route handlers → services → repositories. Request IDs; RFC7807; idempotency.
- **Data Layer:** Supabase (Postgres) with RLS; migrations via SQL change sets; partitioning for heavy tables (gl_entries) by tenant+period.
- **Ledger Integrity:** DB constraints: total_debits == total_credits per journal; posting trigger locks; versioned adjustments (no UPDATE on posted lines).
- **Events:** Domain events (journal_posted, invoice_paid) → outbox table → worker; retryable consumers.
- **Files:** BYOS connector pattern (GDrive/Dropbox) + Supabase storage fallback; hash integrity in audit trail.
- **State & Forms (FE):** Zustand for app state; React Hook Form + Zod for validation; Error Boundaries; Suspense + code splitting.
- **Design System:** SSOT tokens only (no hardcoded Tailwind); WCAG 2.2 AAA targets; dark‑first.

---

## 4) Phased Roadmap (10 Weeks, 5 Sprints)
> Two‑week sprints; cut scope not quality. Each sprint ends with a demo + CFO checkpoint.

### **Sprint 0 (1 week): Stabilize the Foundation**
**Goals:** Kill “Not implemented” paths; wire tracing; unify errors; enforce RLS.
- Complete auth middleware (JWT/JWKS) + org/role extraction; impersonation guard
- Add **idempotency** middleware; assign request_id; persist to DB for POST/PUT
- Global error handler → **RFC7807** payloads; consistent codes
- Instrument **OpenTelemetry** (http server/client spans); propagate trace IDs to DB logs
- RLS policies audited and enforced; seed minimal roles: `Owner`, `Accountant`, `Cashier`, `Auditor`
- CI gates for Quality (lint, type check, test, a11y, bundle size budgets)
**Exit Criteria:** Hello‑world API with full tracing + RFC7807 + RLS proof; 20 golden tests green

### **Sprint 1: Ledger Core + COA + Periods**
- COA CRUD with governance flags (posting_allowed, normal_balance, mfrs_category)
- Journal Engine v1: create → validate → post (transaction) → lock; reversal & recurring templates
- Fiscal Periods: open/close; lock after close; posting blocks per GL category
- Reports: GL listing; Trial Balance computed via views; seed exchange rate table
- Audit trail baseline for all ledger writes
**Exit Criteria:** Post a sample JE → see GL & TB match; Period close prevents new postings

### **Sprint 2: AR & AP E2E (happy paths)**
- AR: Customer master; Invoice (items, taxes); Receipt; Credit Note; Aging buckets
- AP: Vendor master; Bill; Payment; Debit Note; Aging buckets
- Tax mapping; posting rules to AR/AP control accounts; cash book entries
- File attachments (docs) with hash refs in audit trail
- FE: Wire real APIs for AR/AP screens; form validation; optimistic UI with rollback
**Exit Criteria:** Create invoice→receive payment→TB updates; Create bill→pay→TB updates; tax report exports (CSV)

### **Sprint 3: Approvals, Reconciliation, Multi‑Currency**
- Approval workflows: Bills & Journals by threshold/role; explain‑why; override with reason codes
- Bank import (CSV), matching rules, tolerances; partial match; reconciliation status
- Multi‑currency: document currency, functional currency; realized/unrealized FX; reval job
- Performance pass: indexes, pagination, N+1 audit
**Exit Criteria:** 2‑step approvals enforced; bank rec demo on sample CSV; FX revaluation entries auto‑posted

### **Sprint 4: SaaS Essentials + Observability + Hardening**
- Tenant provisioning wizard (seed COA, tax codes, periods)
- Subscription & billing integration (plans, proration, webhooks) — start with Stripe‑like provider
- Usage metering for automation events; limits per plan; feature flags
- SRE: dashboards (latency, error rate, saturation), on‑call runbook, backup/restore drill
- Security: permission matrix, PII encryption, secrets rotation, dependency audits
**Exit Criteria:** Create new tenant → subscribe → operate AR/AP; restore drill success; SLO dashboards live

> **Optional “Sprint 5 (Polish)”** — PWA offline queue, mobile layouts, advanced analytics, AI assist (categorization/anomaly), MBRS pack.

---

## 5) Workstreams & RACI
- **Backend/API** — _R:_ Lead Backend Eng; _A:_ CTO; _C:_ DBA; _I:_ QA, Security
- **Database & Data Ops** — _R:_ DBA; _A:_ CTO; _C:_ Backend; _I:_ CFO
- **Frontend** — _R:_ Lead FE Eng; _A:_ Design Director; _C:_ Backend; _I:_ QA
- **Design System** — _R:_ Design; _A:_ Design Director; _C:_ FE; _I:_ QA
- **SRE/Platform** — _R:_ SRE Lead; _A:_ CTO; _C:_ Backend; _I:_ All
- **Finance & Compliance** — _R:_ CFO; _A:_ CEO; _C:_ Legal/Audit; _I:_ Eng

---

## 6) Detailed Backlogs (Seed)
### Backend/API
- [ ] Auth middleware: JWKS cache, clock skew, audience/issuer checks
- [ ] Idempotency storage table + middleware (key, request_hash, response_hash, ttl)
- [ ] RFC7807 error formatter; code taxonomy; correlation IDs
- [ ] Posting engine: transactional guarantees; debit=credit constraint; reversal logic
- [ ] Outbox table + worker; exponential backoff; poison queue handling
- [ ] FX rates fetcher + reval job; consolidated GL view
- [ ] Bank import parsers; matching rules DSL (amount window, date tolerance, memo tokens)

### Database
- [ ] RLS policies per table; tenant_id on all rows; admin bypass role
- [ ] Partition `gl_entries` (tenant_id, period_key); helpful indexes (acct, date, doc_id)
- [ ] Triggers: on post → lock journal; prevent UPDATE/DELETE on posted lines
- [ ] Views: TB, BS, PL; materialized views for heavy aggregates with refresh policy
- [ ] Backups: daily full + WAL; PITR; restore playbook and drill

### Frontend
- [ ] Global store (Zustand) with slices: session, ledger, ar, ap, bank
- [ ] React Hook Form + Zod schemas; input masks for money/FX/tax
- [ ] Error Boundaries + toasts; skeletons; retry with backoff
- [ ] Keyboard‑first actions; a11y checks; data grid virtualization for ledgers
- [ ] PWA shell + offline queue (optional in Sprint 5)

### Design System
- [ ] Enforce **SSOT tokens**; remove rogue Tailwind; dark‑first palette
- [ ] Form primitives: MoneyInput, TaxSelector, FxCurrencyPicker
- [ ] Approval banners, risk pills, status chips; empty states with guidance

### SRE/Platform
- [ ] OTel collector; logs to Loki; metrics to Prometheus; dashboards in Grafana
- [ ] SLOs + alerts (latency, error rate, saturation, queue lag)
- [ ] Health endpoints; readiness/liveness; chaos probe (small)

### Finance/Compliance
- [ ] Close checklist; lock/rollback procedure; audit evidence pack export
- [ ] Tax reports (Malaysia SST) and placeholders for other regimes
- [ ] Segregation of duties (SoD) matrix; approval thresholds; audit queries library

---

## 7) Testing Strategy (Shift‑Left)
**Pyramid:** Unit (heavy) → Integration (services+DB with containers) → E2E (Playwright) → Non‑func (perf, a11y, security)

- **Contract tests:** Consumer‑driven (Pact) for FE ↔ API
- **Golden data set:** Seed 2 tenants, 2 currencies, sample AR/AP cycles, FX reval scenario
- **Perf tests:** K6 scenarios — posting spikes, bank import 5k lines, AR aging for 100k invoices
- **A11y:** axe-core in CI; keyboard tab order tests
- **Security:** ZAP baseline scan; dependency checks; secrets audit

**Definition of Done (extra):** tracing present; audit entries present; RFC7807 verified; rollback paths tested.

---

## 8) Risks & Mitigations
1. **Backend not available / flaky** → FE uses **MSW** mocks behind a flag + **Pact** contracts; offline queue for critical forms; circuit‑breaker UI with retry/backoff.
2. **Ledger data corruption** → Invariant constraints; posting only via stored proc/service; checksums; shadow write to audit table; restore drill weekly.
3. **Multi‑currency complexity** → Start with document currency + functional currency; limit derived scenarios; add reval later.
4. **Compliance drift** → Embed checklists in period close; report templates; auditor read‑only role; immutable attachments.
5. **Scope creep** → Guardrails: MVP charter; feature flags; change‑control board; burn‑down review per sprint.
6. **Performance at scale** → Partition early; pagination; async outbox; nightly maintenance; index advisor runs.

---

## 9) Environments & CI/CD
- **Envs:** Dev (preview), Staging (prod‑like data, masked), Prod
- **Pipelines:** On PR → type/lint/tests/a11y/contract; On main → build, DB migrate (safe), smoke tests; Tag → release notes, canary deploy
- **Config:** 12‑factor; secrets via vault/KMS; feature flags remotely managed

---

## 10) Data Migration & Seed Plan
- CSV importers for COA, customers, vendors, opening balances
- Validation report before commit; dry‑run mode; reconciliation checklist
- Attachments ingestion with hash; link to master docs

---

## 11) Compliance & Audit Pack (V1)
- Audit trail export (CSV/JSON) with filters (date, entity, user)
- Evidence bundle: postings, approvals, source docs (hash verified)
- Period close binder: checklists, sign‑offs, exception logs
- SOX controls matrix (lite), segregation of duties proof

---

## 12) Release Criteria (Go/No‑Go)
- Two live tenants complete AR/AP cycles end‑to‑end with correct TB/BS/PL
- Bank reconciliation completed for one month; no unreconciled > tolerance
- FX revaluation executed; reports match accountant’s manual calc
- DR drill ≤ 30 min RTO; PITR verified for last 7 days
- SLOs green for 7 consecutive days; error budget healthy

---

## 13) Sprint‑Ready Tickets (Day‑1)
1. Implement JWKS‑backed auth middleware with caching (feat/auth‑middleware)
2. Add idempotency middleware + `idempotency_keys` table
3. Introduce RFC7807 error formatter; standardize error codes
4. COA service + endpoints with posting controls; FE COA screen wired
5. Journal post procedure with debit=credit constraint and reversal
6. RLS audit + policies for all core tables; admin role bypass
7. Trial Balance view + endpoint; FE TB page with data grid
8. Customer/Vendor masters + basic AR/AP endpoints
9. Attachments service with hash; link to audit log entries
10. OTel tracing plumbed; dashboards skeleton; request_id → logs

---

## 14) Glossary (short)
- **Posting:** Committing a journal to GL (immutable)
- **Reversal:** Automatic inverse journal to negate prior posting
- **Functional Currency:** Base currency of the books; docs may be in other currencies
- **Outbox:** Table storing events to be delivered reliably to async consumers

---

### Appendix A — Example Data Models (high level)
- `chart_of_accounts(id, tenant_id, code, name, type, normal_balance, posting_allowed, mfrs_category, parent_id, …)`
- `journals(id, tenant_id, doc_type, doc_id, status, posted_at, posted_by, period_id, fx_rate, …)`
- `journal_lines(id, journal_id, account_id, debit, credit, currency, amount_fx, tax_code, …)`
- `gl_entries(partition_key, tenant_id, account_id, date, debit, credit, source, doc_ref, …)`
- `approvals(id, entity, entity_id, step, approver_role, threshold, status, reason_code, …)`
- `audit_logs(id, tenant_id, entity, entity_id, action, user_id, hash, created_at, …)`

### Appendix B — Close Checklist (excerpt)
- [ ] All sub‑ledgers reconciled (AR/AP/Bank)
- [ ] Suspense/rounding < tolerance
- [ ] FX revaluation posted
- [ ] Accruals & prepayments posted
- [ ] Period lock applied; backup snapshot captured

