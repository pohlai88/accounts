[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/security](../README.md) / [](../README.md) / GDPRCompliance

# Class: GDPRCompliance

Defined in: [packages/security/src/encryption.ts:315](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L315)

GDPR Compliance Utilities

## Constructors

### Constructor

> **new GDPRCompliance**(`encryptionManager`): `GDPRCompliance`

Defined in: [packages/security/src/encryption.ts:318](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L318)

#### Parameters

##### encryptionManager

[`EncryptionManager`](EncryptionManager.md)

#### Returns

`GDPRCompliance`

## Methods

### anonymizePersonalData()

> **anonymizePersonalData**(`data`): `Record`\<`string`, `string` \| `number` \| `boolean` \| `string`[]\>

Defined in: [packages/security/src/encryption.ts:325](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L325)

Anonymize personal data

#### Parameters

##### data

`Record`\<`string`, `string` \| `number` \| `boolean` \| `string`[]\>

#### Returns

`Record`\<`string`, `string` \| `number` \| `boolean` \| `string`[]\>

***

### generateRetentionPolicy()

> **generateRetentionPolicy**(`dataType`): `object`

Defined in: [packages/security/src/encryption.ts:342](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L342)

Generate data retention policy

#### Parameters

##### dataType

`string`

#### Returns

`object`

##### anonymizeAfter

> **anonymizeAfter**: `number`

##### autoDelete

> **autoDelete**: `boolean`

##### retentionPeriod

> **retentionPeriod**: `number`
