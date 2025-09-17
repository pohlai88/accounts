[**AI-BOS Accounts API Documentation**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../../README.md) / [@aibos/ui](../../../README.md) / [components/member-management](../README.md) / MemberManagementProps

# Interface: MemberManagementProps

Defined in: [packages/ui/src/components/member-management.tsx:30](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/member-management.tsx#L30)

## Properties

### className?

> `optional` **className**: `string`

Defined in: [packages/ui/src/components/member-management.tsx:37](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/member-management.tsx#L37)

***

### currentUserRole

> **currentUserRole**: `string`

Defined in: [packages/ui/src/components/member-management.tsx:32](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/member-management.tsx#L32)

***

### loading?

> `optional` **loading**: `boolean`

Defined in: [packages/ui/src/components/member-management.tsx:36](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/member-management.tsx#L36)

***

### members

> **members**: [`Member`](Member.md)[]

Defined in: [packages/ui/src/components/member-management.tsx:31](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/member-management.tsx#L31)

***

### onInviteUser()

> **onInviteUser**: (`email`, `role`) => `Promise`\<`void`\>

Defined in: [packages/ui/src/components/member-management.tsx:33](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/member-management.tsx#L33)

#### Parameters

##### email

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>

***

### onRemoveMember()

> **onRemoveMember**: (`userId`) => `Promise`\<`void`\>

Defined in: [packages/ui/src/components/member-management.tsx:34](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/member-management.tsx#L34)

#### Parameters

##### userId

`string`

#### Returns

`Promise`\<`void`\>

***

### onUpdateRole()

> **onUpdateRole**: (`userId`, `role`) => `Promise`\<`void`\>

Defined in: [packages/ui/src/components/member-management.tsx:35](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/member-management.tsx#L35)

#### Parameters

##### userId

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>
