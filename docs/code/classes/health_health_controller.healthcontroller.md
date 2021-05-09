[konviw]() / [Exports](../modules.md) / [health/health.controller](../modules/health_health_controller.md) / HealthController

# Class: HealthController

[health/health.controller](../modules/health_health_controller.md).HealthController

## Constructors

### constructor

\+ **new HealthController**(`apiHealth`: [*ApiHealthService*](health_health_atlassian_service.apihealthservice.md), `health`: *HealthCheckService*): [*HealthController*](health_health_controller.healthcontroller.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `apiHealth` | [*ApiHealthService*](health_health_atlassian_service.apihealthservice.md) |
| `health` | *HealthCheckService* |

**Returns:** [*HealthController*](health_health_controller.healthcontroller.md)

Defined in: [src/health/health.controller.ts:6](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/health/health.controller.ts#L6)

## Methods

### apiCheck

▸ **apiCheck**(): *Promise*<HealthCheckResult\>

**`get`** (controller)

**`description`** Health check controller to show Konviw and Atlassian API status

**Returns:** *Promise*<HealthCheckResult\>

'{"status": "ok"}' - terminus JSON response

Defined in: [src/health/health.controller.ts:19](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/health/health.controller.ts#L19)
