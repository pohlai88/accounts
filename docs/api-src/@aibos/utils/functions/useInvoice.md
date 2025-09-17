[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / useInvoice

# Function: useInvoice()

> **useInvoice**(`context`, `id`, `options?`): `object`

Defined in: [packages/utils/src/state-management.ts:78](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/state-management.ts#L78)

## Parameters

### context

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

### id

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

> **refetch**: () => `Promise`\<`void`\> = `fetchInvoice`

#### Returns

`Promise`\<`void`\>
