[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [periods/period-management](../README.md) / openFiscalPeriod

# Function: openFiscalPeriod()

> **openFiscalPeriod**(`input`, `dbClient`): `Promise`\<[`PeriodCloseResult`](../interfaces/PeriodCloseResult.md) \| [`PeriodManagementError`](../interfaces/PeriodManagementError.md)\>

Defined in: [packages/accounting/src/periods/period-management.ts:205](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/periods/period-management.ts#L205)

Open a previously closed fiscal period

## Parameters

### input

[`PeriodOpenInput`](../interfaces/PeriodOpenInput.md)

### dbClient

`unknown`

## Returns

`Promise`\<[`PeriodCloseResult`](../interfaces/PeriodCloseResult.md) \| [`PeriodManagementError`](../interfaces/PeriodManagementError.md)\>
