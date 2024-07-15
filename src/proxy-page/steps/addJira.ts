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

  const formatDateTime = (dateString) => (dateString
    ? `${new Date(dateString).toLocaleString('en-EN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })}`
    : '');
  const formatDate = (dateString) => (dateString
    ? `${new Date(dateString).toLocaleString('en-EN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })}`
    : '');
  
  const formatNumber = (number) => number ||'';

  const formatOption = (option)=> option?.value || '';

  const formatUser = (user) => user?.displayName ||'';

  const formatResolution = (resolution) =>  resolution?.name || '';
  const formatTeam = (team) =>  team?.name || '';
  const getTextContent = (customField) => customField?.content
    ?.flatMap((item) => item.content)
    ?.map((subItem) => subItem.text)
    .join(' ') || '';

  const formatPriority = (priority: { name?: string; iconUrl?: string }) => {
    return {
      name: priority?.name || '',
      icon: priority?.iconUrl || '',
    };
  };
  const formatString = (string) => {
    if (string?.content) {
      return string.content
        .flatMap((item) => item.content)
        .map((subItem) => subItem.text)
        .join(' ');
    } else if (string) {
      return string;
    } else {
      return '';
    }
  };

  const getContentWithMap = (contents) => contents?.map((content) => content.name) || [];

  const createLinkObject = (key, baseUrl, name = '') => ({
    name: name || key || '',
    link: key ? `${baseUrl}/browse/${key}?src=confmacro` : '',
  });

  const getSubtasksInfo = (subtasks, baseUrl) =>
    subtasks?.map((subtask) => createLinkObject(subtask.key, baseUrl)) || [];

  const getIssueLinksInfo = (issuelinks, baseUrl) =>
    issuelinks?.map((link) => createLinkObject(link.outwardIssue?.key || link.inwardIssue?.key, baseUrl)) || [];

  let fields = [];

  const promise = jiraService.getFields();
  
  await promise.then((result) => {
    fields = result;
  });




