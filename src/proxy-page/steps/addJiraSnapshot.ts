import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';
import { JiraService } from '../../jira/jira.service';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import * as FieldInterfaces from '../dto/FieldInterface';
import * as jiraGrid from '../utils/jiraGrid';

export default (config: ConfigService, jiraService: JiraService): Step => async (context: ContextService): Promise<void> => {
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
      } else if (jqlParams.levelType[i] !== 'XRAY_TESTRUNS') {
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
  const cleanedJql = level.jql.replace(/\n/g, '');
  jqlParams.jqls.push(cleanedJql);
  jqlParams.titles.push(level.title);
  const columnsId = [];
  const columnsName = [];
  jqlParams.levelType.push(level.levelType);
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
  const keys: string[] = [];
  issuesResponse.forEach((issueArray) => {
    if (child === 'key') {
      issueArray.forEach((issue) => {
        keys.push(issue.key);
      });
    } else {
      issueArray.forEach((issue) => {
        if (issue.fields[columnObject[child]]?.key) {
          keys.push(issue.fields[columnObject[child]].key);
        }
        else {
          keys.push(issue.fields[columnObject[child]])
        }
      });
    }
  });
  return keys;
}

function numberIssues(issuesResponse: any[][]) {
  let number = 0;
  issuesResponse.forEach((issueArray) => {
    number += issueArray.length;
  });
  return number;
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
    const name = jqlParams.levelType[indexLevel] === 'XRAY_TESTRUNS'
      ? 'TEST RUN NOT SUPPORTED YET'
      : `${jqlParams.titles[indexLevel]} (Total: ${jqlParams.numberTicket[indexLevel]})`;

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
