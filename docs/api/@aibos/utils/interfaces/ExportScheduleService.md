[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / ExportScheduleService

# Interface: ExportScheduleService

Defined in: [packages/utils/src/export/export-scheduler.ts:47](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L47)

## Methods

### createSchedule()

> **createSchedule**(`schedule`): `Promise`\<[`ScheduledExport`](ScheduledExport.md)\>

Defined in: [packages/utils/src/export/export-scheduler.ts:48](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L48)

#### Parameters

##### schedule

`Omit`\<[`ScheduledExport`](ScheduledExport.md), `"id"` \| `"createdAt"` \| `"updatedAt"` \| `"nextRunAt"`\>

#### Returns

`Promise`\<[`ScheduledExport`](ScheduledExport.md)\>

***

### deleteSchedule()

> **deleteSchedule**(`id`): `Promise`\<`void`\>

Defined in: [packages/utils/src/export/export-scheduler.ts:52](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L52)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

***

### executeSchedule()

> **executeSchedule**(`id`): `Promise`\<[`ExportResult`](ExportResult.md)\>

Defined in: [packages/utils/src/export/export-scheduler.ts:55](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L55)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<[`ExportResult`](ExportResult.md)\>

***

### getDueSchedules()

> **getDueSchedules**(): `Promise`\<[`ScheduledExport`](ScheduledExport.md)[]\>

Defined in: [packages/utils/src/export/export-scheduler.ts:57](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L57)

#### Returns

`Promise`\<[`ScheduledExport`](ScheduledExport.md)[]\>

***

### getNextRunTime()

> **getNextRunTime**(`schedule`, `lastRun?`): `Date`

Defined in: [packages/utils/src/export/export-scheduler.ts:56](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L56)

#### Parameters

##### schedule

[`ScheduleConfig`](ScheduleConfig.md)

##### lastRun?

`Date`

#### Returns

`Date`

***

### getSchedule()

> **getSchedule**(`id`): `Promise`\<`null` \| [`ScheduledExport`](ScheduledExport.md)\>

Defined in: [packages/utils/src/export/export-scheduler.ts:53](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L53)

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`null` \| [`ScheduledExport`](ScheduledExport.md)\>

***

### listSchedules()

> **listSchedules**(`tenantId`, `companyId?`): `Promise`\<[`ScheduledExport`](ScheduledExport.md)[]\>

Defined in: [packages/utils/src/export/export-scheduler.ts:54](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L54)

#### Parameters

##### tenantId

`string`

##### companyId?

`string`

#### Returns

`Promise`\<[`ScheduledExport`](ScheduledExport.md)[]\>

***

### updateSchedule()

> **updateSchedule**(`id`, `updates`): `Promise`\<[`ScheduledExport`](ScheduledExport.md)\>

Defined in: [packages/utils/src/export/export-scheduler.ts:51](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/export-scheduler.ts#L51)

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`ScheduledExport`](ScheduledExport.md)\>

#### Returns

`Promise`\<[`ScheduledExport`](ScheduledExport.md)\>
