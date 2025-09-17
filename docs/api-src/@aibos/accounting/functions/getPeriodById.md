[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / getPeriodById

# Function: getPeriodById()

> **getPeriodById**(`db`, `args`): `Promise`\<`null` \| \{ `code`: `string`; `companyId`: `string`; `createdAt`: `Date`; `endDate`: `Date`; `id`: `string`; `startDate`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenantId`: `string`; `updatedAt`: `null` \| `Date`; \}\>

Defined in: [packages/accounting/src/repos/periodRepo.ts:42](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/repos/periodRepo.ts#L42)

Get a single period by ID

## Parameters

### db

[`DbAdapter`](../../db/adapter/interfaces/DbAdapter.md)

### args

#### companyId

`string`

#### periodId

`string`

#### tenantId

`string`

## Returns

`Promise`\<`null` \| \{ `code`: `string`; `companyId`: `string`; `createdAt`: `Date`; `endDate`: `Date`; `id`: `string`; `startDate`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenantId`: `string`; `updatedAt`: `null` \| `Date`; \}\>
