[konviw]() / [Exports](../modules.md) / proxy-page/steps/addWebStatsTracker

# Module: proxy-page/steps/addWebStatsTracker

## Properties

### default

• **default**: (`config`: *ConfigService*<Record<string, any\>\>) => [*Step*](../interfaces/proxy_page_proxy_page_step.step.md)

#### Type declaration

▸ (`config`: *ConfigService*<Record<string, any\>\>): [*Step*](../interfaces/proxy_page_proxy_page_step.step.md)

### Proxy page step to add Web statistics trackers for Matomo or Google.

This module gets Cheerio to append to the head of the page the web tracker for Matomo or Google Analytics. Env variables must be defined:

- `matomoBaseURL` and `matomoIdSite` for Matomo
- `googleTag` for Google Analytics

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | *ConfigService*<Record<string, any\>\> |

**Returns:** [*Step*](../interfaces/proxy_page_proxy_page_step.step.md)

void

Defined in: [src/proxy-page/steps/addWebStatsTracker.ts:3](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/proxy-page/steps/addWebStatsTracker.ts#L3)
