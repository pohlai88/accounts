[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / JournalInput

# Interface: JournalInput

Defined in: [packages/db/src/repos.ts:61](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L61)

## Properties

### currency

> **currency**: `string`

Defined in: [packages/db/src/repos.ts:65](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L65)

***

### description?

> `optional` **description**: `string`

Defined in: [packages/db/src/repos.ts:63](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L63)

***

### idempotencyKey?

> `optional` **idempotencyKey**: `string`

Defined in: [packages/db/src/repos.ts:74](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L74)

***

### journalDate

> **journalDate**: `Date`

Defined in: [packages/db/src/repos.ts:64](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L64)

***

### journalNumber

> **journalNumber**: `string`

Defined in: [packages/db/src/repos.ts:62](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L62)

***

### lines

> **lines**: `object`[]

Defined in: [packages/db/src/repos.ts:66](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L66)

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

***

### status?

> `optional` **status**: `"draft"` \| `"posted"` \| `"pending_approval"`

Defined in: [packages/db/src/repos.ts:73](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L73)
