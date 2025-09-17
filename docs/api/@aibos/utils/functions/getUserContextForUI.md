[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / getUserContextForUI

# Function: getUserContextForUI()

> **getUserContextForUI**(`request`): `Promise`\<\{ `canPerform`: (`action`, `context?`) => `Promise`\<`boolean`\>; `hasFeature`: (`feature`) => `boolean`; `user`: [`EnhancedUserContext`](../interfaces/EnhancedUserContext.md); \}\>

Defined in: [packages/utils/src/auth/enhanced-context.ts:201](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/auth/enhanced-context.ts#L201)

Get user context for React components (simplified)

## Parameters

### request

`NextRequest`

## Returns

`Promise`\<\{ `canPerform`: (`action`, `context?`) => `Promise`\<`boolean`\>; `hasFeature`: (`feature`) => `boolean`; `user`: [`EnhancedUserContext`](../interfaces/EnhancedUserContext.md); \}\>
