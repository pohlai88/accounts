[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / useInvoices

# Function: useInvoices()

> **useInvoices**(`context`, `filters`, `options?`): `object`

Defined in: [packages/utils/src/state-management.ts:19](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/state-management.ts#L19)

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

### options?

#### enabled?

`boolean`

## Returns

`object`

### data

> **data**: `null` \| \{ `invoices`: `unknown`[]; \}

### error

> **error**: `null` \| `Error`

### isLoading

> **isLoading**: `boolean`

### refetch()

> **refetch**: () => `Promise`\<`void`\> = `fetchInvoices`

#### Returns

`Promise`\<`void`\>
