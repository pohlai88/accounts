[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/security](../README.md) / [](../README.md) / createAuditEvent

# Function: createAuditEvent()

> **createAuditEvent**(`event`): \{ `action`: `"auth.login"`; `category`: `string`; `companyId?`: `string`; `ip`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"auth.logout"`; `category`: `string`; `companyId?`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"permission.denied"`; `category`: `string`; `required`: \[`string`, `...string[]`\]; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"api.request"`; `category`: `string`; `duration`: `number`; `ip`: `string`; `method`: `string`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `statusCode`: `number`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"data.export"`; `category`: `string`; `recordCount`: `number`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \}

Defined in: [packages/security/src/auditEvent.ts:85](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/auditEvent.ts#L85)

Create a typed audit event with defaults

## Parameters

### event

`Partial`\<\{ `action`: `"auth.login"`; `category`: `string`; `companyId?`: `string`; `ip`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"auth.logout"`; `category`: `string`; `companyId?`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"permission.denied"`; `category`: `string`; `required`: \[`string`, `...string[]`\]; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"api.request"`; `category`: `string`; `duration`: `number`; `ip`: `string`; `method`: `string`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `statusCode`: `number`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"data.export"`; `category`: `string`; `recordCount`: `number`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \}\> & `object`

Partial audit event data

## Returns

\{ `action`: `"auth.login"`; `category`: `string`; `companyId?`: `string`; `ip`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"auth.logout"`; `category`: `string`; `companyId?`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"permission.denied"`; `category`: `string`; `required`: \[`string`, `...string[]`\]; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \} \| \{ `action`: `"api.request"`; `category`: `string`; `duration`: `number`; `ip`: `string`; `method`: `string`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `statusCode`: `number`; `tenantId`: `string`; `ts`: `Date`; `ua?`: `string`; `userId`: `string`; \} \| \{ `action`: `"data.export"`; `category`: `string`; `recordCount`: `number`; `resource`: `string`; `severity`: `"low"` \| `"medium"` \| `"high"` \| `"critical"`; `tenantId`: `string`; `ts`: `Date`; `userId`: `string`; \}

Parsed AuditEvent
