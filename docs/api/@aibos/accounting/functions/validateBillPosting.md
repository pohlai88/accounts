[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / validateBillPosting

# Function: validateBillPosting()

> **validateBillPosting**(`input`, `userId`, `userRole`, `baseCurrency`): `Promise`\<[`BillPostingResult`](../interfaces/BillPostingResult.md) \| [`BillPostingError`](../interfaces/BillPostingError.md)\>

Defined in: [packages/accounting/src/ap/bill-posting.ts:84](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/bill-posting.ts#L84)

Validates and posts an AP bill to the General Ledger

Journal Entry Structure:
Dr. Expense Accounts (by line)     XXX
Dr. Tax Input Accounts (if any)    XXX
    Cr. Accounts Payable               XXX

## Parameters

### input

[`BillPostingInput`](../interfaces/BillPostingInput.md)

### userId

`string`

### userRole

`string`

### baseCurrency

`string` = `"MYR"`

## Returns

`Promise`\<[`BillPostingResult`](../interfaces/BillPostingResult.md) \| [`BillPostingError`](../interfaces/BillPostingError.md)\>
