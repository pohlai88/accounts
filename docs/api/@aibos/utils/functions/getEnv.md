[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / getEnv

# Function: getEnv()

> **getEnv**\<`K`\>(`key`, `defaultValue?`): `object`\[`K`\]

Defined in: [packages/utils/src/env.ts:42](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/env.ts#L42)

Safe environment variable access

## Type Parameters

### K

`K` *extends* `requiredKeys`\<`baseObjectOutputType`\<\{ `API_KEY`: `ZodOptional`\<`ZodString`\>; `CORS_ORIGIN`: `ZodOptional`\<`ZodString`\>; `DATABASE_URL`: `ZodOptional`\<`ZodString`\>; `JWT_SECRET`: `ZodOptional`\<`ZodString`\>; `LOG_LEVEL`: `ZodDefault`\<`ZodEnum`\<\[`"error"`, `"warn"`, `"info"`, `"debug"`\]\>\>; `NODE_ENV`: `ZodDefault`\<`ZodEnum`\<\[`"development"`, `"test"`, `"production"`\]\>\>; `PORT`: `ZodDefault`\<`ZodEffects`\<`ZodString`, `number`, `string`\>\>; `RATE_LIMIT_MAX_REQUESTS`: `ZodDefault`\<`ZodEffects`\<`ZodString`, `number`, `string`\>\>; `RATE_LIMIT_WINDOW_MS`: `ZodDefault`\<`ZodEffects`\<`ZodString`, `number`, `string`\>\>; `REDIS_URL`: `ZodOptional`\<`ZodString`\>; `SUPABASE_ANON_KEY`: `ZodString`; `SUPABASE_SERVICE_ROLE_KEY`: `ZodOptional`\<`ZodString`\>; `SUPABASE_URL`: `ZodString`; \}\>\> \| `optionalKeys`\<`baseObjectOutputType`\<\{ `API_KEY`: `ZodOptional`\<`ZodString`\>; `CORS_ORIGIN`: `ZodOptional`\<`ZodString`\>; `DATABASE_URL`: `ZodOptional`\<`ZodString`\>; `JWT_SECRET`: `ZodOptional`\<`ZodString`\>; `LOG_LEVEL`: `ZodDefault`\<`ZodEnum`\<\[`"error"`, `"warn"`, `"info"`, `"debug"`\]\>\>; `NODE_ENV`: `ZodDefault`\<`ZodEnum`\<\[`"development"`, `"test"`, `"production"`\]\>\>; `PORT`: `ZodDefault`\<`ZodEffects`\<`ZodString`, `number`, `string`\>\>; `RATE_LIMIT_MAX_REQUESTS`: `ZodDefault`\<`ZodEffects`\<`ZodString`, `number`, `string`\>\>; `RATE_LIMIT_WINDOW_MS`: `ZodDefault`\<`ZodEffects`\<`ZodString`, `number`, `string`\>\>; `REDIS_URL`: `ZodOptional`\<`ZodString`\>; `SUPABASE_ANON_KEY`: `ZodString`; `SUPABASE_SERVICE_ROLE_KEY`: `ZodOptional`\<`ZodString`\>; `SUPABASE_URL`: `ZodString`; \}\>\>

## Parameters

### key

`K`

Environment variable key

### defaultValue?

`object`\[`K`\]

Default value if not set

## Returns

`object`\[`K`\]

Environment variable value or default
