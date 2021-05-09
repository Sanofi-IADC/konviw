[konviw]() / [Exports](../modules.md) / [proxy-page/proxy-page.service](../modules/proxy_page_proxy_page_service.md) / ProxyPageService

# Class: ProxyPageService

[proxy-page/proxy-page.service](../modules/proxy_page_proxy_page_service.md).ProxyPageService

## Constructors

### constructor

\+ **new ProxyPageService**(`config`: *ConfigService*<Record<string, any\>\>, `confluence`: [*ConfluenceService*](confluence_confluence_service.confluenceservice.md), `context`: [*ContextService*](context_context_service.contextservice.md), `jiraService`: [*JiraService*](jira_jira_service.jiraservice.md)): [*ProxyPageService*](proxy_page_proxy_page_service.proxypageservice.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | *ConfigService*<Record<string, any\>\> |
| `confluence` | [*ConfluenceService*](confluence_confluence_service.confluenceservice.md) |
| `context` | [*ContextService*](context_context_service.contextservice.md) |
| `jiraService` | [*JiraService*](jira_jira_service.jiraservice.md) |

**Returns:** [*ProxyPageService*](proxy_page_proxy_page_service.proxypageservice.md)

Defined in: [src/proxy-page/proxy-page.service.ts:36](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.service.ts#L36)

## Properties

### logger

• `Private` `Readonly` **logger**: *Logger*

Defined in: [src/proxy-page/proxy-page.service.ts:36](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.service.ts#L36)

## Methods

### getMediaCdnUrl

▸ **getMediaCdnUrl**(`uri`: *string*): *Promise*<string\>

getMediaCdnUrl Service

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `uri` | *string* | 'iadc' - URL of the media file to return |

**Returns:** *Promise*<string\>

Promise string

Defined in: [src/proxy-page/proxy-page.service.ts:153](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.service.ts#L153)

___

### initContext

▸ `Private` **initContext**(`spaceKey`: *string*, `pageId`: *string*, `theme`: *string*, `results`: *any*): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `spaceKey` | *string* |
| `pageId` | *string* |
| `theme` | *string* |
| `results` | *any* |

**Returns:** *void*

Defined in: [src/proxy-page/proxy-page.service.ts:44](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.service.ts#L44)

___

### renderPage

▸ **renderPage**(`spaceKey`: *string*, `pageId`: *string*, `theme`: *string*, `type`: *string*, `style`: *string*): *Promise*<string\>

**`function`** renderPage Service

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `spaceKey` | *string* | 'iadc' - space key where the page belongs |
| `pageId` | *string* | '639243960' - id of the page to retrieve |
| `theme` | *string* | '#FFFFFF' - theme used by the page |
| `type` | *string* | 'blog' - type of the page |
| `style` | *string* | - |

**Returns:** *Promise*<string\>

Promise {string}

Defined in: [src/proxy-page/proxy-page.service.ts:76](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.service.ts#L76)

___

### renderSlides

▸ **renderSlides**(`spaceKey`: *string*, `pageId`: *string*, `theme`: *string*): *Promise*<string\>

**`function`** renderSlides Service

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `spaceKey` | *string* | 'iadc' - space key where the page belongs |
| `pageId` | *string* | '639243960' - id of the page to retrieve |
| `theme` | *string* | '#FFFFFF' - the theme used of the page |

**Returns:** *Promise*<string\>

Promise {string}

Defined in: [src/proxy-page/proxy-page.service.ts:126](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/proxy-page.service.ts#L126)
