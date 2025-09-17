[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / ApiRouter

# Class: ApiRouter

Defined in: [packages/utils/src/api-gateway/router.ts:4](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L4)

## Constructors

### Constructor

> **new ApiRouter**(): `ApiRouter`

#### Returns

`ApiRouter`

## Methods

### addRoute()

> **addRoute**(`route`): `void`

Defined in: [packages/utils/src/api-gateway/router.ts:10](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L10)

Register a new route

#### Parameters

##### route

[`RouteConfig`](../interfaces/RouteConfig.md)

#### Returns

`void`

***

### addRoutes()

> **addRoutes**(`routes`): `void`

Defined in: [packages/utils/src/api-gateway/router.ts:17](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L17)

Register multiple routes

#### Parameters

##### routes

[`RouteConfig`](../interfaces/RouteConfig.md)[]

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: [packages/utils/src/api-gateway/router.ts:102](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L102)

Clear all routes

#### Returns

`void`

***

### findRoute()

> **findRoute**(`method`, `path`): `null` \| [`RouteMatch`](../interfaces/RouteMatch.md)

Defined in: [packages/utils/src/api-gateway/router.ts:24](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L24)

Find matching route for request

#### Parameters

##### method

`string`

##### path

`string`

#### Returns

`null` \| [`RouteMatch`](../interfaces/RouteMatch.md)

***

### getRoutes()

> **getRoutes**(): [`RouteConfig`](../interfaces/RouteConfig.md)[]

Defined in: [packages/utils/src/api-gateway/router.ts:95](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/router.ts#L95)

Get all registered routes

#### Returns

[`RouteConfig`](../interfaces/RouteConfig.md)[]
