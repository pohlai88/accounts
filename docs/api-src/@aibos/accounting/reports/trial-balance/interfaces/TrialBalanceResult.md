[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [reports/trial-balance](../README.md) / TrialBalanceResult

# Interface: TrialBalanceResult

Defined in: [packages/accounting/src/reports/trial-balance.ts:35](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L35)

## Properties

### accounts

> **accounts**: [`TrialBalanceAccount`](TrialBalanceAccount.md)[]

Defined in: [packages/accounting/src/reports/trial-balance.ts:40](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L40)

***

### asOfDate

> **asOfDate**: `Date`

Defined in: [packages/accounting/src/reports/trial-balance.ts:37](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L37)

***

### currency

> **currency**: `string`

Defined in: [packages/accounting/src/reports/trial-balance.ts:39](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L39)

***

### generatedAt

> **generatedAt**: `Date`

Defined in: [packages/accounting/src/reports/trial-balance.ts:38](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L38)

***

### isBalanced

> **isBalanced**: `boolean`

Defined in: [packages/accounting/src/reports/trial-balance.ts:51](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L51)

***

### metadata

> **metadata**: `object`

Defined in: [packages/accounting/src/reports/trial-balance.ts:52](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L52)

#### accountsWithActivity

> **accountsWithActivity**: `number`

#### generationTime

> **generationTime**: `number`

#### newestTransaction?

> `optional` **newestTransaction**: `Date`

#### oldestTransaction?

> `optional` **oldestTransaction**: `Date`

#### totalAccounts

> **totalAccounts**: `number`

***

### success

> **success**: `true`

Defined in: [packages/accounting/src/reports/trial-balance.ts:36](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L36)

***

### totals

> **totals**: `object`

Defined in: [packages/accounting/src/reports/trial-balance.ts:41](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L41)

#### netIncome

> **netIncome**: `number`

#### totalAssets

> **totalAssets**: `number`

#### totalCredits

> **totalCredits**: `number`

#### totalDebits

> **totalDebits**: `number`

#### totalEquity

> **totalEquity**: `number`

#### totalExpenses

> **totalExpenses**: `number`

#### totalLiabilities

> **totalLiabilities**: `number`

#### totalRevenue

> **totalRevenue**: `number`
