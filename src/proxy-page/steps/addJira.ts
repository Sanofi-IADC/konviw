import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import cheerio from 'cheerio';
import { JiraService } from 'src/jira/jira.service';
import { ConfigService } from '@nestjs/config';

export default (config: ConfigService): Step => {
  return async (
    context: ContextService,
    jiraService: JiraService,
  ): Promise<void> => {
    context.setPerfMark('addJira');
    const $ = context.getCheerioBody();
    const basePath = config.get('web.basePath');
    const version = config.get('version');

    if (!$('.refresh-wiki') || !$('.refresh-wiki').data()) {
      context.getPerfMeasure('addJira');
      return;
    }

    const jiraIssuesPromises = [];
    $('.refresh-wiki').each((_, elementJira: cheerio.TagElement) => {
      const wikimarkup: string = elementJira.attribs['data-wikimarkup'];
      const xmlWikimarkup = cheerio.load(wikimarkup, { xmlMode: true });
      const filter = xmlWikimarkup(
        'ac\\:parameter[ac\\:name="jqlQuery"]',
      ).text();
      const columns =
        xmlWikimarkup('ac\\:parameter[ac\\:name="columns"]').text() +
        ',issuetype';
      const maximumIssues = xmlWikimarkup(
        'ac\\:parameter[ac\\:name="maximumIssues"]',
      ).text();

      jiraIssuesPromises.push({
        issues: {
          issues: jiraService
            .findTickets(filter, columns, Number(maximumIssues))
            .then((res) => res.issues),
        },
        columns,
      });
    });

    const jirasIssues = await Promise.all(
      jiraIssuesPromises.map((j) => j.issues.issues),
    );
    const issuesColumns = jiraIssuesPromises.map((jira, i) => ({
      columns: jira.columns,
      issues: jirasIssues[i],
    }));

    issuesColumns.forEach(({ issues, columns }, index) => {
      const data = [];
      issues.forEach((issue) => {
        data.push({
          key: {
            name: issue.key,
            link: `${config.get('confluence.baseURL')}/browse/${
              issue.key
            }?src=confmacro`,
          },
          t: {
            name: issue.fields.issuetype.name,
            icon: issue.fields.issuetype?.iconUrl,
          },
          summary: {
            name: issue.fields.summary,
            link: `${config.get('confluence.baseURL')}/browse/${
              issue.key
            }?src=confmacro`,
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
        });
      });

      const requestedFields = columns.split(',');

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
                formatter: (cell) => gridjs.html(${'`<div style="color:${cell.color}">${cell.name}</div>`'})
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
      gridjsColumns += ']';

      // remove the header
      $('div[id^="jira-issues-"]').remove();

      // remove the 'loading...' text
      $('div[id^="refresh-issues-loading-"]').remove();

      // remove the actualize link
      $('.refresh-issues-bottom').remove();

      // add the grid using http://gridjs.io library

      $('head').append(
        `<link href="${basePath}/gridjs/mermaid.min.css?cache=${version}" rel="stylesheet" />`,
      );

      $('body').append(
        `<script defer src="${basePath}/gridjs/gridjs.production.min.js?cache=${version}"></script>`,
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
                padding: '5px 5px'
              },
              th: {
                padding: '5px 5px'
              }
            }
          }).render(document.getElementById("gridjs${index}"));
        })
      </script>`,
      );
    });
    context.getPerfMeasure('addJira');
  };
};
