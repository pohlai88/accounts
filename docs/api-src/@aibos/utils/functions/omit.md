[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / omit

# Function: omit()

> **omit**\<`T`, `K`\>(`obj`, `keys`): `Omit`\<`T`, `K`\>

Defined in: [packages/utils/src/pick.ts:37](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/pick.ts#L37)

Omit specific properties from an object

## Type Parameters

### T

`T`

### K

`K` *extends* `string` \| `number` \| `symbol`

## Parameters

### obj

`T`

Source object

### keys

readonly `K`[]

Array of keys to omit

## Returns

`Omit`\<`T`, `K`\>

Object without the specified keys
