[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/utils](../../../README.md) / [audit/service](../README.md) / AuditService

# Class: AuditService

Defined in: [packages/utils/src/audit/service.ts:58](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L58)

Audit Service for comprehensive business operation logging
Provides application-level audit trail beyond database triggers

## Constructors

### Constructor

> **new AuditService**(`database?`): `AuditService`

Defined in: [packages/utils/src/audit/service.ts:61](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L61)

#### Parameters

##### database?

[`AuditDatabase`](../interfaces/AuditDatabase.md)

#### Returns

`AuditService`

## Methods

### getEntityAuditTrail()

> **getEntityAuditTrail**(`scope`, `entityType`, `entityId`, `limit`): `Promise`\<[`AuditLogResult`](../../../types/interfaces/AuditLogResult.md)[]\>

Defined in: [packages/utils/src/audit/service.ts:281](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L281)

Get audit trail for a specific entity

#### Parameters

##### scope

[`Scope`](../../../../db/interfaces/Scope.md)

##### entityType

[`AuditEntityType`](../../../types/type-aliases/AuditEntityType.md)

##### entityId

`string`

##### limit

`number` = `50`

#### Returns

`Promise`\<[`AuditLogResult`](../../../types/interfaces/AuditLogResult.md)[]\>

***

### getUserAuditActivity()

> **getUserAuditActivity**(`scope`, `userId`, `limit`): `Promise`\<[`AuditLogResult`](../../../types/interfaces/AuditLogResult.md)[]\>

Defined in: [packages/utils/src/audit/service.ts:297](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L297)

Get recent audit activity for a user

#### Parameters

##### scope

[`Scope`](../../../../db/interfaces/Scope.md)

##### userId

`string`

##### limit

`number` = `100`

#### Returns

`Promise`\<[`AuditLogResult`](../../../types/interfaces/AuditLogResult.md)[]\>

***

### logCOAValidation()

> **logCOAValidation**(`scope`, `accountIds`, `validationResult`, `warnings`, `errors`, `context?`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/service.ts:142](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L142)

Log COA validation events

#### Parameters

##### scope

[`Scope`](../../../../db/interfaces/Scope.md)

##### accountIds

`string`[]

##### validationResult

`"SUCCESS"` | `"FAILURE"`

##### warnings

`object`[] = `[]`

##### errors

`object`[] = `[]`

##### context?

[`AuditContext`](../../../types/interfaces/AuditContext.md)

#### Returns

`Promise`\<`void`\>

***

### logIdempotencyUsage()

> **logIdempotencyUsage**(`scope`, `idempotencyKey`, `action`, `entityType`, `entityId?`, `context?`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/service.ts:172](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L172)

Log idempotency key usage

#### Parameters

##### scope

[`Scope`](../../../../db/interfaces/Scope.md)

##### idempotencyKey

`string`

##### action

`"CREATE"` | `"HIT"` | `"EXPIRE"`

##### entityType

[`AuditEntityType`](../../../types/type-aliases/AuditEntityType.md)

##### entityId?

`string`

##### context?

[`AuditContext`](../../../types/interfaces/AuditContext.md)

#### Returns

`Promise`\<`void`\>

***

### logJournalPosting()

> **logJournalPosting**(`scope`, `journalId`, `journalData`, `action`, `context?`, `oldValues?`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/service.ts:110](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L110)

Log journal posting operation with comprehensive details

#### Parameters

##### scope

[`Scope`](../../../../db/interfaces/Scope.md)

##### journalId

`string`

##### journalData

`Record`\<`string`, `unknown`\>

##### action

`"POST"` | `"CREATE"` | `"REVERSE"` | `"APPROVE"`

##### context?

[`AuditContext`](../../../types/interfaces/AuditContext.md)

##### oldValues?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`void`\>

***

### logOperation()

> **logOperation**(`entry`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/service.ts:77](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L77)

Log a business operation for audit trail

#### Parameters

##### entry

[`AuditEntry`](../../../types/interfaces/AuditEntry.md)

#### Returns

`Promise`\<`void`\>

***

### logSecurityEvent()

> **logSecurityEvent**(`scope`, `event`, `details`, `context?`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/service.ts:311](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L311)

Log security events (failed authentication, authorization failures, etc.)

#### Parameters

##### scope

[`Scope`](../../../../db/interfaces/Scope.md)

##### event

`"AUTH_FAILURE"` | `"AUTHZ_FAILURE"` | `"SUSPICIOUS_ACTIVITY"` | `"RATE_LIMIT"`

##### details

`Record`\<`string`, `unknown`\>

##### context?

[`AuditContext`](../../../types/interfaces/AuditContext.md)

#### Returns

`Promise`\<`void`\>

***

### logSoDCompliance()

> **logSoDCompliance**(`scope`, `operation`, `result`, `reason?`, `context?`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/service.ts:198](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L198)

Log SoD compliance checks

#### Parameters

##### scope

[`Scope`](../../../../db/interfaces/Scope.md)

##### operation

`string`

##### result

`"ALLOWED"` | `"DENIED"` | `"REQUIRES_APPROVAL"`

##### reason?

`string`

##### context?

[`AuditContext`](../../../types/interfaces/AuditContext.md)

#### Returns

`Promise`\<`void`\>

***

### queryAuditLogs()

> **queryAuditLogs**(`scope`, `filters`): `Promise`\<[`AuditLogResult`](../../../types/interfaces/AuditLogResult.md)[]\>

Defined in: [packages/utils/src/audit/service.ts:224](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L224)

Query audit logs with filters

#### Parameters

##### scope

[`Scope`](../../../../db/interfaces/Scope.md)

##### filters

[`AuditQueryFilters`](../../../types/interfaces/AuditQueryFilters.md) = `{}`

#### Returns

`Promise`\<[`AuditLogResult`](../../../types/interfaces/AuditLogResult.md)[]\>
