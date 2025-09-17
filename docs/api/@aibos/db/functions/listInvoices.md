[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / listInvoices

# Function: listInvoices()

> **listInvoices**(`scope`, `filters`): `Promise`\<\{ `hasMore`: `boolean`; `invoices`: `object`[]; `total`: `number`; \}\>

Defined in: [packages/db/src/repos.ts:936](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L936)

List invoices with pagination and filtering

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

### filters

#### customerId?

`string`

#### fromDate?

`Date`

#### limit?

`number`

#### offset?

`number`

#### status?

`string`

#### toDate?

`Date`

## Returns

`Promise`\<\{ `hasMore`: `boolean`; `invoices`: `object`[]; `total`: `number`; \}\>
