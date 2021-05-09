[konviw]() / [Exports](../modules.md) / [proxy-api/proxy-api.service](../modules/proxy_api_proxy_api_service.md) / ProxyApiService

# Class: ProxyApiService

[proxy-api/proxy-api.service](../modules/proxy_api_proxy_api_service.md).ProxyApiService

## Constructors

### constructor

\+ **new ProxyApiService**(`config`: *ConfigService*<Record<string, any\>\>, `confluence`: [*ConfluenceService*](confluence_confluence_service.confluenceservice.md), `context`: [*ContextService*](context_context_service.contextservice.md)): [*ProxyApiService*](proxy_api_proxy_api_service.proxyapiservice.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | *ConfigService*<Record<string, any\>\> |
| `confluence` | [*ConfluenceService*](confluence_confluence_service.confluenceservice.md) |
| `context` | [*ContextService*](context_context_service.contextservice.md) |

**Returns:** [*ProxyApiService*](proxy_api_proxy_api_service.proxyapiservice.md)

Defined in: [src/proxy-api/proxy-api.service.ts:9](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-api/proxy-api.service.ts#L9)

## Properties

### logger

• `Private` `Readonly` **logger**: *Logger*

Defined in: [src/proxy-api/proxy-api.service.ts:9](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-api/proxy-api.service.ts#L9)

## Methods

### getAllPosts

▸ **getAllPosts**(`spaceKey`: *string*): *Promise*<any\>

**`function`** getAllPosts Service

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `spaceKey` | *string* | 'iadc' - space key where the page belongs |

**Returns:** *Promise*<any\>

Promise {string}

Defined in: [src/proxy-api/proxy-api.service.ts:21](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-api/proxy-api.service.ts#L21)

___

### getSearchResults

▸ **getSearchResults**(`spaceKey`: *string*, `query`: *string*): *Promise*<string\>

**`function`** getSearchResults Service

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `spaceKey` | *string* | 'iadc' - space key where the page belongs |
| `query` | *string* | 'vision factory' - words to be searched |

**Returns:** *Promise*<string\>

Promise {string}

Defined in: [src/proxy-api/proxy-api.service.ts:66](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-api/proxy-api.service.ts#L66)
