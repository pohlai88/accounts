[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / listPeriodsByCompany

# Function: listPeriodsByCompany()

> **listPeriodsByCompany**(`db`, `args`): `Promise`\<`object`[]\>

Defined in: [packages/accounting/src/repos/periodRepo.ts:9](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/repos/periodRepo.ts#L9)

List periods by company with filtering and pagination

## Parameters

### db

[`DbAdapter`](../../db/adapter/interfaces/DbAdapter.md)

### args

#### companyId

`string`

#### limit?

`number`

#### offset?

`number`

#### status?

`"open"` \| `"closed"` \| `"locked"`

#### tenantId

`string`

## Returns

`Promise`\<`object`[]\>
