[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / TrialBalanceAccountSchema

# Variable: TrialBalanceAccountSchema

> `const` **TrialBalanceAccountSchema**: `ZodObject`\<\{ `balance`: `ZodNumber`; `code`: `ZodString`; `creditBalance`: `ZodNumber`; `debitBalance`: `ZodNumber`; `id`: `ZodString`; `isActive`: `ZodBoolean`; `level`: `ZodOptional`\<`ZodNumber`\>; `name`: `ZodString`; `parentId`: `ZodOptional`\<`ZodString`\>; `type`: `ZodEnum`\<\[`"asset"`, `"liability"`, `"equity"`, `"revenue"`, `"expense"`\]\>; \}, `"strip"`, `ZodTypeAny`, \{ `balance`: `number`; `code`: `string`; `creditBalance`: `number`; `debitBalance`: `number`; `id`: `string`; `isActive`: `boolean`; `level?`: `number`; `name`: `string`; `parentId?`: `string`; `type`: `"asset"` \| `"liability"` \| `"equity"` \| `"revenue"` \| `"expense"`; \}, \{ `balance`: `number`; `code`: `string`; `creditBalance`: `number`; `debitBalance`: `number`; `id`: `string`; `isActive`: `boolean`; `level?`: `number`; `name`: `string`; `parentId?`: `string`; `type`: `"asset"` \| `"liability"` \| `"equity"` \| `"revenue"` \| `"expense"`; \}\>

Defined in: [packages/contracts/src/reports.ts:30](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/reports.ts#L30)
