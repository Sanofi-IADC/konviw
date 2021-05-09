[konviw]() / [Exports](../modules.md) / [proxy-api/proxy-api.controller](../modules/proxy_api_proxy_api_controller.md) / ProxyApiController

# Class: ProxyApiController

[proxy-api/proxy-api.controller](../modules/proxy_api_proxy_api_controller.md).ProxyApiController

## Constructors

### constructor

\+ **new ProxyApiController**(`proxyApi`: [*ProxyApiService*](proxy_api_proxy_api_service.proxyapiservice.md)): [*ProxyApiController*](proxy_api_proxy_api_controller.proxyapicontroller.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `proxyApi` | [*ProxyApiService*](proxy_api_proxy_api_service.proxyapiservice.md) |

**Returns:** [*ProxyApiController*](proxy_api_proxy_api_controller.proxyapicontroller.md)

Defined in: [src/proxy-api/proxy-api.controller.ts:6](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-api/proxy-api.controller.ts#L6)

## Methods

### getAllPosts

▸ **getAllPosts**(`params`: [*PostsParamsDTO*](proxy_api_proxy_api_validation_dto.postsparamsdto.md)): *Promise*<any\>

**`get`** (controller) api/getAllPosts/:spaceKey

**`description`** Route to retrieve the standard media files like images and videos (usually attachments)

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [*PostsParamsDTO*](proxy_api_proxy_api_validation_dto.postsparamsdto.md) |

**Returns:** *Promise*<any\>

'url' - URL of the media to display

Defined in: [src/proxy-api/proxy-api.controller.ts:15](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-api/proxy-api.controller.ts#L15)

___

### getSearchResults

▸ **getSearchResults**(`queries`: [*SearchQueryDTO*](proxy_api_proxy_api_validation_dto.searchquerydto.md)): *Promise*<any\>

**`get`** (controller) api/search

**`description`** Route to retrieve the standard media files like images and videos (usually attachments)

#### Parameters

| Name | Type |
| :------ | :------ |
| `queries` | [*SearchQueryDTO*](proxy_api_proxy_api_validation_dto.searchquerydto.md) |

**Returns:** *Promise*<any\>

'url' - URL of the media to display

Defined in: [src/proxy-api/proxy-api.controller.ts:25](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-api/proxy-api.controller.ts#L25)
