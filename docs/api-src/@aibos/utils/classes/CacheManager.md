[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / CacheManager

# Class: CacheManager

Defined in: [packages/utils/src/cache/cache-manager.ts:6](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L6)

## Constructors

### Constructor

> **new CacheManager**(`config`): `CacheManager`

Defined in: [packages/utils/src/cache/cache-manager.ts:11](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L11)

#### Parameters

##### config

[`CacheConfig`](../interfaces/CacheConfig.md)

#### Returns

`CacheManager`

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:25](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L25)

Initialize cache connection

#### Returns

`Promise`\<`void`\>

***

### del()

> **del**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:81](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L81)

Delete key from cache

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

***

### delByTags()

> **delByTags**(`tags`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:103](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L103)

Delete keys by tags

#### Parameters

##### tags

`string`[]

#### Returns

`Promise`\<`number`\>

***

### delPattern()

> **delPattern**(`pattern`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:92](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L92)

Delete keys by pattern

#### Parameters

##### pattern

`string`

#### Returns

`Promise`\<`number`\>

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:44](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L44)

Disconnect from cache

#### Returns

`Promise`\<`void`\>

***

### exists()

> **exists**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:114](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L114)

Check if key exists

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

***

### expire()

> **expire**(`key`, `ttl`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:136](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L136)

Set expiration for key

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

Defined in: [packages/utils/src/cache/cache-manager.ts:147](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L147)

Flush all cache

#### Returns

`Promise`\<`boolean`\>

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`null` \| `T`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:59](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L59)

Get value from cache

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`null` \| `T`\>

***

### getConfig()

> **getConfig**(): [`CacheConfig`](../interfaces/CacheConfig.md)

Defined in: [packages/utils/src/cache/cache-manager.ts:228](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L228)

Get cache configuration

#### Returns

[`CacheConfig`](../interfaces/CacheConfig.md)

***

### invalidateByPattern()

> **invalidateByPattern**(`pattern`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:221](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L221)

Invalidate cache by pattern

#### Parameters

##### pattern

`string`

#### Returns

`Promise`\<`number`\>

***

### invalidateByTags()

> **invalidateByTags**(`tags`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:214](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L214)

Invalidate cache by tags

#### Parameters

##### tags

`string`[]

#### Returns

`Promise`\<`number`\>

***

### isCacheConnected()

> **isCacheConnected**(): `boolean`

Defined in: [packages/utils/src/cache/cache-manager.ts:235](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L235)

Check if cache is connected

#### Returns

`boolean`

***

### ping()

> **ping**(): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:175](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L175)

Ping cache server

#### Returns

`Promise`\<`boolean`\>

***

### remember()

> **remember**\<`T`\>(`key`, `fn`, `options`): `Promise`\<`T`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:186](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L186)

Cache a function result

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### fn

() => `Promise`\<`T`\>

##### options

[`CacheOptions`](../interfaces/CacheOptions.md) = `{}`

#### Returns

`Promise`\<`T`\>

***

### rememberWithTags()

> **rememberWithTags**\<`T`\>(`key`, `tags`, `fn`, `options`): `Promise`\<`T`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:202](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L202)

Cache a function result with tags

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### tags

`string`[]

##### fn

() => `Promise`\<`T`\>

##### options

[`CacheOptions`](../interfaces/CacheOptions.md) = `{}`

#### Returns

`Promise`\<`T`\>

***

### set()

> **set**\<`T`\>(`key`, `value`, `options`): `Promise`\<`boolean`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:70](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L70)

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

***

### stats()

> **stats**(): `Promise`\<[`CacheStats`](../interfaces/CacheStats.md)\>

Defined in: [packages/utils/src/cache/cache-manager.ts:158](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L158)

Get cache statistics

#### Returns

`Promise`\<[`CacheStats`](../interfaces/CacheStats.md)\>

***

### ttl()

> **ttl**(`key`): `Promise`\<`number`\>

Defined in: [packages/utils/src/cache/cache-manager.ts:125](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/cache/cache-manager.ts#L125)

Get TTL for key

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`number`\>
