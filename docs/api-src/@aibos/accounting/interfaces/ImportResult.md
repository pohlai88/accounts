[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / ImportResult

# Interface: ImportResult

Defined in: [packages/accounting/src/bank/csv-import.ts:16](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/bank/csv-import.ts#L16)

## Properties

### errors

> **errors**: `string`[]

Defined in: [packages/accounting/src/bank/csv-import.ts:19](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/bank/csv-import.ts#L19)

***

### success

> **success**: `boolean`

Defined in: [packages/accounting/src/bank/csv-import.ts:17](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/bank/csv-import.ts#L17)

***

### summary

> **summary**: `object`

Defined in: [packages/accounting/src/bank/csv-import.ts:21](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/bank/csv-import.ts#L21)

#### duplicates

> **duplicates**: `number`

#### errors

> **errors**: `number`

#### totalRows

> **totalRows**: `number`

#### validTransactions

> **validTransactions**: `number`

***

### transactions

> **transactions**: [`BankTransactionImport`](BankTransactionImport.md)[]

Defined in: [packages/accounting/src/bank/csv-import.ts:18](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/bank/csv-import.ts#L18)

***

### warnings

> **warnings**: `string`[]

Defined in: [packages/accounting/src/bank/csv-import.ts:20](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/bank/csv-import.ts#L20)
