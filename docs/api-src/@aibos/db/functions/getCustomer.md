[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / getCustomer

# Function: getCustomer()

> **getCustomer**(`scope`, `customerId`): `Promise`\<`undefined` \| \{ `billingAddress`: `unknown`; `companyId`: `string`; `createdAt`: `null` \| `Date`; `creditLimit`: `null` \| `string`; `currency`: `string`; `customerNumber`: `string`; `email`: `null` \| `string`; `id`: `string`; `isActive`: `boolean`; `name`: `string`; `paymentTerms`: `string`; `phone`: `null` \| `string`; `shippingAddress`: `unknown`; `tenantId`: `string`; `updatedAt`: `null` \| `Date`; \}\>

Defined in: [packages/db/src/repos.ts:529](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L529)

Get customer by ID

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

### customerId

`string`

## Returns

`Promise`\<`undefined` \| \{ `billingAddress`: `unknown`; `companyId`: `string`; `createdAt`: `null` \| `Date`; `creditLimit`: `null` \| `string`; `currency`: `string`; `customerNumber`: `string`; `email`: `null` \| `string`; `id`: `string`; `isActive`: `boolean`; `name`: `string`; `paymentTerms`: `string`; `phone`: `null` \| `string`; `shippingAddress`: `unknown`; `tenantId`: `string`; `updatedAt`: `null` \| `Date`; \}\>
