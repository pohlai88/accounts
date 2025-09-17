[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / fetchJournals

# Function: fetchJournals()

> **fetchJournals**(`context`, `filters`): `Promise`\<\{ `data`: `unknown`; `error`: `null`; `success`: `boolean`; \} \| \{ `data`: `null`; `error`: `string`; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/server-api-client.ts:106](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/server-api-client.ts#L106)

## Parameters

### context

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

### filters

#### fromDate?

`string`

#### limit?

`number`

#### page?

`number`

#### status?

`string`

#### toDate?

`string`

## Returns

`Promise`\<\{ `data`: `unknown`; `error`: `null`; `success`: `boolean`; \} \| \{ `data`: `null`; `error`: `string`; `success`: `boolean`; \}\>
