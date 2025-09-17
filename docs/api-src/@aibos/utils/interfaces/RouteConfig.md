[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / RouteConfig

# Interface: RouteConfig

Defined in: [packages/utils/src/api-gateway/types.ts:22](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/types.ts#L22)

## Properties

### cache?

> `optional` **cache**: `object`

Defined in: [packages/utils/src/api-gateway/types.ts:31](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/types.ts#L31)

#### key?

> `optional` **key**: `string`

#### ttl

> **ttl**: `number`

***

### handler()

> **handler**: (`req`) => `Promise`\<[`GatewayResponse`](GatewayResponse.md)\>

Defined in: [packages/utils/src/api-gateway/types.ts:25](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/types.ts#L25)

#### Parameters

##### req

[`ApiRequest`](ApiRequest.md)

#### Returns

`Promise`\<[`GatewayResponse`](GatewayResponse.md)\>

***

### method

> **method**: `string`

Defined in: [packages/utils/src/api-gateway/types.ts:24](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/types.ts#L24)

***

### middleware?

> `optional` **middleware**: [`Middleware`](Middleware.md)[]

Defined in: [packages/utils/src/api-gateway/types.ts:26](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/types.ts#L26)

***

### path

> **path**: `string`

Defined in: [packages/utils/src/api-gateway/types.ts:23](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/types.ts#L23)

***

### rateLimit?

> `optional` **rateLimit**: `object`

Defined in: [packages/utils/src/api-gateway/types.ts:27](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/types.ts#L27)

#### max

> **max**: `number`

#### windowMs

> **windowMs**: `number`
