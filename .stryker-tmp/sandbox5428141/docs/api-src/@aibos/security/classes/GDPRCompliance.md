[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/security](../README.md) / GDPRCompliance

# Class: GDPRCompliance

Defined in: [packages/security/src/encryption.ts:338](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L338)

GDPR Compliance Utilities

## Constructors

### Constructor

> **new GDPRCompliance**(`encryptionManager`): `GDPRCompliance`

Defined in: [packages/security/src/encryption.ts:341](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L341)

#### Parameters

##### encryptionManager

[`EncryptionManager`](EncryptionManager.md)

#### Returns

`GDPRCompliance`

## Methods

### anonymizePersonalData()

> **anonymizePersonalData**(`data`): `Record`\<`string`, `any`\>

Defined in: [packages/security/src/encryption.ts:348](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L348)

Anonymize personal data

#### Parameters

##### data

`Record`\<`string`, `any`\>

#### Returns

`Record`\<`string`, `any`\>

***

### generateRetentionPolicy()

> **generateRetentionPolicy**(`dataType`): `object`

Defined in: [packages/security/src/encryption.ts:365](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L365)

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
