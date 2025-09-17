[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / getTaxCode

# Function: getTaxCode()

> **getTaxCode**(`scope`, `taxCodeString`): `Promise`\<`undefined` \| \{ `code`: `string`; `id`: `string`; `isActive`: `boolean`; `name`: `string`; `rate`: `string`; `taxAccountId`: `string`; `taxType`: `string`; \}\>

Defined in: [packages/db/src/repos.ts:556](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L556)

Get tax code information by code

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

### taxCodeString

`string`

## Returns

`Promise`\<`undefined` \| \{ `code`: `string`; `id`: `string`; `isActive`: `boolean`; `name`: `string`; `rate`: `string`; `taxAccountId`: `string`; `taxType`: `string`; \}\>
