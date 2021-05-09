[konviw]() / [Exports](../modules.md) / [jira/jira.service](../modules/jira_jira_service.md) / JiraService

# Class: JiraService

[jira/jira.service](../modules/jira_jira_service.md).JiraService

## Constructors

### constructor

\+ **new JiraService**(`http`: *HttpService*): [*JiraService*](jira_jira_service.jiraservice.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `http` | *HttpService* |

**Returns:** [*JiraService*](jira_jira_service.jiraservice.md)

Defined in: [src/jira/jira.service.ts:4](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/jira/jira.service.ts#L4)

## Methods

### findTickets

▸ **findTickets**(`jqlSearch`: *string*, `fields`: *string*, `maxResult?`: *number*): *Promise*<any\>

**`function`** findTickets Service

**`description`** Return a the tickets selected in the Jira macro

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `jqlSearch` | *string* | - | 'project = FND ORDER BY resolution DESC' - Jira Query Language to filter the issues to retrieve |
| `fields` | *string* | - | - |
| `maxResult` | *number* | 100 | 100 - maximum number of issues retrieved |

**Returns:** *Promise*<any\>

Promise {any}

Defined in: [src/jira/jira.service.ts:14](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/jira/jira.service.ts#L14)
