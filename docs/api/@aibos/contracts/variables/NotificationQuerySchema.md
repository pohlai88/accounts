[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / NotificationQuerySchema

# Variable: NotificationQuerySchema

> `const` **NotificationQuerySchema**: `ZodObject`\<\{ `category`: `ZodOptional`\<`ZodString`\>; `limit`: `ZodDefault`\<`ZodNumber`\>; `offset`: `ZodDefault`\<`ZodNumber`\>; `type`: `ZodOptional`\<`ZodEnum`\<\[`"info"`, `"warning"`, `"error"`, `"success"`\]\>\>; `unreadOnly`: `ZodDefault`\<`ZodBoolean`\>; \}, `"strip"`, `ZodTypeAny`, \{ `category?`: `string`; `limit`: `number`; `offset`: `number`; `type?`: `"success"` \| `"error"` \| `"info"` \| `"warning"`; `unreadOnly`: `boolean`; \}, \{ `category?`: `string`; `limit?`: `number`; `offset?`: `number`; `type?`: `"success"` \| `"error"` \| `"info"` \| `"warning"`; `unreadOnly?`: `boolean`; \}\>

Defined in: [packages/contracts/src/notification.ts:25](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/notification.ts#L25)

Notification Query Schema
