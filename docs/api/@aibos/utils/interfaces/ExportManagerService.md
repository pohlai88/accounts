[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / ExportManagerService

# Interface: ExportManagerService

Defined in: [packages/utils/src/export/export-manager.ts:27](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-manager.ts#L27)

## Methods

### cleanupExpiredExports()

> **cleanupExpiredExports**(): `Promise`\<`number`\>

Defined in: [packages/utils/src/export/export-manager.ts:36](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-manager.ts#L36)

#### Returns

`Promise`\<`number`\>

***

### createExport()

> **createExport**(`request`, `userId`): `Promise`\<[`ExportHistory`](ExportHistory.md)\>

Defined in: [packages/utils/src/export/export-manager.ts:28](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-manager.ts#L28)

#### Parameters

##### request

[`ReportExportRequest`](ReportExportRequest.md)

##### userId

`string`

#### Returns

`Promise`\<[`ExportHistory`](ExportHistory.md)\>

***

### deleteExport()

> **deleteExport**(`id`): `Promise`\<`void`\>

Defined in: [packages/utils/src/export/export-manager.ts:35](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-manager.ts#L35)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

***

### downloadExport()

> **downloadExport**(`id`, `userId`): `Promise`\<\{ `error?`: `string`; `success`: `boolean`; `url?`: `string`; \}\>

Defined in: [packages/utils/src/export/export-manager.ts:31](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-manager.ts#L31)

#### Parameters

##### id

`string`

##### userId

`string`

#### Returns

`Promise`\<\{ `error?`: `string`; `success`: `boolean`; `url?`: `string`; \}\>

***

### getExport()

> **getExport**(`id`): `Promise`\<`null` \| [`ExportHistory`](ExportHistory.md)\>

Defined in: [packages/utils/src/export/export-manager.ts:29](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-manager.ts#L29)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`ExportHistory`](ExportHistory.md)\>

***

### getExportStats()

> **getExportStats**(`tenantId`, `companyId?`): `Promise`\<[`ExportStats`](ExportStats.md)\>

Defined in: [packages/utils/src/export/export-manager.ts:37](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-manager.ts#L37)

#### Parameters

##### tenantId

`string`

##### companyId?

`string`

#### Returns

`Promise`\<[`ExportStats`](ExportStats.md)\>

***

### listExports()

> **listExports**(`tenantId`, `companyId?`, `limit?`): `Promise`\<[`ExportHistory`](ExportHistory.md)[]\>

Defined in: [packages/utils/src/export/export-manager.ts:30](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-manager.ts#L30)

#### Parameters

##### tenantId

`string`

##### companyId?

`string`

##### limit?

`number`

#### Returns

`Promise`\<[`ExportHistory`](ExportHistory.md)[]\>
