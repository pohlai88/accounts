[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / updatePeriodStatus

# Function: updatePeriodStatus()

> **updatePeriodStatus**(`db`, `args`): `Promise`\<`null` \| \{ `code`: `string`; `companyId`: `string`; `createdAt`: `Date`; `endDate`: `Date`; `id`: `string`; `startDate`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenantId`: `string`; `updatedAt`: `null` \| `Date`; \}\>

Defined in: [packages/accounting/src/repos/periodRepo.ts:101](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/repos/periodRepo.ts#L101)

Update period status

## Parameters

### db

[`DbAdapter`](../../db/adapter/interfaces/DbAdapter.md)

### args

#### companyId

`string`

#### periodId

`string`

#### status

`"open"` \| `"closed"` \| `"locked"`

#### tenantId

`string`

## Returns

`Promise`\<`null` \| \{ `code`: `string`; `companyId`: `string`; `createdAt`: `Date`; `endDate`: `Date`; `id`: `string`; `startDate`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenantId`: `string`; `updatedAt`: `null` \| `Date`; \}\>
