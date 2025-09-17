[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / pick

# Function: pick()

> **pick**\<`T`, `K`\>(`obj`, `keys`): `Pick`\<`T`, `K`\>

Defined in: [packages/utils/src/pick.ts:12](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/pick.ts#L12)

Pick specific properties from an object

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

Array of keys to pick

## Returns

`Pick`\<`T`, `K`\>

Object with only the specified keys
