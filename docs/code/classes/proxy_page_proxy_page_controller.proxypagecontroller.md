[konviw]() / [Exports](../modules.md) / [proxy-page/proxy-page.controller](../modules/proxy_page_proxy_page_controller.md) / ProxyPageController

# Class: ProxyPageController

[proxy-page/proxy-page.controller](../modules/proxy_page_proxy_page_controller.md).ProxyPageController

## Constructors

### constructor

\+ **new ProxyPageController**(`proxyPage`: [*ProxyPageService*](proxy_page_proxy_page_service.proxypageservice.md)): [*ProxyPageController*](proxy_page_proxy_page_controller.proxypagecontroller.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `proxyPage` | [*ProxyPageService*](proxy_page_proxy_page_service.proxypageservice.md) |

**Returns:** [*ProxyPageController*](proxy_page_proxy_page_controller.proxypagecontroller.md)

Defined in: [src/proxy-page/proxy-page.controller.ts:16](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.controller.ts#L16)

## Properties

### logger

• `Private` `Readonly` **logger**: *Logger*

Defined in: [src/proxy-page/proxy-page.controller.ts:16](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.controller.ts#L16)

## Methods

### getMedia

▸ **getMedia**(`req`: *Request*<ParamsDictionary, any, any, ParsedQs, Record<string, any\>\>, `res`: *Response*<any, Record<string, any\>\>): *Promise*<void\>

Route to retrieve the standard media files like images, videos or user profile avatar

**`get`** (controller) /download/* or /aa-avatar/*

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | *Request*<ParamsDictionary, any, any, ParsedQs, Record<string, any\>\> |
| `res` | *Response*<any, Record<string, any\>\> |

**Returns:** *Promise*<void\>

'url' - URL of the media to display

Defined in: [src/proxy-page/proxy-page.controller.ts:83](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.controller.ts#L83)

___

### getPage

▸ **getPage**(`params`: [*PageParamsDTO*](proxy_page_proxy_page_validation_dto.pageparamsdto.md), `queries`: [*PageQueryDTO*](proxy_page_proxy_page_validation_dto.pagequerydto.md)): *Promise*<string\>

Route to get a read-only fully rendered Confluence page or blog post

**`get`** (controller) /spaces/:spaceKey/pages/:pageId/:pageSlug?

**`get`** (controller) /spaces/:spaceKey/blog/:year/:month/:day/:pageId/:pageSlug?

**`query`** theme {string} 'dark' - switch between light and dark themes

**`query`** type {string} 'blog' - 'blog' to display a post header or 'notitle' to remove the title of the page

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [*PageParamsDTO*](proxy_page_proxy_page_validation_dto.pageparamsdto.md) |
| `queries` | [*PageQueryDTO*](proxy_page_proxy_page_validation_dto.pagequerydto.md) |

**Returns:** *Promise*<string\>

'html' - full html of the rendered Confluence page

Defined in: [src/proxy-page/proxy-page.controller.ts:38](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.controller.ts#L38)

___

### getSlides

▸ **getSlides**(`params`: [*PageParamsDTO*](proxy_page_proxy_page_validation_dto.pageparamsdto.md), `queries`: [*PageQueryDTO*](proxy_page_proxy_page_validation_dto.pagequerydto.md)): *Promise*<string\>

Route to get a full reveal.js slides from a single Confluence page

**`get`** (controller) /slides/:spaceKey/:pageId/:pageSlug?

**`query`** theme {string} 'iadc' - select the theme to use for your slide deck

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [*PageParamsDTO*](proxy_page_proxy_page_validation_dto.pageparamsdto.md) |
| `queries` | [*PageQueryDTO*](proxy_page_proxy_page_validation_dto.pagequerydto.md) |

**Returns:** *Promise*<string\>

'html' - full html of the rendered page as reveal.js slides

Defined in: [src/proxy-page/proxy-page.controller.ts:62](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.controller.ts#L62)
