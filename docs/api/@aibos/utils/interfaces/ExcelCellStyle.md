[**AI-BOS Accounts API Documentation**](../../../README.md)

***

[AI-BOS Accounts API Documentation](../../../README.md) / [@aibos/utils](../README.md) / [](../README.md) / ExcelCellStyle

# Interface: ExcelCellStyle

Defined in: [packages/utils/src/export/types.ts:26](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L26)

## Properties

### alignment?

> `optional` **alignment**: `object`

Defined in: [packages/utils/src/export/types.ts:37](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L37)

#### horizontal?

> `optional` **horizontal**: `"left"` \| `"center"` \| `"right"`

#### vertical?

> `optional` **vertical**: `"center"` \| `"top"` \| `"bottom"`

***

### border?

> `optional` **border**: `object`

Defined in: [packages/utils/src/export/types.ts:41](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L41)

#### bottom?

> `optional` **bottom**: `object`

##### bottom.color?

> `optional` **color**: `object`

##### bottom.color.rgb

> **rgb**: `string`

##### bottom.style

> **style**: `string`

#### left?

> `optional` **left**: `object`

##### left.color?

> `optional` **color**: `object`

##### left.color.rgb

> **rgb**: `string`

##### left.style

> **style**: `string`

#### right?

> `optional` **right**: `object`

##### right.color?

> `optional` **color**: `object`

##### right.color.rgb

> **rgb**: `string`

##### right.style

> **style**: `string`

#### top?

> `optional` **top**: `object`

##### top.color?

> `optional` **color**: `object`

##### top.color.rgb

> **rgb**: `string`

##### top.style

> **style**: `string`

***

### fill?

> `optional` **fill**: `object`

Defined in: [packages/utils/src/export/types.ts:33](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L33)

#### bgColor?

> `optional` **bgColor**: `object`

##### bgColor.rgb

> **rgb**: `string`

#### fgColor?

> `optional` **fgColor**: `object`

##### fgColor.rgb

> **rgb**: `string`

***

### font?

> `optional` **font**: `object`

Defined in: [packages/utils/src/export/types.ts:27](https://github.com/pohlai88/accounts/blob/48103fb36d28b2b9bfb33472b6de2f719773cde9/packages/utils/src/export/types.ts#L27)

#### bold?

> `optional` **bold**: `boolean`

#### color?

> `optional` **color**: `object`

##### color.rgb

> **rgb**: `string`

#### italic?

> `optional` **italic**: `boolean`

#### size?

> `optional` **size**: `number`
