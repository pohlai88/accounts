[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / ApiGateway

# Class: ApiGateway

Defined in: [packages/utils/src/api-gateway/gateway.ts:11](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/gateway.ts#L11)

## Constructors

### Constructor

> **new ApiGateway**(`config`): `ApiGateway`

Defined in: [packages/utils/src/api-gateway/gateway.ts:16](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/gateway.ts#L16)

#### Parameters

##### config

[`GatewayConfig`](../interfaces/GatewayConfig.md)

#### Returns

`ApiGateway`

## Methods

### getConfig()

> **getConfig**(): [`GatewayConfig`](../interfaces/GatewayConfig.md)

Defined in: [packages/utils/src/api-gateway/gateway.ts:140](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/gateway.ts#L140)

Get gateway configuration

#### Returns

[`GatewayConfig`](../interfaces/GatewayConfig.md)

***

### getRoutes()

> **getRoutes**(): [`RouteConfig`](../interfaces/RouteConfig.md)[]

Defined in: [packages/utils/src/api-gateway/gateway.ts:133](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/gateway.ts#L133)

Get all registered routes

#### Returns

[`RouteConfig`](../interfaces/RouteConfig.md)[]

***

### processRequest()

> **processRequest**(`request`): `Promise`\<[`GatewayResponse`](../interfaces/GatewayResponse.md)\>

Defined in: [packages/utils/src/api-gateway/gateway.ts:62](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/gateway.ts#L62)

Process incoming request

#### Parameters

##### request

[`ApiRequest`](../interfaces/ApiRequest.md)

#### Returns

`Promise`\<[`GatewayResponse`](../interfaces/GatewayResponse.md)\>

***

### route()

> **route**(`path`, `method`): [`RouteBuilder`](RouteBuilder.md)

Defined in: [packages/utils/src/api-gateway/gateway.ts:41](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/gateway.ts#L41)

Register a route

#### Parameters

##### path

`string`

##### method

`string`

#### Returns

[`RouteBuilder`](RouteBuilder.md)

***

### routes()

> **routes**(`routes`): `void`

Defined in: [packages/utils/src/api-gateway/gateway.ts:48](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/gateway.ts#L48)

Register multiple routes

#### Parameters

##### routes

[`RouteConfig`](../interfaces/RouteConfig.md)[]

#### Returns

`void`

***

### updateConfig()

> **updateConfig**(`updates`): `void`

Defined in: [packages/utils/src/api-gateway/gateway.ts:147](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/gateway.ts#L147)

Update configuration

#### Parameters

##### updates

`Partial`\<[`GatewayConfig`](../interfaces/GatewayConfig.md)\>

#### Returns

`void`

***

### use()

> **use**(`middleware`): `void`

Defined in: [packages/utils/src/api-gateway/gateway.ts:55](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway/gateway.ts#L55)

Add global middleware

#### Parameters

##### middleware

[`Middleware`](../interfaces/Middleware.md)

#### Returns

`void`
