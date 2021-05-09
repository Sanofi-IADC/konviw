[konviw]() / [Exports](../modules.md) / [proxy-page/steps/toc/Toc](../modules/proxy_page_steps_toc_toc.md) / default

# Class: default

[proxy-page/steps/toc/Toc](../modules/proxy_page_steps_toc_toc.md).default

## Hierarchy

- [*default*](proxy_page_steps_toc_tocsection.default.md)

  ↳ **default**

## Constructors

### constructor

\+ **new default**(`renderingStrategy`: [*default*](../interfaces/proxy_page_steps_toc_tocrenderingstrategy.default.md), `filters`: [*default*](../interfaces/proxy_page_steps_toc_tocfilter.default.md)[]): [*default*](proxy_page_steps_toc_toc.default.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `renderingStrategy` | [*default*](../interfaces/proxy_page_steps_toc_tocrenderingstrategy.default.md) |
| `filters` | [*default*](../interfaces/proxy_page_steps_toc_tocfilter.default.md)[] |

**Returns:** [*default*](proxy_page_steps_toc_toc.default.md)

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md)

Defined in: [src/proxy-page/steps/toc/TocSection.ts:5](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocSection.ts#L5)

\+ **new default**(`renderingStrategy`: [*default*](../interfaces/proxy_page_steps_toc_tocrenderingstrategy.default.md), `filters`: [*default*](../interfaces/proxy_page_steps_toc_tocfilter.default.md)[], `parent`: [*default*](proxy_page_steps_toc_tocsection.default.md), `title`: *string*, `id`: *string*): [*default*](proxy_page_steps_toc_toc.default.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `renderingStrategy` | [*default*](../interfaces/proxy_page_steps_toc_tocrenderingstrategy.default.md) |
| `filters` | [*default*](../interfaces/proxy_page_steps_toc_tocfilter.default.md)[] |
| `parent` | [*default*](proxy_page_steps_toc_tocsection.default.md) |
| `title` | *string* |
| `id` | *string* |

**Returns:** [*default*](proxy_page_steps_toc_toc.default.md)

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md)

Defined in: [src/proxy-page/steps/toc/TocSection.ts:8](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocSection.ts#L8)

## Properties

### children

• `Readonly` **children**: [*default*](proxy_page_steps_toc_tocsection.default.md)[]= []

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md).[children](proxy_page_steps_toc_tocsection.default.md#children)

Defined in: [src/proxy-page/steps/toc/TocSection.ts:5](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocSection.ts#L5)

___

### id

• `Optional` `Readonly` **id**: *string*

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md).[id](proxy_page_steps_toc_tocsection.default.md#id)

___

### parent

• `Optional` `Readonly` **parent**: [*default*](proxy_page_steps_toc_tocsection.default.md)

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md).[parent](proxy_page_steps_toc_tocsection.default.md#parent)

___

### renderingStrategy

• `Protected` `Readonly` **renderingStrategy**: [*default*](../interfaces/proxy_page_steps_toc_tocrenderingstrategy.default.md)

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md).[renderingStrategy](proxy_page_steps_toc_tocsection.default.md#renderingstrategy)

___

### title

• `Optional` `Readonly` **title**: *string*

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md).[title](proxy_page_steps_toc_tocsection.default.md#title)

## Methods

### createChild

▸ **createChild**(`title`: *string*, `id`: *string*): [*default*](proxy_page_steps_toc_tocsection.default.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `title` | *string* |
| `id` | *string* |

**Returns:** [*default*](proxy_page_steps_toc_tocsection.default.md)

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md)

Defined in: [src/proxy-page/steps/toc/TocSection.ts:27](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocSection.ts#L27)

___

### getChildIndex

▸ **getChildIndex**(`child`: [*default*](proxy_page_steps_toc_tocsection.default.md)): *number*

#### Parameters

| Name | Type |
| :------ | :------ |
| `child` | [*default*](proxy_page_steps_toc_tocsection.default.md) |

**Returns:** *number*

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md)

Defined in: [src/proxy-page/steps/toc/TocSection.ts:39](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocSection.ts#L39)

___

### getIndex

▸ **getIndex**(): *number*

**Returns:** *number*

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md)

Defined in: [src/proxy-page/steps/toc/TocSection.ts:54](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocSection.ts#L54)

___

### getLevel

▸ **getLevel**(): *number*

**Returns:** *number*

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md)

Defined in: [src/proxy-page/steps/toc/TocSection.ts:47](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocSection.ts#L47)

___

### getOutline

▸ **getOutline**(): *string*

**Returns:** *string*

Inherited from: [default](proxy_page_steps_toc_tocsection.default.md)

Defined in: [src/proxy-page/steps/toc/TocSection.ts:61](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocSection.ts#L61)

___

### render

▸ **render**(): *string*

**Returns:** *string*

Overrides: [default](proxy_page_steps_toc_tocsection.default.md)

Defined in: [src/proxy-page/steps/toc/Toc.ts:4](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/Toc.ts#L4)
