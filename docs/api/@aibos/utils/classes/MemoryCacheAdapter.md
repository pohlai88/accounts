[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / MemoryCacheAdapter

# Class: MemoryCacheAdapter

Defined in: [packages/utils/src/cache/memory-adapter.ts:4](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L4)

## Implements

- [`CacheAdapter`](../interfaces/CacheAdapter.md)

## Constructors

### Constructor

> **new MemoryCacheAdapter**(`config`): `MemoryCacheAdapter`

Defined in: [packages/utils/src/cache/memory-adapter.ts:15](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L15)

#### Parameters

##### config

[`CacheConfig`](../interfaces/CacheConfig.md)

#### Returns

`MemoryCacheAdapter`

## Methods

### del()

> **del**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:84](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L84)

Delete key from cache

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`del`](../interfaces/CacheAdapter.md#del)

***

### delByTags()

> **delByTags**(`tags`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:123](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L123)

Delete keys by tags

#### Parameters

##### tags

`string`[]

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`delByTags`](../interfaces/CacheAdapter.md#delbytags)

***

### delPattern()

> **delPattern**(`pattern`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:99](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L99)

Delete keys by pattern

#### Parameters

##### pattern

`string`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`delPattern`](../interfaces/CacheAdapter.md#delpattern)

***

### exists()

> **exists**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:145](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L145)

Check if key exists

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`exists`](../interfaces/CacheAdapter.md#exists)

***

### expire()

> **expire**(`key`, `ttl`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:185](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L185)

Set expiration for key

#### Parameters

##### key

`string`

##### ttl

`number`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`expire`](../interfaces/CacheAdapter.md#expire)

***

### flush()

> **flush**(): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:206](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L206)

Flush all cache

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`flush`](../interfaces/CacheAdapter.md#flush)

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`null` \| `T`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:27](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L27)

Get value from cache

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`null` \| `T`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`get`](../interfaces/CacheAdapter.md#get)

***

### ping()

> **ping**(): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:233](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L233)

Ping (always returns true for memory cache)

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`ping`](../interfaces/CacheAdapter.md#ping)

***

### set()

> **set**\<`T`\>(`key`, `value`, `options`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:60](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L60)

Set value in cache

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### value

`T`

##### options

[`CacheOptions`](../interfaces/CacheOptions.md) = `{}`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`set`](../interfaces/CacheAdapter.md#set)

***

### stats()

> **stats**(): `Promise`\<[`CacheStats`](../interfaces/CacheStats.md)\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:226](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L226)

Get cache statistics

#### Returns

`Promise`\<[`CacheStats`](../interfaces/CacheStats.md)\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`stats`](../interfaces/CacheAdapter.md#stats)

***

### ttl()

> **ttl**(`key`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/memory-adapter.ts:158](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/memory-adapter.ts#L158)

Get TTL for key

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`ttl`](../interfaces/CacheAdapter.md#ttl)
