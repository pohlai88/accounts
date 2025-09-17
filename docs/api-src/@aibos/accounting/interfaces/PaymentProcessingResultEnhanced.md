[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / PaymentProcessingResultEnhanced

# Interface: PaymentProcessingResultEnhanced

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:68](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L68)

## Properties

### allocationsProcessed

> **allocationsProcessed**: `number`

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:73](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L73)

***

### bankCharges?

> `optional` **bankCharges**: `object`[]

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:86](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L86)

#### accountId

> **accountId**: `string`

#### amount

> **amount**: `number`

#### description

> **description**: `string`

***

### fxApplied?

> `optional` **fxApplied**: `object`

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:80](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L80)

#### convertedAmount

> **convertedAmount**: `number`

#### exchangeRate

> **exchangeRate**: `number`

#### fromCurrency

> **fromCurrency**: `string`

#### toCurrency

> **toCurrency**: `string`

***

### journalId

> **journalId**: `string`

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:70](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L70)

***

### journalNumber

> **journalNumber**: `string`

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:71](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L71)

***

### lines

> **lines**: `object`[]

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:74](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L74)

#### accountId

> **accountId**: `string`

#### credit

> **credit**: `number`

#### debit

> **debit**: `number`

#### description

> **description**: `string`

***

### success

> **success**: `true`

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:69](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L69)

***

### totalAmount

> **totalAmount**: `number`

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:72](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L72)

***

### withholdingTax?

> `optional` **withholdingTax**: `object`[]

Defined in: [packages/accounting/src/ap/payment-processing-fixed.ts:91](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/payment-processing-fixed.ts#L91)

#### accountId

> **accountId**: `string`

#### amount

> **amount**: `number`

#### description

> **description**: `string`
