[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / PostInvoiceRes

# Variable: PostInvoiceRes

> `const` **PostInvoiceRes**: `ZodObject`\<\{ `invoiceId`: `ZodString`; `journalId`: `ZodString`; `journalNumber`: `ZodString`; `lines`: `ZodArray`\<`ZodObject`\<\{ `accountId`: `ZodString`; `accountName`: `ZodString`; `credit`: `ZodNumber`; `debit`: `ZodNumber`; `description`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `accountId`: `string`; `accountName`: `string`; `credit`: `number`; `debit`: `number`; `description`: `string`; \}, \{ `accountId`: `string`; `accountName`: `string`; `credit`: `number`; `debit`: `number`; `description`: `string`; \}\>, `"many"`\>; `postedAt`: `ZodString`; `status`: `ZodEnum`\<\[`"posted"`\]\>; `totalCredit`: `ZodNumber`; `totalDebit`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `invoiceId`: `string`; `journalId`: `string`; `journalNumber`: `string`; `lines`: `object`[]; `postedAt`: `string`; `status`: `"posted"`; `totalCredit`: `number`; `totalDebit`: `number`; \}, \{ `invoiceId`: `string`; `journalId`: `string`; `journalNumber`: `string`; `lines`: `object`[]; `postedAt`: `string`; `status`: `"posted"`; `totalCredit`: `number`; `totalDebit`: `number`; \}\>

Defined in: [packages/contracts/src/invoice.ts:109](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/invoice.ts#L109)
