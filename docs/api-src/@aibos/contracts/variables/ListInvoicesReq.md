[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / ListInvoicesReq

# Variable: ListInvoicesReq

> `const` **ListInvoicesReq**: `ZodObject`\<\{ `companyId`: `ZodString`; `customerId`: `ZodOptional`\<`ZodString`\>; `fromDate`: `ZodOptional`\<`ZodString`\>; `limit`: `ZodDefault`\<`ZodNumber`\>; `offset`: `ZodDefault`\<`ZodNumber`\>; `status`: `ZodOptional`\<`ZodEnum`\<\[`"draft"`, `"sent"`, `"paid"`, `"overdue"`, `"cancelled"`\]\>\>; `tenantId`: `ZodString`; `toDate`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `companyId`: `string`; `customerId?`: `string`; `fromDate?`: `string`; `limit`: `number`; `offset`: `number`; `status?`: `"cancelled"` \| `"overdue"` \| `"draft"` \| `"sent"` \| `"paid"`; `tenantId`: `string`; `toDate?`: `string`; \}, \{ `companyId`: `string`; `customerId?`: `string`; `fromDate?`: `string`; `limit?`: `number`; `offset?`: `number`; `status?`: `"cancelled"` \| `"overdue"` \| `"draft"` \| `"sent"` \| `"paid"`; `tenantId`: `string`; `toDate?`: `string`; \}\>

Defined in: [packages/contracts/src/invoice.ts:173](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/invoice.ts#L173)
