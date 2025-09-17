[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / RedisCacheAdapter

# Class: RedisCacheAdapter

Defined in: [packages/utils/src/cache/redis-adapter.ts:4](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L4)

## Implements

- [`CacheAdapter`](../interfaces/CacheAdapter.md)

## Constructors

### Constructor

> **new RedisCacheAdapter**(`config`): `RedisCacheAdapter`

Defined in: [packages/utils/src/cache/redis-adapter.ts:15](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L15)

#### Parameters

##### config

[`CacheConfig`](../interfaces/CacheConfig.md)

#### Returns

`RedisCacheAdapter`

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [packages/utils/src/cache/redis-adapter.ts:22](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L22)

Initialize Redis connection

#### Returns

`Promise`\<`void`\>

***

### del()

> **del**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/redis-adapter.ts:150](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L150)

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

Defined in: [packages/utils/src/cache/redis-adapter.ts:200](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L200)

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

Defined in: [packages/utils/src/cache/redis-adapter.ts:173](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L173)

Delete keys by pattern

#### Parameters

##### pattern

`string`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`delPattern`](../interfaces/CacheAdapter.md#delpattern)

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [packages/utils/src/cache/redis-adapter.ts:54](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L54)

Disconnect from Redis

#### Returns

`Promise`\<`void`\>

***

### exists()

> **exists**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/redis-adapter.ts:236](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L236)

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

Defined in: [packages/utils/src/cache/redis-adapter.ts:273](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L273)

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

Defined in: [packages/utils/src/cache/redis-adapter.ts:293](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L293)

Flush all cache

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`flush`](../interfaces/CacheAdapter.md#flush)

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`null` \| `T`\>

Defined in: [packages/utils/src/cache/redis-adapter.ts:64](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L64)

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

Defined in: [packages/utils/src/cache/redis-adapter.ts:333](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L333)

Ping Redis server

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`ping`](../interfaces/CacheAdapter.md#ping)

***

### set()

> **set**\<`T`\>(`key`, `value`, `options`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/redis-adapter.ts:105](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L105)

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

Defined in: [packages/utils/src/cache/redis-adapter.ts:326](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L326)

Get cache statistics

#### Returns

`Promise`\<[`CacheStats`](../interfaces/CacheStats.md)\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`stats`](../interfaces/CacheAdapter.md#stats)

***

### ttl()

> **ttl**(`key`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/redis-adapter.ts:256](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/redis-adapter.ts#L256)

Get TTL for key

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`number`\>

#### Implementation of

[`CacheAdapter`](../interfaces/CacheAdapter.md).[`ttl`](../interfaces/CacheAdapter.md#ttl)
