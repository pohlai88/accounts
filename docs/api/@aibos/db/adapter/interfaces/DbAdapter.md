[**AI-BOS Accounts API Documentation**](../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../README.md) / [@aibos/db](../../README.md) / [adapter](../README.md) / DbAdapter

# Interface: DbAdapter

Defined in: [packages/db/src/adapter.ts:6](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapter.ts#L6)

Database Adapter Interface - Unified database access layer

## Methods

### delete()

> **delete**(`opts`): `Promise`\<`void`\>

Defined in: [packages/db/src/adapter.ts:34](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapter.ts#L34)

Delete records

#### Parameters

##### opts

###### eq?

`Record`\<`string`, `string` \| `number`\>

###### table

`string`

#### Returns

`Promise`\<`void`\>

***

### insert()

> **insert**\<`T`\>(`opts`): `Promise`\<`T`\>

Defined in: [packages/db/src/adapter.ts:21](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapter.ts#L21)

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

***

### queryRaw()

> **queryRaw**\<`T`\>(`sql`, `params?`): `Promise`\<`T`\>

Defined in: [packages/db/src/adapter.ts:8](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapter.ts#L8)

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

***

### select()

> **select**\<`T`\>(`opts`): `Promise`\<`T`[]\>

Defined in: [packages/db/src/adapter.ts:11](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapter.ts#L11)

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

***

### update()

> **update**\<`T`\>(`opts`): `Promise`\<`T`[]\>

Defined in: [packages/db/src/adapter.ts:27](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/adapter.ts#L27)

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
