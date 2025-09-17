[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / getCompanySettings

# Function: getCompanySettings()

> **getCompanySettings**(`scope`): `Promise`\<`null` \| \{ `autoPostInvoices`: `boolean`; `defaultApAccountId?`: `null` \| `string`; `defaultArAccountId?`: `null` \| `string`; `defaultBankAccountId?`: `null` \| `string`; `defaultCashAccountId?`: `null` \| `string`; `defaultTaxAccountId?`: `null` \| `string`; `requireApprovalForPosting`: `boolean`; \}\>

Defined in: [packages/db/src/repos.ts:1017](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L1017)

Get company settings including default AR account

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

## Returns

`Promise`\<`null` \| \{ `autoPostInvoices`: `boolean`; `defaultApAccountId?`: `null` \| `string`; `defaultArAccountId?`: `null` \| `string`; `defaultBankAccountId?`: `null` \| `string`; `defaultCashAccountId?`: `null` \| `string`; `defaultTaxAccountId?`: `null` \| `string`; `requireApprovalForPosting`: `boolean`; \}\>
