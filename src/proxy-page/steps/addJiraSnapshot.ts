import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';
import { JiraService } from '../../jira/jira.service';
import { XrayService, XrayTestRun } from '../../xray/xray.service';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import * as FieldInterfaces from '../dto/FieldInterface';
import * as jiraGrid from '../utils/jiraGrid';

// Synthetic field metadata describing the Xray Test Run columns. Xray test runs
// are not Jira issues, so their column ids (as configured in the snapshot macro's
// XRAY_TESTRUNS level) are not returned by the Jira field API. We declare them
// here so the existing grid pipeline (fieldFunctions / columnConfig) can render
// them like any other column. Note: `status` is intentionally omitted because it
// is a real Jira field and already resolves through getFields().
const XRAY_TESTRUN_FIELDS = [
  { id: 'testexeckey', name: 'Test Execution Key', schema: { type: 'issuelinks' } },
  { id: 'fixversions', name: 'Fix versions', schema: { type: 'string' } },
  { id: 'defects', name: 'Defects', schema: { type: 'issuelinks' } },
  { id: 'test', name: 'Test', schema: { type: 'issuelinks' } },
  { id: 'startedon', name: 'Started On', schema: { type: 'datetime' } },
  { id: 'finishedon', name: 'Finished On', schema: { type: 'datetime' } },
  { id: 'executedby', name: 'Executed By', schema: { type: 'string' } },
  { id: 'testenvironments', name: 'Test Environments', schema: { type: 'string' } },
  { id: 'comment', name: 'Comment', schema: { type: 'string' } },
];

export default (
  config: ConfigService,
  jiraService: JiraService,
  xrayService?: XrayService,
): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addJiraSnapshot');
  const $ = context.getCheerioBody();
  const $xml = cheerio.load(context.getBodyStorage(), { xmlMode: true });
  const basePath = config.get('web.basePath');
  const version = config.get('version');
  const confluenceDomain = config.get('confluence.baseURL');

  const { fieldFunctions } = FieldInterfaces;
  const { columnConfig } = jiraGrid;
  const createGridTable = jiraGrid.createTable;

  // add the grid using http://gridjs.io library
  $('head').append(
    `<link href="${basePath}/gridjs/mermaid.min.css?cache=${version}" rel="stylesheet" />`,
  );
  $('body').append(
    `<script defer src="${basePath}/gridjs/gridjs.production.min.js?cache=${version}"></script>`,
  );

  const jiraJqlSnapshots = [];

  // Select elements with the attribute data-macro-name="jira-jql-snapshot"
  $('div[data-macro-name="jira-jql-snapshot"]').each((i, element) => {
    jiraJqlSnapshots.push($(element));
  });

  const macroParamsList = [];
  $xml('ac\\:parameter[ac\\:name="macroParams"]').each((i, element) => {
    const macroParams = $(element).text();
    macroParamsList.push(macroParams);
  });

  let jiraFields_ = [];
  const promise = jiraService.getFields();
  await promise.then((result) => {
    jiraFields_ = result;
  });
  // Make the Xray Test Run columns resolvable by the grid rendering pipeline.
  jiraFields_ = [...(jiraFields_ ?? []), ...XRAY_TESTRUN_FIELDS];

  const processJqlsWithKeys = async (jqlParams: JqlParams, jiraFields, index) => {
    const allIssues = [];
    let levelJiraIssues = [];
    let keys = [];
    /* eslint-disable no-plusplus */
    for (let i = 0; i < jqlParams.jqls.length; i++) {
      let child = '';
      const jiraIssues = [];
      const apiCalls = [];

      if (i === 0) {
        jiraIssues.push({
          issues: {
            issues: jiraService
              .findTickets('System JIRA', jqlParams.jqls[i], jqlParams.allColumnsId[i])
              .then((res) => res?.data?.issues ?? []),
          },
        });
      } else if (jqlParams.levelType[i] === 'XRAY_TESTRUNS') {
        // The previous level holds the parent Tests (Test Cases); we fetch their
        // Test Runs from the Xray API (not available via the Jira API) in a single
        // batched call and group the runs back per Test to keep the grid hierarchy
        // aligned. The level's own query may restrict to a fix version.
        const parentTests = levelJiraIssues.flat();
        const testIds = parentTests.map((test) => test?.id).filter(Boolean);
        let runs: XrayTestRun[] = [];
        if (xrayService) {
          // eslint-disable-next-line no-await-in-loop
          runs = await xrayService.getTestRunsByTestIds(testIds).catch(() => []);
        }
        const filteredRuns = filterTestRunsByFixVersion(runs, jqlParams.jqls[i]);
        const runsByTest = groupTestRunsByTest(filteredRuns);
        parentTests.forEach((test) => {
          const testRuns = runsByTest[test?.id] ?? [];
          jiraIssues.push({
            issues: {
              issues: Promise.resolve(
                mapTestRunsToIssues(testRuns, test?.key, confluenceDomain),
              ),
            },
          });
        });
      } else {
        child = getJqlVariables(jqlParams.jqls[i]);
        keys = extractKeys(levelJiraIssues, jqlParams.allColumns, child);
        keys.forEach((key) => {
          const newJql = jqlParams.jqls[i].replace(new RegExp(`\\$${child}`, 'g'), `${key}`);
          jiraIssues.push({
            issues: {
              issues: jiraService
                .findTickets('System JIRA', newJql, jqlParams.allColumnsId[i])
                .then((res) => res?.data?.issues ?? []),
            },
          });
        });
      }

      apiCalls.push(...jiraIssues.map((j) => j.issues?.issues));
      /* eslint-disable no-await-in-loop */
      // order has to be respected
      levelJiraIssues = await Promise.all(apiCalls);
      /* eslint-disable no-await-in-loop */
      if (levelJiraIssues.length > 0) {
        allIssues.push(levelJiraIssues);
      }
      jqlParams.numberTicket.push(numberIssues(levelJiraIssues));
    }

    // After fetching data we will build a hierarchy (parents, children of all levels)
    const hierarchiedIssues = buildHierarchy(allIssues);

    // To display the data, we will duplicate the values in a format where each child contains the path of all its parents
    const duplicatedIssue = hierarchiedIssues.flatMap((issue) => traverseIssues(issue));

    // Then based on the duplicate value we will build the row format for gridjs
    const gridData = extractKeysColumns(duplicatedIssue, jqlParams.allColumnsId, jiraFields, fieldFunctions, confluenceDomain);
    const preparedData = gridData.map((obj) => Object.values(obj));
    const gridjsColumns = createHeaderGridColumns(jqlParams, jiraFields, columnConfig, fieldFunctions, confluenceDomain);
    // Implementation of the gridjs table
    $(jiraJqlSnapshots[index]).append(createGridTable(index, gridjsColumns, preparedData));
  };

  const promises = macroParamsList.map((params, index) => {
    const jsonData = JSON.parse(params);
    const jqlParams: JqlParams = {
      jqls: [],
      titles: [],
      levelType: [],
      allColumnsId: [],
      allColumnsName: [],
      numberTicket: [],
      allColumns: {},
    };

    if (jsonData.levels) {
      jsonData.levels.forEach((level) => {
        processLevel(level, jqlParams);
      });
    }

    return processJqlsWithKeys(jqlParams, jiraFields_, index);
  });

  await Promise.all(promises);
  context.getPerfMeasure('addJiraSnapshot');
};

