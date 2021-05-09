[konviw]() / [Exports](../modules.md) / [health/health-atlassian.service](../modules/health_health_atlassian_service.md) / ApiHealthService

# Class: ApiHealthService

[health/health-atlassian.service](../modules/health_health_atlassian_service.md).ApiHealthService

## Hierarchy

- *HealthIndicator*

  ↳ **ApiHealthService**

## Constructors

### constructor

\+ **new ApiHealthService**(`confluence`: [*ConfluenceService*](confluence_confluence_service.confluenceservice.md)): [*ApiHealthService*](health_health_atlassian_service.apihealthservice.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `confluence` | [*ConfluenceService*](confluence_confluence_service.confluenceservice.md) |

**Returns:** [*ApiHealthService*](health_health_atlassian_service.apihealthservice.md)

Overrides: HealthIndicator.constructor

Defined in: [src/health/health-atlassian.service.ts:11](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/health/health-atlassian.service.ts#L11)

## Properties

### logger

• `Private` `Readonly` **logger**: *Logger*

Defined in: [src/health/health-atlassian.service.ts:11](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/health/health-atlassian.service.ts#L11)

## Methods

### apiCheck

▸ **apiCheck**(): *Promise*<HealthIndicatorResult\>

**`function`** apiCheck Service

**`description`** Call the API service from Atlassian to check it is alive

**Returns:** *Promise*<HealthIndicatorResult\>

Promise {HealthIndicatorResult}

Defined in: [src/health/health-atlassian.service.ts:21](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/health/health-atlassian.service.ts#L21)

___

### getStatus

▸ `Protected` **getStatus**(`key`: *string*, `isHealthy`: *boolean*, `data?`: { [key: string]: *any*;  }): HealthIndicatorResult

Generates the health indicator result object

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | *string* | The key which will be used as key for the result object |
| `isHealthy` | *boolean* | Whether the health indicator is healthy |
| `data?` | *object* | Additional data which will get appended to the result object |

**Returns:** HealthIndicatorResult

Inherited from: HealthIndicator.getStatus

Defined in: node_modules/@nestjs/terminus/dist/health-indicator/health-indicator.d.ts:35
