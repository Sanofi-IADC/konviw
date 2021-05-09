[konviw]() / [Exports](../modules.md) / [confluence/confluence.service](../modules/confluence_confluence_service.md) / ConfluenceService

# Class: ConfluenceService

[confluence/confluence.service](../modules/confluence_confluence_service.md).ConfluenceService

## Constructors

### constructor

\+ **new ConfluenceService**(`http`: *HttpService*): [*ConfluenceService*](confluence_confluence_service.confluenceservice.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `http` | *HttpService* |

**Returns:** [*ConfluenceService*](confluence_confluence_service.confluenceservice.md)

Defined in: [src/confluence/confluence.service.ts:12](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/confluence/confluence.service.ts#L12)

## Properties

### logger

• `Private` `Readonly` **logger**: *Logger*

Defined in: [src/confluence/confluence.service.ts:12](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/confluence/confluence.service.ts#L12)

## Methods

### getAllPosts

▸ **getAllPosts**(`spaceKey`: *string*): *Promise*<any\>

**`function`** getAllPosts Service

**`description`** Return all blog posts published in a Confluence space

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `spaceKey` | *string* | 'iadc' - space key where the page belongs |

**Returns:** *Promise*<any\>

Promise {any}

Defined in: [src/confluence/confluence.service.ts:130](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/confluence/confluence.service.ts#L130)

___

### getPage

▸ **getPage**(`spaceKey`: *string*, `pageId`: *string*): *Promise*<any\>

**`function`** getPage Service

**`description`** Return a page from a Confluence space

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `spaceKey` | *string* | 'iadc' - space key where the page belongs |
| `pageId` | *string* | '639243960' - id of the page to retrieve |

**Returns:** *Promise*<any\>

Promise {any}

Defined in: [src/confluence/confluence.service.ts:22](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/confluence/confluence.service.ts#L22)

___

### getRedirectUrlForMedia

▸ **getRedirectUrlForMedia**(`uri`: *string*): *Promise*<string\>

**`function`** getRedirectUrlForMedia Service

**`description`** Route to retrieve the standard media files like images and videos (usually attachments)

#### Parameters

| Name | Type |
| :------ | :------ |
| `uri` | *string* |

**Returns:** *Promise*<string\>

Promise {string} 'url' - URL of the media to display

Defined in: [src/confluence/confluence.service.ts:62](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/confluence/confluence.service.ts#L62)

___

### getResults

▸ **getResults**(`spaceKey`: *string*, `query`: *string*): *Promise*<any\>

TODO: Make this function generic enough to serve standard search or
TODO: get blog posts. Include options like 'type', 'date-range', 'ancestor' ...

**`function`** getResults Service

**`description`** Search results from Confluence API /rest/api/search

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `spaceKey` | *string* | 'iadc' - space key where the page belongs |
| `query` | *string* | space key identifying the document space from Confluence |

**Returns:** *Promise*<any\>

Promise {any}

Defined in: [src/confluence/confluence.service.ts:89](https://github.com/Sanofi-IADC/konviw/blob/d2e0da9/src/confluence/confluence.service.ts#L89)
