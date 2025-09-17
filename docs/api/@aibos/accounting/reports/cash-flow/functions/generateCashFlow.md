[**AI-BOS Accounts API Documentation**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [reports/cash-flow](../README.md) / generateCashFlow

# Function: generateCashFlow()

> **generateCashFlow**(`input`, `dbClient`): `Promise`\<[`CashFlowResult`](../interfaces/CashFlowResult.md) \| [`CashFlowError`](../interfaces/CashFlowError.md)\>

Defined in: [packages/accounting/src/reports/cash-flow.ts:114](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/reports/cash-flow.ts#L114)

Generate Cash Flow Statement from Trial Balance data
V1 Requirement: All reports derive from GL journal lines

## Parameters

### input

[`CashFlowInput`](../interfaces/CashFlowInput.md)

### dbClient

#### query

(`sql`, `params?`) => `Promise`\<`unknown`\>

## Returns

`Promise`\<[`CashFlowResult`](../interfaces/CashFlowResult.md) \| [`CashFlowError`](../interfaces/CashFlowError.md)\>
