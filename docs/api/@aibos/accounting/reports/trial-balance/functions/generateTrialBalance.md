[**AI-BOS Accounts API Documentation**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [reports/trial-balance](../README.md) / generateTrialBalance

# Function: generateTrialBalance()

> **generateTrialBalance**(`input`, `dbClient`): `Promise`\<[`TrialBalanceResult`](../interfaces/TrialBalanceResult.md) \| [`TrialBalanceError`](../interfaces/TrialBalanceError.md)\>

Defined in: [packages/accounting/src/reports/trial-balance.ts:72](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/trial-balance.ts#L72)

Generate Trial Balance from GL journal lines
V1 Requirement: All reports must derive from GL only

## Parameters

### input

[`TrialBalanceInput`](../interfaces/TrialBalanceInput.md)

### dbClient

#### query

(`sql`, `params?`) => `Promise`\<`unknown`\>

## Returns

`Promise`\<[`TrialBalanceResult`](../interfaces/TrialBalanceResult.md) \| [`TrialBalanceError`](../interfaces/TrialBalanceError.md)\>
