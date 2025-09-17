[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / ProfitLossResult

# Interface: ProfitLossResult

Defined in: [packages/accounting/src/reports/profit-loss.ts:50](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L50)

## Properties

### comparativeEndDate?

> `optional` **comparativeEndDate**: `Date`

Defined in: [packages/accounting/src/reports/profit-loss.ts:55](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L55)

***

### comparativeStartDate?

> `optional` **comparativeStartDate**: `Date`

Defined in: [packages/accounting/src/reports/profit-loss.ts:54](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L54)

***

### costOfSales

> **costOfSales**: [`ProfitLossSection`](ProfitLossSection.md)[]

Defined in: [packages/accounting/src/reports/profit-loss.ts:62](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L62)

***

### currency

> **currency**: `string`

Defined in: [packages/accounting/src/reports/profit-loss.ts:57](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L57)

***

### endDate

> **endDate**: `Date`

Defined in: [packages/accounting/src/reports/profit-loss.ts:53](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L53)

***

### generatedAt

> **generatedAt**: `Date`

Defined in: [packages/accounting/src/reports/profit-loss.ts:56](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L56)

***

### metadata

> **metadata**: `object`

Defined in: [packages/accounting/src/reports/profit-loss.ts:95](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L95)

#### accountsWithActivity

> **accountsWithActivity**: `number`

#### basedOnTrialBalance

> **basedOnTrialBalance**: `boolean`

#### generationTime

> **generationTime**: `number`

#### periodDays

> **periodDays**: `number`

#### totalAccounts

> **totalAccounts**: `number`

***

### metrics

> **metrics**: `object`

Defined in: [packages/accounting/src/reports/profit-loss.ts:68](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L68)

#### comparativeGrossProfit?

> `optional` **comparativeGrossProfit**: `number`

#### comparativeNetIncome?

> `optional` **comparativeNetIncome**: `number`

#### comparativeOperatingIncome?

> `optional` **comparativeOperatingIncome**: `number`

#### comparativeTotalRevenue?

> `optional` **comparativeTotalRevenue**: `number`

#### grossProfit

> **grossProfit**: `number`

#### grossProfitMargin

> **grossProfitMargin**: `number`

#### grossProfitVariance?

> `optional` **grossProfitVariance**: `number`

#### netIncomeAfterTax

> **netIncomeAfterTax**: `number`

#### netIncomeBeforeTax

> **netIncomeBeforeTax**: `number`

#### netIncomeVariance?

> `optional` **netIncomeVariance**: `number`

#### netProfitMargin

> **netProfitMargin**: `number`

#### operatingIncome

> **operatingIncome**: `number`

#### operatingIncomeVariance?

> `optional` **operatingIncomeVariance**: `number`

#### operatingMargin

> **operatingMargin**: `number`

#### revenueVariance?

> `optional` **revenueVariance**: `number`

#### totalCostOfSales

> **totalCostOfSales**: `number`

#### totalOperatingExpenses

> **totalOperatingExpenses**: `number`

#### totalOtherExpenses

> **totalOtherExpenses**: `number`

#### totalOtherIncome

> **totalOtherIncome**: `number`

#### totalRevenue

> **totalRevenue**: `number`

***

### operatingExpenses

> **operatingExpenses**: [`ProfitLossSection`](ProfitLossSection.md)[]

Defined in: [packages/accounting/src/reports/profit-loss.ts:63](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L63)

***

### otherExpenses

> **otherExpenses**: [`ProfitLossSection`](ProfitLossSection.md)[]

Defined in: [packages/accounting/src/reports/profit-loss.ts:65](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L65)

***

### otherIncome

> **otherIncome**: [`ProfitLossSection`](ProfitLossSection.md)[]

Defined in: [packages/accounting/src/reports/profit-loss.ts:64](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L64)

***

### reportFormat

> **reportFormat**: `string`

Defined in: [packages/accounting/src/reports/profit-loss.ts:58](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L58)

***

### revenue

> **revenue**: [`ProfitLossSection`](ProfitLossSection.md)[]

Defined in: [packages/accounting/src/reports/profit-loss.ts:61](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L61)

***

### startDate

> **startDate**: `Date`

Defined in: [packages/accounting/src/reports/profit-loss.ts:52](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L52)

***

### success

> **success**: `true`

Defined in: [packages/accounting/src/reports/profit-loss.ts:51](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L51)
