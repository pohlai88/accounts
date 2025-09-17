[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/realtime](../README.md) / [](../README.md) / WebSocketMessageSchema

# Variable: WebSocketMessageSchema

> `const` **WebSocketMessageSchema**: `ZodObject`\<\{ `id`: `ZodOptional`\<`ZodString`\>; `payload`: `ZodUnknown`; `tenantId`: `ZodString`; `ts`: `ZodDate`; `type`: `ZodEnum`\<\[`"presence.update"`, `"metrics.update"`, `"notification"`, `"system.alert"`, `"data.sync"`\]\>; `userId`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `id?`: `string`; `payload?`: `unknown`; `tenantId`: `string`; `ts`: `Date`; `type`: `"presence.update"` \| `"notification"` \| `"metrics.update"` \| `"system.alert"` \| `"data.sync"`; `userId?`: `string`; \}, \{ `id?`: `string`; `payload?`: `unknown`; `tenantId`: `string`; `ts`: `Date`; `type`: `"presence.update"` \| `"notification"` \| `"metrics.update"` \| `"system.alert"` \| `"data.sync"`; `userId?`: `string`; \}\>

Defined in: [packages/realtime/src/wsMessage.ts:14](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/wsMessage.ts#L14)

WebSocket Message Schema - Type-safe message envelope
Centralizes all WebSocket message validation
