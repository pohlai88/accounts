[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / CreateInvoiceReq

# Variable: CreateInvoiceReq

> `const` **CreateInvoiceReq**: `ZodObject`\<\{ `companyId`: `ZodString`; `currency`: `ZodString`; `customerId`: `ZodString`; `description`: `ZodOptional`\<`ZodString`\>; `dueDate`: `ZodString`; `exchangeRate`: `ZodDefault`\<`ZodNumber`\>; `invoiceDate`: `ZodString`; `invoiceNumber`: `ZodString`; `lines`: `ZodArray`\<`ZodObject`\<\{ `description`: `ZodString`; `lineNumber`: `ZodNumber`; `quantity`: `ZodDefault`\<`ZodNumber`\>; `revenueAccountId`: `ZodString`; `taxCode`: `ZodOptional`\<`ZodString`\>; `unitPrice`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `description`: `string`; `lineNumber`: `number`; `quantity`: `number`; `revenueAccountId`: `string`; `taxCode?`: `string`; `unitPrice`: `number`; \}, \{ `description`: `string`; `lineNumber`: `number`; `quantity?`: `number`; `revenueAccountId`: `string`; `taxCode?`: `string`; `unitPrice`: `number`; \}\>, `"many"`\>; `notes`: `ZodOptional`\<`ZodString`\>; `tenantId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `companyId`: `string`; `currency`: `string`; `customerId`: `string`; `description?`: `string`; `dueDate`: `string`; `exchangeRate`: `number`; `invoiceDate`: `string`; `invoiceNumber`: `string`; `lines`: `object`[]; `notes?`: `string`; `tenantId`: `string`; \}, \{ `companyId`: `string`; `currency`: `string`; `customerId`: `string`; `description?`: `string`; `dueDate`: `string`; `exchangeRate?`: `number`; `invoiceDate`: `string`; `invoiceNumber`: `string`; `lines`: `object`[]; `notes?`: `string`; `tenantId`: `string`; \}\>

Defined in: [packages/contracts/src/invoice.ts:59](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/invoice.ts#L59)