function processLevel(level, jqlParams: JqlParams) {
  const cleanedJql = (level.jql ?? '').replace(/\n/g, '');
  jqlParams.jqls.push(cleanedJql);
  jqlParams.titles.push(level.title);
  jqlParams.levelType.push(level.levelType);
  const columnsId = [];
  const columnsName = [];
  level.fieldsPosition.forEach((field) => {
    columnsId.push(field.value.id);
    columnsName.push(field.label);
  });
  /* eslint-disable no-param-reassign */
  // in our case there is no override since each field.label has different values
  level.fieldsPosition.forEach((field) => {
    jqlParams.allColumns[field.label] = field.value.id;
  });
  /* eslint-enable no-param-reassign */
  jqlParams.allColumnsId.push(columnsId.join(','));
  jqlParams.allColumnsName.push(columnsName.join(','));
}

function checkFieldExistence(fields: jiraField[], idToCheck: string): CheckFieldResult | undefined {
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
}

function isInternalCustomField(fieldId: string): boolean {
  return /^customfield_\d+$/i.test(fieldId);
}

function traverseIssues(issue: Issues, parentStructure: Issues['item'][] = []): Issues['item'][][] {
  // Append the current issue's item to the parent structure
  const currentStructure = [...parentStructure, issue.item];
  // If the current issue has no children, return the current structure
  if (!issue.children || issue.children.length === 0) {
    return [currentStructure];
  }
  // Otherwise, traverse each child and accumulate the results
  return issue.children.reduce((results, child) => results.concat(traverseIssues(child, currentStructure)), []);
}

function extractKeys(issuesResponse: any[][], columnObject: Record<string, string>, child: string): string[] {
  return issuesResponse.flatMap((issueArray) => issueArray.map((issue) => {
    if (child === 'key') {
      return issue.key;
    }
    const field = issue.fields[columnObject[child]];
    if (field) {
      return field?.key ?? field;
    }
    return '';
  }));
}

