[konviw]() / [Exports](../modules.md) / [context/context.service](../modules/context_context_service.md) / ContextService

# Class: ContextService

[context/context.service](../modules/context_context_service.md).ContextService

## Constructors

### constructor

\+ **new ContextService**(`config`: *ConfigService*<Record<string, any\>\>): [*ContextService*](context_context_service.contextservice.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | *ConfigService*<Record<string, any\>\> |

**Returns:** [*ContextService*](context_context_service.contextservice.md)

Defined in: [src/context/context.service.ts:23](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L23)

## Properties

### author

• `Private` **author**: *string*= ''

Defined in: [src/context/context.service.ts:14](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L14)

___

### avatar

• `Private` **avatar**: *string*= ''

Defined in: [src/context/context.service.ts:16](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L16)

___

### cheerioBody

• `Private` **cheerioBody**: CheerioStatic

Defined in: [src/context/context.service.ts:12](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L12)

___

### email

• `Private` **email**: *string*= ''

Defined in: [src/context/context.service.ts:15](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L15)

___

### excerpt

• `Private` **excerpt**: *string*= ''

Defined in: [src/context/context.service.ts:17](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L17)

___

### friendlyWhen

• `Private` **friendlyWhen**: *string*= ''

Defined in: [src/context/context.service.ts:20](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L20)

___

### fullWidth

• `Private` **fullWidth**: *boolean*= false

Defined in: [src/context/context.service.ts:22](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L22)

___

### imgblog

• `Private` **imgblog**: *string*= ''

Defined in: [src/context/context.service.ts:18](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L18)

___

### logger

• `Private` `Readonly` **logger**: *Logger*

Defined in: [src/context/context.service.ts:8](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L8)

___

### observer

• `Private` **observer**: *PerformanceObserver*

Defined in: [src/context/context.service.ts:23](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L23)

___

### pageId

• `Private` **pageId**: *string*= ''

Defined in: [src/context/context.service.ts:10](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L10)

___

### searchResults

• `Private` **searchResults**: *string*= ''

Defined in: [src/context/context.service.ts:21](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L21)

___

### spaceKey

• `Private` **spaceKey**: *string*= ''

Defined in: [src/context/context.service.ts:9](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L9)

___

### theme

• `Private` **theme**: *string*= 'light'

Defined in: [src/context/context.service.ts:11](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L11)

___

### title

• `Private` **title**: *string*= ''

Defined in: [src/context/context.service.ts:13](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L13)

___

### when

• `Private` **when**: *string*= ''

Defined in: [src/context/context.service.ts:19](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L19)

## Methods

### Close

▸ **Close**(): *void*

**Returns:** *void*

Defined in: [src/context/context.service.ts:45](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L45)

___

### Init

▸ **Init**(`spaceKey`: *string*, `pageId`: *string*, `theme?`: *string*): *void*

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `spaceKey` | *string* | - |
| `pageId` | *string* | - |
| `theme` | *string* | '' |

**Returns:** *void*

Defined in: [src/context/context.service.ts:30](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L30)

___

### getAuthor

▸ **getAuthor**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:121](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L121)

___

### getAvatar

▸ **getAvatar**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:150](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L150)

___

### getCheerioBody

▸ **getCheerioBody**(): CheerioStatic

**Returns:** CheerioStatic

Defined in: [src/context/context.service.ts:83](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L83)

___

### getEmail

▸ **getEmail**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:129](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L129)

___

### getExcerpt

▸ **getExcerpt**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:164](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L164)

___

### getFriendlyWhen

▸ **getFriendlyWhen**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:141](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L141)

___

### getHtmlBody

▸ **getHtmlBody**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:88](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L88)

___

### getImgBlog

▸ **getImgBlog**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:172](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L172)

___

### getPageId

▸ **getPageId**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:67](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L67)

___

### getPerfMeasure

▸ **getPerfMeasure**(`mark`: *string*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `mark` | *string* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:59](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L59)

___

### getReadTime

▸ **getReadTime**(): *number*

**Returns:** *number*

Defined in: [src/context/context.service.ts:158](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L158)

___

### getResults

▸ **getResults**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:101](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L101)

___

### getSpaceKey

▸ **getSpaceKey**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:71](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L71)

___

### getTextBody

▸ **getTextBody**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:92](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L92)

___

### getTheme

▸ **getTheme**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:117](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L117)

___

### getTitle

▸ **getTitle**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:75](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L75)

___

### getWhen

▸ **getWhen**(): *string*

**Returns:** *string*

Defined in: [src/context/context.service.ts:137](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L137)

___

### isFullWidth

▸ **isFullWidth**(): *boolean*

**Returns:** *boolean*

Defined in: [src/context/context.service.ts:109](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L109)

___

### setAuthor

▸ **setAuthor**(`author`: *string*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `author` | *string* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:125](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L125)

___

### setAvatar

▸ **setAvatar**(`avatar`: *string*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `avatar` | *string* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:154](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L154)

___

### setEmail

▸ **setEmail**(`email`: *string*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `email` | *string* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:133](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L133)

___

### setExcerpt

▸ **setExcerpt**(`excerpt`: *any*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `excerpt` | *any* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:168](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L168)

___

### setFullWidth

▸ **setFullWidth**(`fullWidth`: *boolean*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `fullWidth` | *boolean* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:113](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L113)

___

### setHtmlBody

▸ **setHtmlBody**(`body`: *string*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | *string* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:97](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L97)

___

### setImgBlog

▸ **setImgBlog**(`imgblog`: *any*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `imgblog` | *any* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:176](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L176)

___

### setPerfMark

▸ **setPerfMark**(`mark`: *string*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `mark` | *string* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:52](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L52)

___

### setResults

▸ **setResults**(`results`: *string*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `results` | *string* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:105](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L105)

___

### setTitle

▸ **setTitle**(`title`: *string*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `title` | *string* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:79](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L79)

___

### setWhen

▸ **setWhen**(`when`: *string*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `when` | *string* |

**Returns:** *void*

Defined in: [src/context/context.service.ts:145](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/context/context.service.ts#L145)
