[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / ListInvoicesRes

# Variable: ListInvoicesRes

> `const` **ListInvoicesRes**: `ZodObject`\<\{ `hasMore`: `ZodBoolean`; `invoices`: `ZodArray`\<`ZodObject`\<\{ `balanceAmount`: `ZodNumber`; `createdAt`: `ZodString`; `currency`: `ZodString`; `customerId`: `ZodString`; `customerName`: `ZodString`; `dueDate`: `ZodString`; `id`: `ZodString`; `invoiceDate`: `ZodString`; `invoiceNumber`: `ZodString`; `paidAmount`: `ZodNumber`; `status`: `ZodEnum`\<\[`"draft"`, `"sent"`, `"paid"`, `"overdue"`, `"cancelled"`\]\>; `totalAmount`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `balanceAmount`: `number`; `createdAt`: `string`; `currency`: `string`; `customerId`: `string`; `customerName`: `string`; `dueDate`: `string`; `id`: `string`; `invoiceDate`: `string`; `invoiceNumber`: `string`; `paidAmount`: `number`; `status`: `"cancelled"` \| `"overdue"` \| `"draft"` \| `"sent"` \| `"paid"`; `totalAmount`: `number`; \}, \{ `balanceAmount`: `number`; `createdAt`: `string`; `currency`: `string`; `customerId`: `string`; `customerName`: `string`; `dueDate`: `string`; `id`: `string`; `invoiceDate`: `string`; `invoiceNumber`: `string`; `paidAmount`: `number`; `status`: `"cancelled"` \| `"overdue"` \| `"draft"` \| `"sent"` \| `"paid"`; `totalAmount`: `number`; \}\>, `"many"`\>; `total`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `hasMore`: `boolean`; `invoices`: `object`[]; `total`: `number`; \}, \{ `hasMore`: `boolean`; `invoices`: `object`[]; `total`: `number`; \}\>

Defined in: [packages/contracts/src/invoice.ts:184](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/invoice.ts#L184)
