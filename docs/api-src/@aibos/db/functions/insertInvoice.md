[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / insertInvoice

# Function: insertInvoice()

> **insertInvoice**(`scope`, `input`): `Promise`\<\{ `createdAt`: `null` \| `Date`; `currency`: `string`; `dueDate`: `Date`; `id`: `string`; `invoiceDate`: `Date`; `invoiceNumber`: `string`; `lines`: (`undefined` \| \{ `description`: `string`; `id`: `string`; `lineAmount`: `string`; `lineNumber`: `string`; `quantity`: `string`; `revenueAccountId`: `string`; `taxAmount`: `string`; `unitPrice`: `string`; \})[]; `status`: `string`; `subtotal`: `string`; `taxAmount`: `string`; `totalAmount`: `string`; \}\>

Defined in: [packages/db/src/repos.ts:625](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L625)

Create a new invoice

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

### input

[`InvoiceInput`](../interfaces/InvoiceInput.md)

## Returns

`Promise`\<\{ `createdAt`: `null` \| `Date`; `currency`: `string`; `dueDate`: `Date`; `id`: `string`; `invoiceDate`: `Date`; `invoiceNumber`: `string`; `lines`: (`undefined` \| \{ `description`: `string`; `id`: `string`; `lineAmount`: `string`; `lineNumber`: `string`; `quantity`: `string`; `revenueAccountId`: `string`; `taxAmount`: `string`; `unitPrice`: `string`; \})[]; `status`: `string`; `subtotal`: `string`; `taxAmount`: `string`; `totalAmount`: `string`; \}\>
