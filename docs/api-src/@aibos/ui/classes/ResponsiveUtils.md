[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/ui](../README.md) / [](../README.md) / ResponsiveUtils

# Class: ResponsiveUtils

Defined in: [packages/ui/src/components/common/ResponsiveProvider.tsx:253](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ResponsiveProvider.tsx#L253)

## Constructors

### Constructor

> **new ResponsiveUtils**(): `ResponsiveUtils`

#### Returns

`ResponsiveUtils`

## Methods

### getResponsiveClasses()

> `static` **getResponsiveClasses**(`classes`): `string`

Defined in: [packages/ui/src/components/common/ResponsiveProvider.tsx:254](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ResponsiveProvider.tsx#L254)

#### Parameters

##### classes

###### desktop?

`string`

###### largeDesktop?

`string`

###### mobile?

`string`

###### tablet?

`string`

#### Returns

`string`

***

### getResponsiveValue()

> `static` **getResponsiveValue**\<`T`\>(`values`): `undefined` \| `T`

Defined in: [packages/ui/src/components/common/ResponsiveProvider.tsx:276](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ResponsiveProvider.tsx#L276)

#### Type Parameters

##### T

`T`

#### Parameters

##### values

###### desktop?

`T`

###### largeDesktop?

`T`

###### mobile?

`T`

###### tablet?

`T`

#### Returns

`undefined` \| `T`

***

### isAboveBreakpoint()

> `static` **isAboveBreakpoint**(`breakpointName`): `boolean`

Defined in: [packages/ui/src/components/common/ResponsiveProvider.tsx:303](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ResponsiveProvider.tsx#L303)

#### Parameters

##### breakpointName

`string`

#### Returns

`boolean`

***

### isBelowBreakpoint()

> `static` **isBelowBreakpoint**(`breakpointName`): `boolean`

Defined in: [packages/ui/src/components/common/ResponsiveProvider.tsx:312](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ResponsiveProvider.tsx#L312)

#### Parameters

##### breakpointName

`string`

#### Returns

`boolean`

***

### isBreakpoint()

> `static` **isBreakpoint**(`breakpointName`): `boolean`

Defined in: [packages/ui/src/components/common/ResponsiveProvider.tsx:298](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/ui/src/components/common/ResponsiveProvider.tsx#L298)

#### Parameters

##### breakpointName

`string`

#### Returns

`boolean`
