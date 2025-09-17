[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / ApiClient

# Class: ApiClient

Defined in: [packages/utils/src/api-client.ts:62](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-client.ts#L62)

## Constructors

### Constructor

> **new ApiClient**(`config`): `ApiClient`

Defined in: [packages/utils/src/api-client.ts:66](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-client.ts#L66)

#### Parameters

##### config

[`ApiClientConfig`](../interfaces/ApiClientConfig.md)

#### Returns

`ApiClient`

## Methods

### delete()

> **delete**\<`T`\>(`endpoint`, `options?`): `Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

Defined in: [packages/utils/src/api-client.ts:266](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-client.ts#L266)

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### options?

`Omit`\<`undefined` \| \{ `body?`: `unknown`; `context?`: [`ApiRequestContext`](../interfaces/ApiRequestContext.md); `headers?`: `Record`\<`string`, `string`\>; `method?`: `"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"`; `query?`: `Record`\<`string`, `string` \| `number` \| `boolean`\>; \}, `"method"` \| `"body"`\>

#### Returns

`Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

***

### get()

> **get**\<`T`\>(`endpoint`, `options?`): `Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

Defined in: [packages/utils/src/api-client.ts:235](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-client.ts#L235)

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### options?

`Omit`\<`undefined` \| \{ `body?`: `unknown`; `context?`: [`ApiRequestContext`](../interfaces/ApiRequestContext.md); `headers?`: `Record`\<`string`, `string`\>; `method?`: `"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"`; `query?`: `Record`\<`string`, `string` \| `number` \| `boolean`\>; \}, `"method"` \| `"body"`\>

#### Returns

`Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

***

### patch()

> **patch**\<`T`\>(`endpoint`, `body?`, `options?`): `Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

Defined in: [packages/utils/src/api-client.ts:258](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-client.ts#L258)

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### body?

`unknown`

##### options?

`Omit`\<`undefined` \| \{ `body?`: `unknown`; `context?`: [`ApiRequestContext`](../interfaces/ApiRequestContext.md); `headers?`: `Record`\<`string`, `string`\>; `method?`: `"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"`; `query?`: `Record`\<`string`, `string` \| `number` \| `boolean`\>; \}, `"method"` \| `"body"`\>

#### Returns

`Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

***

### post()

> **post**\<`T`\>(`endpoint`, `body?`, `options?`): `Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

Defined in: [packages/utils/src/api-client.ts:242](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-client.ts#L242)

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### body?

`unknown`

##### options?

`Omit`\<`undefined` \| \{ `body?`: `unknown`; `context?`: [`ApiRequestContext`](../interfaces/ApiRequestContext.md); `headers?`: `Record`\<`string`, `string`\>; `method?`: `"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"`; `query?`: `Record`\<`string`, `string` \| `number` \| `boolean`\>; \}, `"method"` \| `"body"`\>

#### Returns

`Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

***

### put()

> **put**\<`T`\>(`endpoint`, `body?`, `options?`): `Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

Defined in: [packages/utils/src/api-client.ts:250](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-client.ts#L250)

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### body?

`unknown`

##### options?

`Omit`\<`undefined` \| \{ `body?`: `unknown`; `context?`: [`ApiRequestContext`](../interfaces/ApiRequestContext.md); `headers?`: `Record`\<`string`, `string`\>; `method?`: `"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"`; `query?`: `Record`\<`string`, `string` \| `number` \| `boolean`\>; \}, `"method"` \| `"body"`\>

#### Returns

`Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

***

### request()

> **request**\<`T`\>(`endpoint`, `options`): `Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>

Defined in: [packages/utils/src/api-client.ts:84](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-client.ts#L84)

Make a type-safe API request with automatic error handling
Follows RFC 7807 Problem Details specification

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### options

###### body?

`unknown`

###### context?

[`ApiRequestContext`](../interfaces/ApiRequestContext.md)

###### headers?

`Record`\<`string`, `string`\>

###### method?

`"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"`

###### query?

`Record`\<`string`, `string` \| `number` \| `boolean`\>

#### Returns

`Promise`\<[`ApiResponse`](../type-aliases/ApiResponse.md)\<`T`\>\>
