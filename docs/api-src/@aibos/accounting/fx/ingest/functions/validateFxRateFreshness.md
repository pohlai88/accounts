[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [fx/ingest](../README.md) / validateFxRateFreshness

# Function: validateFxRateFreshness()

> **validateFxRateFreshness**(`timestamp`, `threshold`): `object`

Defined in: [packages/accounting/src/fx/ingest.ts:372](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/fx/ingest.ts#L372)

Validate FX rate freshness

## Parameters

### timestamp

`Date`

### threshold

`number` = `STALENESS_THRESHOLDS.WARNING`

## Returns

`object`

### ageMinutes

> **ageMinutes**: `number`

### isValid

> **isValid**: `boolean`

### threshold

> **threshold**: `number`
