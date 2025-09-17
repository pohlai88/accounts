[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / createPeriod

# Function: createPeriod()

> **createPeriod**(`db`, `args`): `Promise`\<\{ `code`: `string`; `companyId`: `string`; `createdAt`: `Date`; `endDate`: `Date`; `id`: `string`; `startDate`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenantId`: `string`; `updatedAt`: `null` \| `Date`; \}\>

Defined in: [packages/accounting/src/repos/periodRepo.ts:71](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/repos/periodRepo.ts#L71)

Create a new period

## Parameters

### db

[`DbAdapter`](../../db/adapter/interfaces/DbAdapter.md)

### args

#### code

`string`

#### companyId

`string`

#### endDate

`Date`

#### startDate

`Date`

#### status?

`"open"` \| `"closed"` \| `"locked"`

#### tenantId

`string`

## Returns

`Promise`\<\{ `code`: `string`; `companyId`: `string`; `createdAt`: `Date`; `endDate`: `Date`; `id`: `string`; `startDate`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenantId`: `string`; `updatedAt`: `null` \| `Date`; \}\>
