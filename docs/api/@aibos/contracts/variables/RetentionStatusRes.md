[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/contracts](../README.md) / [](../README.md) / RetentionStatusRes

# Variable: RetentionStatusRes

> `const` **RetentionStatusRes**: `ZodObject`\<\{ `attachmentId`: `ZodString`; `complianceStatus`: `ZodEnum`\<\[`"compliant"`, `"expiring_soon"`, `"expired"`, `"on_hold"`\]\>; `daysUntilExpiry`: `ZodOptional`\<`ZodNumber`\>; `hasRetentionPolicy`: `ZodBoolean`; `legalHoldReason`: `ZodOptional`\<`ZodString`\>; `legalHoldUntil`: `ZodOptional`\<`ZodString`\>; `nextAction`: `ZodOptional`\<`ZodEnum`\<\[`"none"`, `"archive"`, `"delete"`, `"review"`\]\>\>; `nextActionDate`: `ZodOptional`\<`ZodString`\>; `onLegalHold`: `ZodBoolean`; `policyName`: `ZodOptional`\<`ZodString`\>; `retentionUntil`: `ZodOptional`\<`ZodString`\>; \}, `"strip"`, `ZodTypeAny`, \{ `attachmentId`: `string`; `complianceStatus`: `"compliant"` \| `"expiring_soon"` \| `"expired"` \| `"on_hold"`; `daysUntilExpiry?`: `number`; `hasRetentionPolicy`: `boolean`; `legalHoldReason?`: `string`; `legalHoldUntil?`: `string`; `nextAction?`: `"delete"` \| `"archive"` \| `"review"` \| `"none"`; `nextActionDate?`: `string`; `onLegalHold`: `boolean`; `policyName?`: `string`; `retentionUntil?`: `string`; \}, \{ `attachmentId`: `string`; `complianceStatus`: `"compliant"` \| `"expiring_soon"` \| `"expired"` \| `"on_hold"`; `daysUntilExpiry?`: `number`; `hasRetentionPolicy`: `boolean`; `legalHoldReason?`: `string`; `legalHoldUntil?`: `string`; `nextAction?`: `"delete"` \| `"archive"` \| `"review"` \| `"none"`; `nextActionDate?`: `string`; `onLegalHold`: `boolean`; `policyName?`: `string`; `retentionUntil?`: `string`; \}\>

Defined in: [packages/contracts/src/attachments.ts:446](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/contracts/src/attachments.ts#L446)
