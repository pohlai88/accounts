[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/ui](../../../README.md) / [hooks/use-tenant-management](../README.md) / useTenantManagement

# Function: useTenantManagement()

> **useTenantManagement**(): `object`

Defined in: [packages/ui/src/hooks/use-tenant-management.ts:45](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/hooks/use-tenant-management.ts#L45)

## Returns

`object`

### activeTenantId

> **activeTenantId**: `null` \| `string`

### currentUserRole

> **currentUserRole**: `string`

### error

> **error**: `null` \| `string`

### fetchMembers()

> **fetchMembers**: (`tenantId`) => `Promise`\<`void`\>

#### Parameters

##### tenantId

`string`

#### Returns

`Promise`\<`void`\>

### fetchTenants()

> **fetchTenants**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

### inviteUser()

> **inviteUser**: (`tenantId`, `email`, `role`) => `Promise`\<`void`\>

#### Parameters

##### tenantId

`string`

##### email

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>

### loading

> **loading**: `boolean`

### members

> **members**: [`Member`](../interfaces/Member.md)[]

### removeMember()

> **removeMember**: (`tenantId`, `userId`) => `Promise`\<`void`\>

#### Parameters

##### tenantId

`string`

##### userId

`string`

#### Returns

`Promise`\<`void`\>

### switchTenant()

> **switchTenant**: (`tenantId`) => `Promise`\<`void`\>

#### Parameters

##### tenantId

`string`

#### Returns

`Promise`\<`void`\>

### tenants

> **tenants**: [`Tenant`](../interfaces/Tenant.md)[]

### updateMemberRole()

> **updateMemberRole**: (`tenantId`, `userId`, `role`) => `Promise`\<`void`\>

#### Parameters

##### tenantId

`string`

##### userId

`string`

##### role

`string`

#### Returns

`Promise`\<`void`\>