function numberIssues(issuesResponse: any[][]) {
  let number = 0;
  issuesResponse.forEach((issueArray) => {
    number += issueArray.length;
  });
  return number;
}

// Groups a flat list of Xray Test Runs by their parent Test issue id.
function groupTestRunsByTest(runs: XrayTestRun[]): Record<string, XrayTestRun[]> {
  return (runs ?? []).reduce((grouped, run) => {
    const testId = run?.test?.issueId;
    if (!testId) {
      return grouped;
    }
    /* eslint-disable no-param-reassign */
    (grouped[testId] = grouped[testId] ?? []).push(run);
    /* eslint-enable no-param-reassign */
    return grouped;
  }, {} as Record<string, XrayTestRun[]>);
}

// Best-effort restriction of the runs to a fix version, parsed from the XRAY
// level query (e.g. `fixVersions = Track4 2.0.1`). When no fix version can be
// parsed, all runs are returned unchanged.
function filterTestRunsByFixVersion(runs: XrayTestRun[], levelJql: string): XrayTestRun[] {
  // Grab everything after the `fixVersions =` assignment, then narrow it down
  // imperatively. This avoids a single regex with overlapping quantifiers whose
  // backtracking would be super-linear on adversarial input.
  const assignmentMatch = /fixversions?\s*=\s*(.+)/i.exec(levelJql ?? '');
  const wanted = (assignmentMatch?.[1] ?? '')
    // Drop any trailing ` AND ...` clause that follows the value.
    .split(/\s+and\b/i)[0]
    .trim()
    // Strip surrounding quotes when the value was quoted.
    .replace(/^"(.*)"$/, '$1')
    .trim();
  if (!wanted) {
    return runs ?? [];
  }
  return (runs ?? []).filter((run) => {
    const versions = run?.testExecution?.jira?.fixVersions ?? [];
    return versions.some((version) => version?.name === wanted);
  });
}

// Maps Xray Test Runs into the issue-like shape expected by the grid pipeline,
// keyed by the macro's XRAY column ids (see XRAY_TESTRUN_FIELDS) so they render
// through the same fieldFunctions / columnConfig as Jira issues. All supported
// columns are populated; the grid only renders the ones the macro configured.
function mapTestRunsToIssues(runs: XrayTestRun[], testKeyFallback: string, baseUrl: string) {
  return (runs ?? []).map((run) => {
    const execKey = run?.testExecution?.jira?.key ?? '';
    const testKey = run?.test?.jira?.key ?? testKeyFallback ?? '';
    const statusName = run?.status?.name ?? '';
    const fixVersions = (run?.testExecution?.jira?.fixVersions ?? [])
      .map((version) => version?.name)
      .filter(Boolean)
      .join(', ');
    return {
      id: run?.id ?? '',
      key: execKey || testKey,
      self: execKey ? `${baseUrl}/browse/${execKey}` : '',
      fields: {
        testexeckey: execKey ? [{ id: run?.testExecution?.issueId ?? '', key: execKey, self: `${baseUrl}/browse/${execKey}` }] : [],
        test: testKey ? [{ id: run?.test?.issueId ?? '', key: testKey, self: `${baseUrl}/browse/${testKey}` }] : [],
        status: statusName
          ? [{
            self: '',
            description: run?.status?.description ?? '',
            iconUrl: '',
            name: statusName,
            id: '',
            statusCategory: {
              self: '',
              id: 0,
              key: '',
              colorName: run?.status?.color ?? '#6B778C',
              name: statusName,
            },
          }]
          : [],
        fixversions: fixVersions,
        defects: (run?.defects ?? []).map((defect) => ({ id: '', key: defect, self: `${baseUrl}/browse/${defect}` })),
        startedon: run?.startedOn ?? '',
        finishedon: run?.finishedOn ?? '',
        executedby: run?.executedById ?? '',
        testenvironments: (run?.testExecution?.testEnvironments ?? []).join(', '),
        comment: run?.comment ?? '',
      },
    };
  });
}

function splitStrings(inputArray: string[]): string[] {
  return inputArray.flatMap((str) => str.split(','));
}
export function getJqlVariables(jql: string): string {
  // Snapshot child levels reference their parent through a variable that is
  // either a bare field id (e.g. `$key`) or a quoted field name that may
  // contain spaces (e.g. `$"Epic Link"`). The capture group must stop at the
  // end of the token: for the bare form we only allow word characters so we do
  // not greedily swallow the rest of the clause (`$key AND issuetype in ...`).
  const variablePattern = /\$(?:"([^"]+)"|(\w+))/g;
  const matches = Array.from(jql.matchAll(variablePattern));
  const variables = matches
    .map((match) => (match[1] ?? match[2] ?? '').trim())
    .filter(Boolean);

  return variables.join(', ');
}

