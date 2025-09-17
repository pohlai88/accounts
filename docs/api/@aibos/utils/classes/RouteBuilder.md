[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / RouteBuilder

# Class: RouteBuilder

Defined in: [packages/utils/src/api-gateway/router.ts:110](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L110)

Route builder for fluent API

## Constructors

### Constructor

> **new RouteBuilder**(`router`): `RouteBuilder`

Defined in: [packages/utils/src/api-gateway/router.ts:113](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L113)

#### Parameters

##### router

[`ApiRouter`](ApiRouter.md)

#### Returns

`RouteBuilder`

## Methods

### build()

> **build**(): `void`

Defined in: [packages/utils/src/api-gateway/router.ts:145](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L145)

#### Returns

`void`

***

### cache()

> **cache**(`ttl`, `key?`): `RouteBuilder`

Defined in: [packages/utils/src/api-gateway/router.ts:140](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L140)

#### Parameters

##### ttl

`number`

##### key?

`string`

#### Returns

`RouteBuilder`

***

### handler()

> **handler**(`handler`): `RouteBuilder`

Defined in: [packages/utils/src/api-gateway/router.ts:125](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L125)

#### Parameters

##### handler

(`req`) => `Promise`\<[`GatewayResponse`](../interfaces/GatewayResponse.md)\>

#### Returns

`RouteBuilder`

***

### method()

> **method**(`method`): `RouteBuilder`

Defined in: [packages/utils/src/api-gateway/router.ts:120](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L120)

#### Parameters

##### method

`string`

#### Returns

`RouteBuilder`

***

### middleware()

> **middleware**(`middleware`): `RouteBuilder`

Defined in: [packages/utils/src/api-gateway/router.ts:130](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L130)

#### Parameters

##### middleware

[`Middleware`](../interfaces/Middleware.md)[]

#### Returns

`RouteBuilder`

***

### path()

> **path**(`path`): `RouteBuilder`

Defined in: [packages/utils/src/api-gateway/router.ts:115](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L115)

#### Parameters

##### path

`string`

#### Returns

`RouteBuilder`

***

### rateLimit()

> **rateLimit**(`windowMs`, `max`): `RouteBuilder`

Defined in: [packages/utils/src/api-gateway/router.ts:135](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L135)

#### Parameters

##### windowMs

`number`

##### max

`number`

#### Returns

`RouteBuilder`
