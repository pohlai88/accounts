[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/accounting](../../README.md) / [posting](../README.md) / JournalLine

# Variable: JournalLine

> `const` **JournalLine**: `ZodObject`\<\{ `accountId`: `ZodString`; `credit`: `ZodDefault`\<`ZodNumber`\>; `debit`: `ZodDefault`\<`ZodNumber`\>; `description`: `ZodOptional`\<`ZodString`\>; `reference`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `accountId`: `string`; `credit`: `number`; `debit`: `number`; `description?`: `string`; `reference?`: `string`; \}, \{ `accountId`: `string`; `credit?`: `number`; `debit?`: `number`; `description?`: `string`; `reference?`: `string`; \}\>

Defined in: [packages/accounting/src/posting.ts:6](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L6)
