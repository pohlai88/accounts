[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/utils](../../README.md) / [axiom](../README.md) / logPerformanceEvent

# Function: logPerformanceEvent()

> **logPerformanceEvent**(`dataset`, `context`, `metrics`): `Promise`\<`void`\>

Defined in: [packages/utils/src/axiom.ts:104](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/axiom.ts#L104)

## Parameters

### dataset

`"app_web_prod"` | `"app_web_staging"` | `"api_prod"` | `"api_staging"` | `"jobs_prod"` | `"jobs_staging"`

### context

#### company_id?

`string`

#### request_id?

`string`

#### request_method?

`string`

#### request_path?

`string`

#### tenant_id?

`string`

#### user_id?

`string`

### metrics

[`PerformanceMetrics`](../interfaces/PerformanceMetrics.md)

## Returns

`Promise`\<`void`\>
