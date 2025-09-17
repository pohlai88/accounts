[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / PostJournalRes

# Variable: PostJournalRes

> `const` **PostJournalRes**: `ZodObject`\<\{ `approverRoles`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `id`: `ZodString`; `journalNumber`: `ZodString`; `postedAt`: `ZodNullable`\<`ZodString`\>; `requiresApproval`: `ZodBoolean`; `status`: `ZodEnum`\<\[`"draft"`, `"posted"`, `"pending_approval"`\]\>; `totalCredit`: `ZodNumber`; `totalDebit`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `approverRoles?`: `string`[]; `id`: `string`; `journalNumber`: `string`; `postedAt`: `null` \| `string`; `requiresApproval`: `boolean`; `status`: `"draft"` \| `"posted"` \| `"pending_approval"`; `totalCredit`: `number`; `totalDebit`: `number`; \}, \{ `approverRoles?`: `string`[]; `id`: `string`; `journalNumber`: `string`; `postedAt`: `null` \| `string`; `requiresApproval`: `boolean`; `status`: `"draft"` \| `"posted"` \| `"pending_approval"`; `totalCredit`: `number`; `totalDebit`: `number`; \}\>

Defined in: [packages/contracts/src/journal.ts:20](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/journal.ts#L20)
