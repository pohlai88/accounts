[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / validatePaymentAllocations

# Function: validatePaymentAllocations()

> **validatePaymentAllocations**(`allocations`, `outstandingBalances`): `object`

Defined in: [packages/accounting/src/ap/payment-processing.ts:348](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing.ts#L348)

Validate payment allocation against outstanding balances

## Parameters

### allocations

[`PaymentAllocationInput`](../interfaces/PaymentAllocationInput.md)[]

### outstandingBalances

`Map`\<`string`, `number`\>

## Returns

`object`

### errors

> **errors**: `string`[]

### valid

> **valid**: `boolean`

### warnings

> **warnings**: `string`[]
