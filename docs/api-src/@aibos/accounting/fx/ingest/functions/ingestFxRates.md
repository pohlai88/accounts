[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [fx/ingest](../README.md) / ingestFxRates

# Function: ingestFxRates()

> **ingestFxRates**(`baseCurrency`, `targetCurrencies`, `stalenessThreshold`): `Promise`\<[`FxIngestResult`](../interfaces/FxIngestResult.md) \| [`FxIngestError`](../interfaces/FxIngestError.md)\>

Defined in: [packages/accounting/src/fx/ingest.ts:87](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/fx/ingest.ts#L87)

Ingest FX rates from primary source with fallback

## Parameters

### baseCurrency

`string` = `"MYR"`

### targetCurrencies

`string`[] = `...`

### stalenessThreshold

`number` = `STALENESS_THRESHOLDS.WARNING`

## Returns

`Promise`\<[`FxIngestResult`](../interfaces/FxIngestResult.md) \| [`FxIngestError`](../interfaces/FxIngestError.md)\>
