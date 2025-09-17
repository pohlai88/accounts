[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / validateInvoicePosting

# Function: validateInvoicePosting()

> **validateInvoicePosting**(`input`, `userId`, `userRole`, `baseCurrency`): `Promise`\<[`InvoicePostingResult`](../interfaces/InvoicePostingResult.md) \| [`InvoicePostingError`](../interfaces/InvoicePostingError.md)\>

Defined in: [packages/accounting/src/ar/invoice-posting.ts:69](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ar/invoice-posting.ts#L69)

Validates and prepares an AR invoice for GL posting

Business Rules:
1. Invoice must be balanced (AR = Revenue + Tax)
2. All accounts must exist and be active
3. Revenue accounts must be REVENUE type
4. AR account must be ASSET type
5. Tax accounts must be LIABILITY type (for output tax)
6. Currency validation with FX policy
7. Line amounts must equal header amounts

## Parameters

### input

[`InvoicePostingInput`](../interfaces/InvoicePostingInput.md)

### userId

`string`

### userRole

`string`

### baseCurrency

`string` = `"MYR"`

## Returns

`Promise`\<[`InvoicePostingResult`](../interfaces/InvoicePostingResult.md) \| [`InvoicePostingError`](../interfaces/InvoicePostingError.md)\>
