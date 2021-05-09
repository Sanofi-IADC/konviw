[konviw]() / [Exports](../modules.md) / [cache/custom-http-cache.interceptor](../modules/cache_custom_http_cache_interceptor.md) / default

# Class: default

[cache/custom-http-cache.interceptor](../modules/cache_custom_http_cache_interceptor.md).default

## Hierarchy

- *CacheInterceptor*

  ↳ **default**

## Constructors

### constructor

\+ **new default**(`cacheManager`: *any*, `reflector`: *any*): [*default*](cache_custom_http_cache_interceptor.default.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `cacheManager` | *any* |
| `reflector` | *any* |

**Returns:** [*default*](cache_custom_http_cache_interceptor.default.md)

Inherited from: CacheInterceptor.constructor

Defined in: node_modules/@nestjs/common/cache/interceptors/cache.interceptor.d.ts:9

## Properties

### cacheManager

• `Protected` `Readonly` **cacheManager**: *any*

Inherited from: CacheInterceptor.cacheManager

Defined in: node_modules/@nestjs/common/cache/interceptors/cache.interceptor.d.ts:7

___

### httpAdapterHost

• `Protected` `Readonly` **httpAdapterHost**: *HttpAdapterHost*<any\>

Inherited from: CacheInterceptor.httpAdapterHost

Defined in: node_modules/@nestjs/common/cache/interceptors/cache.interceptor.d.ts:9

___

### reflector

• `Protected` `Readonly` **reflector**: *any*

Inherited from: CacheInterceptor.reflector

Defined in: node_modules/@nestjs/common/cache/interceptors/cache.interceptor.d.ts:8

## Methods

### intercept

▸ **intercept**(`context`: ExecutionContext, `next`: *CallHandler*<any\>): *Promise*<Observable<any\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | ExecutionContext |
| `next` | *CallHandler*<any\> |

**Returns:** *Promise*<Observable<any\>\>

Inherited from: CacheInterceptor.intercept

Defined in: node_modules/@nestjs/common/cache/interceptors/cache.interceptor.d.ts:11

___

### trackBy

▸ **trackBy**(`context`: ExecutionContext): *string*

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | ExecutionContext |

**Returns:** *string*

Overrides: CacheInterceptor.trackBy

Defined in: [src/cache/custom-http-cache.interceptor.ts:5](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/cache/custom-http-cache.interceptor.ts#L5)
