[**AI-BOS Accounts API Documentation**](../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../README.md) / [@aibos/utils](../../README.md) / [types](../README.md) / AuditEntry

# Interface: AuditEntry

Defined in: [packages/utils/src/types.ts:75](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/types.ts#L75)

## Properties

### action

> **action**: [`AuditAction`](../type-aliases/AuditAction.md)

Defined in: [packages/utils/src/types.ts:77](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/types.ts#L77)

***

### context?

> `optional` **context**: [`AuditContext`](AuditContext.md)

Defined in: [packages/utils/src/types.ts:83](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/types.ts#L83)

***

### entityId

> **entityId**: `string`

Defined in: [packages/utils/src/types.ts:79](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/types.ts#L79)

***

### entityType

> **entityType**: [`AuditEntityType`](../type-aliases/AuditEntityType.md)

Defined in: [packages/utils/src/types.ts:78](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/types.ts#L78)

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [packages/utils/src/types.ts:82](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/types.ts#L82)

***

### newValues?

> `optional` **newValues**: `Record`\<`string`, `unknown`\>

Defined in: [packages/utils/src/types.ts:81](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/types.ts#L81)

***

### oldValues?

> `optional` **oldValues**: `Record`\<`string`, `unknown`\>

Defined in: [packages/utils/src/types.ts:80](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/types.ts#L80)

***

### scope

> **scope**: [`Scope`](../../../db/interfaces/Scope.md)

Defined in: [packages/utils/src/types.ts:76](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/types.ts#L76)
