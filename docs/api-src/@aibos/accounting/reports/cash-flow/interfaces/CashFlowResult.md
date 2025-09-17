[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [reports/cash-flow](../README.md) / CashFlowResult

# Interface: CashFlowResult

Defined in: [packages/accounting/src/reports/cash-flow.ts:41](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L41)

## Properties

### comparativeEndDate?

> `optional` **comparativeEndDate**: `Date`

Defined in: [packages/accounting/src/reports/cash-flow.ts:46](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L46)

***

### comparativeStartDate?

> `optional` **comparativeStartDate**: `Date`

Defined in: [packages/accounting/src/reports/cash-flow.ts:45](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L45)

***

### currency

> **currency**: `string`

Defined in: [packages/accounting/src/reports/cash-flow.ts:48](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L48)

***

### endDate

> **endDate**: `Date`

Defined in: [packages/accounting/src/reports/cash-flow.ts:44](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L44)

***

### financingActivities

> **financingActivities**: [`CashFlowSection`](CashFlowSection.md)

Defined in: [packages/accounting/src/reports/cash-flow.ts:55](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L55)

***

### generatedAt

> **generatedAt**: `Date`

Defined in: [packages/accounting/src/reports/cash-flow.ts:47](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L47)

***

### investingActivities

> **investingActivities**: [`CashFlowSection`](CashFlowSection.md)

Defined in: [packages/accounting/src/reports/cash-flow.ts:54](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L54)

***

### metadata

> **metadata**: `object`

Defined in: [packages/accounting/src/reports/cash-flow.ts:94](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L94)

#### activitiesWithCashFlow

> **activitiesWithCashFlow**: `number`

#### basedOnTrialBalance

> **basedOnTrialBalance**: `boolean`

#### generationTime

> **generationTime**: `number`

#### periodDays

> **periodDays**: `number`

#### totalActivities

> **totalActivities**: `number`

***

### method

> **method**: `"DIRECT"` \| `"INDIRECT"`

Defined in: [packages/accounting/src/reports/cash-flow.ts:49](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L49)

***

### metrics

> **metrics**: `object`

Defined in: [packages/accounting/src/reports/cash-flow.ts:58](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L58)

#### beginningCashBalance

> **beginningCashBalance**: `number`

#### comparativeNetCashFromFinancing?

> `optional` **comparativeNetCashFromFinancing**: `number`

#### comparativeNetCashFromInvesting?

> `optional` **comparativeNetCashFromInvesting**: `number`

#### comparativeNetCashFromOperating?

> `optional` **comparativeNetCashFromOperating**: `number`

#### comparativeNetChangeInCash?

> `optional` **comparativeNetChangeInCash**: `number`

#### endingCashBalance

> **endingCashBalance**: `number`

#### financingCashVariance?

> `optional` **financingCashVariance**: `number`

#### investingCashVariance?

> `optional` **investingCashVariance**: `number`

#### netCashFromFinancing

> **netCashFromFinancing**: `number`

#### netCashFromInvesting

> **netCashFromInvesting**: `number`

#### netCashFromOperating

> **netCashFromOperating**: `number`

#### netCashVariance?

> `optional` **netCashVariance**: `number`

#### netChangeInCash

> **netChangeInCash**: `number`

#### operatingCashVariance?

> `optional` **operatingCashVariance**: `number`

***

### operatingActivities

> **operatingActivities**: [`CashFlowSection`](CashFlowSection.md)

Defined in: [packages/accounting/src/reports/cash-flow.ts:53](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L53)

***

### reconciliation?

> `optional` **reconciliation**: `object`

Defined in: [packages/accounting/src/reports/cash-flow.ts:80](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L80)

#### adjustments

> **adjustments**: `object`[]

#### netIncome

> **netIncome**: `number`

#### workingCapitalChanges

> **workingCapitalChanges**: `object`[]

***

### reportFormat

> **reportFormat**: `string`

Defined in: [packages/accounting/src/reports/cash-flow.ts:50](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L50)

***

### startDate

> **startDate**: `Date`

Defined in: [packages/accounting/src/reports/cash-flow.ts:43](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L43)

***

### success

> **success**: `true`

Defined in: [packages/accounting/src/reports/cash-flow.ts:42](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L42)
