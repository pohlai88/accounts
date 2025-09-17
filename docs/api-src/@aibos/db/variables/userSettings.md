[**AI-BOS Accounts API Documentation (Source)**](../../../README.md)

***

[AI-BOS Accounts API Documentation (Source)](../../../README.md) / [@aibos/db](../README.md) / [](../README.md) / userSettings

# Variable: userSettings

> `const` **userSettings**: `PgTableWithColumns`\<\{ `columns`: \{ `activeTenantId`: `PgColumn`\<\{ `baseColumn`: `never`; `columnType`: `"PgUUID"`; `data`: `string`; `dataType`: `"string"`; `driverParam`: `string`; `enumValues`: `undefined`; `generated`: `undefined`; `hasDefault`: `false`; `hasRuntimeDefault`: `false`; `isAutoincrement`: `false`; `isPrimaryKey`: `false`; `name`: `"active_tenant_id"`; `notNull`: `false`; `tableName`: `"user_settings"`; \}, \{ \}, \{ \}\>; `createdAt`: `PgColumn`\<\{ `baseColumn`: `never`; `columnType`: `"PgTimestamp"`; `data`: `Date`; `dataType`: `"date"`; `driverParam`: `string`; `enumValues`: `undefined`; `generated`: `undefined`; `hasDefault`: `true`; `hasRuntimeDefault`: `false`; `isAutoincrement`: `false`; `isPrimaryKey`: `false`; `name`: `"created_at"`; `notNull`: `false`; `tableName`: `"user_settings"`; \}, \{ \}, \{ \}\>; `updatedAt`: `PgColumn`\<\{ `baseColumn`: `never`; `columnType`: `"PgTimestamp"`; `data`: `Date`; `dataType`: `"date"`; `driverParam`: `string`; `enumValues`: `undefined`; `generated`: `undefined`; `hasDefault`: `true`; `hasRuntimeDefault`: `false`; `isAutoincrement`: `false`; `isPrimaryKey`: `false`; `name`: `"updated_at"`; `notNull`: `false`; `tableName`: `"user_settings"`; \}, \{ \}, \{ \}\>; `userId`: `PgColumn`\<\{ `baseColumn`: `never`; `columnType`: `"PgUUID"`; `data`: `string`; `dataType`: `"string"`; `driverParam`: `string`; `enumValues`: `undefined`; `generated`: `undefined`; `hasDefault`: `false`; `hasRuntimeDefault`: `false`; `isAutoincrement`: `false`; `isPrimaryKey`: `true`; `name`: `"user_id"`; `notNull`: `true`; `tableName`: `"user_settings"`; \}, \{ \}, \{ \}\>; \}; `dialect`: `"pg"`; `name`: `"user_settings"`; `schema`: `undefined`; \}\>

Defined in: [packages/db/src/schema-user-settings.ts:6](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/db/src/schema-user-settings.ts#L6)
