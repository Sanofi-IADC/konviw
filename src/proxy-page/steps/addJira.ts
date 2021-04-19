import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import cheerio from 'cheerio';
import { JiraService } from 'src/http/jira.service';

export default (): Step => {
  return async (
    context: ContextService,
    jiraService: JiraService,
  ): Promise<void> => {
    context.setPerfMark('addJira');
    const $ = context.getCheerioBody();

    if (!$('.refresh-wiki') || !$('.refresh-wiki').data()) {
      context.getPerfMeasure('addJira');
      return;
    }

    const wikimarkup: string = $('.refresh-wiki').data().wikimarkup;
    const xmlWikimarkup = cheerio.load(wikimarkup, { xmlMode: true });
    const filter = xmlWikimarkup('ac\\:parameter[ac\\:name="jqlQuery"]').text();
    const columns =
      xmlWikimarkup('ac\\:parameter[ac\\:name="columns"]').text() +
      ',issuetype';
    const maximumIssues = xmlWikimarkup(
      'ac\\:parameter[ac\\:name="maximumIssues"]',
    ).text();
    const { issues } = await jiraService.findTickets(
      filter,
      columns,
      Number(maximumIssues),
    );

    const data = [];
    issues.forEach((issue) => {
      data.push({
        key: {
          name: issue.key,
          link: `https://iadc.atlassian.net/browse/${issue.key}?src=confmacro`,
        },
        t: issue.fields.issuetype?.iconUrl,
        summary: {
          name: issue.fields.summary,
          link: `https://iadc.atlassian.net/browse/${issue.key}?src=confmacro`,
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
        pr: issue.fields.priority?.iconUrl,
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
                width: '5%',
                formatter: (cell) => gridjs.html(${'`<a href="${cell.link}" target="_blank">${cell.name}</a>`'})
              },`;
    if (requestedFields.includes('summary')) {
      gridjsColumns += `{
                name: 'Summary',
                width: '30%',
                formatter: (cell) => gridjs.html(${'`<a href="${cell.link}" target="_blank">${cell.name}</a>`'})
              },`;
    }

    if (requestedFields.includes('issuetype')) {
      gridjsColumns += `{
                name: 'T',
                width: '2%',
                formatter: (cell) => gridjs.html(cell ? ${'`<img src="${cell}" style="height:2.5rem"/>`'} : ''),
              },`;
    }
    if (requestedFields.includes('status')) {
      gridjsColumns += `{
                name: 'Status',
                width: '5%',
                formatter: (cell) => gridjs.html(${'`<div style="color:${cell.color}">${cell.name}</div>`'})
              },`;
    }
    if (requestedFields.includes('updated')) {
      gridjsColumns += `{
                name: 'Updated',
                width: '7%',
                sort: {
                  compare: (a, b) => (new Date(a) > new Date(b) ? 1 : -1),
                }
              },`;
    }
    if (requestedFields.includes('assignee')) {
      gridjsColumns += `{
                name: 'Assignee',
                width: '10%',
              },`;
    }
    if (requestedFields.includes('priority')) {
      gridjsColumns += `{
                name: 'Pr',
                width: '3%',
                formatter: (cell) => gridjs.html(cell ? ${'`<img src="${cell}" style="height:2.5rem"/>`'} : ''),
              },`;
    }
    if (requestedFields.includes('resolution')) {
      gridjsColumns += ` {
                name: 'Resolution',
                width: '5%',
              },`;
    }
    gridjsColumns += ']';
    console.log(gridjsColumns);

    // remove the header
    $('div[id^="jira-issues-"]').remove();

    // remove the 'loading...' text
    $('div[id^="refresh-issues-loading-"]').remove();

    // remove the actualize link
    $('.refresh-issues-bottom').remove();

    // add the grid using http://gridjs.io library
    $('#Content').append(
      '<script src="https://unpkg.com/gridjs/dist/gridjs.production.min.js"></script>',
      '<link href="https://unpkg.com/gridjs/dist/theme/mermaid.min.css" rel="stylesheet" />',
      '<div id="gridjs"></div>',
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
            style: {
              td: {
                padding: '5px 5px'
              },
              th: {
                padding: '5px 5px'
              }
            }
          }).render(document.getElementById("gridjs"));
        })
      </script>`,
    );

    context.getPerfMeasure('addJira');
  };
};
