[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / PresenceResponseSchema

# Variable: PresenceResponseSchema

> `const` **PresenceResponseSchema**: `ZodObject`\<\{ `presence`: `ZodArray`\<`ZodObject`\<\{ `device`: `ZodOptional`\<`ZodString`\>; `lastSeen`: `ZodNumber`; `location`: `ZodOptional`\<`ZodString`\>; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `status`: `ZodEnum`\<\[`"online"`, `"away"`, `"busy"`, `"offline"`\]\>; `tenantId`: `ZodString`; `userId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `device?`: `string`; `lastSeen`: `number`; `location?`: `string`; `metadata?`: `Record`\<`string`, `unknown`\>; `status`: `"online"` \| `"away"` \| `"busy"` \| `"offline"`; `tenantId`: `string`; `userId`: `string`; \}, \{ `device?`: `string`; `lastSeen`: `number`; `location?`: `string`; `metadata?`: `Record`\<`string`, `unknown`\>; `status`: `"online"` \| `"away"` \| `"busy"` \| `"offline"`; `tenantId`: `string`; `userId`: `string`; \}\>, `"many"`\>; `stats`: `ZodObject`\<\{ `away`: `ZodNumber`; `busy`: `ZodNumber`; `offline`: `ZodNumber`; `online`: `ZodNumber`; `total`: `ZodNumber`; \}, `"strip"`, `ZodTypeAny`, \{ `away`: `number`; `busy`: `number`; `offline`: `number`; `online`: `number`; `total`: `number`; \}, \{ `away`: `number`; `busy`: `number`; `offline`: `number`; `online`: `number`; `total`: `number`; \}\>; \}, `"strip"`, `ZodTypeAny`, \{ `presence`: `object`[]; `stats`: \{ `away`: `number`; `busy`: `number`; `offline`: `number`; `online`: `number`; `total`: `number`; \}; \}, \{ `presence`: `object`[]; `stats`: \{ `away`: `number`; `busy`: `number`; `offline`: `number`; `online`: `number`; `total`: `number`; \}; \}\>

Defined in: [packages/contracts/src/presence.ts:32](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/presence.ts#L32)

Presence Response Schema
