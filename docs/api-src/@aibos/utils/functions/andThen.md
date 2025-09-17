[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / andThen

# Function: andThen()

> **andThen**\<`T`, `U`, `E`\>(`result`, `fn`): [`Result`](../type-aliases/Result.md)\<`U`, `E`\>

Defined in: [packages/utils/src/result.ts:100](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/result.ts#L100)

Chain operations on results

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

The result to chain

### fn

(`value`) => [`Result`](../type-aliases/Result.md)\<`U`, `E`\>

Function that returns a new result

## Returns

[`Result`](../type-aliases/Result.md)\<`U`, `E`\>

New result from the chained operation
