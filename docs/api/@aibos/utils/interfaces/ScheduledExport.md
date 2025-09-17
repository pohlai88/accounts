[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / ScheduledExport

# Interface: ScheduledExport

Defined in: [packages/utils/src/export/export-scheduler.ts:7](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L7)

## Properties

### createdAt

> **createdAt**: `Date`

Defined in: [packages/utils/src/export/export-scheduler.ts:30](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L30)

***

### createdBy

> **createdBy**: `string`

Defined in: [packages/utils/src/export/export-scheduler.ts:34](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L34)

***

### filters

> **filters**: `object`

Defined in: [packages/utils/src/export/export-scheduler.ts:13](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L13)

#### accountIds?

> `optional` **accountIds**: `string`[]

#### asOfDate?

> `optional` **asOfDate**: `string`

#### companyId

> **companyId**: `string`

#### fromDate?

> `optional` **fromDate**: `string`

#### includeInactive?

> `optional` **includeInactive**: `boolean`

#### tenantId

> **tenantId**: `string`

#### toDate?

> `optional` **toDate**: `string`

***

### format

> **format**: [`ExportFormat`](../enumerations/ExportFormat.md)

Defined in: [packages/utils/src/export/export-scheduler.ts:11](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L11)

***

### id

> **id**: `string`

Defined in: [packages/utils/src/export/export-scheduler.ts:8](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L8)

***

### isActive

> **isActive**: `boolean`

Defined in: [packages/utils/src/export/export-scheduler.ts:29](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L29)

***

### lastRunAt?

> `optional` **lastRunAt**: `Date`

Defined in: [packages/utils/src/export/export-scheduler.ts:32](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L32)

***

### name

> **name**: `string`

Defined in: [packages/utils/src/export/export-scheduler.ts:9](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L9)

***

### nextRunAt?

> `optional` **nextRunAt**: `Date`

Defined in: [packages/utils/src/export/export-scheduler.ts:33](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L33)

***

### options?

> `optional` **options**: `object`

Defined in: [packages/utils/src/export/export-scheduler.ts:22](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L22)

#### dateFormat?

> `optional` **dateFormat**: `string`

#### filename?

> `optional` **filename**: `string`

#### includeHeaders?

> `optional` **includeHeaders**: `boolean`

#### timezone?

> `optional` **timezone**: `string`

***

### recipients

> **recipients**: `string`[]

Defined in: [packages/utils/src/export/export-scheduler.ts:28](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L28)

***

### reportType

> **reportType**: `"trial-balance"` \| `"balance-sheet"` \| `"profit-loss"` \| `"cash-flow"`

Defined in: [packages/utils/src/export/export-scheduler.ts:10](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L10)

***

### schedule

> **schedule**: [`ScheduleConfig`](ScheduleConfig.md)

Defined in: [packages/utils/src/export/export-scheduler.ts:12](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L12)

***

### updatedAt

> **updatedAt**: `Date`

Defined in: [packages/utils/src/export/export-scheduler.ts:31](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L31)
