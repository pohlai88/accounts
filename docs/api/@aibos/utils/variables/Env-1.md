[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / Env

# Variable: Env

> `const` **Env**: `ZodObject`\<\{ `API_KEY`: `ZodOptional`\<`ZodString`\>; `CORS_ORIGIN`: `ZodOptional`\<`ZodString`\>; `DATABASE_URL`: `ZodOptional`\<`ZodString`\>; `JWT_SECRET`: `ZodOptional`\<`ZodString`\>; `LOG_LEVEL`: `ZodDefault`\<`ZodEnum`\<\[`"error"`, `"warn"`, `"info"`, `"debug"`\]\>\>; `NODE_ENV`: `ZodDefault`\<`ZodEnum`\<\[`"development"`, `"test"`, `"production"`\]\>\>; `PORT`: `ZodDefault`\<`ZodEffects`\<`ZodString`, `number`, `string`\>\>; `RATE_LIMIT_MAX_REQUESTS`: `ZodDefault`\<`ZodEffects`\<`ZodString`, `number`, `string`\>\>; `RATE_LIMIT_WINDOW_MS`: `ZodDefault`\<`ZodEffects`\<`ZodString`, `number`, `string`\>\>; `REDIS_URL`: `ZodOptional`\<`ZodString`\>; `SUPABASE_ANON_KEY`: `ZodString`; `SUPABASE_SERVICE_ROLE_KEY`: `ZodOptional`\<`ZodString`\>; `SUPABASE_URL`: `ZodString`; \}, `"strip"`, `ZodTypeAny`, \{ `API_KEY?`: `string`; `CORS_ORIGIN?`: `string`; `DATABASE_URL?`: `string`; `JWT_SECRET?`: `string`; `LOG_LEVEL`: `"error"` \| `"warn"` \| `"info"` \| `"debug"`; `NODE_ENV`: `"development"` \| `"production"` \| `"test"`; `PORT`: `number`; `RATE_LIMIT_MAX_REQUESTS`: `number`; `RATE_LIMIT_WINDOW_MS`: `number`; `REDIS_URL?`: `string`; `SUPABASE_ANON_KEY`: `string`; `SUPABASE_SERVICE_ROLE_KEY?`: `string`; `SUPABASE_URL`: `string`; \}, \{ `API_KEY?`: `string`; `CORS_ORIGIN?`: `string`; `DATABASE_URL?`: `string`; `JWT_SECRET?`: `string`; `LOG_LEVEL?`: `"error"` \| `"warn"` \| `"info"` \| `"debug"`; `NODE_ENV?`: `"development"` \| `"production"` \| `"test"`; `PORT?`: `string`; `RATE_LIMIT_MAX_REQUESTS?`: `string`; `RATE_LIMIT_WINDOW_MS?`: `string`; `REDIS_URL?`: `string`; `SUPABASE_ANON_KEY`: `string`; `SUPABASE_SERVICE_ROLE_KEY?`: `string`; `SUPABASE_URL`: `string`; \}\>

Defined in: [packages/utils/src/env.ts:12](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/env.ts#L12)

Environment schema definition
Validates and types environment variables at runtime
