[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/accounting](../../README.md) / [posting](../README.md) / JournalPostingInput

# Interface: JournalPostingInput

Defined in: [packages/accounting/src/posting.ts:21](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L21)

## Properties

### context

> **context**: [`PostingContext`](PostingContext.md)

Defined in: [packages/accounting/src/posting.ts:27](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L27)

***

### currency

> **currency**: `string`

Defined in: [packages/accounting/src/posting.ts:25](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L25)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/accounting/src/posting.ts:23](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L23)

***

### journalDate

> **journalDate**: `Date`

Defined in: [packages/accounting/src/posting.ts:24](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L24)

***

### journalNumber

> **journalNumber**: `string`

Defined in: [packages/accounting/src/posting.ts:22](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L22)

***

### lines

> **lines**: `object`[]

Defined in: [packages/accounting/src/posting.ts:26](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L26)

#### accountId

> **accountId**: `string`

#### credit

> **credit**: `number`

#### debit

> **debit**: `number`

#### description?

> `optional` **description**: `string`

#### reference?

> `optional` **reference**: `string`
