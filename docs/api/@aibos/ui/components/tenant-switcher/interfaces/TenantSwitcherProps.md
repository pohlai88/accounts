[**AI-BOS Accounts API Documentation**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../../README.md) / [@aibos/ui](../../../README.md) / [components/tenant-switcher](../README.md) / TenantSwitcherProps

# Interface: TenantSwitcherProps

Defined in: [packages/ui/src/components/tenant-switcher.tsx:41](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L41)

## Properties

### activeTenantId

> **activeTenantId**: `null` \| `string`

Defined in: [packages/ui/src/components/tenant-switcher.tsx:43](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L43)

***

### className?

> `optional` **className**: `string`

Defined in: [packages/ui/src/components/tenant-switcher.tsx:48](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L48)

***

### loading?

> `optional` **loading**: `boolean`

Defined in: [packages/ui/src/components/tenant-switcher.tsx:47](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L47)

***

### onCreateTenant()?

> `optional` **onCreateTenant**: () => `void`

Defined in: [packages/ui/src/components/tenant-switcher.tsx:45](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L45)

#### Returns

`void`

***

### onManageTenants()?

> `optional` **onManageTenants**: () => `void`

Defined in: [packages/ui/src/components/tenant-switcher.tsx:46](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L46)

#### Returns

`void`

***

### onTenantSwitch()

> **onTenantSwitch**: (`tenantId`) => `Promise`\<`void`\>

Defined in: [packages/ui/src/components/tenant-switcher.tsx:44](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L44)

#### Parameters

##### tenantId

`string`

#### Returns

`Promise`\<`void`\>

***

### showStatistics?

> `optional` **showStatistics**: `boolean`

Defined in: [packages/ui/src/components/tenant-switcher.tsx:49](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L49)

***

### showSubscription?

> `optional` **showSubscription**: `boolean`

Defined in: [packages/ui/src/components/tenant-switcher.tsx:50](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L50)

***

### tenants

> **tenants**: [`Tenant`](Tenant.md)[]

Defined in: [packages/ui/src/components/tenant-switcher.tsx:42](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/tenant-switcher.tsx#L42)
