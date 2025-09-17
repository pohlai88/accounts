[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / getPeriodsCount

# Function: getPeriodsCount()

> **getPeriodsCount**(`db`, `args`): `Promise`\<`number`\>

Defined in: [packages/accounting/src/repos/periodRepo.ts:130](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/repos/periodRepo.ts#L130)

Get total count of periods for pagination

## Parameters

### db

[`DbAdapter`](../../db/adapter/interfaces/DbAdapter.md)

### args

#### companyId

`string`

#### status?

`"open"` \| `"closed"` \| `"locked"`

#### tenantId

`string`

## Returns

`Promise`\<`number`\>
