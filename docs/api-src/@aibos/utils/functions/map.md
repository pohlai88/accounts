[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / map

# Function: map()

> **map**\<`T`, `U`, `E`\>(`result`, `fn`): [`Result`](../type-aliases/Result.md)\<`U`, `E`\>

Defined in: [packages/utils/src/result.ts:74](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/result.ts#L74)

Map a successful result to a new value

## Type Parameters

### T

`T`

### U

`U`

### E

`E`

## Parameters

### result

[`Result`](../type-aliases/Result.md)\<`T`, `E`\>

The result to map

### fn

(`value`) => `U`

Function to transform the value

## Returns

[`Result`](../type-aliases/Result.md)\<`U`, `E`\>

New result with transformed value
