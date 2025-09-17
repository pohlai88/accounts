[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / calculateWithholdingTax

# Function: calculateWithholdingTax()

> **calculateWithholdingTax**(`tenantId`, `companyId`, `paymentAmount`, `partyType`): `Promise`\<`object`[]\>

Defined in: [packages/db/src/repos.ts:1539](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L1539)

Calculate withholding tax for a payment

## Parameters

### tenantId

`string`

### companyId

`string`

### paymentAmount

`number`

### partyType

`"CUSTOMER"` | `"SUPPLIER"`

## Returns

`Promise`\<`object`[]\>
