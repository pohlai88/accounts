[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / storeIdempotencyResult

# Function: storeIdempotencyResult()

> **storeIdempotencyResult**(`scope`, `idempotencyKey`, `response`, `status`): `Promise`\<`void`\>

Defined in: [packages/db/src/repos.ts:394](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L394)

Store idempotency result for future checks

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

### idempotencyKey

`string`

### response

`Record`\<`string`, `unknown`\>

### status

`"draft"` | `"processing"` | `"posted"` | `"failed"`

## Returns

`Promise`\<`void`\>
