[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/security](../../README.md) / [types](../README.md) / AuditLogEvent

# Interface: AuditLogEvent

Defined in: [packages/security/src/types.ts:44](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L44)

## Properties

### action

> **action**: `string`

Defined in: [packages/security/src/types.ts:49](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L49)

***

### category

> **category**: `"authentication"` \| `"authorization"` \| `"data_access"` \| `"data_modification"` \| `"system"` \| `"security"` \| `"compliance"`

Defined in: [packages/security/src/types.ts:57](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L57)

***

### complianceFlags

> **complianceFlags**: `string`[]

Defined in: [packages/security/src/types.ts:67](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L67)

***

### details

> **details**: `Record`\<`string`, `string` \| `number` \| `boolean` \| `string`[] \| `number`[]\>

Defined in: [packages/security/src/types.ts:52](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L52)

***

### id

> **id**: `string`

Defined in: [packages/security/src/types.ts:45](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L45)

***

### ipAddress?

> `optional` **ipAddress**: `string`

Defined in: [packages/security/src/types.ts:53](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L53)

***

### metadata

> **metadata**: `Record`\<`string`, `string` \| `number` \| `boolean` \| `string`[] \| `number`[]\>

Defined in: [packages/security/src/types.ts:68](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L68)

***

### outcome

> **outcome**: `"success"` \| `"failure"` \| `"partial"`

Defined in: [packages/security/src/types.ts:65](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L65)

***

### resource

> **resource**: `string`

Defined in: [packages/security/src/types.ts:50](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L50)

***

### resourceId?

> `optional` **resourceId**: `string`

Defined in: [packages/security/src/types.ts:51](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L51)

***

### riskScore

> **riskScore**: `number`

Defined in: [packages/security/src/types.ts:66](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L66)

***

### sessionId?

> `optional` **sessionId**: `string`

Defined in: [packages/security/src/types.ts:55](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L55)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [packages/security/src/types.ts:56](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L56)

***

### tenantId

> **tenantId**: `string`

Defined in: [packages/security/src/types.ts:47](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L47)

***

### timestamp

> **timestamp**: `number`

Defined in: [packages/security/src/types.ts:46](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L46)

***

### userAgent?

> `optional` **userAgent**: `string`

Defined in: [packages/security/src/types.ts:54](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L54)

***

### userId?

> `optional` **userId**: `string`

Defined in: [packages/security/src/types.ts:48](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L48)
