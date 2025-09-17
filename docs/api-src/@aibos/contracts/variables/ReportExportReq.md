[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / ReportExportReq

# Variable: ReportExportReq

> `const` **ReportExportReq**: `ZodObject`\<\{ `companyId`: `ZodString`; `filename`: `ZodOptional`\<`ZodString`\>; `format`: `ZodEnum`\<\[`"csv"`, `"xlsx"`, `"pdf"`, `"jsonl"`\]\>; `includeMetadata`: `ZodDefault`\<`ZodBoolean`\>; `reportData`: `ZodRecord`\<`ZodString`, `ZodUnknown`\>; `reportType`: `ZodEnum`\<\[`"trial-balance"`, `"balance-sheet"`, `"profit-loss"`, `"cash-flow"`\]\>; `tenantId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `companyId`: `string`; `filename?`: `string`; `format`: `"csv"` \| `"xlsx"` \| `"pdf"` \| `"jsonl"`; `includeMetadata`: `boolean`; `reportData`: `Record`\<`string`, `unknown`\>; `reportType`: `"trial-balance"` \| `"balance-sheet"` \| `"profit-loss"` \| `"cash-flow"`; `tenantId`: `string`; \}, \{ `companyId`: `string`; `filename?`: `string`; `format`: `"csv"` \| `"xlsx"` \| `"pdf"` \| `"jsonl"`; `includeMetadata?`: `boolean`; `reportData`: `Record`\<`string`, `unknown`\>; `reportType`: `"trial-balance"` \| `"balance-sheet"` \| `"profit-loss"` \| `"cash-flow"`; `tenantId`: `string`; \}\>

Defined in: [packages/contracts/src/reports.ts:206](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/reports.ts#L206)
