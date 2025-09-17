[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / generateProfitLoss

# Function: generateProfitLoss()

> **generateProfitLoss**(`input`, `dbClient`): `Promise`\<[`ProfitLossResult`](../interfaces/ProfitLossResult.md) \| [`ProfitLossError`](../interfaces/ProfitLossError.md)\>

Defined in: [packages/accounting/src/reports/profit-loss.ts:115](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/profit-loss.ts#L115)

Generate Profit & Loss statement from Trial Balance data
V1 Requirement: All reports derive from GL journal lines

## Parameters

### input

[`ProfitLossInput`](../interfaces/ProfitLossInput.md)

### dbClient

`unknown`

## Returns

`Promise`\<[`ProfitLossResult`](../interfaces/ProfitLossResult.md) \| [`ProfitLossError`](../interfaces/ProfitLossError.md)\>
