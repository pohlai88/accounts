[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / ProfitLossLineSchema

# Variable: ProfitLossLineSchema

> `const` **ProfitLossLineSchema**: `ZodObject`\<\{ `accountCode`: `ZodString`; `accountId`: `ZodString`; `accountName`: `ZodString`; `accountType`: `ZodEnum`\<\[`"revenue"`, `"expense"`\]\>; `comparativeAmount`: `ZodOptional`\<`ZodNumber`\>; `currentAmount`: `ZodNumber`; `isHeader`: `ZodDefault`\<`ZodBoolean`\>; `isTotal`: `ZodDefault`\<`ZodBoolean`\>; `level`: `ZodNumber`; `variance`: `ZodOptional`\<`ZodNumber`\>; `variancePercent`: `ZodOptional`\<`ZodNumber`\>; \}, `"strip"`, `ZodTypeAny`, \{ `accountCode`: `string`; `accountId`: `string`; `accountName`: `string`; `accountType`: `"revenue"` \| `"expense"`; `comparativeAmount?`: `number`; `currentAmount`: `number`; `isHeader`: `boolean`; `isTotal`: `boolean`; `level`: `number`; `variance?`: `number`; `variancePercent?`: `number`; \}, \{ `accountCode`: `string`; `accountId`: `string`; `accountName`: `string`; `accountType`: `"revenue"` \| `"expense"`; `comparativeAmount?`: `number`; `currentAmount`: `number`; `isHeader?`: `boolean`; `isTotal?`: `boolean`; `level`: `number`; `variance?`: `number`; `variancePercent?`: `number`; \}\>

Defined in: [packages/contracts/src/reports.ts:124](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/reports.ts#L124)
