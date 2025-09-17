[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / CacheAdapter

# Interface: CacheAdapter

Defined in: [packages/utils/src/cache/types.ts:34](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L34)

## Methods

### del()

> **del**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/types.ts:37](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L37)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

***

### delByTags()

> **delByTags**(`tags`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/types.ts:39](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L39)

#### Parameters

##### tags

`string`[]

#### Returns

`Promise`\<`number`\>

***

### delPattern()

> **delPattern**(`pattern`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/types.ts:38](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L38)

#### Parameters

##### pattern

`string`

#### Returns

`Promise`\<`number`\>

***

### exists()

> **exists**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/types.ts:40](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L40)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

***

### expire()

> **expire**(`key`, `ttl`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/types.ts:42](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L42)

#### Parameters

##### key

`string`

##### ttl

`number`

#### Returns

`Promise`\<`boolean`\>

***

### flush()

> **flush**(): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/types.ts:43](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L43)

#### Returns

`Promise`\<`boolean`\>

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`null` \| `T`\>

Defined in: [packages/utils/src/cache/types.ts:35](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L35)

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`null` \| `T`\>

***

### ping()

> **ping**(): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/types.ts:45](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L45)

#### Returns

`Promise`\<`boolean`\>

***

### set()

> **set**\<`T`\>(`key`, `value`, `options?`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/types.ts:36](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L36)

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### value

`T`

##### options?

[`CacheOptions`](CacheOptions.md)

#### Returns

`Promise`\<`boolean`\>

***

### stats()

> **stats**(): `Promise`\<[`CacheStats`](CacheStats.md)\>

Defined in: [packages/utils/src/cache/types.ts:44](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L44)

#### Returns

`Promise`\<[`CacheStats`](CacheStats.md)\>

***

### ttl()

> **ttl**(`key`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/types.ts:41](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/types.ts#L41)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`number`\>
