[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [fx/ingest](../README.md) / getCurrentFxRate

# Function: getCurrentFxRate()

> **getCurrentFxRate**(`fromCurrency`, `toCurrency`, `stalenessThreshold`): `Promise`\<`null` \| \{ `age`: `number`; `rate`: `number`; `source`: `string`; \}\>

Defined in: [packages/accounting/src/fx/ingest.ts:341](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/fx/ingest.ts#L341)

Get current FX rate for a currency pair

## Parameters

### fromCurrency

`string`

### toCurrency

`string`

### stalenessThreshold

`number` = `STALENESS_THRESHOLDS.WARNING`

## Returns

`Promise`\<`null` \| \{ `age`: `number`; `rate`: `number`; `source`: `string`; \}\>
