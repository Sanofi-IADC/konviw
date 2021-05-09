[konviw]() / [Exports](../modules.md) / [proxy-page/steps/toc/TocExcludeRegexFilter](../modules/proxy_page_steps_toc_tocexcluderegexfilter.md) / default

# Class: default

[proxy-page/steps/toc/TocExcludeRegexFilter](../modules/proxy_page_steps_toc_tocexcluderegexfilter.md).default

## Implements

- [*default*](../interfaces/proxy_page_steps_toc_tocfilter.default.md)

## Constructors

### constructor

\+ **new default**(`regexStr`: *string*): [*default*](proxy_page_steps_toc_tocexcluderegexfilter.default.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `regexStr` | *string* |

**Returns:** [*default*](proxy_page_steps_toc_tocexcluderegexfilter.default.md)

Defined in: [src/proxy-page/steps/toc/TocExcludeRegexFilter.ts:5](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocExcludeRegexFilter.ts#L5)

## Properties

### regex

• `Readonly` **regex**: *RegExp*

Defined in: [src/proxy-page/steps/toc/TocExcludeRegexFilter.ts:5](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocExcludeRegexFilter.ts#L5)

## Methods

### isHidden

▸ **isHidden**(`section`: [*default*](proxy_page_steps_toc_tocsection.default.md)): *boolean*

#### Parameters

| Name | Type |
| :------ | :------ |
| `section` | [*default*](proxy_page_steps_toc_tocsection.default.md) |

**Returns:** *boolean*

Implementation of: [default](../interfaces/proxy_page_steps_toc_tocfilter.default.md)

Defined in: [src/proxy-page/steps/toc/TocExcludeRegexFilter.ts:11](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/toc/TocExcludeRegexFilter.ts#L11)
