[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / fetchInvoices

# Function: fetchInvoices()

> **fetchInvoices**(`context`, `filters`): `Promise`\<\{ `data`: `unknown`; `error`: `null`; `success`: `boolean`; \} \| \{ `data`: `null`; `error`: `string`; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/server-api-client.ts:14](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/server-api-client.ts#L14)

## Parameters

### context

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

### filters

#### customerId?

`string`

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
