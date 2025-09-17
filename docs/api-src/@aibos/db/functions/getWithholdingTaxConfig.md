[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / getWithholdingTaxConfig

# Function: getWithholdingTaxConfig()

> **getWithholdingTaxConfig**(`tenantId`, `companyId`, `applicableTo`): `Promise`\<[`WithholdingTaxConfig`](../interfaces/WithholdingTaxConfig.md)[]\>

Defined in: [packages/db/src/repos.ts:1440](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L1440)

Get withholding tax configuration

## Parameters

### tenantId

`string`

### companyId

`string`

### applicableTo

`"SUPPLIERS"` | `"CUSTOMERS"` | `"BOTH"`

## Returns

`Promise`\<[`WithholdingTaxConfig`](../interfaces/WithholdingTaxConfig.md)[]\>
