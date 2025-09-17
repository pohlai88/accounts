[**AI-BOS Accounts API Documentation**](../../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../../README.md) / [@aibos/utils](../../README.md) / [axiom](../README.md) / AxiomBatcher

# Class: AxiomBatcher

Defined in: [packages/utils/src/axiom.ts:190](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/axiom.ts#L190)

## Constructors

### Constructor

> **new AxiomBatcher**(`dataset`, `batchSize`, `flushInterval`): `AxiomBatcher`

Defined in: [packages/utils/src/axiom.ts:196](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/axiom.ts#L196)

#### Parameters

##### dataset

`"app_web_prod"` | `"app_web_staging"` | `"api_prod"` | `"api_staging"` | `"jobs_prod"` | `"jobs_staging"`

##### batchSize

`number` = `100`

##### flushInterval

`number` = `5000`

#### Returns

`AxiomBatcher`

## Methods

### add()

> **add**(`event`): `void`

Defined in: [packages/utils/src/axiom.ts:206](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/axiom.ts#L206)

#### Parameters

##### event

`Partial`\<[`AxiomEvent`](../interfaces/AxiomEvent.md)\>

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/utils/src/axiom.ts:229](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/axiom.ts#L229)

#### Returns

`void`

***

### flush()

> **flush**(): `Promise`\<`void`\>

Defined in: [packages/utils/src/axiom.ts:214](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/axiom.ts#L214)

#### Returns

`Promise`\<`void`\>
