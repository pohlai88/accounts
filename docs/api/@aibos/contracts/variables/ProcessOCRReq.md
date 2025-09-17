[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / ProcessOCRReq

# Variable: ProcessOCRReq

> `const` **ProcessOCRReq**: `ZodObject`\<\{ `attachmentId`: `ZodString`; `documentType`: `ZodOptional`\<`ZodEnum`\<\[`"invoice"`, `"receipt"`, `"bank_statement"`, `"contract"`, `"general"`\]\>\>; `extractMetadata`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; `extractTables`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; `extractText`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; `languages`: `ZodDefault`\<`ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>\>; `priority`: `ZodDefault`\<`ZodOptional`\<`ZodEnum`\<\[`"low"`, `"normal"`, `"high"`\]\>\>\>; `tenantId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `attachmentId`: `string`; `documentType?`: `"invoice"` \| `"receipt"` \| `"contract"` \| `"bank_statement"` \| `"general"`; `extractMetadata`: `boolean`; `extractTables`: `boolean`; `extractText`: `boolean`; `languages`: `string`[]; `priority`: `"low"` \| `"normal"` \| `"high"`; `tenantId`: `string`; \}, \{ `attachmentId`: `string`; `documentType?`: `"invoice"` \| `"receipt"` \| `"contract"` \| `"bank_statement"` \| `"general"`; `extractMetadata?`: `boolean`; `extractTables?`: `boolean`; `extractText?`: `boolean`; `languages?`: `string`[]; `priority?`: `"low"` \| `"normal"` \| `"high"`; `tenantId`: `string`; \}\>

Defined in: [packages/contracts/src/attachments.ts:234](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/attachments.ts#L234)
