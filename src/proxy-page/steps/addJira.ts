import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';
import { JiraService } from '../../jira/jira.service';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import * as FieldInterfaces from '../dto/FieldInterface';

export default (config: ConfigService, jiraService: JiraService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addJira');
  const $ = context.getCheerioBody();
  const basePath = config.get('web.basePath');
  const version = config.get('version');
  const confluenceDomain = config.get('confluence.baseURL');
  /* fetch Jira issues details and update the title and status for each one */
  const issuesDetailsPromises = [];
  $('span.confluence-jim-macro.jira-issue').each(
    (_, elementJira: cheerio.Element) => {
      const jiraKey = $(elementJira).attr('data-jira-key');
      if (!jiraKey) return;
      issuesDetailsPromises.push(jiraService.getTicket(jiraKey));
    },
  );

  await Promise.allSettled(issuesDetailsPromises).then((results) => {
    results.forEach((res: any) => {
      if (!res?.value.key || !res?.value?.fields) return;
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
  const issuesCountPromises = [];
  const issuesCountMacroIds = [];
  $('span.static-jira-issues_count').each(
    (_, elementJira: cheerio.Element) => {
      const dataMacroId = $(elementJira).attr('data-macro-id');
      issuesCountPromises.push(
        jiraService.getMaCro(context.getPageId(), dataMacroId),
      );
      issuesCountMacroIds.push(dataMacroId);
    },
  );
  const issuesToFindPromises = [];
  const issuesCountQueries = [];
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

  // collect all new Jira issues macro elements
  const newJiraIssuesMacroElements = $('.external-link').get().filter((link) => link.attribs['data-datasource']);

  const elementsToVerifyStep = [
    ...$(newJiraIssuesMacroElements).toArray(),
    ...$('.refresh-wiki').toArray(),
  ];

  if (!elementsToVerifyStep.length) {
    context.getPerfMeasure('addJira');
    return;
  }

  const elementTags = [];
  // this is the outer div used to wrap the Jira issues macro and anchor to wrap the new Jira issues macro
  // which it is saved to place the tables just before
  const jiraIssuesLegacyMacro = $('div.confluence-jim-macro.jira-table');
  const newJiraIssuesMacro = $(newJiraIssuesMacroElements);

  $([...jiraIssuesLegacyMacro, ...newJiraIssuesMacro]).each(
    (_, elementJira: cheerio.Element) => {
      elementTags.push(elementJira);
    },
  );
  const jiraIssuesPromises = [];
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
    const wikimarkup = JSON.parse(link.attribs['data-datasource']) as { [key: string]: any };
    const server = 'System JIRA';
    const filter = wikimarkup.parameters.jql;
    const columns = wikimarkup.views[0].properties.columns.map(({ key }) => key).join(',');

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

  let jiraFields = [];
  const promise = jiraService.getFields();
  await promise.then((result) => {
    jiraFields = result;
  });

  const checkFieldExistence = (fields, idToCheck: string): { name: string, type: string | undefined, isArray?: boolean } | undefined => {
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

  const fieldFunctions: {
    [key: string]: (value: any, baseUrl?: string) => any;
  } = {
    date: FieldInterfaces.formatDate,
    datetime: FieldInterfaces.formatDateTime,
    number: FieldInterfaces.formatNumber,
    option: FieldInterfaces.formatOption,
    user: FieldInterfaces.formatUser,
    priority: FieldInterfaces.formatPriority,
    string: FieldInterfaces.formatString,
    resolution: FieldInterfaces.formatResolution,
    version: FieldInterfaces.formatVersion,
    component: FieldInterfaces.formatComponent,
    team: FieldInterfaces.formatTeam,
    status: FieldInterfaces.formatStatus,
    issuetype: FieldInterfaces.formatIssueType,
    issuelinks: (value: any, baseUrl?: string) =>
      FieldInterfaces.formatIssueLinks(value, baseUrl),
    json: FieldInterfaces.formatJson,
  };

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
      const requestedFields = columns.split(',');
      const dataObject:DataObject[] = [];
      // Load new base URL if defined a specific connection for Jira as ENV variables
      // otherwise default to standard baseURL defined for main server
      const baseUrl = process.env[`CPV_JIRA_${server.replace(/\s/, '_')}_BASE_URL`]
        ?? config.get('confluence.baseURL');
      issues.forEach((issue) => {
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
          const fieldTypeData = checkFieldExistence(jiraFields, fieldName);
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
      const reorderedDataArray = dataObject.map((item) => {
        const reorderedItem = {};
        requestedFields.forEach((column) => {
          if (Object.prototype.hasOwnProperty.call(item, column)) {
            reorderedItem[column] = item[column];
          }
        });
        return reorderedItem;
      });
      // prepared data format for grid
      const preparedData = reorderedDataArray.map((obj) => Object.values(obj));
      /* eslint-disable no-template-curly-in-string */

      const columnConfig = {
        link: (name) => `{
          name: \`${name}\`,
          sort: { compare: (a, b) => (a.data.name > b.data.name ? 1 : -1) },
          formatter: (cell) => gridjs.html(cell.data.map((item) => \`<a href="\${item.link}" target="_blank">\${item.name}</a>\`).join(' '))
        }`,
        date: (name) => `{
          name: \`${name}\`,
            sort: {
          compare: (a, b) => {
            var dateA = new Date(a.data);
            var dateB = new Date(b.data);
            return dateA > dateB ? 1 : (dateA < dateB ? -1 : 0);
          }
        },
          formatter: (cell) => gridjs.html(cell.data.map((item) => \`\${item}\`))
        }`,
        normal: (name) => `{
          name: \`${name}\`,
          sort: { compare: (a, b) => (a.data > b.data ? 1 : -1) },
          formatter: (cell) => gridjs.html(cell.data.map((item) => \`\${item}\`).join(' '))
        }`,
        status: (name) => `
        {
          name: \`${name}\`,
          sort: { compare: (a, b) => (a.data.name > b.data.name ? 1 : -1) },
          formatter: (cell) => gridjs.html(
            cell.data.map(item => \`
              <div class="aui-lozenge" style="background-color:\${item.color};color:darkgrey;font-size: 11px;">\${item.name}</div>
            \`).join(' ')
          )
        }`,
        icon: (name) => `
        {
          name: \`${name}\`,
          sort: { compare: (a, b) => (a.data.name > b.data.name ? 1 : -1) },
          formatter: (cell) => gridjs.html(
            cell.data.map(item => \`
              <div style="display: flex; align-items: center;">
                <img src="\${item.icon}" style="height:25px; margin-right: 5px;" />
              </div>
            \`).join(' ')
          )
        }`,
      };
      const createColumns = (data) => `[${data.slice(0, 1).flatMap((obj) =>
        Object.keys(obj)
          .map((key) => {
            const field = obj[key];
            const { gridtype } = field;
            const { name } = field;
            return columnConfig[gridtype](name);
          })
          .filter(Boolean)).join(',')}]`;
      const gridjsColumns = createColumns(reorderedDataArray);

      // remove the header
      $('div[id^="jira-issues-"]').remove();

      // remove the 'loading...' text
      $('div[id^="refresh-issues-loading-"]').remove();

      // remove the actualize link
      $('.refresh-issues-bottom').remove();

      $(element).before(
        `<div id="gridjs${index}"></div>`,
        `<script>
      document.addEventListener('DOMContentLoaded', function () {
      new gridjs.Grid({
        columns: ${gridjsColumns},
        data: ${JSON.stringify(preparedData)},
        sort: true,
        search: {
          enabled: true,
          selector: (cell, rowIndex, cellIndex) => cell.data.map(item => item.name).join(' ') || cell.data
        },
        width: '100%',
        style: {
          td: {
            padding: '5px 5px',
            maxWidth: '500px',
            minWidth: '25px',
            overflow: 'auto',
          },
          th: {
            padding: '5px 5px'
          }
        }
      }).render(document.getElementById("gridjs${index}"));
      })
      </script>`,
      );
      $(element).remove();
    },
  );
  context.getPerfMeasure('addJira');
};
