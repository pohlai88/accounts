[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / PresenceQuerySchema

# Variable: PresenceQuerySchema

> `const` **PresenceQuerySchema**: `ZodObject`\<\{ `includeOffline`: `ZodDefault`\<`ZodBoolean`\>; `limit`: `ZodDefault`\<`ZodNumber`\>; `status`: `ZodOptional`\<`ZodEnum`\<\[`"online"`, `"away"`, `"busy"`, `"offline"`\]\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `includeOffline`: `boolean`; `limit`: `number`; `status?`: `"online"` \| `"away"` \| `"busy"` \| `"offline"`; \}, \{ `includeOffline?`: `boolean`; `limit?`: `number`; `status?`: `"online"` \| `"away"` \| `"busy"` \| `"offline"`; \}\>

Defined in: [packages/contracts/src/presence.ts:21](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/presence.ts#L21)

Presence Query Schema
