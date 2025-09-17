[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/utils](../../../README.md) / [middleware/idempotency](../README.md) / cleanupIdempotencyCache

# Function: cleanupIdempotencyCache()

> **cleanupIdempotencyCache**(): `Promise`\<`void`\>

Defined in: [packages/utils/src/middleware/idempotency.ts:101](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/middleware/idempotency.ts#L101)

Clean up expired idempotency cache entries
Should be run periodically via cron job

## Returns

`Promise`\<`void`\>
