[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/security](../README.md) / [](../README.md) / EncryptionManager

# Class: EncryptionManager

Defined in: [packages/security/src/encryption.ts:7](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L7)

## Constructors

### Constructor

> **new EncryptionManager**(`config`): `EncryptionManager`

Defined in: [packages/security/src/encryption.ts:12](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L12)

#### Parameters

##### config

`Partial`\<[`EncryptionConfig`](../types/interfaces/EncryptionConfig.md)\> = `{}`

#### Returns

`EncryptionManager`

## Methods

### decrypt()

> **decrypt**(`encryptedData`, `password?`): `Promise`\<`string` \| `Record`\<`string`, `unknown`\>\>

Defined in: [packages/security/src/encryption.ts:82](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L82)

Decrypt sensitive data

#### Parameters

##### encryptedData

[`EncryptedData`](../types/interfaces/EncryptedData.md)

##### password?

`string`

#### Returns

`Promise`\<`string` \| `Record`\<`string`, `unknown`\>\>

***

### decryptPII()

> **decryptPII**(`encryptedData`, `tenantId`): `Promise`\<`Record`\<`string`, `string` \| `number` \| `boolean` \| `string`[]\>\>

Defined in: [packages/security/src/encryption.ts:182](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L182)

Decrypt PII data

#### Parameters

##### encryptedData

`Record`\<`string`, `string`\>

##### tenantId

`string`

#### Returns

`Promise`\<`Record`\<`string`, `string` \| `number` \| `boolean` \| `string`[]\>\>

***

### encrypt()

> **encrypt**(`data`, `password?`): `Promise`\<[`EncryptedData`](../types/interfaces/EncryptedData.md)\>

Defined in: [packages/security/src/encryption.ts:45](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L45)

Encrypt sensitive data

#### Parameters

##### data

`string` | `Buffer`\<`ArrayBufferLike`\> | `Record`\<`string`, `unknown`\>

##### password?

`string`

#### Returns

`Promise`\<[`EncryptedData`](../types/interfaces/EncryptedData.md)\>

***

### encryptPII()

> **encryptPII**(`piiData`, `tenantId`): `Promise`\<`Record`\<`string`, `string`\>\>

Defined in: [packages/security/src/encryption.ts:161](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L161)

Encrypt PII data

#### Parameters

##### piiData

`Record`\<`string`, `string` \| `number` \| `boolean` \| `string`[]\>

##### tenantId

`string`

#### Returns

`Promise`\<`Record`\<`string`, `string`\>\>

***

### generateSecurePassword()

> **generateSecurePassword**(`length`): `string`

Defined in: [packages/security/src/encryption.ts:146](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L146)

Generate secure password

#### Parameters

##### length

`number` = `16`

#### Returns

`string`

***

### generateSecureRandom()

> **generateSecureRandom**(`length`): `string`

Defined in: [packages/security/src/encryption.ts:139](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L139)

Generate secure random string

#### Parameters

##### length

`number` = `32`

#### Returns

`string`

***

### generateTenantKey()

> **generateTenantKey**(`tenantId`): `Promise`\<`string`\>

Defined in: [packages/security/src/encryption.ts:240](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L240)

Generate data encryption key for tenant

#### Parameters

##### tenantId

`string`

#### Returns

`Promise`\<`string`\>

***

### hash()

> **hash**(`data`, `algorithm`): `string`

Defined in: [packages/security/src/encryption.ts:123](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L123)

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

Defined in: [packages/security/src/encryption.ts:130](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L130)

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

> **maskSensitiveData**(`data`, `fields`): `string` \| `Record`\<`string`, `unknown`\>

Defined in: [packages/security/src/encryption.ts:208](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L208)

Mask sensitive data for logging

#### Parameters

##### data

`string` | `Record`\<`string`, `unknown`\>

##### fields

`string`[] = `...`

#### Returns

`string` \| `Record`\<`string`, `unknown`\>

***

### maskString()

> **maskString**(`data`): `string`

Defined in: [packages/security/src/encryption.ts:299](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L299)

Mask string data

#### Parameters

##### data

`string`

#### Returns

`string`

***

### setMasterKey()

> **setMasterKey**(`key`): `void`

Defined in: [packages/security/src/encryption.ts:34](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L34)

Set master encryption key

#### Parameters

##### key

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

`void`

***

### verifyIntegrity()

> **verifyIntegrity**(`data`, `hash`, `algorithm`): `boolean`

Defined in: [packages/security/src/encryption.ts:249](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/security/src/encryption.ts#L249)

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
