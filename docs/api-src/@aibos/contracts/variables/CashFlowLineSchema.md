[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / CashFlowLineSchema

# Variable: CashFlowLineSchema

> `const` **CashFlowLineSchema**: `ZodObject`\<\{ `accountIds`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `amount`: `ZodNumber`; `description`: `ZodString`; `isSubtotal`: `ZodDefault`\<`ZodBoolean`\>; `level`: `ZodDefault`\<`ZodNumber`\>; \}, `"strip"`, `ZodTypeAny`, \{ `accountIds?`: `string`[]; `amount`: `number`; `description`: `string`; `isSubtotal`: `boolean`; `level`: `number`; \}, \{ `accountIds?`: `string`[]; `amount`: `number`; `description`: `string`; `isSubtotal?`: `boolean`; `level?`: `number`; \}\>

Defined in: [packages/contracts/src/reports.ts:173](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/reports.ts#L173)
