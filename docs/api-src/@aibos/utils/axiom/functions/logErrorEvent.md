[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/utils](../../README.md) / [axiom](../README.md) / logErrorEvent

# Function: logErrorEvent()

> **logErrorEvent**(`dataset`, `context`, `error`): `Promise`\<`void`\>

Defined in: [packages/utils/src/axiom.ts:161](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/axiom.ts#L161)

## Parameters

### dataset

`"app_web_prod"` | `"app_web_staging"` | `"api_prod"` | `"api_staging"` | `"jobs_prod"` | `"jobs_staging"`

### context

#### company_id?

`string`

#### request_id?

`string`

#### tenant_id?

`string`

#### user_id?

`string`

### error

[`ErrorEvent`](../interfaces/ErrorEvent.md)

## Returns

`Promise`\<`void`\>
