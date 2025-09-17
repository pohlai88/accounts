[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/security](../README.md) / EncryptionManager

# Class: EncryptionManager

Defined in: [packages/security/src/encryption.ts:30](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L30)

## Constructors

### Constructor

> **new EncryptionManager**(`config`): `EncryptionManager`

Defined in: [packages/security/src/encryption.ts:35](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L35)

#### Parameters

##### config

`Partial`\<[`EncryptionConfig`](../interfaces/EncryptionConfig.md)\> = `{}`

#### Returns

`EncryptionManager`

## Methods

### decrypt()

> **decrypt**(`encryptedData`, `password?`): `Promise`\<`any`\>

Defined in: [packages/security/src/encryption.ts:105](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L105)

Decrypt sensitive data

#### Parameters

##### encryptedData

[`EncryptedData`](../interfaces/EncryptedData.md)

##### password?

`string`

#### Returns

`Promise`\<`any`\>

***

### decryptPII()

> **decryptPII**(`encryptedData`, `tenantId`): `Promise`\<`Record`\<`string`, `any`\>\>

Defined in: [packages/security/src/encryption.ts:205](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L205)

Decrypt PII data

#### Parameters

##### encryptedData

`Record`\<`string`, `string`\>

##### tenantId

`string`

#### Returns

`Promise`\<`Record`\<`string`, `any`\>\>

***

### encrypt()

> **encrypt**(`data`, `password?`): `Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

Defined in: [packages/security/src/encryption.ts:68](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L68)

Encrypt sensitive data

#### Parameters

##### data

`any`

##### password?

`string`

#### Returns

`Promise`\<[`EncryptedData`](../interfaces/EncryptedData.md)\>

***

### encryptPII()

> **encryptPII**(`piiData`, `tenantId`): `Promise`\<`Record`\<`string`, `string`\>\>

Defined in: [packages/security/src/encryption.ts:184](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L184)

Encrypt PII data

#### Parameters

##### piiData

`Record`\<`string`, `any`\>

##### tenantId

`string`

#### Returns

`Promise`\<`Record`\<`string`, `string`\>\>

***

### generateSecurePassword()

> **generateSecurePassword**(`length`): `string`

Defined in: [packages/security/src/encryption.ts:169](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L169)

Generate secure password

#### Parameters

##### length

`number` = `16`

#### Returns

`string`

***

### generateSecureRandom()

> **generateSecureRandom**(`length`): `string`

Defined in: [packages/security/src/encryption.ts:162](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L162)

Generate secure random string

#### Parameters

##### length

`number` = `32`

#### Returns

`string`

***

### generateTenantKey()

> **generateTenantKey**(`tenantId`): `Promise`\<`string`\>

Defined in: [packages/security/src/encryption.ts:263](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L263)

Generate data encryption key for tenant

#### Parameters

##### tenantId

`string`

#### Returns

`Promise`\<`string`\>

***

### hash()

> **hash**(`data`, `algorithm`): `string`

Defined in: [packages/security/src/encryption.ts:146](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L146)

Hash sensitive data (one-way)

#### Parameters

##### data

`string`

##### algorithm

`string` = `"sha256"`

#### Returns

`string`

***

### hashWithSalt()

> **hashWithSalt**(`data`, `salt`, `algorithm`): `string`

Defined in: [packages/security/src/encryption.ts:153](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L153)

Hash with salt

#### Parameters

##### data

`string`

##### salt

`string`

##### algorithm

`string` = `"sha256"`

#### Returns

`string`

***

### maskSensitiveData()

> **maskSensitiveData**(`data`, `fields`): `any`

Defined in: [packages/security/src/encryption.ts:231](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L231)

Mask sensitive data for logging

#### Parameters

##### data

`any`

##### fields

`string`[] = `...`

#### Returns

`any`

***

### maskString()

> **maskString**(`data`): `string`

Defined in: [packages/security/src/encryption.ts:322](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L322)

Mask string data

#### Parameters

##### data

`string`

#### Returns

`string`

***

### setMasterKey()

> **setMasterKey**(`key`): `void`

Defined in: [packages/security/src/encryption.ts:57](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L57)

Set master encryption key

#### Parameters

##### key

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

`void`

***

### verifyIntegrity()

> **verifyIntegrity**(`data`, `hash`, `algorithm`): `boolean`

Defined in: [packages/security/src/encryption.ts:272](https://github.com/pohlai88/accounts/blob/40016c553531e31c50d7dcad114ff9c2ce691261/packages/security/src/encryption.ts#L272)

Verify data integrity

#### Parameters

##### data

`string`

##### hash

`string`

##### algorithm

`string` = `"sha256"`

#### Returns

`boolean`
