[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [reports/balance-sheet](../README.md) / BalanceSheetResult

# Interface: BalanceSheetResult

Defined in: [packages/accounting/src/reports/balance-sheet.ts:43](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L43)

## Properties

### asOfDate

> **asOfDate**: `Date`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:45](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L45)

***

### assets

> **assets**: [`BalanceSheetSection`](BalanceSheetSection.md)[]

Defined in: [packages/accounting/src/reports/balance-sheet.ts:52](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L52)

***

### balanceCheck

> **balanceCheck**: `object`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:75](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L75)

#### assetsEqualsLiabilitiesPlusEquity

> **assetsEqualsLiabilitiesPlusEquity**: `boolean`

#### difference

> **difference**: `number`

***

### comparativeDate?

> `optional` **comparativeDate**: `Date`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:46](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L46)

***

### currency

> **currency**: `string`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:48](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L48)

***

### equity

> **equity**: [`BalanceSheetSection`](BalanceSheetSection.md)[]

Defined in: [packages/accounting/src/reports/balance-sheet.ts:54](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L54)

***

### generatedAt

> **generatedAt**: `Date`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:47](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L47)

***

### isBalanced

> **isBalanced**: `boolean`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:74](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L74)

***

### liabilities

> **liabilities**: [`BalanceSheetSection`](BalanceSheetSection.md)[]

Defined in: [packages/accounting/src/reports/balance-sheet.ts:53](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L53)

***

### metadata

> **metadata**: `object`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:80](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L80)

#### accountsWithBalances

> **accountsWithBalances**: `number`

#### basedOnTrialBalance

> **basedOnTrialBalance**: `boolean`

#### generationTime

> **generationTime**: `number`

#### totalAccounts

> **totalAccounts**: `number`

***

### reportFormat

> **reportFormat**: `string`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:49](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L49)

***

### success

> **success**: `true`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:44](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L44)

***

### totals

> **totals**: `object`

Defined in: [packages/accounting/src/reports/balance-sheet.ts:57](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L57)

#### comparativeTotalAssets?

> `optional` **comparativeTotalAssets**: `number`

#### comparativeTotalEquity?

> `optional` **comparativeTotalEquity**: `number`

#### comparativeTotalLiabilities?

> `optional` **comparativeTotalLiabilities**: `number`

#### retainedEarnings

> **retainedEarnings**: `number`

#### totalAssets

> **totalAssets**: `number`

#### totalCurrentAssets

> **totalCurrentAssets**: `number`

#### totalCurrentLiabilities

> **totalCurrentLiabilities**: `number`

#### totalEquity

> **totalEquity**: `number`

#### totalLiabilities

> **totalLiabilities**: `number`

#### totalNonCurrentAssets

> **totalNonCurrentAssets**: `number`

#### totalNonCurrentLiabilities

> **totalNonCurrentLiabilities**: `number`
