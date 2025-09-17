[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/realtime](../README.md) / [](../README.md) / toWsMessage

# Function: toWsMessage()

> **toWsMessage**(`input`): `Result`\<\{ `id?`: `string`; `payload?`: `unknown`; `tenantId`: `string`; `ts`: `Date`; `type`: `"presence.update"` \| `"notification"` \| `"metrics.update"` \| `"system.alert"` \| `"data.sync"`; `userId?`: `string`; \}, `ZodError`\<`any`\>\>

Defined in: [packages/realtime/src/wsMessage.ts:30](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/wsMessage.ts#L30)

Parse and validate WebSocket message from unknown input

## Parameters

### input

`unknown`

Unknown input to parse

## Returns

`Result`\<\{ `id?`: `string`; `payload?`: `unknown`; `tenantId`: `string`; `ts`: `Date`; `type`: `"presence.update"` \| `"notification"` \| `"metrics.update"` \| `"system.alert"` \| `"data.sync"`; `userId?`: `string`; \}, `ZodError`\<`any`\>\>

Result containing parsed WebSocketMessage or ZodError
