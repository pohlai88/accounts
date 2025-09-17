[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / V1AuditService

# Class: V1AuditService

Defined in: [packages/utils/src/audit/audit-service.ts:27](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L27)

## Constructors

### Constructor

> **new V1AuditService**(): `AuditService`

Defined in: [packages/utils/src/audit/audit-service.ts:30](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L30)

#### Returns

`AuditService`

## Methods

### logAuthentication()

> **logAuthentication**(`context`, `action`, `details`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/audit-service.ts:179](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L179)

Log user authentication events

#### Parameters

##### context

[`V1AuditAuditContext`](../types/interfaces/V1AuditAuditContext.md)

##### action

`"LOGIN"` | `"LOGOUT"` | `"LOGIN_FAILED"`

##### details

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`void`\>

***

### logCOAValidation()

> **logCOAValidation**(`scope`, `accountIds`, `result`, `warnings?`, `context?`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/audit-service.ts:251](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L251)

Log Chart of Accounts validation

#### Parameters

##### scope

###### companyId

`string`

###### sessionId?

`string`

###### tenantId

`string`

###### userId

`string`

###### userRole?

`string`

##### accountIds

`string`[]

##### result

`string`

##### warnings?

`string`[]

##### context?

[`V1AuditAuditContext`](../types/interfaces/V1AuditAuditContext.md)

#### Returns

`Promise`\<`void`\>

***

### logError()

> **logError**(`context`, `errorType`, `details`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/audit-service.ts:151](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L151)

Log general errors

#### Parameters

##### context

[`V1AuditAuditContext`](../types/interfaces/V1AuditAuditContext.md)

##### errorType

`string`

##### details

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`void`\>

***

### logJournalPosting()

> **logJournalPosting**(`context`, `journalId`, `operation`, `details`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/audit-service.ts:125](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L125)

Log journal posting operations

#### Parameters

##### context

[`V1AuditAuditContext`](../types/interfaces/V1AuditAuditContext.md)

##### journalId

`string`

##### operation

`string`

##### details

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`void`\>

***

### logOperation()

> **logOperation**(`context`, `operation`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/audit-service.ts:298](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L298)

Log general operation

#### Parameters

##### context

[`V1AuditAuditContext`](../types/interfaces/V1AuditAuditContext.md)

##### operation

###### data?

`Record`\<`string`, `unknown`\>

###### entityId?

`string`

###### entityType?

`string`

###### operation

`string`

#### Returns

`Promise`\<`void`\>

***

### logPeriodOperation()

> **logPeriodOperation**(`context`, `operation`, `periodId`, `details`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/audit-service.ts:99](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L99)

Log period management operations

#### Parameters

##### context

[`V1AuditAuditContext`](../types/interfaces/V1AuditAuditContext.md)

##### operation

`string`

##### periodId

`string`

##### details

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`void`\>

***

### logReportGeneration()

> **logReportGeneration**(`context`, `reportType`, `parameters`, `result`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/audit-service.ts:39](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L39)

Log report generation events

#### Parameters

##### context

[`V1AuditAuditContext`](../types/interfaces/V1AuditAuditContext.md)

##### reportType

`string`

##### parameters

`Record`\<`string`, `unknown`\>

##### result

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`void`\>

***

### logSecurityViolation()

> **logSecurityViolation**(`context`, `violationType`, `details`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/audit-service.ts:71](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L71)

Log security violations

#### Parameters

##### context

[`V1AuditAuditContext`](../types/interfaces/V1AuditAuditContext.md)

##### violationType

`string`

##### details

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`void`\>

***

### logSoDCompliance()

> **logSoDCompliance**(`scope`, `operation`, `result`, `details?`, `context?`): `Promise`\<`void`\>

Defined in: [packages/utils/src/audit/audit-service.ts:204](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L204)

Log SoD compliance checks

#### Parameters

##### scope

###### companyId

`string`

###### sessionId?

`string`

###### tenantId

`string`

###### userId

`string`

###### userRole?

`string`

##### operation

`string`

##### result

`string`

##### details?

`string`

##### context?

[`V1AuditAuditContext`](../types/interfaces/V1AuditAuditContext.md)

#### Returns

`Promise`\<`void`\>

***

### queryAuditEvents()

> **queryAuditEvents**(`filters`): `Promise`\<[`V1AuditAuditEvent`](../types/interfaces/V1AuditAuditEvent.md)[]\>

Defined in: [packages/utils/src/audit/audit-service.ts:355](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/audit-service.ts#L355)

Query audit events

#### Parameters

##### filters

###### companyId?

`string`

###### endDate?

`Date`

###### entityType?

`string`

###### eventType?

`string`

###### limit?

`number`

###### startDate?

`Date`

###### tenantId?

`string`

###### userId?

`string`

#### Returns

`Promise`\<[`V1AuditAuditEvent`](../types/interfaces/V1AuditAuditEvent.md)[]\>
