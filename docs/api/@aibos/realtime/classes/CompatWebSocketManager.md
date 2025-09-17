[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/realtime](../README.md) / [](../README.md) / CompatWebSocketManager

# Class: CompatWebSocketManager

Defined in: [packages/realtime/src/compat/WebSocketManager.ts:9](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/compat/WebSocketManager.ts#L9)

## Constructors

### Constructor

> **new CompatWebSocketManager**(): `WebSocketManager`

#### Returns

`WebSocketManager`

## Methods

### ~~getConnectionsByTenant()~~

> `static` **getConnectionsByTenant**(`tenantId`): [`ConnectionInfo`](../interfaces/ConnectionInfo.md)[]

Defined in: [packages/realtime/src/compat/WebSocketManager.ts:13](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/compat/WebSocketManager.ts#L13)

#### Parameters

##### tenantId

`string`

#### Returns

[`ConnectionInfo`](../interfaces/ConnectionInfo.md)[]

#### Deprecated

Use CoreWebSocketManager.getConnectionsByTenant() instead

***

### ~~getConnectionsByUser()~~

> `static` **getConnectionsByUser**(`userId`): [`ConnectionInfo`](../interfaces/ConnectionInfo.md)[]

Defined in: [packages/realtime/src/compat/WebSocketManager.ts:23](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/compat/WebSocketManager.ts#L23)

#### Parameters

##### userId

`string`

#### Returns

[`ConnectionInfo`](../interfaces/ConnectionInfo.md)[]

#### Deprecated

Use CoreWebSocketManager.getConnectionsByUser() instead
