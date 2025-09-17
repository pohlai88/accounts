[**AI-BOS Accounts API Documentation**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../../README.md) / [@aibos/contracts](../../../README.md) / [db/period](../README.md) / PeriodQuerySchema

# Variable: PeriodQuerySchema

> `const` **PeriodQuerySchema**: `ZodObject`\<\{ `companyId`: `ZodString`; `limit`: `ZodDefault`\<`ZodNumber`\>; `offset`: `ZodDefault`\<`ZodNumber`\>; `status`: `ZodOptional`\<`ZodEnum`\<\[`"open"`, `"closed"`, `"locked"`\]\>\>; `tenantId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `companyId`: `string`; `limit`: `number`; `offset`: `number`; `status?`: `"open"` \| `"closed"` \| `"locked"`; `tenantId`: `string`; \}, \{ `companyId`: `string`; `limit?`: `number`; `offset?`: `number`; `status?`: `"open"` \| `"closed"` \| `"locked"`; `tenantId`: `string`; \}\>

Defined in: [packages/contracts/src/db/period.ts:40](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/db/period.ts#L40)

Period Query Schema
