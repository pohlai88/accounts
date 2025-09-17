[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / ReportExportRequest

# Interface: ReportExportRequest

Defined in: [packages/utils/src/export/types.ts:79](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L79)

## Properties

### filters

> **filters**: `object`

Defined in: [packages/utils/src/export/types.ts:82](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L82)

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

Defined in: [packages/utils/src/export/types.ts:81](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L81)

***

### options?

> `optional` **options**: `Partial`\<[`ExportOptions`](ExportOptions.md)\>

Defined in: [packages/utils/src/export/types.ts:91](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L91)

***

### reportType

> **reportType**: `"trial-balance"` \| `"balance-sheet"` \| `"profit-loss"` \| `"cash-flow"`

Defined in: [packages/utils/src/export/types.ts:80](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L80)
