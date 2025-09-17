[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / NotificationSchema

# Variable: NotificationSchema

> `const` **NotificationSchema**: `ZodObject`\<\{ `category`: `ZodString`; `createdAt`: `ZodNumber`; `data`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `id`: `ZodString`; `message`: `ZodString`; `read`: `ZodDefault`\<`ZodBoolean`\>; `tenantId`: `ZodString`; `title`: `ZodString`; `type`: `ZodEnum`\<\[`"info"`, `"warning"`, `"error"`, `"success"`\]\>; `updatedAt`: `ZodOptional`\<`ZodNumber`\>; `userId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `category`: `string`; `createdAt`: `number`; `data?`: `Record`\<`string`, `unknown`\>; `id`: `string`; `message`: `string`; `read`: `boolean`; `tenantId`: `string`; `title`: `string`; `type`: `"success"` \| `"error"` \| `"info"` \| `"warning"`; `updatedAt?`: `number`; `userId`: `string`; \}, \{ `category`: `string`; `createdAt`: `number`; `data?`: `Record`\<`string`, `unknown`\>; `id`: `string`; `message`: `string`; `read?`: `boolean`; `tenantId`: `string`; `title`: `string`; `type`: `"success"` \| `"error"` \| `"info"` \| `"warning"`; `updatedAt?`: `number`; `userId`: `string`; \}\>

Defined in: [packages/contracts/src/notification.ts:6](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/notification.ts#L6)

Notification Schema - Type-safe notification data
