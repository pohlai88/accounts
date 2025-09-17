[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / PresenceSchema

# Variable: PresenceSchema

> `const` **PresenceSchema**: `ZodObject`\<\{ `device`: `ZodOptional`\<`ZodString`\>; `lastSeen`: `ZodNumber`; `location`: `ZodOptional`\<`ZodString`\>; `metadata`: `ZodOptional`\<`ZodRecord`\<`ZodString`, `ZodUnknown`\>\>; `status`: `ZodEnum`\<\[`"online"`, `"away"`, `"busy"`, `"offline"`\]\>; `tenantId`: `ZodString`; `userId`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `device?`: `string`; `lastSeen`: `number`; `location?`: `string`; `metadata?`: `Record`\<`string`, `unknown`\>; `status`: `"online"` \| `"away"` \| `"busy"` \| `"offline"`; `tenantId`: `string`; `userId`: `string`; \}, \{ `device?`: `string`; `lastSeen`: `number`; `location?`: `string`; `metadata?`: `Record`\<`string`, `unknown`\>; `status`: `"online"` \| `"away"` \| `"busy"` \| `"offline"`; `tenantId`: `string`; `userId`: `string`; \}\>

Defined in: [packages/contracts/src/presence.ts:6](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/presence.ts#L6)

Presence Schema - Type-safe presence data
