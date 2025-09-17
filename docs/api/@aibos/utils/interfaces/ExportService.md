[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / ExportService

# Interface: ExportService

Defined in: [packages/utils/src/export/export-service.ts:13](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-service.ts#L13)

## Methods

### exportData()

> **exportData**(`data`, `options`): `Promise`\<[`ExportResult`](ExportResult.md)\>

Defined in: [packages/utils/src/export/export-service.ts:15](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-service.ts#L15)

#### Parameters

##### data

[`ExportableData`](ExportableData.md)

##### options

[`ExportOptions`](ExportOptions.md)

#### Returns

`Promise`\<[`ExportResult`](ExportResult.md)\>

***

### exportReport()

> **exportReport**(`request`): `Promise`\<[`ExportResult`](ExportResult.md)\>

Defined in: [packages/utils/src/export/export-service.ts:14](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-service.ts#L14)

#### Parameters

##### request

[`ReportExportRequest`](ReportExportRequest.md)

#### Returns

`Promise`\<[`ExportResult`](ExportResult.md)\>
