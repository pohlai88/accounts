[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / ApprovalDecisionReq

# Variable: ApprovalDecisionReq

> `const` **ApprovalDecisionReq**: `ZodObject`\<\{ `attachmentId`: `ZodString`; `comments`: `ZodOptional`\<`ZodString`\>; `conditions`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `decision`: `ZodEnum`\<\[`"approve"`, `"reject"`, `"request_changes"`\]\>; `delegateTo`: `ZodOptional`\<`ZodString`\>; `delegationReason`: `ZodOptional`\<`ZodString`\>; `tenantId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `attachmentId`: `string`; `comments?`: `string`; `conditions?`: `string`[]; `decision`: `"approve"` \| `"reject"` \| `"request_changes"`; `delegateTo?`: `string`; `delegationReason?`: `string`; `tenantId`: `string`; \}, \{ `attachmentId`: `string`; `comments?`: `string`; `conditions?`: `string`[]; `decision`: `"approve"` \| `"reject"` \| `"request_changes"`; `delegateTo?`: `string`; `delegationReason?`: `string`; `tenantId`: `string`; \}\>

Defined in: [packages/contracts/src/attachments.ts:352](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/attachments.ts#L352)
