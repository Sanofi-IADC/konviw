[konviw]() / [Exports](../modules.md) / [app.module](../modules/app_module.md) / AppModule

# Class: AppModule

[app.module](../modules/app_module.md).AppModule

## Implements

- *NestModule*

## Constructors

### constructor

\+ **new AppModule**(`config`: *ConfigService*<Record<string, any\>\>): [*AppModule*](app_module.appmodule.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | *ConfigService*<Record<string, any\>\> |

**Returns:** [*AppModule*](app_module.appmodule.md)

Defined in: [src/app.module.ts:55](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/app.module.ts#L55)

## Methods

### configure

▸ **configure**(`consumer`: MiddlewareConsumer): *void*

#### Parameters

| Name | Type |
| :------ | :------ |
| `consumer` | MiddlewareConsumer |

**Returns:** *void*

Implementation of: NestModule.configure

Defined in: [src/app.module.ts:58](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/app.module.ts#L58)
