[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/security](../../README.md) / [types](../README.md) / SecurityEvent

# Interface: SecurityEvent

Defined in: [packages/security/src/types.ts:140](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L140)

## Properties

### details

> **details**: `Record`\<`string`, `string` \| `number` \| `boolean` \| `string`[] \| `number`[]\>

Defined in: [packages/security/src/types.ts:147](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L147)

***

### ip

> **ip**: `string`

Defined in: [packages/security/src/types.ts:143](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L143)

***

### requestId

> **requestId**: `string`

Defined in: [packages/security/src/types.ts:149](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L149)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [packages/security/src/types.ts:142](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L142)

***

### tenantId?

> `optional` **tenantId**: `string`

Defined in: [packages/security/src/types.ts:145](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L145)

***

### timestamp

> **timestamp**: `number`

Defined in: [packages/security/src/types.ts:148](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L148)

***

### type

> **type**: `"rate_limit"` \| `"csrf_attack"` \| `"xss_attempt"` \| `"suspicious_activity"` \| `"security_violation"`

Defined in: [packages/security/src/types.ts:141](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L141)

***

### userAgent

> **userAgent**: `string`

Defined in: [packages/security/src/types.ts:144](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L144)

***

### userId?

> `optional` **userId**: `string`

Defined in: [packages/security/src/types.ts:146](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/types.ts#L146)
