[**AI-BOS Accounts API Documentation**](../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../README.md) / [@aibos/utils](../../README.md) / [axiom](../README.md) / logBusinessEvent

# Function: logBusinessEvent()

> **logBusinessEvent**(`dataset`, `context`, `event`): `Promise`\<`void`\>

Defined in: [packages/utils/src/axiom.ts:132](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/axiom.ts#L132)

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

### event

[`BusinessEvent`](../interfaces/BusinessEvent.md)

## Returns

`Promise`\<`void`\>
