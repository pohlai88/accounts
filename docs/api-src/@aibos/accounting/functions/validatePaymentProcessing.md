[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / validatePaymentProcessing

# Function: validatePaymentProcessing()

> **validatePaymentProcessing**(`input`, `userId`, `userRole`, `baseCurrency`): `Promise`\<[`PaymentProcessingResult`](../interfaces/PaymentProcessingResult.md) \| [`PaymentProcessingError`](../interfaces/PaymentProcessingError.md)\>

Defined in: [packages/accounting/src/ap/payment-processing.ts:64](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing.ts#L64)

Validates and posts a payment to the General Ledger

Journal Entry Structure for Bill Payment:
Dr. Accounts Payable                XXX
    Cr. Bank Account                    XXX

Journal Entry Structure for Invoice Receipt:
Dr. Bank Account                    XXX
    Cr. Accounts Receivable             XXX

## Parameters

### input

[`PaymentProcessingInput`](../interfaces/PaymentProcessingInput.md)

### userId

`string`

### userRole

`string`

### baseCurrency

`string` = `"MYR"`

## Returns

`Promise`\<[`PaymentProcessingResult`](../interfaces/PaymentProcessingResult.md) \| [`PaymentProcessingError`](../interfaces/PaymentProcessingError.md)\>
