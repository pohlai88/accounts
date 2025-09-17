[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / BatchAttachmentOperationReq

# Variable: BatchAttachmentOperationReq

> `const` **BatchAttachmentOperationReq**: `ZodObject`\<\{ `attachmentIds`: `ZodArray`\<`ZodString`, `"many"`\>; `category`: `ZodOptional`\<`ZodEnum`\<\[`"invoice"`, `"receipt"`, `"contract"`, `"report"`, `"statement"`, `"tax_document"`, `"bank_document"`, `"legal_document"`, `"correspondence"`, `"other"`\]\>\>; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `operation`: `ZodEnum`\<\[`"delete"`, `"archive"`, `"restore"`, `"update_category"`, `"add_tags"`, `"remove_tags"`\]\>; `tags`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `tenantId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `attachmentIds`: `string`[]; `category?`: `"invoice"` \| `"receipt"` \| `"contract"` \| `"report"` \| `"statement"` \| `"tax_document"` \| `"bank_document"` \| `"legal_document"` \| `"correspondence"` \| `"other"`; `metadata?`: `Record`\<`string`, `unknown`\>; `operation`: `"delete"` \| `"archive"` \| `"restore"` \| `"update_category"` \| `"add_tags"` \| `"remove_tags"`; `tags?`: `string`[]; `tenantId`: `string`; \}, \{ `attachmentIds`: `string`[]; `category?`: `"invoice"` \| `"receipt"` \| `"contract"` \| `"report"` \| `"statement"` \| `"tax_document"` \| `"bank_document"` \| `"legal_document"` \| `"correspondence"` \| `"other"`; `metadata?`: `Record`\<`string`, `unknown`\>; `operation`: `"delete"` \| `"archive"` \| `"restore"` \| `"update_category"` \| `"add_tags"` \| `"remove_tags"`; `tags?`: `string`[]; `tenantId`: `string`; \}\>

Defined in: [packages/contracts/src/attachments.ts:218](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/attachments.ts#L218)
