[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / useUserCapabilities

# Function: useUserCapabilities()

> **useUserCapabilities**(`user`): \{ `canPerform`: () => `boolean`; `getDecision`: () => `object`; `hasFeature`: () => `boolean`; \} \| \{ `canPerform`: (`action`, `context`) => `boolean`; `getDecision`: (`action`, `context`) => `Decision`; `hasFeature`: (`feature`) => `boolean`; \}

Defined in: [packages/utils/src/auth/react-hooks.ts:110](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/auth/react-hooks.ts#L110)

Hook to get all user capabilities

## Parameters

### user

`null` | [`ClientUserContext`](../interfaces/ClientUserContext.md)

## Returns

\{ `canPerform`: () => `boolean`; `getDecision`: () => `object`; `hasFeature`: () => `boolean`; \} \| \{ `canPerform`: (`action`, `context`) => `boolean`; `getDecision`: (`action`, `context`) => `Decision`; `hasFeature`: (`feature`) => `boolean`; \}
