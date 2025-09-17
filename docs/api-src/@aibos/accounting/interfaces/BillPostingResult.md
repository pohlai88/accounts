[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/accounting](../README.md) / [](../README.md) / BillPostingResult

# Interface: BillPostingResult

Defined in: [packages/accounting/src/ap/bill-posting.ts:54](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/bill-posting.ts#L54)

## Properties

### approverRoles?

> `optional` **approverRoles**: `string`[]

Defined in: [packages/accounting/src/ap/bill-posting.ts:59](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/bill-posting.ts#L59)

***

### coaWarnings?

> `optional` **coaWarnings**: `object`[]

Defined in: [packages/accounting/src/ap/bill-posting.ts:60](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/bill-posting.ts#L60)

#### accountId

> **accountId**: `string`

#### accountType

> **accountType**: `string`

#### amount

> **amount**: `number`

#### side

> **side**: `"debit"` \| `"credit"`

#### warning

> **warning**: `string`

***

### journalInput

> **journalInput**: [`JournalPostingInput`](../posting/interfaces/JournalPostingInput.md)

Defined in: [packages/accounting/src/ap/bill-posting.ts:56](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/bill-posting.ts#L56)

***

### requiresApproval?

> `optional` **requiresApproval**: `boolean`

Defined in: [packages/accounting/src/ap/bill-posting.ts:58](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/bill-posting.ts#L58)

***

### totalAmount

> **totalAmount**: `number`

Defined in: [packages/accounting/src/ap/bill-posting.ts:57](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/bill-posting.ts#L57)

***

### validated

> **validated**: `true`

Defined in: [packages/accounting/src/ap/bill-posting.ts:55](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/ap/bill-posting.ts#L55)
