# Security & Governance
- RLS ON by default for all multi-tenant tables.
- SoD matrix enforced in services + DB.
- Idempotency on payments/postings via `X-Idempotency-Key`.
- No PII in logs; Axiom labels {env, tenant_id, company_id, request_id, user_id?, region}.
