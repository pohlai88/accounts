[**AI-BOS Accounts API Documentation**](../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../README.md) / [@aibos/utils](../../README.md) / [api-gateway](../README.md) / RouteConfig

# Interface: RouteConfig

Defined in: [packages/utils/src/api-gateway.ts:23](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway.ts#L23)

## Properties

### handler()

> **handler**: (`req`) => `Promise`\<`NextResponse`\<`unknown`\>\>

Defined in: [packages/utils/src/api-gateway.ts:27](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway.ts#L27)

#### Parameters

##### req

`NextRequest`

#### Returns

`Promise`\<`NextResponse`\<`unknown`\>\>

***

### method

> **method**: `string`

Defined in: [packages/utils/src/api-gateway.ts:25](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway.ts#L25)

***

### middleware?

> `optional` **middleware**: (`req`) => `Promise`\<`NextRequest` \| `NextResponse`\<`unknown`\>\>[]

Defined in: [packages/utils/src/api-gateway.ts:26](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway.ts#L26)

#### Parameters

##### req

`NextRequest`

#### Returns

`Promise`\<`NextRequest` \| `NextResponse`\<`unknown`\>\>

***

### path

> **path**: `string`

Defined in: [packages/utils/src/api-gateway.ts:24](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/api-gateway.ts#L24)
