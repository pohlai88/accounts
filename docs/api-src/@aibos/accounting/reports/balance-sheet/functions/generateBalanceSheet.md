[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [reports/balance-sheet](../README.md) / generateBalanceSheet

# Function: generateBalanceSheet()

> **generateBalanceSheet**(`input`, `dbClient`): `Promise`\<[`BalanceSheetResult`](../interfaces/BalanceSheetResult.md) \| [`BalanceSheetError`](../interfaces/BalanceSheetError.md)\>

Defined in: [packages/accounting/src/reports/balance-sheet.ts:99](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/balance-sheet.ts#L99)

Generate Balance Sheet from Trial Balance data
V1 Requirement: All reports derive from GL journal lines

## Parameters

### input

[`BalanceSheetInput`](../interfaces/BalanceSheetInput.md)

### dbClient

#### query

(`sql`, `params?`) => `Promise`\<`unknown`\>

## Returns

`Promise`\<[`BalanceSheetResult`](../interfaces/BalanceSheetResult.md) \| [`BalanceSheetError`](../interfaces/BalanceSheetError.md)\>
