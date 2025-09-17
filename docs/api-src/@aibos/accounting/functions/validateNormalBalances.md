[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / validateNormalBalances

# Function: validateNormalBalances()

> **validateNormalBalances**(`lines`, `accounts`): `object`[]

Defined in: [packages/accounting/src/coa-validation.ts:110](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/coa-validation.ts#L110)

Validate normal balance rules (warning only, not blocking)
Assets and Expenses normally have debit balances
Liabilities, Equity, and Revenue normally have credit balances

## Parameters

### lines

`object`[]

### accounts

`Map`\<`string`, [`AccountInfo`](../../db/interfaces/AccountInfo.md)\>

## Returns

`object`[]
