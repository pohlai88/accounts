[**AI-BOS Accounts API Documentation**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../../README.md) / [@aibos/utils](../../../README.md) / [middleware/idempotency](../README.md) / processIdempotencyKey

# Function: processIdempotencyKey()

> **processIdempotencyKey**(`request`): `Promise`\<[`IdempotencyResult`](../interfaces/IdempotencyResult.md)\>

Defined in: [packages/utils/src/middleware/idempotency.ts:15](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/middleware/idempotency.ts#L15)

Process idempotency key for API requests
V1 requirement: All financial operations must be idempotent

## Parameters

### request

`NextRequest`

## Returns

`Promise`\<[`IdempotencyResult`](../interfaces/IdempotencyResult.md)\>
