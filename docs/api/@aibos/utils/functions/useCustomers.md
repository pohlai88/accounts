[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / useCustomers

# Function: useCustomers()

> **useCustomers**(`context`, `filters`, `options?`): `object`

Defined in: [packages/utils/src/state-management.ts:202](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/state-management.ts#L202)

## Parameters

### context

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

### filters

#### limit?

`number`

#### page?

`number`

#### search?

`string`

#### status?

`string`

### options?

#### enabled?

`boolean`

## Returns

`object`

### data

> **data**: `null` \| \{ `customers`: `unknown`[]; \}

### error

> **error**: `null` \| `Error`

### isLoading

> **isLoading**: `boolean`

### refetch()

> **refetch**: () => `Promise`\<`void`\> = `fetchCustomers`

#### Returns

`Promise`\<`void`\>
