[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / unwrapOr

# Function: unwrapOr()

> **unwrapOr**\<`T`, `E`\>(`result`, `defaultValue`): `T`

Defined in: [packages/utils/src/result.ts:61](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/result.ts#L61)

Get the value from a successful result, or return default if error

## Type Parameters

### T

`T`

### E

`E`

## Parameters

### result

[`Result`](../type-aliases/Result.md)\<`T`, `E`\>

The result to unwrap

### defaultValue

`T`

Default value if error

## Returns

`T`

The value if successful, or default if error
