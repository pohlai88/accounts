[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/realtime](../README.md) / [](../README.md) / NotificationPreferences

# Interface: NotificationPreferences

Defined in: [packages/realtime/src/notification-system.ts:37](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/notification-system.ts#L37)

## Properties

### categories

> **categories**: `Record`\<`string`, \{ `channels`: (`"push"` \| `"email"` \| `"sms"` \| `"websocket"`)[]; `enabled`: `boolean`; `quietHours?`: \{ `end`: `string`; `start`: `string`; `timezone`: `string`; \}; \}\>

Defined in: [packages/realtime/src/notification-system.ts:40](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/notification-system.ts#L40)

***

### globalSettings

> **globalSettings**: `object`

Defined in: [packages/realtime/src/notification-system.ts:52](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/notification-system.ts#L52)

#### autoMarkRead

> **autoMarkRead**: `boolean`

#### autoMarkReadDelay

> **autoMarkReadDelay**: `number`

#### enableEmail

> **enableEmail**: `boolean`

#### enablePush

> **enablePush**: `boolean`

#### enableSMS

> **enableSMS**: `boolean`

#### enableWebSocket

> **enableWebSocket**: `boolean`

#### maxNotifications

> **maxNotifications**: `number`

***

### tenantId

> **tenantId**: `string`

Defined in: [packages/realtime/src/notification-system.ts:39](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/notification-system.ts#L39)

***

### userId

> **userId**: `string`

Defined in: [packages/realtime/src/notification-system.ts:38](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/realtime/src/notification-system.ts#L38)
