[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/utils](../../README.md) / [api-gateway](../README.md) / RouteBuilder

# Interface: RouteBuilder

Defined in: [packages/utils/src/api-gateway.ts:36](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway.ts#L36)

## Methods

### build()

> **build**(): `void`

Defined in: [packages/utils/src/api-gateway.ts:39](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway.ts#L39)

#### Returns

`void`

***

### handler()

> **handler**(`handler`): `RouteBuilder`

Defined in: [packages/utils/src/api-gateway.ts:38](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway.ts#L38)

#### Parameters

##### handler

(`req`) => `Promise`\<`NextResponse`\<`unknown`\>\>

#### Returns

`RouteBuilder`

***

### middleware()

> **middleware**(`middlewares`): `RouteBuilder`

Defined in: [packages/utils/src/api-gateway.ts:37](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway.ts#L37)

#### Parameters

##### middlewares

(`req`) => `Promise`\<`NextRequest` \| `NextResponse`\<`unknown`\>\>[]

#### Returns

`RouteBuilder`
