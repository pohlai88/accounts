[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/security](../README.md) / [](../README.md) / parseAuditEvent

# Function: parseAuditEvent()

> **parseAuditEvent**(`input`): [`Result`](../types/type-aliases/Result.md)\<\{ `action`: `"auth.login"`; `category`: `string`; `companyId?`: `string`; `ip`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"auth.logout"`; `category`: `string`; `companyId?`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"permission.denied"`; `category`: `string`; `required`: \[`string`, `...string[]`\]; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"api.request"`; `category`: `string`; `duration`: `number`; `ip`: `string`; `method`: `string`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `statusCode`: `number`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"data.export"`; `category`: `string`; `recordCount`: `number`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \}, `ZodError`\<`any`\>\>

Defined in: [packages/security/src/auditEvent.ts:75](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/auditEvent.ts#L75)

Parse and validate audit event from unknown input

## Parameters

### input

`unknown`

Unknown input to parse

## Returns

[`Result`](../types/type-aliases/Result.md)\<\{ `action`: `"auth.login"`; `category`: `string`; `companyId?`: `string`; `ip`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"auth.logout"`; `category`: `string`; `companyId?`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"permission.denied"`; `category`: `string`; `required`: \[`string`, `...string[]`\]; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"api.request"`; `category`: `string`; `duration`: `number`; `ip`: `string`; `method`: `string`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `statusCode`: `number`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"data.export"`; `category`: `string`; `recordCount`: `number`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \}, `ZodError`\<`any`\>\>

Result containing parsed AuditEvent or ZodError
