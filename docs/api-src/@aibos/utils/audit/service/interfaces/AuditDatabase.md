[**AI-BOS Accounts API Documentation (Source)**](../../../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../../../README.md) / [@aibos/utils](../../../README.md) / [audit/service](../README.md) / AuditDatabase

# Interface: AuditDatabase

Defined in: [packages/utils/src/audit/service.ts:37](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L37)

Database interface for audit operations

## Properties

### insert()

> **insert**: (`table`) => `object`

Defined in: [packages/utils/src/audit/service.ts:38](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L38)

#### Parameters

##### table

`unknown`

#### Returns

`object`

##### values()

> **values**: (`values`) => `Promise`\<`unknown`\>

###### Parameters

###### values

`unknown`

###### Returns

`Promise`\<`unknown`\>

***

### select()

> **select**: () => `object`

Defined in: [packages/utils/src/audit/service.ts:41](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/audit/service.ts#L41)

#### Returns

`object`

##### from()

> **from**: (`table`) => `object`

###### Parameters

###### table

`unknown`

###### Returns

`object`

###### where()

> **where**: (`condition`) => `object`

###### Parameters

###### condition

`unknown`

###### Returns

`object`

###### orderBy()

> **orderBy**: (`order`) => `object`

###### Parameters

###### order

`unknown`

###### Returns

`object`

###### limit()

> **limit**: (`limit`) => `object`

###### Parameters

###### limit

`number`

###### Returns

`object`

###### offset()

> **offset**: (`offset`) => ...

###### Parameters

###### offset

...

###### Returns

...
