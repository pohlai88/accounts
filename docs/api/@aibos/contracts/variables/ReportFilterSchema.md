[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / ReportFilterSchema

# Variable: ReportFilterSchema

> `const` **ReportFilterSchema**: `ZodObject`\<\{ `accountIds`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `accountNumberRange`: `ZodOptional`\<`ZodObject`\<\{ `from`: `ZodString`; `to`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `from`: `string`; `to`: `string`; \}, \{ `from`: `string`; `to`: `string`; \}\>\>; `accountTypes`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `includeInactive`: `ZodDefault`\<`ZodBoolean`\>; `includeZeroBalances`: `ZodDefault`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `accountIds?`: `string`[]; `accountNumberRange?`: \{ `from`: `string`; `to`: `string`; \}; `accountTypes?`: `string`[]; `includeInactive`: `boolean`; `includeZeroBalances`: `boolean`; \}, \{ `accountIds?`: `string`[]; `accountNumberRange?`: \{ `from`: `string`; `to`: `string`; \}; `accountTypes?`: `string`[]; `includeInactive?`: `boolean`; `includeZeroBalances?`: `boolean`; \}\>

Defined in: [packages/contracts/src/reports.ts:6](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/reports.ts#L6)
