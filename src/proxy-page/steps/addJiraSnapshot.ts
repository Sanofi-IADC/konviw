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
  { id: 'testexecsummary', name: 'Test Execution Summary', schema: { type: 'string' } },
  { id: 'testexecstatus', name: 'Test Execution Status', schema: { type: 'status' } },
  { id: 'fixversions', name: 'Fix versions', schema: { type: 'string' } },
  { id: 'defects', name: 'Defects', schema: { type: 'issuelinks' } },
  { id: 'test', name: 'Test', schema: { type: 'issuelinks' } },
  { id: 'testkey', name: 'Test Key', schema: { type: 'issuelinks' } },
  { id: 'testrunlinkcloud', name: 'Link to Test Run', schema: { type: 'weblink' } },
  { id: 'testversion', name: 'Test Version', schema: { type: 'string' } },
  { id: 'revision', name: 'Revision', schema: { type: 'string' } },
  { id: 'startedon', name: 'Started On', schema: { type: 'datetime' } },
  { id: 'finishedon', name: 'Finished On', schema: { type: 'datetime' } },
  { id: 'executedby', name: 'Executed By', schema: { type: 'user' } },
  { id: 'assignee', name: 'Assignee', schema: { type: 'user' } },
  { id: 'testenvironments', name: 'Test Environments', schema: { type: 'string' } },
  { id: 'comment', name: 'Comment', schema: { type: 'string' } },
  { id: 'gherkin', name: 'Gherkin', schema: { type: 'string' } },
  { id: 'unstructured', name: 'Definition', schema: { type: 'string' } },
  { id: 'evidences', name: 'Evidences', schema: { type: 'evidences' } },
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

  // Lightbox for Xray evidence images: clicking a thumbnail opens the full
  // image in a centered modal (80% of the viewport) instead of navigating away
  // or downloading it. Added once per page and driven by a delegated listener
  // since the grid (and its thumbnails) are rendered client-side by Grid.js.
  if (jiraJqlSnapshots.length > 0) {
    // The modal image is created client-side (not in the server HTML) so that
    // earlier link/image steps (e.g. fixLinks, which hides <img> tags that have
    // an empty src) cannot tamper with it before we set its src on click.
    $('body').append(
      '<div id="xray-evidence-modal" class="xray-evidence-modal" role="dialog" aria-modal="true" aria-label="Xray evidence">'
      + '<button type="button" class="xray-evidence-modal-close" aria-label="Close">&times;</button>'
      + '</div>',
    );
    $('body').append(`<script defer>
      document.addEventListener('DOMContentLoaded', function () {
        var modal = document.getElementById('xray-evidence-modal');
        if (!modal) { return; }
        var modalImg = document.createElement('img');
        modalImg.className = 'xray-evidence-modal-img';
        modal.appendChild(modalImg);
        var open = function (src, alt) {
          modalImg.setAttribute('src', src);
          modalImg.setAttribute('alt', alt || '');
          modal.classList.add('is-open');
        };
        var close = function () {
          modal.classList.remove('is-open');
          modalImg.setAttribute('src', '');
        };
        document.addEventListener('click', function (e) {
          var target = e.target;
          if (target && target.classList && target.classList.contains('xray-evidence-thumb')) {
            e.preventDefault();
            open(target.currentSrc || target.src, target.getAttribute('alt'));
          } else if (target === modal || (target.classList && target.classList.contains('xray-evidence-modal-close'))) {
            close();
          }
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') { close(); }
        });
      });
    </script>`);
  }

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
  jiraFields_ = jiraFields_ ?? [];
  // The Xray Test Run columns are only valid inside an XRAY_TESTRUNS level.
  // We keep a dedicated field list where the synthetic Xray metadata takes
  // precedence over the real Jira fields, so columns whose id collides with a
  // real Jira field (e.g. `comment`, `assignee`) resolve with the type/data we
  // control for Xray. Regular Jira levels keep using the untouched Jira fields.
  const xrayJiraFields = [...XRAY_TESTRUN_FIELDS, ...jiraFields_];

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
        const filteredRuns = filterTestRunsByEnvironment(
          filterTestRunsByFixVersion(runs, jqlParams.jqls[i]),
          jqlParams.jqls[i],
        );
        const runsByTest = groupTestRunsByTest(filteredRuns);
        // Xray returns account ids for the executor / assignee; resolve them to
        // display names in a single batched call so the grid shows user names.
        const accountIds = filteredRuns.flatMap((run) => [run?.executedById, run?.assigneeId]);
        // eslint-disable-next-line no-await-in-loop
        const usersById = await jiraService
          .getUsersByAccountIds(accountIds)
          .catch(() => ({}));
        parentTests.forEach((test) => {
          const testRuns = runsByTest[test?.id] ?? [];
          jiraIssues.push({
            issues: {
              issues: Promise.resolve(
                mapTestRunsToIssues(testRuns, test?.key, confluenceDomain, usersById, basePath),
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
    const gridData = extractKeysColumns(
      duplicatedIssue,
      jqlParams.allColumnsId,
      jqlParams.levelType,
      jiraFields,
      xrayJiraFields,
      fieldFunctions,
      confluenceDomain,
    );
    const preparedData = gridData.map((obj) => Object.values(obj));
    const gridjsColumns = createHeaderGridColumns(jqlParams, jiraFields, xrayJiraFields, columnConfig, fieldFunctions, confluenceDomain);
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
  const match = (levelJql ?? '').match(/fixversions?\s*=\s*"?([^"\n]+?)"?\s*(?:and|$)/i);
  const wanted = match?.[1]?.trim();
  if (!wanted) {
    return runs ?? [];
  }
  return (runs ?? []).filter((run) => {
    const versions = run?.testExecution?.jira?.fixVersions ?? [];
    return versions.some((version) => version?.name === wanted);
  });
}

// Best-effort restriction of the runs to a test environment, parsed from the
// XRAY level query (e.g. `environments = Test`). Test environments live on the
// Test Execution in Xray. When no environment can be parsed, all runs are
// returned unchanged.
function filterTestRunsByEnvironment(runs: XrayTestRun[], levelJql: string): XrayTestRun[] {
  const match = (levelJql ?? '').match(/(?:test)?environments?\s*=\s*"?([^"\n]+?)"?\s*(?:and|$)/i);
  const wanted = match?.[1]?.trim();
  if (!wanted) {
    return runs ?? [];
  }
  return (runs ?? []).filter((run) => {
    const environments = run?.testExecution?.testEnvironments ?? [];
    return environments.includes(wanted);
  });
}

// Maps Xray Test Runs into the issue-like shape expected by the grid pipeline,
// keyed by the macro's XRAY column ids (see XRAY_TESTRUN_FIELDS) so they render
// through the same fieldFunctions / columnConfig as Jira issues. All supported
// columns are populated; the grid only renders the ones the macro configured.
function mapTestRunsToIssues(
  runs: XrayTestRun[],
  testKeyFallback: string,
  baseUrl: string,
  usersById: Record<string, { accountId: string; displayName: string; emailAddress: string; self: string }> = {},
  webBasePath = '',
) {
  // Builds the `user`-typed data (an array of User objects) expected by
  // formatUser. Falls back to showing the raw account id when the user could
  // not be resolved, so the column is never silently empty.
  const toUserData = (accountId?: string) => {
    if (!accountId) {
      return [];
    }
    const user = usersById?.[accountId];
    return [{
      self: user?.self ?? '',
      accountId,
      emailAddress: user?.emailAddress ?? '',
      displayName: user?.displayName || accountId,
    }];
  };

  return (runs ?? []).map((run) => {
    const execKey = run?.testExecution?.jira?.key ?? '';
    const testKey = run?.test?.jira?.key ?? testKeyFallback ?? '';
    const statusName = run?.status?.name ?? '';
    const execStatus = run?.testExecution?.jira?.status;
    const fixVersions = (run?.testExecution?.jira?.fixVersions ?? [])
      .map((version) => version?.name)
      .filter(Boolean)
      .join(', ');
    const testLink = testKey
      ? [{ id: run?.test?.issueId ?? '', key: testKey, self: `${baseUrl}/browse/${testKey}` }]
      : [];
    return {
      id: run?.id ?? '',
      key: execKey || testKey,
      self: execKey ? `${baseUrl}/browse/${execKey}` : '',
      fields: {
        testexeckey: execKey ? [{ id: run?.testExecution?.issueId ?? '', key: execKey, self: `${baseUrl}/browse/${execKey}` }] : [],
        testexecsummary: run?.testExecution?.jira?.summary ?? '',
        // The Test Execution's Jira status object already carries the shape
        // (name + statusCategory.colorName) expected by formatStatus.
        testexecstatus: execStatus?.name ? [execStatus] : [],
        test: testLink,
        testkey: testLink,
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
        // Xray Test Runs are not Jira issues and have no public deep link, so we
        // link to the Test Execution issue that contains the run.
        testrunlinkcloud: execKey ? [{ name: execKey, link: `${baseUrl}/browse/${execKey}?src=confmacro` }] : [],
        testversion: run?.testVersion?.name ?? '',
        revision: run?.testVersion?.id != null ? String(run.testVersion.id) : '',
        startedon: run?.startedOn ?? '',
        finishedon: run?.finishedOn ?? '',
        executedby: toUserData(run?.executedById),
        assignee: toUserData(run?.assigneeId),
        testenvironments: (run?.testExecution?.testEnvironments ?? []).join(', '),
        comment: run?.comment ?? '',
        gherkin: run?.gherkin ?? '',
        unstructured: run?.unstructured ?? '',
        // Xray attachment URLs (`evidence.downloadLink`) require a bearer token
        // and are not browsable directly, so we point at konviw's proxy route
        // (`/api/xray/attachments/:id`) which fetches the bytes server-side.
        evidences: (run?.evidence ?? []).map((evidence) => ({
          name: evidence?.filename ?? evidence?.id ?? 'evidence',
          link: evidence?.id
            ? `${webBasePath}/api/xray/attachments/${evidence.id}`
            : (evidence?.downloadLink ?? ''),
        })),
      },
    };
  });
}

function splitStrings(inputArray: string[]): string[] {
  return inputArray.flatMap((str) => str.split(','));
}
function getJqlVariables(jql: string): string {
  const variablePattern = /\$\s*"?([a-zA-Z0-9\s_]+)"?/g;
  const matches = Array.from(jql.matchAll(variablePattern));
  const variables = matches
    .filter((match) => match[1])
    .map((match) => match[1].trim());

  return variables.join(', ');
}

function buildChildren(data: any[][][], level: number, parentIndex: number): Issues[] {
  const children = [];

  if (level >= data.length) {
    return children;
  }

  const siblingGroups = data[level] ?? [];
  const group = siblingGroups[parentIndex] ?? [];
  // The next level's groups are indexed by the *global* (flattened) position of
  // their parent within this level, whereas `forEach` only gives us the index
  // local to the current parent group. We therefore add the number of items in
  // all preceding sibling groups so children resolve to the correct group
  // instead of always the first one (which broke snapshots with 2+ parents).
  let globalOffset = 0;
  for (let i = 0; i < parentIndex; i += 1) {
    globalOffset += (siblingGroups[i]?.length ?? 0);
  }

  group.forEach((childItem: any, index: number) => {
    const childNode = {
      item: childItem,
      children: buildChildren(data, level + 1, globalOffset + index),
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

function extractKeysColumns(issuesArray, allColumnsId, levelTypes, jiraFields, xrayFields, fieldFunctions, baseUrl): DataObject[] {
  const dataObjects: DataObject[] = [];

  issuesArray.forEach((issueArray) => {
    if (!issueArray) return;

    const rowData: RowData = {};

    issueArray.forEach((issue, levelIndex) => {
      const columns = splitStrings([allColumnsId[levelIndex]]);
      const fieldsForLevel = levelTypes?.[levelIndex] === 'XRAY_TESTRUNS' ? xrayFields : jiraFields;
      columns.forEach((column) => {
        const isKeyColumn = column === 'key';
        const fieldTypeData = checkFieldExistence(fieldsForLevel, column);

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

function createHeaderGridColumns(jqlParams:JqlParams, jiraFields, xrayFields, columnConfig, fieldFunctions, confluenceDomain) {
  const gridColumns = jqlParams.allColumnsId.map((column, indexLevel) => {
    const columnId = splitStrings([column]);
    const columnName = splitStrings([jqlParams.allColumnsName[indexLevel]]);
    const name = `${jqlParams.titles[indexLevel]} (Total: ${jqlParams.numberTicket[indexLevel]})`;
    const fieldsForLevel = jqlParams.levelType?.[indexLevel] === 'XRAY_TESTRUNS' ? xrayFields : jiraFields;

    const header = `{
      name: '${name}',
      columns: ${createGridColumns(columnId, columnName, fieldsForLevel, columnConfig, fieldFunctions, confluenceDomain)}
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
