[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/db](../../README.md) / [adapter](../README.md) / queryTypedSingle

# Function: queryTypedSingle()

> **queryTypedSingle**\<`T`\>(`run`, `schema`): `Promise`\<`TypeOf`\<`T`\>\>

Defined in: [packages/db/src/adapter.ts:60](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapter.ts#L60)

Helper to parse single item with a schema

## Type Parameters

### T

`T` *extends* `ZodTypeAny`

## Parameters

### run

() => `Promise`\<`unknown`\>

Function that returns unknown item

### schema

`T`

Zod schema to parse the item

## Returns

`Promise`\<`TypeOf`\<`T`\>\>

Parsed typed item
