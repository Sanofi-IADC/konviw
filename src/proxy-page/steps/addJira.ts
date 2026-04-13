import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';
import { JiraService } from '../../jira/jira.service';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import * as FieldInterfaces from '../dto/FieldInterface';
import * as JiraTable from '../utils/jiraGrid';

const extractIssueKey = (keyCell: cheerio.Cheerio<cheerio.Element>): string => {
  const href = keyCell.find('a').attr('href') || '';
  const hrefKeyMatch = href.match(/\/browse\/([A-Z]+-\d+)/i);
  const textKeyMatch = keyCell.text().match(/([A-Z]+-\d+)/i);
  return hrefKeyMatch?.[1] || textKeyMatch?.[1] || '';
};

const getTableHeaders = (
  $: cheerio.CheerioAPI,
  tableElement: cheerio.Element,
): cheerio.Element[] => $(tableElement).find('tr').first().find('th')
  .toArray();

const isFixVersionTable = (
  $: cheerio.CheerioAPI,
  tableElement: cheerio.Element,
  normalizeHeader: (value: string) => string,
): boolean => {
  const headers = getTableHeaders($, tableElement).map((header) => normalizeHeader($(header).text()));
  return headers.includes('key') && (headers.includes('fixversions') || headers.includes('fixversion'));
};

const collectIssueKeysFromTable = (
  $: cheerio.CheerioAPI,
  tableElement: cheerio.Element,
  issueKeys: Set<string>,
  normalizeHeader: (value: string) => string,
): void => {
  const headers = getTableHeaders($, tableElement);
  const keyColumnIndex = headers.findIndex((header) => normalizeHeader($(header).text()) === 'key');
  if (keyColumnIndex < 0) {
    return;
  }

  const rows = $(tableElement).find('tr').slice(1).toArray();
  rows.forEach((row) => {
    const keyCell = $(row).find('td').eq(keyColumnIndex);
    const issueKey = extractIssueKey(keyCell);
    if (issueKey) {
      issueKeys.add(issueKey);
    }
  });
};

const buildFixVersionMap = (jiraIssuesResponse: any): Map<string, string> => {
  const fixVersionByKey = new Map<string, string>();
  (jiraIssuesResponse?.data?.issues ?? []).forEach((issue: any) => {
    const fixVersions = (issue.fields?.fixVersions ?? [])
      .map((item: { name?: string }) => item.name)
      .filter(Boolean);
    fixVersionByKey.set(issue.key, fixVersions.join(', '));
  });
  return fixVersionByKey;
};

const removeInternalCustomColumns = (
  $: cheerio.CheerioAPI,
  tableElement: cheerio.Element,
  normalizeHeader: (value: string) => string,
): void => {
  const removableInternalColumns = getTableHeaders($, tableElement)
    .map((header, headerIndex) => ({
      headerIndex,
      normalized: normalizeHeader($(header).text()),
    }))
    .filter(({ normalized }) => /^customfield_\d+$/i.test(normalized))
    .map(({ headerIndex }) => headerIndex)
    .sort((a, b) => b - a);

  removableInternalColumns.forEach((headerIndex) => {
    const rows = $(tableElement).find('tr').toArray();
    rows.forEach((row) => {
      $(row).find('th,td').eq(headerIndex).remove();
    });
  });
};

const fillFixVersionsInTable = (
  $: cheerio.CheerioAPI,
  tableElement: cheerio.Element,
  fixVersionByKey: Map<string, string>,
  normalizeHeader: (value: string) => string,
): void => {
  const refreshedHeaders = getTableHeaders($, tableElement);
  const keyColumnIndex = refreshedHeaders.findIndex((header) => normalizeHeader($(header).text()) === 'key');
  const fixVersionColumnIndex = refreshedHeaders.findIndex((header) => {
    const normalized = normalizeHeader($(header).text());
    return normalized === 'fixversions' || normalized === 'fixversion';
  });

  if (fixVersionColumnIndex >= 0) {
    $(refreshedHeaders[fixVersionColumnIndex]).text('Fix versions');
  }

  if (keyColumnIndex < 0 || fixVersionColumnIndex < 0) {
    return;
  }

  const rows = $(tableElement).find('tr').slice(1).toArray();
  rows.forEach((row) => {
    const cells = $(row).find('td');
    const keyCell = cells.eq(keyColumnIndex);
    const fixVersionCell = cells.eq(fixVersionColumnIndex);
    const issueKey = extractIssueKey(keyCell);

    if (!issueKey || !fixVersionCell.length) {
      return;
    }

    const fixVersionValue = fixVersionByKey.get(issueKey) || '';
    fixVersionCell.text(fixVersionValue);
  });
};

