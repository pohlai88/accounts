[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / calculateInvoiceTaxes

# Function: calculateInvoiceTaxes()

> **calculateInvoiceTaxes**(`scope`, `lines`): `Promise`\<[`LineTaxCalculation`](../interfaces/LineTaxCalculation.md)[]\>

Defined in: [packages/accounting/src/tax-calculations.ts:72](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/tax-calculations.ts#L72)

Calculate taxes for multiple line items

## Parameters

### scope

[`Scope`](../../db/interfaces/Scope.md)

### lines

`object`[]

## Returns

`Promise`\<[`LineTaxCalculation`](../interfaces/LineTaxCalculation.md)[]\>
