[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / validateControlAccounts

# Function: validateControlAccounts()

> **validateControlAccounts**(`accountIds`, `accounts`, `allAccounts`): `void`

Defined in: [packages/accounting/src/coa-validation.ts:163](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/coa-validation.ts#L163)

Validate control account restrictions
Control accounts (level 0 or with children) should not allow direct posting

## Parameters

### accountIds

`string`[]

### accounts

`Map`\<`string`, [`AccountInfo`](../../db/interfaces/AccountInfo.md)\>

### allAccounts

[`AccountInfo`](../../db/interfaces/AccountInfo.md)[]

## Returns

`void`