function buildChildren(data: any[][][], level: number, parentIndex: number): Issues[] {
  const children = [];

  if (level >= data.length) {
    return children;
  }

  data[level][parentIndex].forEach((childItem: any, index: number) => {
    const childNode = {
      item: childItem,
      children: buildChildren(data, level + 1, index),
    };
    children.push(childNode);
  });
  return children;
}

function buildHierarchy(data: any[][][]): Issues[] {
  const hierarchy = [];

  data[0][0].forEach((item: any, index: number) => {
    const node = {
      item,
      children: buildChildren(data, 1, index),
    };
    hierarchy.push(node);
  });

  return hierarchy;
}

function extractKeysColumns(issuesArray, allColumnsId, jiraFields, fieldFunctions, baseUrl): DataObject[] {
  const dataObjects: DataObject[] = [];

  issuesArray.forEach((issueArray) => {
    if (!issueArray) return;

    const rowData: RowData = {};

    issueArray.forEach((issue, levelIndex) => {
      const columns = splitStrings([allColumnsId[levelIndex]]);
      columns.forEach((column) => {
        const isKeyColumn = column === 'key';
        const fieldTypeData = checkFieldExistence(jiraFields, column);

        if (!isKeyColumn && isInternalCustomField(column) && fieldTypeData === undefined) {
          return;
        }

        let fieldValue = issue.fields[column];
        let columnProcess = '';

        if (isKeyColumn) {
          rowData[`key${levelIndex}`] = {
            data: [FieldInterfaces.createLinkObject(issue.key, baseUrl)],
            name: 'Key',
            type: 'issuelinks',
            gridtype: 'link',
          };
        } else if (fieldTypeData === undefined) {
          fieldValue = ['column undefined'];
          columnProcess = 'normal';
        } else if (fieldTypeData.type in fieldFunctions) {
          [fieldValue, columnProcess] = fieldFunctions[fieldTypeData.type](fieldValue, baseUrl);
        } else {
          fieldValue = ['Type not treated'];
          columnProcess = 'normal';
        }

        if (!isKeyColumn) {
          rowData[`${column}${levelIndex}`] = {
            data: fieldValue,
            name: fieldTypeData ? fieldTypeData.name : column,
            type: fieldTypeData ? fieldTypeData.type : 'string',
            gridtype: columnProcess,
          };
        }
      });
    });

    dataObjects.push(rowData);
  });

  return dataObjects;
}

function createGridColumns(columns, columnsName, jiraFields, columnConfig, fieldFunctions, confluenceDomain) {
  const allColumns_ = columns.flatMap((column, index) => {
    const fieldTypeData = checkFieldExistence(jiraFields, column);

    if (column === 'key') {
      return columnConfig.link(column);
    }

    if (isInternalCustomField(column) && fieldTypeData === undefined) {
      return '';
    }

    if (fieldTypeData === undefined || !(fieldTypeData.type in fieldFunctions)) {
      return columnConfig.normal(columnsName[index]);
    }

    const columnProcess = fieldFunctions[fieldTypeData.type]('', confluenceDomain);
    return columnConfig[columnProcess[1]](columnsName[index]);
  }).filter(Boolean);

  return `[${allColumns_.join(',')}]`;
}

function createHeaderGridColumns(jqlParams:JqlParams, jiraFields, columnConfig, fieldFunctions, confluenceDomain) {
  const gridColumns = jqlParams.allColumnsId.map((column, indexLevel) => {
    const columnId = splitStrings([column]);
    const columnName = splitStrings([jqlParams.allColumnsName[indexLevel]]);
    const name = `${jqlParams.titles[indexLevel]} (Total: ${jqlParams.numberTicket[indexLevel]})`;

    const header = `{
      name: '${name}',
      columns: ${createGridColumns(columnId, columnName, jiraFields, columnConfig, fieldFunctions, confluenceDomain)}
    }`;

    return header;
  });

  return `[${gridColumns.join(',')}]`;
}
interface JqlParams {
  jqls: string[];
  titles: string[];
  levelType: string[];
  allColumnsId: string[];
  allColumnsName: string[];
  numberTicket: number[];
  allColumns: Record<string, string>;
}

type Issues = {
  item: {
    expand: string;
    id: string;
    self: string;
    key: string;
    fields: Record<string, any>;
  };
  children: Issues[];
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
type CheckFieldResult = {
  name: string;
  type: string | undefined;
  isArray?: boolean;
};
type jiraField = {
  id: string;
  name: string;
  schema?: {
    type: string;
    items?: string;
  };
};

type DataObject = Record<string, Field>;