const reorderDataObjectKeys = (
  item: Record<string, any>,
  requestedFields: (string | number)[],
): Record<string, any> => {
  const reorderedItem = {};
  requestedFields.forEach((column: string | number) => {
    if (Object.prototype.hasOwnProperty.call(item, column)) {
      reorderedItem[column] = item[column];
    }
  });
  return reorderedItem;
};

const buildGridColumnsConfig = (
  data: Record<string, any>[],
  columnConfig: Record<string, (name: string) => string>,
): string => {
  const columns = data.slice(0, 1).flatMap((obj) => Object.keys(obj)
    .map((key) => {
      const field = obj[key];
      const { gridtype } = field;
      const { name } = field;
      return columnConfig[gridtype](name);
    })
    .filter(Boolean));
  return `[${columns.join(',')}]`;
};

const enrichStaticFixVersionTables = async (
  $: cheerio.CheerioAPI,
  jiraService: JiraService,
  normalizeHeader: (value: string) => string,
): Promise<number> => {
  const candidateTables = $('table').toArray().filter((tableElement) => isFixVersionTable($, tableElement, normalizeHeader));
  if (!candidateTables.length) {
    return 0;
  }

  const issueKeys = new Set<string>();
  candidateTables.forEach((tableElement) => {
    collectIssueKeysFromTable($, tableElement, issueKeys, normalizeHeader);
  });

  const keys = [...issueKeys];
  if (!keys.length) {
    return candidateTables.length;
  }

  const jiraIssuesResponse = await jiraService.findTickets(
    'System JIRA',
    `key in (${keys.join(',')})`,
    'fixVersions',
    0,
    keys.length,
  );

  const fixVersionByKey = buildFixVersionMap(jiraIssuesResponse);
  candidateTables.forEach((tableElement) => {
    removeInternalCustomColumns($, tableElement, normalizeHeader);
    fillFixVersionsInTable($, tableElement, fixVersionByKey, normalizeHeader);
  });

  return candidateTables.length;
};

