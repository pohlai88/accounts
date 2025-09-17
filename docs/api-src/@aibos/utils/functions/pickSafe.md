[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / pickSafe

# Function: pickSafe()

> **pickSafe**\<`T`, `K`\>(`obj`, `keys`): `Pick`\<`T`, `K`\>

Defined in: [packages/utils/src/pick.ts:21](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/pick.ts#L21)

Pick specific properties from an object with type safety

## Type Parameters

### T

`T` *extends* `object`

### K

`K` *extends* `string` \| `number` \| `symbol`

## Parameters

### obj

`T`

Source object

### keys

`K`[]

Array of keys to pick

## Returns

`Pick`\<`T`, `K`\>

Object with only the specified keys
