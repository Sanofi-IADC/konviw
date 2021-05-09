[konviw]() / [Exports](../modules.md) / [common/middleware/logger.middleware](../modules/common_middleware_logger_middleware.md) / LoggerMiddleware

# Class: LoggerMiddleware

[common/middleware/logger.middleware](../modules/common_middleware_logger_middleware.md).LoggerMiddleware

## Implements

- *NestMiddleware*

## Constructors

### constructor

\+ **new LoggerMiddleware**(): [*LoggerMiddleware*](common_middleware_logger_middleware.loggermiddleware.md)

**Returns:** [*LoggerMiddleware*](common_middleware_logger_middleware.loggermiddleware.md)

## Properties

### logger

• `Private` **logger**: *Logger*

Defined in: [src/common/middleware/logger.middleware.ts:6](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/common/middleware/logger.middleware.ts#L6)

## Methods

### use

▸ **use**(`request`: *Request*<ParamsDictionary, any, any, ParsedQs, Record<string, any\>\>, `response`: *Response*<any, Record<string, any\>\>, `next`: NextFunction): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | *Request*<ParamsDictionary, any, any, ParsedQs, Record<string, any\>\> |
| `response` | *Response*<any, Record<string, any\>\> |
| `next` | NextFunction |

**Returns:** *void*

Implementation of: NestMiddleware.use

Defined in: [src/common/middleware/logger.middleware.ts:7](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/common/middleware/logger.middleware.ts#L7)
