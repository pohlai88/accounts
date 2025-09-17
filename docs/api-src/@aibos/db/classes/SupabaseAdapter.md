[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / SupabaseAdapter

# Class: SupabaseAdapter

Defined in: [packages/db/src/adapters/supabaseAdapter.ts:7](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapters/supabaseAdapter.ts#L7)

Supabase Database Adapter - Implements DbAdapter for Supabase

## Implements

- [`DbAdapter`](../adapter/interfaces/DbAdapter.md)

## Constructors

### Constructor

> **new SupabaseAdapter**(`sb`): `SupabaseAdapter`

Defined in: [packages/db/src/adapters/supabaseAdapter.ts:8](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapters/supabaseAdapter.ts#L8)

#### Parameters

##### sb

`SupabaseClient`

#### Returns

`SupabaseAdapter`

## Methods

### delete()

> **delete**(`opts`): `Promise`\<`void`\>

Defined in: [packages/db/src/adapters/supabaseAdapter.ts:82](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapters/supabaseAdapter.ts#L82)

Delete records

#### Parameters

##### opts

###### eq?

`Record`\<`string`, `string` \| `number`\>

###### table

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`DbAdapter`](../adapter/interfaces/DbAdapter.md).[`delete`](../adapter/interfaces/DbAdapter.md#delete)

***

### insert()

> **insert**\<`T`\>(`opts`): `Promise`\<`T`\>

Defined in: [packages/db/src/adapters/supabaseAdapter.ts:50](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapters/supabaseAdapter.ts#L50)

Insert a single record

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### opts

###### data

`Record`\<`string`, `unknown`\>

###### table

`string`

#### Returns

`Promise`\<`T`\>

#### Implementation of

[`DbAdapter`](../adapter/interfaces/DbAdapter.md).[`insert`](../adapter/interfaces/DbAdapter.md#insert)

***

### queryRaw()

> **queryRaw**\<`T`\>(`sql`, `params?`): `Promise`\<`T`\>

Defined in: [packages/db/src/adapters/supabaseAdapter.ts:10](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapters/supabaseAdapter.ts#L10)

Low-level raw query if you have RPC/SQL (optional)

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### sql

`string`

##### params?

`unknown`[]

#### Returns

`Promise`\<`T`\>

#### Implementation of

[`DbAdapter`](../adapter/interfaces/DbAdapter.md).[`queryRaw`](../adapter/interfaces/DbAdapter.md#queryraw)

***

### select()

> **select**\<`T`\>(`opts`): `Promise`\<`T`[]\>

Defined in: [packages/db/src/adapters/supabaseAdapter.ts:17](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapters/supabaseAdapter.ts#L17)

High-level select (table + select) for PostgREST style

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### opts

###### columns?

`string`

###### eq?

`Record`\<`string`, `string` \| `number`\>

###### limit?

`number`

###### offset?

`number`

###### orderBy?

\{ `ascending?`: `boolean`; `column`: `string`; \}

###### orderBy.ascending?

`boolean`

###### orderBy.column

`string`

###### table

`string`

#### Returns

`Promise`\<`T`[]\>

#### Implementation of

[`DbAdapter`](../adapter/interfaces/DbAdapter.md).[`select`](../adapter/interfaces/DbAdapter.md#select)

***

### update()

> **update**\<`T`\>(`opts`): `Promise`\<`T`[]\>

Defined in: [packages/db/src/adapters/supabaseAdapter.ts:64](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapters/supabaseAdapter.ts#L64)

Update records

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### opts

###### data

`Record`\<`string`, `unknown`\>

###### eq?

`Record`\<`string`, `string` \| `number`\>

###### table

`string`

#### Returns

`Promise`\<`T`[]\>

#### Implementation of

[`DbAdapter`](../adapter/interfaces/DbAdapter.md).[`update`](../adapter/interfaces/DbAdapter.md#update)
