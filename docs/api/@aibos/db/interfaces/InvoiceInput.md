[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / InvoiceInput

# Interface: InvoiceInput

Defined in: [packages/db/src/repos.ts:449](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L449)

## Properties

### currency

> **currency**: `string`

Defined in: [packages/db/src/repos.ts:454](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L454)

***

### customerId

> **customerId**: `string`

Defined in: [packages/db/src/repos.ts:450](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L450)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/db/src/repos.ts:456](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L456)

***

### dueDate

> **dueDate**: `Date`

Defined in: [packages/db/src/repos.ts:453](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L453)

***

### exchangeRate?

> `optional` **exchangeRate**: `number`

Defined in: [packages/db/src/repos.ts:455](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L455)

***

### invoiceDate

> **invoiceDate**: `Date`

Defined in: [packages/db/src/repos.ts:452](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L452)

***

### invoiceNumber

> **invoiceNumber**: `string`

Defined in: [packages/db/src/repos.ts:451](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L451)

***

### lines

> **lines**: `object`[]

Defined in: [packages/db/src/repos.ts:458](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L458)

#### description

> **description**: `string`

#### lineAmount

> **lineAmount**: `number`

#### lineNumber

> **lineNumber**: `number`

#### quantity

> **quantity**: `number`

#### revenueAccountId

> **revenueAccountId**: `string`

#### taxAmount?

> `optional` **taxAmount**: `number`

#### taxCode?

> `optional` **taxCode**: `string`

#### taxRate?

> `optional` **taxRate**: `number`

#### unitPrice

> **unitPrice**: `number`

***

### notes?

> `optional` **notes**: `string`

Defined in: [packages/db/src/repos.ts:457](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L457)
