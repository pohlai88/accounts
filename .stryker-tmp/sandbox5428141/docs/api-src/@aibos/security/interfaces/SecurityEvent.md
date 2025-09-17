[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/security](../README.md) / SecurityEvent

# Interface: SecurityEvent

Defined in: [packages/security/src/advanced-security.ts:22](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L22)

## Properties

### details

> **details**: `Record`\<`string`, `any`\>

Defined in: [packages/security/src/advanced-security.ts:29](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L29)

***

### ip

> **ip**: `string`

Defined in: [packages/security/src/advanced-security.ts:25](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L25)

***

### requestId

> **requestId**: `string`

Defined in: [packages/security/src/advanced-security.ts:31](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L31)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [packages/security/src/advanced-security.ts:24](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L24)

***

### tenantId?

> `optional` **tenantId**: `string`

Defined in: [packages/security/src/advanced-security.ts:27](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L27)

***

### timestamp

> **timestamp**: `number`

Defined in: [packages/security/src/advanced-security.ts:30](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L30)

***

### type

> **type**: `"rate_limit"` \| `"csrf_attack"` \| `"xss_attempt"` \| `"suspicious_activity"` \| `"security_violation"`

Defined in: [packages/security/src/advanced-security.ts:23](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L23)

***

### userAgent

> **userAgent**: `string`

Defined in: [packages/security/src/advanced-security.ts:26](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L26)

***

### userId?

> `optional` **userId**: `string`

Defined in: [packages/security/src/advanced-security.ts:28](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/advanced-security.ts#L28)
