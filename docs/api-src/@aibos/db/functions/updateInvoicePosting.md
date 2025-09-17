[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / updateInvoicePosting

# Function: updateInvoicePosting()

> **updateInvoicePosting**(`scope`, `invoiceId`, `journalId`, `status`): `Promise`\<`undefined` \| \{ `id`: `string`; `journalId`: `null` \| `string`; `postedAt`: `null` \| `Date`; `status`: `string`; \}\>

Defined in: [packages/db/src/repos.ts:893](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L893)

Update invoice status and journal reference after posting

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

### invoiceId

`string`

### journalId

`string`

### status

`"posted"` = `"posted"`

## Returns

`Promise`\<`undefined` \| \{ `id`: `string`; `journalId`: `null` \| `string`; `postedAt`: `null` \| `Date`; `status`: `string`; \}\>
