[**AI-BOS Accounts API Documentation**](../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../README.md) / [@aibos/accounting](../../README.md) / [posting](../README.md) / postJournal

# Function: postJournal()

> **postJournal**(`input`): `Promise`\<\{ `accountDetails`: `Map`\<`string`, [`AccountInfo`](../../../db/interfaces/AccountInfo.md)\>; `approverRoles`: `undefined` \| `string`[]; `coaWarnings`: `object`[]; `requiresApproval`: `boolean`; `totalCredit`: `number`; `totalDebit`: `number`; `validated`: `boolean`; \}\>

Defined in: [packages/accounting/src/posting.ts:156](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/accounting/src/posting.ts#L156)

## Parameters

### input

[`JournalPostingInput`](../interfaces/JournalPostingInput.md)

## Returns

`Promise`\<\{ `accountDetails`: `Map`\<`string`, [`AccountInfo`](../../../db/interfaces/AccountInfo.md)\>; `approverRoles`: `undefined` \| `string`[]; `coaWarnings`: `object`[]; `requiresApproval`: `boolean`; `totalCredit`: `number`; `totalDebit`: `number`; `validated`: `boolean`; \}\>
