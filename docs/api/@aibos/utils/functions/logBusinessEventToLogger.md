[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / logBusinessEventToLogger

# Function: logBusinessEventToLogger()

> **logBusinessEventToLogger**(`context`, `event`): `void`

Defined in: [packages/utils/src/middleware.ts:124](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/middleware.ts#L124)

## Parameters

### context

[`RequestContext`](../interfaces/RequestContext.md)

### event

#### amount?

`string`

#### currency?

`string`

#### details?

`Record`\<`string`, `unknown`\>

#### entity_id

`string`

#### entity_type

`string`

#### type

`"journal_posted"` \| `"invoice_created"` \| `"payment_processed"` \| `"user_login"` \| `"period_closed"`

## Returns

`void`
