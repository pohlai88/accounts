[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / fetchChartOfAccounts

# Function: fetchChartOfAccounts()

> **fetchChartOfAccounts**(`context`, `filters`): `Promise`\<\{ `data`: `unknown`; `error`: `null`; `success`: `boolean`; \} \| \{ `data`: `null`; `error`: `string`; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/server-api-client.ts:142](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/server-api-client.ts#L142)

## Parameters

### context

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

### filters

#### accountType?

`string`

#### includeInactive?

`boolean`

#### isActive?

`boolean`

## Returns

`Promise`\<\{ `data`: `unknown`; `error`: `null`; `success`: `boolean`; \} \| \{ `data`: `null`; `error`: `string`; `success`: `boolean`; \}\>
