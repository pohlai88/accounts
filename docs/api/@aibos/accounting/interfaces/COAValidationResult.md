[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / COAValidationResult

# Interface: COAValidationResult

Defined in: [packages/accounting/src/coa-validation.ts:214](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/coa-validation.ts#L214)

Main COA validation function

## Properties

### accountDetails

> **accountDetails**: `Map`\<`string`, [`AccountInfo`](../../db/interfaces/AccountInfo.md)\>

Defined in: [packages/accounting/src/coa-validation.ts:223](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/coa-validation.ts#L223)

***

### valid

> **valid**: `boolean`

Defined in: [packages/accounting/src/coa-validation.ts:215](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/coa-validation.ts#L215)

***

### warnings

> **warnings**: `object`[]

Defined in: [packages/accounting/src/coa-validation.ts:216](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/coa-validation.ts#L216)

#### accountId

> **accountId**: `string`

#### accountType

> **accountType**: `string`

#### amount

> **amount**: `number`

#### side

> **side**: `"debit"` \| `"credit"`

#### warning

> **warning**: `string`