const checkFieldExistence = (fields, idToCheck: string): { name: string, type: string | undefined, isArray?: boolean } | undefined => {
  const field = fields.find(field => field.id === idToCheck);
  if (field) {
    let type = field.schema?.type;
    let isArray = false;

    if (type === 'array' && field.schema?.items) {
      type = field.schema.items;
      isArray = true;
    }

    const name = field.name;
    return { name, type, isArray };
  }
  return undefined;
};

  const fieldFunctions: {
  [key: string]: (value: any) => any;
  } = {
    "date": formatDate,
    "datetime": formatDateTime,
    "number": formatNumber,
    "option": formatOption,
    "user": formatUser,
    "priority": formatPriority,
    "string": formatString,
    "resolution": formatResolution,
    //"component": formatComponent,
    //"json": formantJson,
    "team": formatTeam,

  };

  issuesColumns.forEach(
    ({
      issues, columns, element, server,
    }, index) => {
      const data = [];
      // Load new base URL if defined a specific connection for Jira as ENV variables
      // otherwise default to standard baseURL defined for main server
      const baseUrl = process.env[`CPV_JIRA_${server.replace(/\s/, '_')}_BASE_URL`]
        ?? config.get('confluence.baseURL');
      issues.forEach((issue) => {
        console.log(issue)
        const dataObject: any = {};
        Object.keys(issue.fields).forEach((fieldName) => {
          let fieldValue = issue.fields[fieldName];
          const fieldTypeData = checkFieldExistence(fields,fieldName)
          if (fieldTypeData.type in fieldFunctions && fieldValue != null) {
              fieldValue = fieldFunctions[fieldTypeData.type](fieldValue)
          }

          dataObject[fieldName] = {};
          
          dataObject[fieldName]['data'] = fieldValue;
          dataObject[fieldName]['name'] = fieldTypeData.name;
          dataObject[fieldName]['type'] = fieldTypeData.type;
          console.log(dataObject[fieldName])
        });
        data.push({
          reporter: issue.fields.reporter?.displayName || '',
          components: getContentWithMap(issue.fields.components),
          acceptance_criteria: getTextContent(issue.fields.customfield_10042),
          detail_design_reference: getTextContent(issue.fields.customfield_10129),
          storypoints: issue.fields.customfield_10026 || '',
          labels: issue.fields.labels || [],
          sprint: getContentWithMap(issue.fields.customfield_10020),
          key: createLinkObject(issue.key, baseUrl),
          parent: createLinkObject(issue.fields.parent?.key, baseUrl),
          subtasks: getSubtasksInfo(issue.fields.subtasks, baseUrl),
          issuelinks: getIssueLinksInfo(issue.fields.issuelinks, baseUrl),
          t: {
            name: issue.fields.issuetype.name || '',
            icon: issue.fields.issuetype?.iconUrl || '',
          },
          summary: createLinkObject(issue.key, baseUrl, issue.fields.summary),
          updated: formatDate(issue.fields.updated),
          startdate: formatDate(issue.fields.customfield_10015),
          duedate: formatDate(issue.fields.duedate),
          assignee: issue.fields.assignee?.displayName || '',
          pr: {
            name: issue.fields.priority?.name || '',
            icon: issue.fields.priority?.iconUrl || '',
          },
          status: {
            name: issue.fields.status?.name || '',
            color: issue.fields.status?.statusCategory.colorName || '',
          },
          resolution: issue.fields.resolution?.name || '',
          fixVersion: {
            name: fixVersionNameFactory(issue) || '',
            link: fixVersionUrlFactory(issue) || '',
          },
          description: {
            name: descriptionIssueFactory(issue, baseUrl) || '',
          },
        });
      });
      const requestedFields = columns.split(',');

      /* eslint-disable no-template-curly-in-string */

      const columnConfigs = {
        key: `
        { 
          name: 'Key',
          sort: { compare: (a, b) => (a.name > b.name ? 1 : -1)},
          formatter: (cell) => gridjs.html(${'`<a href="${cell.link}" target="_blank">${cell.name}</a>`'})
        }`,
        summary: `
          {
            name: 'Summary',
            sort: { compare: (a, b) => (a.name > b.name ? 1 : -1) },
            formatter: (cell) => gridjs.html(\`<a href="\${cell.link}" target="_blank">\${cell.name}</a>\`)
          }`,
        description: `
          {
            name: 'Description',
            sort: { compare: (a, b) => (a.name > b.name ? 1 : -1) },
            formatter: (cell) => gridjs.html(\`\${cell.name}\`)
          }`,
        issuetype: `
          {
            name: 'T',
            sort: { compare: (a, b) => (a.name > b.name ? 1 : -1) },
            formatter: (cell) => gridjs.html(\`<img src="\${cell.icon}" style="height:25px;padding:0"/>\`)
          }`,
        status: `
          {
            name: 'Status',
            sort: { compare: (a, b) => (a.name > b.name ? 1 : -1) },
            formatter: (cell) => gridjs.html
              (\`<div class="aui-lozenge" style="background-color:\${cell.color};color:darkgrey;font-size: 11px;">\${cell.name}</div>\`)
          }`,
        updated: `
          {
            name: 'Updated',
            sort: { compare: (a, b) => (new Date(a) > new Date(b) ? 1 : -1) }
          }`,
        customfield_10015: `
          {
            name: 'Startdate',
            sort: { compare: (a, b) => (new Date(a) > new Date(b) ? 1 : -1) }
          }`,
        duedate: `
          {
            name: 'Duedate',
            sort: { compare: (a, b) => (new Date(a) > new Date(b) ? 1 : -1) }
          }`,
        assignee: `
          {
            name: 'Assignee'
          }`,
        customfield_10001: `
          {
            name: 'Team'
          }`,
        customfield_10042: `
          {
            name: 'Acceptance_Criteria'
          }`,
        customfield_10129: `
          {
            name: 'Detail_Design_Reference'
          }`,
        customfield_10026: `
          {
            name: 'Storypoints'
          }`,
        reporter: `
          {
            name: 'Reporter'
          }`,
        parent: `
          {
            name: 'Parent',
            sort: { compare: (a, b) => (a.name > b.name ? 1 : -1) },
            formatter: (cell) => gridjs.html(\`<a href="\${cell.link}" target="_blank">\${cell.name}</a>\`)
          }`,
        labels: `
          {
            name: 'Labels',
            formatter: (cell) => gridjs.html(cell.map(item => \`<p>\${item}</p>\`).join(''))
          }`,
        issuelinks: `
          {
            name: 'Issuelinks',
            sort: { compare: (a, b) => (a.name > b.name ? 1 : -1) },
            formatter: (cell) => gridjs.html(cell.map((item) => \`<a href="\${item.link}" target="_blank">\${item.name}</a>\`).join(', '))
          }`,
        subtasks: `
          {
            name: 'Subtasks',
            sort: { compare: (a, b) => (a.name > b.name ? 1 : -1) },
            formatter: (cell) => gridjs.html(cell.map((item) => \`<a href="\${item.link}" target="_blank">\${item.name}</a>\`).join(', '))
          }`,
        components: `
          {
            name: 'Components',
            formatter: (cell) => gridjs.html(cell.map(item => \`<p>\${item}</p>\`).join(''))
          }`,
        priority: `
          {
            name: 'Pr',
            sort: { compare: (a, b) => (a.name > b.name ? 1 : -1) },
            formatter: (cell) => gridjs.html(\`<img src="\${cell.icon}" style="height:25px;padding:0"/>\`)
          }`,
        resolution: `
          {
            name: 'Resolution'
          }`,
        customfield_10020: `
          {
            name: 'Sprint',
            formatter: (cell) => gridjs.html(cell.map(item => \`<p style="display:inline-block">\${item}</p>\`).join(''))
          }`,
        fixVersions: `
          {
            name: 'Fix Version',
            sort: { compare: (a, b) => (a.name > b.name ? 1 : -1) },
            formatter: (cell) => cell.link ? gridjs.html
              (\`<a href="\${cell.link}" target="_blank">\${cell.name}</a>\`) : gridjs.html(\`\${cell.name}\`)
          }`,
      };

      const gridjsColumns = `[${Object.keys(columnConfigs)
        .filter((field) => requestedFields.includes(field))
        .map((field) => columnConfigs[field])
        .join(',')}]`;

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
