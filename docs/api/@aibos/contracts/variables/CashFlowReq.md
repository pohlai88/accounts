[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / CashFlowReq

# Variable: CashFlowReq

> `const` **CashFlowReq**: `ZodObject`\<\{ `companyId`: `ZodString`; `currency`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `fromDate`: `ZodString`; `includeNonCashItems`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; `method`: `ZodDefault`\<`ZodEnum`\<\[`"direct"`, `"indirect"`\]\>\>; `tenantId`: `ZodString`; `toDate`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `companyId`: `string`; `currency`: `string`; `fromDate`: `string`; `includeNonCashItems`: `boolean`; `method`: `"direct"` \| `"indirect"`; `tenantId`: `string`; `toDate`: `string`; \}, \{ `companyId`: `string`; `currency?`: `string`; `fromDate`: `string`; `includeNonCashItems?`: `boolean`; `method?`: `"direct"` \| `"indirect"`; `tenantId`: `string`; `toDate`: `string`; \}\>

Defined in: [packages/contracts/src/reports.ts:163](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/reports.ts#L163)
