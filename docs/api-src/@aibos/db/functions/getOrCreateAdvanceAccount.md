[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / getOrCreateAdvanceAccount

# Function: getOrCreateAdvanceAccount()

> **getOrCreateAdvanceAccount**(`tenantId`, `companyId`, `partyType`, `partyId`, `currency`, `advanceAccountId`): `Promise`\<[`AdvanceAccountInfo`](../interfaces/AdvanceAccountInfo.md)\>

Defined in: [packages/db/src/repos.ts:1318](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L1318)

Get or create advance account for overpayment handling

## Parameters

### tenantId

`string`

### companyId

`string`

### partyType

`"CUSTOMER"` | `"SUPPLIER"`

### partyId

`string`

### currency

`string`

### advanceAccountId

`string`

## Returns

`Promise`\<[`AdvanceAccountInfo`](../interfaces/AdvanceAccountInfo.md)\>
