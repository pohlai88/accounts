[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / PostJournalReq

# Variable: PostJournalReq

> `const` **PostJournalReq**: `ZodObject`\<\{ `currency`: `ZodString`; `description`: `ZodOptional`\<`ZodString`\>; `idempotencyKey`: `ZodString`; `journalDate`: `ZodString`; `journalNumber`: `ZodString`; `lines`: `ZodArray`\<`ZodObject`\<\{ `accountId`: `ZodString`; `credit`: `ZodDefault`\<`ZodNumber`\>; `debit`: `ZodDefault`\<`ZodNumber`\>; `description`: `ZodOptional`\<`ZodString`\>; `reference`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `accountId`: `string`; `credit`: `number`; `debit`: `number`; `description?`: `string`; `reference?`: `string`; \}, \{ `accountId`: `string`; `credit?`: `number`; `debit?`: `number`; `description?`: `string`; `reference?`: `string`; \}\>, `"many"`\>; \}, `"strip"`, `ZodTypeAny`, \{ `currency`: `string`; `description?`: `string`; `idempotencyKey`: `string`; `journalDate`: `string`; `journalNumber`: `string`; `lines`: `object`[]; \}, \{ `currency`: `string`; `description?`: `string`; `idempotencyKey`: `string`; `journalDate`: `string`; `journalNumber`: `string`; `lines`: `object`[]; \}\>

Defined in: [packages/contracts/src/journal.ts:11](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/journal.ts#L11)
