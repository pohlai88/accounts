[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / useTrialBalance

# Function: useTrialBalance()

> **useTrialBalance**(`context`, `params`, `options?`): `object`

Defined in: [packages/utils/src/state-management.ts:442](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/state-management.ts#L442)

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

### options?

#### enabled?

`boolean`

## Returns

`object`

### data

> **data**: `unknown`

### error

> **error**: `null` \| `Error`

### isLoading

> **isLoading**: `boolean`

### refetch()

> **refetch**: () => `Promise`\<`void`\> = `fetchTrialBalance`

#### Returns

`Promise`\<`void`\>