export default (config: ConfigService, jiraService: JiraService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addJira');
  const $ = context.getCheerioBody();
  const basePath = config.get('web.basePath');
  const version = config.get('version');
  const confluenceDomain = config.get('confluence.baseURL');
  /* fetch Jira issues details and update the title and status for each one */
  const issuesDetailsPromises: any[] = [];
  $('span.confluence-jim-macro.jira-issue').each(
    (_, elementJira: cheerio.Element) => {
      const jiraKey = $(elementJira).attr('data-jira-key');
      if (!jiraKey) return;
      issuesDetailsPromises.push(jiraService.getTicket(jiraKey));
    },
  );

  await Promise.allSettled(issuesDetailsPromises).then((results) => {
    results.forEach((res: any) => {
      if (!res?.value?.key || !res?.value?.fields) return;
      const {
        value: {
          key,
          fields: { summary, status },
        },
      } = res;
      const elem = $(`[data-jira-key="${key}"]`);
      if (!elem) return;
      elem.find('.summary').text(summary);
      elem
        .find('.aui-lozenge')
        .text(status?.name?.toUpperCase())
        .css('background-color', status?.statusCategory?.colorName);
    });
  });

  /* Retrieve the count issues macro and replace it with the actual number of issues fetched */
  const issuesCountPromises: any[] = [];
  const issuesCountMacroIds: any[] = [];
  $('span.static-jira-issues_count').each(
    (_, elementJira: cheerio.Element) => {
      const dataMacroId = $(elementJira).attr('data-macro-id');
      issuesCountPromises.push(
        jiraService.getMaCro(context.getPageId(), dataMacroId),
      );
      issuesCountMacroIds.push(dataMacroId);
    },
  );
  const issuesToFindPromises: any[] = [];
  const issuesCountQueries: any[] = [];
  await Promise.allSettled(issuesCountPromises).then((results) => {
    results.forEach(async (res: any) => {
      const parameters = res?.value?.parameters;
      if (!parameters) {
        return;
      }
      const server = parameters.server.value;
      const query = parameters.jqlQuery.value;
      issuesCountQueries.push(query);
      issuesToFindPromises.push(jiraService.findTickets(server, query, ''));
    });
  });
  await Promise.allSettled(issuesToFindPromises).then((results) => {
    results.forEach((res: any, index: number) => {
      const {
        value: { data: { total } },
      } = res;
      const url = encodeURI(
        `${confluenceDomain}/secure/IssueNavigator.jspa?reset=true&jqlQuery=${issuesCountQueries[index]}`,
      );
      $(
        `span.static-jira-issues_count[data-macro-id=${issuesCountMacroIds[index]}]`,
      ).replaceWith(`<a target="_blank" href="${url}">${total} issues</a>`);
    });
  });

  // collect all new Jira issues macro elements (Atlassian has changed markup over time)
  const newJiraIssuesMacroElements = $('[data-datasource]').get().filter((link) => {
    const dataSource = link.attribs?.['data-datasource'];
    if (!dataSource) {
      return false;
    }

    // Keep only datasource entries that look like Jira macro payloads.
    return dataSource.includes('jql') || dataSource.includes('views') || dataSource.includes('JIRA');
  });

  const elementsToVerifyStep = [
    ...$(newJiraIssuesMacroElements).toArray(),
    ...$('.refresh-wiki').toArray(),
  ];

  const normalizeHeader = (value: string) => value.toLowerCase().split(/\s+/).join('');
  await enrichStaticFixVersionTables($, jiraService, normalizeHeader);

  if (!elementsToVerifyStep.length) {
    context.getPerfMeasure('addJira');
    return;
  }

  const elementTags: any[] = [];
  // this is the outer div used to wrap the Jira issues macro and anchor to wrap the new Jira issues macro
  // which it is saved to place the tables just before
  const jiraIssuesLegacyMacro = $('div.confluence-jim-macro.jira-table');
  const newJiraIssuesMacro = $(newJiraIssuesMacroElements);

  $([...jiraIssuesLegacyMacro, ...newJiraIssuesMacro]).each(
    (_, elementJira: cheerio.Element) => {
      elementTags.push(elementJira);
    },
  );
  type JiraIssuePromise = {
    issues: { issues: Promise<any>; };
    columns: any;
    server: string;
    filter: any;
  };

  const jiraIssuesPromises: JiraIssuePromise[] = [];
  // this is the div holding the data to scrap the list of issues
  $('.refresh-wiki').each((_, elementJira: cheerio.Element) => {
    const wikimarkup: string = elementJira.attribs['data-wikimarkup'];
    const xmlWikimarkup = cheerio.load(wikimarkup, { xmlMode: true });
    const server = xmlWikimarkup('ac\\:parameter[ac\\:name="server"]').text();
    const filter = xmlWikimarkup(
      'ac\\:parameter[ac\\:name="jqlQuery"]',
    ).text();
    const columns = `${xmlWikimarkup('ac\\:parameter[ac\\:name="columns"]').text()
    },issuetype`;
    const maximumIssues = xmlWikimarkup(
      'ac\\:parameter[ac\\:name="maximumIssues"]',
    ).text();

    jiraIssuesPromises.push({
      issues: {
        issues: jiraService
          .findTickets(server, filter, columns, 0, Number(maximumIssues))
          .then((res) => res?.data?.issues ?? []),
      },
      columns,
      server,
      filter,
    });
  });

  // this is the anchor holding the data to scrap the list of issues for new jira macro
  $(newJiraIssuesMacroElements).each((_, link: cheerio.Element) => {
    let wikimarkup: { [key: string]: any };
    try {
      wikimarkup = JSON.parse(link.attribs['data-datasource']) as { [key: string]: any };
    } catch (_error) {
      return;
    }

    if (!wikimarkup?.parameters?.jql || !wikimarkup?.views?.[0]?.properties?.columns) {
      return;
    }

    const server = 'System JIRA';
    const filter = wikimarkup.parameters.jql;
    const columns = wikimarkup.views[0].properties.columns
      .filter((column: { key?: string; isVisible?: boolean; hidden?: boolean }) => {
        if (!column?.key) {
          return false;
        }

        // Ignore hidden/internal datasource columns to avoid rendering fields users did not request.
        const explicitlyVisible = column.isVisible !== false && column.hidden !== true;
        const isInternalCustomField = /^customfield_\d+$/i.test(column.key);
        return explicitlyVisible && !isInternalCustomField;
      })
      .map((column: { key: string }) => column.key)
      .join(',');

    if (!columns) {
      return;
    }

    jiraIssuesPromises.push({
      issues: {
        issues: jiraService
          .findTickets(server, filter, columns, 0)
          .then((res) => res?.data?.issues ?? []),
      },
      columns,
      server,
      filter,
    });
  });

  // add the grid using http://gridjs.io library
  $('head').append(
    `<link href="${basePath}/gridjs/mermaid.min.css?cache=${version}" rel="stylesheet" />`,
  );
  $('body').append(
    `<script defer src="${basePath}/gridjs/gridjs.production.min.js?cache=${version}"></script>`,
  );

  let jiraFields: never[] = [];
  const promise = jiraService.getFields();
  await promise.then((result) => {
    jiraFields = result;
  });

  // TODO: to handle a potential failure of one of the promises gracefully
  const jirasIssues = await Promise.all(
    jiraIssuesPromises.map((j) => j.issues.issues),
  );

  const issuesColumns = jiraIssuesPromises.map((jira, i) => ({
    columns: jira.columns,
    issues: jirasIssues[i],
    element: elementTags[i],
    server: jira.server,
    filter: jira.filter,
  }));

  const checkFieldExistence = (
    fields: any[],
    idToCheck: string,
  ): { name: string, type: string | undefined, isArray?: boolean } | undefined => {
    const targetedField = fields.find((field) => field.id === idToCheck);
    if (targetedField) {
      let type = targetedField.schema?.type;
      let isArray = false;

      if (type === 'array' && targetedField.schema?.items) {
        type = targetedField.schema.items;
        isArray = true;
      }
      const { name } = targetedField;
      return { name, type, isArray };
    }
    return undefined;
  };

  const { fieldFunctions } = FieldInterfaces;
  interface Field {
    data: string[];
    name: string;
    type: string;
    gridtype: string;
  }

  interface RowData {
    [key: string]: {
      data: any[];
      name: string;
      type: string;
      gridtype: string;
    };
  }

  type DataObject = Record<string, Field>;

  issuesColumns.forEach(
    ({
      issues, columns, element, server,
    }, index) => {
      const requestedFields = columns
        .split(',')
        .map((field: string) => field.trim())
        .filter(Boolean)
        .filter((field: string) => {
          if (!/^customfield_\d+$/i.test(field)) {
            return true;
          }

          // Drop unresolved internal Jira custom fields so users do not see raw ids as columns.
          return Boolean(checkFieldExistence(jiraFields, field));
        });
      const dataObject:DataObject[] = [];
      // Load new base URL if defined a specific connection for Jira as ENV variables
      // otherwise default to standard baseURL defined for main server
      const baseUrl = process.env[`CPV_JIRA_${server.split(/\s+/).join('_')}_BASE_URL`]
        ?? config.get('confluence.baseURL');
      issues.forEach((issue: { key: any; fields: { [x: string]: any; }; }) => {
        const rowData:RowData = {};

        // the Jira API doesnt provide the key field value so we have to create manually
        if (requestedFields.includes('key')) {
          rowData.key = {
            data: [FieldInterfaces.createLinkObject(issue.key, baseUrl)],
            name: 'Key',
            type: 'issuelinks',
            gridtype: 'link',
          };
        }
        Object.keys(issue.fields).forEach((fieldName) => {
          let fieldValue = issue.fields[fieldName];

          const fieldTypeData = checkFieldExistence(jiraFields, fieldName)
            ?? { name: fieldName, type: 'string' };
          let ColumnProcess = '';

          if (fieldTypeData.type in fieldFunctions) {
            [fieldValue, ColumnProcess] = fieldFunctions[fieldTypeData.type](fieldValue, baseUrl);
          } else {
            fieldValue = ['Type not treated'];
            ColumnProcess = 'normal';
          }

          rowData[fieldName] = {
            data: fieldValue,
            name: fieldTypeData.name,
            type: fieldTypeData.type,
            gridtype: ColumnProcess,
          };
        });
        dataObject.push(rowData);
      });
      // reorder dataObject keys from issuesColumns.columns sometimes it's unordered
      const reorderedDataArray = dataObject.map((item) => reorderDataObjectKeys(item, requestedFields));

      // prepared data format for grid
      const preparedData = reorderedDataArray.map((obj) => Object.values(obj));
      /* eslint-disable no-template-curly-in-string */
      const { columnConfig } = JiraTable;
      const gridjsColumns = buildGridColumnsConfig(reorderedDataArray, columnConfig);
      const createGridTable = JiraTable.createTable;
      // remove the header
      $('div[id^="jira-issues-"]').remove();

      // remove the 'loading...' text
      $('div[id^="refresh-issues-loading-"]').remove();

      // remove the actualize link
      $('.refresh-issues-bottom').remove();

      $(element).before(createGridTable(index, gridjsColumns, preparedData));
      $(element).remove();
    },
  );
  context.getPerfMeasure('addJira');
};
