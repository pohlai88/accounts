[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / insertCustomer

# Function: insertCustomer()

> **insertCustomer**(`scope`, `input`): `Promise`\<`undefined` \| \{ `createdAt`: `null` \| `Date`; `creditLimit`: `null` \| `string`; `currency`: `string`; `customerNumber`: `string`; `id`: `string`; `name`: `string`; `paymentTerms`: `string`; \}\>

Defined in: [packages/db/src/repos.ts:474](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/repos.ts#L474)

Create a new customer

## Parameters

### scope

[`Scope`](../interfaces/Scope.md)

### input

[`CustomerInput`](../interfaces/CustomerInput.md)

## Returns

`Promise`\<`undefined` \| \{ `createdAt`: `null` \| `Date`; `creditLimit`: `null` \| `string`; `currency`: `string`; `customerNumber`: `string`; `id`: `string`; `name`: `string`; `paymentTerms`: `string`; \}\>
