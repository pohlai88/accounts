[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/accounting](../../../README.md) / [fx/ingest](../README.md) / FxIngestResult

# Interface: FxIngestResult

Defined in: [packages/accounting/src/fx/ingest.ts:27](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/fx/ingest.ts#L27)

## Properties

### errors

> **errors**: `string`[]

Defined in: [packages/accounting/src/fx/ingest.ts:30](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/fx/ingest.ts#L30)

***

### rates

> **rates**: [`FxRateData`](FxRateData.md)[]

Defined in: [packages/accounting/src/fx/ingest.ts:29](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/fx/ingest.ts#L29)

***

### source

> **source**: `"primary"` \| `"fallback"`

Defined in: [packages/accounting/src/fx/ingest.ts:31](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/fx/ingest.ts#L31)

***

### staleness

> **staleness**: `object`

Defined in: [packages/accounting/src/fx/ingest.ts:32](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/fx/ingest.ts#L32)

#### ageMinutes

> **ageMinutes**: `number`

#### isStale

> **isStale**: `boolean`

#### threshold

> **threshold**: `number`

***

### success

> **success**: `boolean`

Defined in: [packages/accounting/src/fx/ingest.ts:28](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/fx/ingest.ts#L28)
