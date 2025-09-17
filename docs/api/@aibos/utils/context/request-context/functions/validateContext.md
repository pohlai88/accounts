[**AI-BOS Accounts API Documentation**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../../README.md) / [@aibos/utils](../../../README.md) / [context/request-context](../README.md) / validateContext

# Function: validateContext()

> **validateContext**(`context`, `requiredFields`): `object`

Defined in: [packages/utils/src/context/request-context.ts:133](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/context/request-context.ts#L133)

Validate required context fields

## Parameters

### context

[`UserContext`](../interfaces/UserContext.md)

### requiredFields

keyof [`UserContext`](../interfaces/UserContext.md)[]

## Returns

`object`

### missing

> **missing**: `string`[]

### valid

> **valid**: `boolean`
