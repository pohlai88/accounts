[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / insertJournal

# Function: insertJournal()

> **insertJournal**(`scope`, `input`): `Promise`\<\{ `id`: `string`; `journalNumber`: `string`; `status`: `"draft"` \| `"posted"` \| `"pending_approval"`; `totalCredit`: `number`; `totalDebit`: `number`; \}\>

Defined in: [packages/db/src/repos.ts:101](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L101)

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

### input

[`JournalInput`](../interfaces/JournalInput.md)

## Returns

`Promise`\<\{ `id`: `string`; `journalNumber`: `string`; `status`: `"draft"` \| `"posted"` \| `"pending_approval"`; `totalCredit`: `number`; `totalDebit`: `number`; \}\>
