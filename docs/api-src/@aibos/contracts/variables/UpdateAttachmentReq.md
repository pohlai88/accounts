[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / UpdateAttachmentReq

# Variable: UpdateAttachmentReq

> `const` **UpdateAttachmentReq**: `ZodObject`\<\{ `attachmentId`: `ZodString`; `category`: `ZodOptional`\<`ZodEnum`\<\[`"invoice"`, `"receipt"`, `"contract"`, `"report"`, `"statement"`, `"tax_document"`, `"bank_document"`, `"legal_document"`, `"correspondence"`, `"other"`\]\>\>; `isPublic`: `ZodOptional`\<`ZodBoolean`\>; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `status`: `ZodOptional`\<`ZodEnum`\<\[`"active"`, `"archived"`, `"deleted"`, `"processing"`, `"failed"`\]\>\>; `tags`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `tenantId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `attachmentId`: `string`; `category?`: `"invoice"` \| `"receipt"` \| `"contract"` \| `"report"` \| `"statement"` \| `"tax_document"` \| `"bank_document"` \| `"legal_document"` \| `"correspondence"` \| `"other"`; `isPublic?`: `boolean`; `metadata?`: `Record`\<`string`, `unknown`\>; `status?`: `"active"` \| `"archived"` \| `"deleted"` \| `"processing"` \| `"failed"`; `tags?`: `string`[]; `tenantId`: `string`; \}, \{ `attachmentId`: `string`; `category?`: `"invoice"` \| `"receipt"` \| `"contract"` \| `"report"` \| `"statement"` \| `"tax_document"` \| `"bank_document"` \| `"legal_document"` \| `"correspondence"` \| `"other"`; `isPublic?`: `boolean`; `metadata?`: `Record`\<`string`, `unknown`\>; `status?`: `"active"` \| `"archived"` \| `"deleted"` \| `"processing"` \| `"failed"`; `tags?`: `string`[]; `tenantId`: `string`; \}\>

Defined in: [packages/contracts/src/attachments.ts:205](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/attachments.ts#L205)
