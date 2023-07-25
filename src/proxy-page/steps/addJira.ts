import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';
import { JiraService } from '../../jira/jira.service';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';

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
      const { data } = await jiraService.findTickets(server, query, '');
      issuesToFindPromises.push(data);
    });
  });
  await Promise.allSettled(issuesToFindPromises).then((results) => {
    results.forEach((res: any, index: number) => {
      const {
        value: { total },
      } = res;
      const url = encodeURI(
        `${confluenceDomain}/secure/IssueNavigator.jspa?reset=true&jqlQuery=${issuesCountQueries[index]}`,
      );
      $(
        `span.static-jira-issues_count[data-macro-id=${issuesCountMacroIds[index]}]`,
      ).replaceWith(`<a target="_blank" href="${url}">${total} issues</a>`);
    });
  });

  if (!$('.refresh-wiki') || !$('.refresh-wiki').data()) {
    context.getPerfMeasure('addJira');
    return;
  }

  const elementTags = [];
  // this is the outer div used to wrap the Jira issues macro
  // which it is saved to place the tables just before
  $('div.confluence-jim-macro.jira-table').each(
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

  const descriptionIssueFactory = (
    issue: { [key: string]: any },
    baseUrl: string,
  ) => issue.renderedFields?.description
    .replace(
      // eslint-disable-next-line prefer-regex-literals
      new RegExp('src="/rest/api/3/', 'g'),
      `src="${baseUrl}/rest/api/3/`,
    );

  const getFixVersionObject = (issue: { [key: string]: any }) => {
    const fixVersion = issue.fields?.fixVersions;
    if (fixVersion && fixVersion[0]) {
      return fixVersion[0];
    }
    return {};
  };

  const fixVersionUrlFactory = (issue: { [key: string]: any }) => {
    const description = getFixVersionObject(issue)?.description;
    if (description) {
      const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
      const results = description.match(urlRegex);
      return (results && results[0]) ?? '';
    }
    return '';
  };

  const fixVersionNameFactory = (issue: { [key: string]: any }) => {
    const name = getFixVersionObject(issue)?.name;
    return name ?? '';
  };

  issuesColumns.forEach(
    ({
      issues, columns, element, server, filter,
    }, index) => {
      const data = [];
      // Load new base URL if defined a specific connection for Jira as ENV variables
      // otherwise default to standard baseURL defined for main server
      const baseUrl = process.env[`CPV_JIRA_${server.replace(/\s/, '_')}_BASE_URL`]
          ?? config.get('confluence.baseURL');
      issues.forEach((issue) => {
        data.push({
          key: {
            name: issue.key,
            link: `${baseUrl}/browse/${issue.key}?src=confmacro`,
          },
          t: {
            name: issue.fields.issuetype.name,
            icon: issue.fields.issuetype?.iconUrl,
          },
          summary: {
            name: issue.fields.summary,
            link: `${baseUrl}/browse/${issue.key}?src=confmacro`,
          },
          updated: issue.fields.updated
            ? `${new Date(issue.fields.updated).toLocaleString('en-EN', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}`
            : '',
          assignee: issue.fields.assignee?.displayName,
          pr: {
            name: issue.fields.priority?.name,
            icon: issue.fields.priority?.iconUrl,
          },
          status: {
            name: issue.fields.status?.name,
            color: issue.fields.status?.statusCategory.colorName,
          },
          resolution: issue.fields.resolution?.name,
          fixVersion: {
            name: fixVersionNameFactory(issue),
            link: fixVersionUrlFactory(issue),
          },
          description: {
            name: descriptionIssueFactory(issue, baseUrl),
          },
        });
      });

      const requestedFields = columns.split(',');

      /* eslint-disable no-template-curly-in-string */
      let gridjsColumns = `[{
                name: 'Key',
                sort: {
                  compare: (a, b) => (a.name > b.name ? 1 : -1),
                },
                formatter: (cell) => gridjs.html(${'`<a href="${cell.link}" target="_blank">${cell.name}</a>`'})
              },`;
      if (requestedFields.includes('summary')) {
        gridjsColumns += `{
                name: 'Summary',
                sort: {
                  compare: (a, b) => (a.name > b.name ? 1 : -1),
                },
                formatter: (cell) => gridjs.html(${'`<a href="${cell.link}" target="_blank">${cell.name}</a>`'})
              },`;
      }
      if (requestedFields.includes('description')) {
        gridjsColumns += `{
                name: 'Description',
                sort: {
                  compare: (a, b) => (a.name > b.name ? 1 : -1),
                },
                formatter: (cell) => gridjs.html(${'`${cell.name}`'})
              },`;
      }
      if (requestedFields.includes('issuetype')) {
        gridjsColumns += `{
                name: 'T',
                sort: {
                  compare: (a, b) => (a.name > b.name ? 1 : -1),
                },
                formatter: (cell) => gridjs.html(cell ? ${'`<img src="${cell.icon}" style="height:25px;padding:0"/>`'} : ''),
              },`;
      }
      if (requestedFields.includes('status')) {
        gridjsColumns += `{
                name: 'Status',
                sort: {
                  compare: (a, b) => (a.name > b.name ? 1 : -1),
                },
                formatter: (cell) => gridjs.html(
                  ${'`<div class="aui-lozenge" style="background-color:${cell.color};color:darkgrey;font-size: 11px;">${cell.name}</div>`'})
              },`;
      }
      if (requestedFields.includes('updated')) {
        gridjsColumns += `{
                name: 'Updated',
                sort: {
                  compare: (a, b) => (new Date(a) > new Date(b) ? 1 : -1),
                }
              },`;
      }
      if (requestedFields.includes('assignee')) {
        gridjsColumns += `{
                name: 'Assignee',
              },`;
      }
      if (requestedFields.includes('priority')) {
        gridjsColumns += `{
                name: 'Pr',
                sort: {
                  compare: (a, b) => (a.name > b.name ? 1 : -1),
                },
                formatter: (cell) => gridjs.html(cell ? ${'`<img src="${cell.icon}" style="height:25px;padding:0"/>`'} : ''),
              },`;
      }
      if (requestedFields.includes('resolution')) {
        gridjsColumns += ` {
                name: 'Resolution',
              },`;
      }
      if (requestedFields.includes('fixVersions')) {
        gridjsColumns += `{
                name: 'Fix Version',
                sort: {
                  compare: (a, b) => (a.name > b.name ? 1 : -1),
                },
                formatter: (cell) =>
                  cell.link ? gridjs.html(${'`<a href="${cell.link}" target="_blank">${cell.name}</a>`'}) : gridjs.html(${'`${cell.name}`'})
              },`;
      }
      gridjsColumns += ']';

      // remove the header
      $('div[id^="jira-issues-"]').remove();

      // remove the 'loading...' text
      $('div[id^="refresh-issues-loading-"]').remove();

      // remove the actualize link
      $('.refresh-issues-bottom').remove();

      $(element).before(
        `<strong>Jira issues for ${filter}</strong>`,
        `<div id="gridjs${index}"></div>`,
        `<script>
        document.addEventListener('DOMContentLoaded', function () {
          new gridjs.Grid({
            columns: ${gridjsColumns},
            data: ${JSON.stringify(data)},
            sort: true,
            search: {
              enabled: true,
              selector: (cell, rowIndex, cellIndex) => cell ? cell.name || cell : ''
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
