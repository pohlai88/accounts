[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / validatePaymentProcessingEnhanced

# Function: validatePaymentProcessingEnhanced()

> **validatePaymentProcessingEnhanced**(`input`, `userId`, `userRole`, `baseCurrency`): `Promise`\<[`PaymentProcessingResultEnhanced`](../interfaces/PaymentProcessingResultEnhanced.md) \| [`PaymentProcessingErrorEnhanced`](../interfaces/PaymentProcessingErrorEnhanced.md)\>

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:149](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L149)

Fixed payment processing with surgical fixes

## Parameters

### input

[`PaymentProcessingInputEnhanced`](../interfaces/PaymentProcessingInputEnhanced.md)

### userId

`string`

### userRole

`string`

### baseCurrency

`string` = `"MYR"`

## Returns

`Promise`\<[`PaymentProcessingResultEnhanced`](../interfaces/PaymentProcessingResultEnhanced.md) \| [`PaymentProcessingErrorEnhanced`](../interfaces/PaymentProcessingErrorEnhanced.md)\>
