[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / useTaxCodes

# Function: useTaxCodes()

> **useTaxCodes**(`context`, `options?`): `object`

Defined in: [packages/utils/src/state-management.ts:556](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/state-management.ts#L556)

## Parameters

### context

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

### options?

#### enabled?

`boolean`

## Returns

`object`

### data

> **data**: `null` \| \{ `taxCodes`: `unknown`[]; \}

### error

> **error**: `null` \| `Error`

### isLoading

> **isLoading**: `boolean`

### refetch()

> **refetch**: () => `Promise`\<`void`\> = `fetchTaxCodes`

#### Returns

`Promise`\<`void`\>
