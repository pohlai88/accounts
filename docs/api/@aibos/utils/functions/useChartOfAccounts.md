[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / useChartOfAccounts

# Function: useChartOfAccounts()

> **useChartOfAccounts**(`context`, `filters`, `options?`): `object`

Defined in: [packages/utils/src/state-management.ts:503](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/state-management.ts#L503)

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

### options?

#### enabled?

`boolean`

## Returns

`object`

### data

> **data**: `null` \| \{ `accounts`: `unknown`[]; \}

### error

> **error**: `null` \| `Error`

### isLoading

> **isLoading**: `boolean`

### refetch()

> **refetch**: () => `Promise`\<`void`\> = `fetchAccounts`

#### Returns

`Promise`\<`void`\>
