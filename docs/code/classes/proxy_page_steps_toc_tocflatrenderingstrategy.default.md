[konviw]() / [Exports](../modules.md) / [proxy-page/steps/toc/TocFlatRenderingStrategy](../modules/proxy_page_steps_toc_tocflatrenderingstrategy.md) / default

# Class: default

[proxy-page/steps/toc/TocFlatRenderingStrategy](../modules/proxy_page_steps_toc_tocflatrenderingstrategy.md).default

## Implements

- [*default*](../interfaces/proxy_page_steps_toc_tocrenderingstrategy.default.md)

## Constructors

### constructor

\+ **new default**(`midSeparator?`: *string*): [*default*](proxy_page_steps_toc_tocflatrenderingstrategy.default.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `midSeparator` | *string* | '' |

**Returns:** [*default*](proxy_page_steps_toc_tocflatrenderingstrategy.default.md)

Defined in: [src/proxy-page/steps/toc/TocFlatRenderingStrategy.ts:6](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocFlatRenderingStrategy.ts#L6)

## Properties

### midSeparator

• `Readonly` **midSeparator**: *string*= ''

## Methods

### $getMidSeparator

▸ `Private` **$getMidSeparator**(): *string*

**Returns:** *string*

Defined in: [src/proxy-page/steps/toc/TocFlatRenderingStrategy.ts:9](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocFlatRenderingStrategy.ts#L9)

___

### renderToc

▸ **renderToc**(`toc`: [*default*](proxy_page_steps_toc_toc.default.md)): *string*

#### Parameters

| Name | Type |
| :------ | :------ |
| `toc` | [*default*](proxy_page_steps_toc_toc.default.md) |

**Returns:** *string*

Implementation of: [default](../interfaces/proxy_page_steps_toc_tocrenderingstrategy.default.md)

Defined in: [src/proxy-page/steps/toc/TocFlatRenderingStrategy.ts:15](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocFlatRenderingStrategy.ts#L15)

___

### renderTocSection

▸ **renderTocSection**(`section`: [*default*](proxy_page_steps_toc_tocsection.default.md), `isHidden`: *boolean*): *string*

#### Parameters

| Name | Type |
| :------ | :------ |
| `section` | [*default*](proxy_page_steps_toc_tocsection.default.md) |
| `isHidden` | *boolean* |

**Returns:** *string*

Implementation of: [default](../interfaces/proxy_page_steps_toc_tocrenderingstrategy.default.md)

Defined in: [src/proxy-page/steps/toc/TocFlatRenderingStrategy.ts:26](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocFlatRenderingStrategy.ts#L26)
