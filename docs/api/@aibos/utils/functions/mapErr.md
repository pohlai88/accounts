[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / mapErr

# Function: mapErr()

> **mapErr**\<`T`, `E`, `F`\>(`result`, `fn`): [`Result`](../type-aliases/Result.md)\<`T`, `F`\>

Defined in: [packages/utils/src/result.ts:87](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/result.ts#L87)

Map an error result to a new error

## Type Parameters

### T

`T`

### E

`E`

### F

`F`

## Parameters

### result

[`Result`](../type-aliases/Result.md)\<`T`, `E`\>

The result to map

### fn

(`error`) => `F`

Function to transform the error

## Returns

[`Result`](../type-aliases/Result.md)\<`T`, `F`\>

New result with transformed error
