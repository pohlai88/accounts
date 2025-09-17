[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / useJournals

# Function: useJournals()

> **useJournals**(`context`, `filters`, `options?`): `object`

Defined in: [packages/utils/src/state-management.ts:341](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/state-management.ts#L341)

## Parameters

### context

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

### filters

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

> **data**: `null` \| \{ `journals`: `unknown`[]; \}

### error

> **error**: `null` \| `Error`

### isLoading

> **isLoading**: `boolean`

### refetch()

> **refetch**: () => `Promise`\<`void`\> = `fetchJournals`

#### Returns

`Promise`\<`void`\>
