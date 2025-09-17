[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / ProfitLossReq

# Variable: ProfitLossReq

> `const` **ProfitLossReq**: `ZodObject`\<\{ `companyId`: `ZodString`; `comparativeFromDate`: `ZodOptional`\<`ZodString`\>; `comparativeToDate`: `ZodOptional`\<`ZodString`\>; `currency`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `fromDate`: `ZodString`; `groupByMonth`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; `includeZeroBalances`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; `tenantId`: `ZodString`; `toDate`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `companyId`: `string`; `comparativeFromDate?`: `string`; `comparativeToDate?`: `string`; `currency`: `string`; `fromDate`: `string`; `groupByMonth`: `boolean`; `includeZeroBalances`: `boolean`; `tenantId`: `string`; `toDate`: `string`; \}, \{ `companyId`: `string`; `comparativeFromDate?`: `string`; `comparativeToDate?`: `string`; `currency?`: `string`; `fromDate`: `string`; `groupByMonth?`: `boolean`; `includeZeroBalances?`: `boolean`; `tenantId`: `string`; `toDate`: `string`; \}\>

Defined in: [packages/contracts/src/reports.ts:112](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/reports.ts#L112)
