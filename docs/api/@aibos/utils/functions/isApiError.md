[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / isApiError

# Function: isApiError()

> **isApiError**(`value`): `value is { code?: string; message: string; status: number }`

Defined in: [packages/utils/src/error-utils.ts:81](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/error-utils.ts#L81)

Type guard to check if value is an API error

## Parameters

### value

`unknown`

Value to check

## Returns

`value is { code?: string; message: string; status: number }`

True if value is an API error
