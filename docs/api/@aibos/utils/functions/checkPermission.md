[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / checkPermission

# Function: checkPermission()

> **checkPermission**(`request`, `action`, `context`): `Promise`\<[`PermissionDecision`](../interfaces/PermissionDecision.md)\>

Defined in: [packages/utils/src/auth/enhanced-context.ts:130](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/auth/enhanced-context.ts#L130)

Check if user can perform an action

## Parameters

### request

`NextRequest`

### action

`string`

### context

#### amount?

`number`

#### creatorRole?

`string`

#### module?

`string`

## Returns

`Promise`\<[`PermissionDecision`](../interfaces/PermissionDecision.md)\>
