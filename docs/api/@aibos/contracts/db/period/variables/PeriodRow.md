[**AI-BOS Accounts API Documentation**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../../README.md) / [@aibos/contracts](../../../README.md) / [db/period](../README.md) / PeriodRow

# Variable: PeriodRow

> `const` **PeriodRow**: `ZodObject`\<\{ `code`: `ZodString`; `company_id`: `ZodString`; `created_at`: `ZodDate`; `end_date`: `ZodDate`; `id`: `ZodString`; `start_date`: `ZodDate`; `status`: `ZodEnum`\<\[`"open"`, `"closed"`, `"locked"`\]\>; `tenant_id`: `ZodString`; `updated_at`: `ZodOptional`\<`ZodDate`\>; \}, `"strip"`, `ZodTypeAny`, \{ `code`: `string`; `company_id`: `string`; `created_at`: `Date`; `end_date`: `Date`; `id`: `string`; `start_date`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenant_id`: `string`; `updated_at?`: `Date`; \}, \{ `code`: `string`; `company_id`: `string`; `created_at`: `Date`; `end_date`: `Date`; `id`: `string`; `start_date`: `Date`; `status`: `"open"` \| `"closed"` \| `"locked"`; `tenant_id`: `string`; `updated_at?`: `Date`; \}\>

Defined in: [packages/contracts/src/db/period.ts:6](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/db/period.ts#L6)

Period Database Row Schema - Raw database structure (snake_case)
