[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / usePostInvoice

# Function: usePostInvoice()

> **usePostInvoice**(`context`, `options?`): `object`

Defined in: [packages/utils/src/state-management.ts:162](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/state-management.ts#L162)

## Parameters

### context

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

### options?

#### enabled?

`boolean`

## Returns

`object`

### error

> **error**: `null` \| `Error`

### isLoading

> **isLoading**: `boolean`

### mutate()

> **mutate**: (`data`) => `Promise`\<`unknown`\>

#### Parameters

##### data

###### arAccountId

`string`

###### invoiceId

`string`

#### Returns

`Promise`\<`unknown`\>
