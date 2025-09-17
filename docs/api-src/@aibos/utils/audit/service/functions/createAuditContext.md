[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/utils](../../../README.md) / [audit/service](../README.md) / createAuditContext

# Function: createAuditContext()

> **createAuditContext**(`requestId?`, `ipAddress?`, `userAgent?`, `source?`): [`AuditContext`](../../../types/interfaces/AuditContext.md)

Defined in: [packages/utils/src/audit/service.ts:356](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L356)

Helper function to create audit context from request

## Parameters

### requestId?

`string`

### ipAddress?

`string`

### userAgent?

`string`

### source?

`undefined` | `"API"` | `"UI"` | `"SYSTEM"` | `"BATCH"` | `"WEBHOOK"`

## Returns

[`AuditContext`](../../../types/interfaces/AuditContext.md)
