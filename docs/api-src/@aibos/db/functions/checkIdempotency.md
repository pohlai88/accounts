[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / checkIdempotency

# Function: checkIdempotency()

> **checkIdempotency**(`scope`, `idempotencyKey`): `Promise`\<`null` \| \{ `createdAt`: `null` \| `Date`; `expiresAt`: `Date`; `key`: `string`; `requestHash`: `string`; `response`: `unknown`; `status`: `string`; `tenantId`: `string`; \}\>

Defined in: [packages/db/src/repos.ts:88](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L88)

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

### idempotencyKey

`string`

## Returns

`Promise`\<`null` \| \{ `createdAt`: `null` \| `Date`; `expiresAt`: `Date`; `key`: `string`; `requestHash`: `string`; `response`: `unknown`; `status`: `string`; `tenantId`: `string`; \}\>
