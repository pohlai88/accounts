[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [periods/period-management](../README.md) / closeFiscalPeriod

# Function: closeFiscalPeriod()

> **closeFiscalPeriod**(`input`, `dbClient`): `Promise`\<[`PeriodCloseResult`](../interfaces/PeriodCloseResult.md) \| [`PeriodManagementError`](../interfaces/PeriodManagementError.md)\>

Defined in: [packages/accounting/src/periods/period-management.ts:74](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/periods/period-management.ts#L74)

Close a fiscal period with full validation and approval workflow
V1 Requirement: Period close with approval flow

## Parameters

### input

[`PeriodCloseInput`](../interfaces/PeriodCloseInput.md)

### dbClient

`unknown`

## Returns

`Promise`\<[`PeriodCloseResult`](../interfaces/PeriodCloseResult.md) \| [`PeriodManagementError`](../interfaces/PeriodManagementError.md)\>
