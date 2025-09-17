[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/db](../../README.md) / [adapter](../README.md) / queryTyped

# Function: queryTyped()

> **queryTyped**\<`T`\>(`run`, `schema`): `Promise`\<`TypeOf`\<`T`\>[]\>

Defined in: [packages/db/src/adapter.ts:46](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapter.ts#L46)

Helper to parse arrays with a schema

## Type Parameters

### T

`T` *extends* `ZodTypeAny`

## Parameters

### run

() => `Promise`\<`unknown`[]\>

Function that returns unknown array

### schema

`T`

Zod schema to parse each item

## Returns

`Promise`\<`TypeOf`\<`T`\>[]\>

Parsed array of typed items
