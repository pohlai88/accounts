[**AI-BOS Accounts API Documentation (Source)**](../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../README.md) / [@aibos/accounting](../../README.md) / [posting](../README.md) / validateJournalPosting

# Function: validateJournalPosting()

> **validateJournalPosting**(`input`): `Promise`\<\{ `accountDetails`: `Map`\<`string`, [`AccountInfo`](../../../db/interfaces/AccountInfo.md)\>; `approverRoles`: `undefined` \| `string`[]; `coaWarnings`: `object`[]; `requiresApproval`: `boolean`; `totalCredit`: `number`; `totalDebit`: `number`; `validated`: `boolean`; \}\>

Defined in: [packages/accounting/src/posting.ts:97](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L97)

## Parameters

### input

[`JournalPostingInput`](../interfaces/JournalPostingInput.md)

## Returns

`Promise`\<\{ `accountDetails`: `Map`\<`string`, [`AccountInfo`](../../../db/interfaces/AccountInfo.md)\>; `approverRoles`: `undefined` \| `string`[]; `coaWarnings`: `object`[]; `requiresApproval`: `boolean`; `totalCredit`: `number`; `totalDebit`: `number`; `validated`: `boolean`; \}\>
