[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/contracts](../../../README.md) / [db/period](../README.md) / PeriodResponseSchema

# Variable: PeriodResponseSchema

> `const` **PeriodResponseSchema**: `ZodObject`\<\{ `hasMore`: `ZodBoolean`; `periods`: `ZodArray`\<`ZodEffects`\<`ZodObject`\<\{ `code`: `ZodString`; `company_id`: `ZodString`; `created_at`: `ZodDate`; `end_date`: `ZodDate`; `id`: `ZodString`; `start_date`: `ZodDate`; `status`: `ZodEnum`\<\[`"open"`, `"closed"`, `"locked"`\]\>; `tenant_id`: `ZodString`; `updated_at`: `ZodOptional`\<`ZodDate`\>; \}, `"strip"`, `ZodTypeAny`, \{ `code`: `string`; `company_id`: `string`; `created_at`: `Date`; `end_date`: `Date`; `id`: `string`; `start_date`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenant_id`: `string`; `updated_at?`: `Date`; \}, \{ `code`: `string`; `company_id`: `string`; `created_at`: `Date`; `end_date`: `Date`; `id`: `string`; `start_date`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenant_id`: `string`; `updated_at?`: `Date`; \}\>, \{ `code`: `string`; `companyId`: `string`; `createdAt`: `Date`; `endDate`: `Date`; `id`: `string`; `startDate`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenantId`: `string`; `updatedAt`: `null` \| `Date`; \}, \{ `code`: `string`; `company_id`: `string`; `created_at`: `Date`; `end_date`: `Date`; `id`: `string`; `start_date`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenant_id`: `string`; `updated_at?`: `Date`; \}\>, `"many"`\>; `totalCount`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `hasMore`: `boolean`; `periods`: `object`[]; `totalCount`: `number`; \}, \{ `hasMore`: `boolean`; `periods`: `object`[]; `totalCount`: `number`; \}\>

Defined in: [packages/contracts/src/db/period.ts:53](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/db/period.ts#L53)

Period Response Schema
