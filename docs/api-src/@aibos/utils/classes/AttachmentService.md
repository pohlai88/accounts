[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / AttachmentService

# Class: AttachmentService

Defined in: [packages/utils/src/storage/attachment-service.ts:59](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L59)

## Constructors

### Constructor

> **new AttachmentService**(): `AttachmentService`

#### Returns

`AttachmentService`

## Methods

### batchDelete()

> **batchDelete**(`attachmentIds`, `tenantId`, `userId`): `Promise`\<\{ `error?`: `string`; `results`: `object`[]; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/storage/attachment-service.ts:618](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L618)

Batch delete multiple attachments

#### Parameters

##### attachmentIds

`string`[]

##### tenantId

`string`

##### userId

`string`

#### Returns

`Promise`\<\{ `error?`: `string`; `results`: `object`[]; `success`: `boolean`; \}\>

***

### deleteAttachment()

> **deleteAttachment**(`attachmentId`, `tenantId`, `userId`): `Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/storage/attachment-service.ts:250](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L250)

Delete attachment

#### Parameters

##### attachmentId

`string`

##### tenantId

`string`

##### userId

`string`

#### Returns

`Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>

***

### downloadFile()

> **downloadFile**(`attachmentId`, `tenantId`, `userId`): `Promise`\<\{ `data?`: `ArrayBuffer`; `error?`: `string`; `filename?`: `string`; `mimeType?`: `string`; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/storage/attachment-service.ts:203](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L203)

Download attachment file

#### Parameters

##### attachmentId

`string`

##### tenantId

`string`

##### userId

`string`

#### Returns

`Promise`\<\{ `data?`: `ArrayBuffer`; `error?`: `string`; `filename?`: `string`; `mimeType?`: `string`; `success`: `boolean`; \}\>

***

### getAttachment()

> **getAttachment**(`attachmentId`, `tenantId`): `Promise`\<`null` \| [`AttachmentInfo`](../interfaces/AttachmentInfo.md)\>

Defined in: [packages/utils/src/storage/attachment-service.ts:167](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L167)

Get attachment information

#### Parameters

##### attachmentId

`string`

##### tenantId

`string`

#### Returns

`Promise`\<`null` \| [`AttachmentInfo`](../interfaces/AttachmentInfo.md)\>

***

### getAttachmentStats()

> **getAttachmentStats**(`tenantId`): `Promise`\<\{ `data?`: \{ `categories`: `Record`\<`string`, `number`\>; `recentUploads`: `number`; `totalAttachments`: `number`; `totalSize`: `number`; \}; `error?`: `string`; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/storage/attachment-service.ts:671](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L671)

Get attachment statistics for a tenant

#### Parameters

##### tenantId

`string`

#### Returns

`Promise`\<\{ `data?`: \{ `categories`: `Record`\<`string`, `number`\>; `recentUploads`: `number`; `totalAttachments`: `number`; `totalSize`: `number`; \}; `error?`: `string`; `success`: `boolean`; \}\>

***

### getEntityAttachments()

> **getEntityAttachments**(`entityType`, `entityId`, `tenantId`): `Promise`\<[`AttachmentInfo`](../interfaces/AttachmentInfo.md)[]\>

Defined in: [packages/utils/src/storage/attachment-service.ts:334](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L334)

Get attachments for an entity

#### Parameters

##### entityType

`string`

##### entityId

`string`

##### tenantId

`string`

#### Returns

`Promise`\<[`AttachmentInfo`](../interfaces/AttachmentInfo.md)[]\>

***

### linkToEntity()

> **linkToEntity**(`attachmentId`, `entityType`, `entityId`, `relationshipType`, `userId`, `description?`, `isRequired?`): `Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/storage/attachment-service.ts:298](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L298)

Link attachment to an entity

#### Parameters

##### attachmentId

`string`

##### entityType

`string`

##### entityId

`string`

##### relationshipType

`string` = `"attachment"`

##### userId

`string`

##### description?

`string`

##### isRequired?

`boolean` = `false`

#### Returns

`Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>

***

### searchAttachments()

> **searchAttachments**(`tenantId`, `filters`): `Promise`\<\{ `data?`: [`AttachmentInfo`](../interfaces/AttachmentInfo.md)[]; `error?`: `string`; `success`: `boolean`; `total?`: `number`; \}\>

Defined in: [packages/utils/src/storage/attachment-service.ts:481](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L481)

Search attachments with filters

#### Parameters

##### tenantId

`string`

##### filters

###### category?

`string`

###### dateFrom?

`string`

###### dateTo?

`string`

###### limit?

`number`

###### mimeType?

`string`

###### offset?

`number`

###### search?

`string`

###### tags?

`string`[]

###### uploadedBy?

`string`

#### Returns

`Promise`\<\{ `data?`: [`AttachmentInfo`](../interfaces/AttachmentInfo.md)[]; `error?`: `string`; `success`: `boolean`; `total?`: `number`; \}\>

***

### updateMetadata()

> **updateMetadata**(`attachmentId`, `tenantId`, `userId`, `metadata`): `Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>

Defined in: [packages/utils/src/storage/attachment-service.ts:576](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L576)

Update attachment metadata

#### Parameters

##### attachmentId

`string`

##### tenantId

`string`

##### userId

`string`

##### metadata

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>

***

### uploadFile()

> **uploadFile**(`file`, `originalFilename`, `mimeType`, `options`): `Promise`\<[`AttachmentUploadResult`](../interfaces/AttachmentUploadResult.md)\>

Defined in: [packages/utils/src/storage/attachment-service.ts:66](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/storage/attachment-service.ts#L66)

Upload a file and create attachment record

#### Parameters

##### file

`ArrayBuffer` | `Buffer`\<`ArrayBufferLike`\>

##### originalFilename

`string`

##### mimeType

`string`

##### options

[`AttachmentUploadOptions`](../interfaces/AttachmentUploadOptions.md)

#### Returns

`Promise`\<[`AttachmentUploadResult`](../interfaces/AttachmentUploadResult.md)\>
