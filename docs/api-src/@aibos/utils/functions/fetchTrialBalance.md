[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / fetchTrialBalance

# Function: fetchTrialBalance()

> **fetchTrialBalance**(`context`, `params`): `Promise`\<\{ `data`: `unknown`; `error`: `null`; `success`: `boolean`; \} \| \{ `data`: `null`; `error`: `string`; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/server-api-client.ts:174](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/server-api-client.ts#L174)

## Parameters

### context

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

### params

#### asOfDate?

`string`

#### companyId

`string`

#### currency?

`string`

#### fromDate

`string`

#### includePeriodActivity?

`boolean`

#### includeZeroBalances?

`boolean`

#### tenantId

`string`

#### toDate

`string`

## Returns

`Promise`\<\{ `data`: `unknown`; `error`: `null`; `success`: `boolean`; \} \| \{ `data`: `null`; `error`: `string`; `success`: `boolean`; \}\>
