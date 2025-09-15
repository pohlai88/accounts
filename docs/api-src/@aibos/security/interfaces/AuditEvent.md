[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/security](../README.md) / AuditEvent

# Interface: AuditEvent

Defined in: [packages/security/src/audit-logger.ts:4](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L4)

## Properties

### action

> **action**: `string`

Defined in: [packages/security/src/audit-logger.ts:9](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L9)

***

### category

> **category**: `"authentication"` \| `"authorization"` \| `"data_access"` \| `"data_modification"` \| `"system"` \| `"security"` \| `"compliance"`

Defined in: [packages/security/src/audit-logger.ts:17](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L17)

***

### complianceFlags

> **complianceFlags**: `string`[]

Defined in: [packages/security/src/audit-logger.ts:27](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L27)

***

### details

> **details**: `Record`\<`string`, `any`\>

Defined in: [packages/security/src/audit-logger.ts:12](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L12)

***

### id

> **id**: `string`

Defined in: [packages/security/src/audit-logger.ts:5](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L5)

***

### ipAddress?

> `optional` **ipAddress**: `string`

Defined in: [packages/security/src/audit-logger.ts:13](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L13)

***

### metadata

> **metadata**: `Record`\<`string`, `any`\>

Defined in: [packages/security/src/audit-logger.ts:28](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L28)

***

### outcome

> **outcome**: `"success"` \| `"failure"` \| `"partial"`

Defined in: [packages/security/src/audit-logger.ts:25](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L25)

***

### resource

> **resource**: `string`

Defined in: [packages/security/src/audit-logger.ts:10](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L10)

***

### resourceId?

> `optional` **resourceId**: `string`

Defined in: [packages/security/src/audit-logger.ts:11](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L11)

***

### riskScore

> **riskScore**: `number`

Defined in: [packages/security/src/audit-logger.ts:26](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L26)

***

### sessionId?

> `optional` **sessionId**: `string`

Defined in: [packages/security/src/audit-logger.ts:15](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L15)

***

### severity

> **severity**: `"low"` \| `"medium"` \| `"high"` \| `"critical"`

Defined in: [packages/security/src/audit-logger.ts:16](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L16)

***

### tenantId

> **tenantId**: `string`

Defined in: [packages/security/src/audit-logger.ts:7](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L7)

***

### timestamp

> **timestamp**: `number`

Defined in: [packages/security/src/audit-logger.ts:6](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L6)

***

### userAgent?

> `optional` **userAgent**: `string`

Defined in: [packages/security/src/audit-logger.ts:14](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L14)

***

### userId?

> `optional` **userId**: `string`

Defined in: [packages/security/src/audit-logger.ts:8](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/audit-logger.ts#L8)
