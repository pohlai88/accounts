[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / HttpClient

# Class: HttpClient

Defined in: [packages/utils/src/httpClient.ts:7](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/httpClient.ts#L7)

Schema-first HTTP client that eliminates unknown types
Provides type-safe API calls with automatic validation

## Constructors

### Constructor

> **new HttpClient**(`fetchImpl`): `HttpClient`

Defined in: [packages/utils/src/httpClient.ts:8](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/httpClient.ts#L8)

#### Parameters

##### fetchImpl

\{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

#### Returns

`HttpClient`

## Methods

### delete()

> **delete**\<`S`\>(`url`, `schema`, `init?`): `Promise`\<`TypeOf`\<`S`\>\>

Defined in: [packages/utils/src/httpClient.ts:47](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/httpClient.ts#L47)

#### Type Parameters

##### S

`S` *extends* `ZodTypeAny`

#### Parameters

##### url

`string`

##### schema

`S`

##### init?

`RequestInit`

#### Returns

`Promise`\<`TypeOf`\<`S`\>\>

***

### get()

> **get**\<`S`\>(`url`, `schema`, `init?`): `Promise`\<`TypeOf`\<`S`\>\>

Defined in: [packages/utils/src/httpClient.ts:10](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/httpClient.ts#L10)

#### Type Parameters

##### S

`S` *extends* `ZodTypeAny`

#### Parameters

##### url

`string`

##### schema

`S`

##### init?

`RequestInit`

#### Returns

`Promise`\<`TypeOf`\<`S`\>\>

***

### post()

> **post**\<`S`, `B`\>(`url`, `body`, `schema`, `init?`): `Promise`\<`TypeOf`\<`S`\>\>

Defined in: [packages/utils/src/httpClient.ts:19](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/httpClient.ts#L19)

#### Type Parameters

##### S

`S` *extends* `ZodTypeAny`

##### B

`B` = `unknown`

#### Parameters

##### url

`string`

##### body

`B`

##### schema

`S`

##### init?

`RequestInit`

#### Returns

`Promise`\<`TypeOf`\<`S`\>\>

***

### put()

> **put**\<`S`, `B`\>(`url`, `body`, `schema`, `init?`): `Promise`\<`TypeOf`\<`S`\>\>

Defined in: [packages/utils/src/httpClient.ts:33](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/httpClient.ts#L33)

#### Type Parameters

##### S

`S` *extends* `ZodTypeAny`

##### B

`B` = `unknown`

#### Parameters

##### url

`string`

##### body

`B`

##### schema

`S`

##### init?

`RequestInit`

#### Returns

`Promise`\<`TypeOf`\<`S`\>\>
