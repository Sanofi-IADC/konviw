import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';
import { JiraService } from '../../jira/jira.service';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import * as FieldInterfaces from '../dto/FieldInterface';
import { Body } from '@nestjs/common';

export default (config: ConfigService, jiraService: JiraService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addJiraSnapshot');
  const $ = context.getCheerioBody();
  const $xml = cheerio.load(context.getBodyStorage(), { xmlMode: true });
  console.log($xml.text())
  const basePath = config.get('web.basePath');
  const version = config.get('version');
  const confluenceDomain = config.get('confluence.baseURL');

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

    let jiraFields = [];
    const promise = jiraService.getFields();
    await promise.then((result) => {
      jiraFields = result;
    });

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

    const macroParamsList = [];
    $xml('ac\\:parameter[ac\\:name="macroParams"]').each((i, element) => {
      const macroParams = $(element).text();
      macroParamsList.push(macroParams);
    });

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

    const processJqls = async () => {
      for (const [index, params] of macroParamsList.entries()) {
        let jsonData;
        try {
          jsonData = JSON.parse(params);
        } catch (e) {
          console.error("Erreur lors de l'analyse du JSON :", e);
          continue;
        }
        console.log("json",jsonData)
        // Initialiser les tableaux pour chaque catégorie
        const jqls = [];
        const columns = new Map();
        const columnIds = new Set();
        const titles = [];
        const allColumnsId = [];
        const allColumnsName = [];
        
        // Vérifiez si jsonData contient des niveaux avant de les parcourir
        if (jsonData.levels) {
          jsonData.levels.forEach(level => {
            // Ajouter le JQL
            const cleanedJql = level.jql.replace(/\n/g, '');
            jqls.push(cleanedJql);
    
            // Ajouter le titre
            titles.push(level.title);
    
            // Ajouter les colonnes (fieldsPosition)
            const columnsId = [];
            const columnsName = []; // Utiliser un tableau pour stocker les noms des colonnes de ce niveau
            level.fieldsPosition.forEach(field => {
              columnsId.push(field.value.id);
              columnsName.push(field.label);
            });
            // Joindre les colonnes en une seule chaîne séparée par des virgules et l'ajouter à allColumnsFormatted
            allColumnsId.push(columnsId.join(','));
            allColumnsName.push(columnsName.join(','))
          });
        }
        
        const splitedColumnsId = splitStrings(allColumnsId);
        const splitedColumnsName = splitStrings(allColumnsName);
    
        const columnsArray = Array.from(columns.entries());
        const columnIdsString = Array.from(columnIds).join(',');
    
        // Créer l'objet final dans la structure désirée
        const result = [jqls, columnsArray, titles];
    
        const processJqlsWithKeys = async (jqls, columnIdsString) => {
          let keys = []; // Définir keys en dehors de la boucle
          const allIssues = [];
    
          for (let i = 0; i < jqls.length; i++) { // Correction de la condition de la boucle
            const issuesTest = [];
            const apiCalls = []; // Nouveau tableau pour stocker les appels API
    
            if (i == 0) {
              issuesTest.push({
                issues: {
                  issues: jiraService
                    .findTickets('System JIRA', jqls[i], allColumnsId[i])
                    .then((res) => res?.data?.issues ?? []),
                },
              });
            } else {
              keys.forEach(key => {
                const newJql = jqls[i].replace(/\$key/g, key);
                issuesTest.push({
                  issues: {
                    issues: jiraService
                      .findTickets('System JIRA', newJql, allColumnsId[i])
                      .then((res) => res?.data?.issues ?? []),
                  },
                });
              });
            }
    
            // Ajouter les appels API au nouveau tableau
            apiCalls.push(
              ...issuesTest.map(async (j) => await j.issues?.issues)
            );
    
            // Attendre la résolution de toutes les promesses dans apiCalls
            const jirasIssuesTest = await Promise.all(apiCalls);
            allIssues.push(jirasIssuesTest);
    
            // Extraire les clés des résultats obtenus
            keys = extractKeys(jirasIssuesTest);
          }
    
          const HierarchiedIssues = buildHierarchy(allIssues)
          const duplicatedIssue = HierarchiedIssues.flatMap(issue => traverseIssues(issue));
          const gridData = extractKeysColumns(duplicatedIssue, allColumnsId)
          const preparedData = gridData.map((obj) => Object.values(obj));
    
          const columnConfig = {
            link: (name) => `{
              name: \`${name}\`,
              sort: { compare: (a, b) => (a?.data.name > b?.data.name ? 1 : -1) },
              formatter: (cell) => gridjs.html(cell?.data.map((item) => \`<a href="\${item.link}" target="_blank">\${item.name}</a>\`).join(' '))
            }`,
            date: (name) => `{
                name: \`${name}\`,
                sort: {
                compare: (a, b) => {
                  var dateA = new Date(a?.data);
                  var dateB = new Date(b?.data);
                  return dateA > dateB ? 1 : (dateA < dateB ? -1 : 0);
              }
            },
              formatter: (cell) => gridjs.html(cell?.data.map((item) => \`\${item}\`))
            }`,
            normal: (name) => `{
              name: \`${name}\`,
              sort: { compare: (a, b) => (a?.data > b?.data ? 1 : -1) },
              formatter: (cell) => gridjs.html(cell?.data.map((item) => \`\${item}\`).join(' '))
            }`,
            status: (name) => `
            {
              name: \`${name}\`,
              sort: { compare: (a, b) => (a?.data[0].name > b?.data[0].name ? 1 : -1) },
              formatter: (cell) => gridjs.html(
                cell?.data.map(item => \`
                  <div class="aui-lozenge" style="background-color:\${item.color};color:darkgrey;font-size: 11px;">\${item.name}</div>
                \`).join(' ')
              )
            }`,
            icon: (name) => `
            {
              name: \`${name}\`,
              sort: { compare: (a, b) => (a?.data[0].name > b?.data[0].name ? 1 : -1) },
              formatter: (cell) => gridjs.html(
                cell?.data.map(item => \`
                  <div style="display: flex; align-items: center;">
                    <img src="\${item.icon}" style="height:25px; margin-right: 5px;" />
                  </div>
                \`).join(' ')
              )
            }`,
          };
    
          const createGridColumns = (columns,columnsName) => {
            console.log("loulou",columns)
            const allColumns = columns.flatMap((column, index) => {
              console.log("kikou",column)
              if (column == 'key') {
                console.log(columnConfig['link'](column))
                return columnConfig['link'](column);
              } else {
                const fieldTypeData = checkFieldExistence(jiraFields, column);
                if (fieldTypeData === undefined) {
                  return columnConfig["normal"](columnsName[index]);
                } else if (fieldTypeData.type in fieldFunctions) {
                  let fieldValue = '';
                  let columnProcess = '';
                  [fieldValue, columnProcess] = fieldFunctions[fieldTypeData.type](fieldValue, confluenceDomain);
                  return columnConfig[columnProcess](columnsName[index]);
                } else {
                  return columnConfig["normal"](columnsName[index]);
                }
              }
            }).filter(Boolean);
            return `[${allColumns.join(',')}]`;
          };

          const createGridColumnsss = (columns,columnsName, title) => {
            const gridColumns = columns.map((column, index) => {
               const columnId = splitStrings([column])
               const columnName = splitStrings([columnsName[index]])
              const header = `{
                name: '${title[index]}',
                columns: ${createGridColumns(columnId,columnName)}
              }`
              return header;
            });
            return `[${gridColumns.join(',')}]`;
          };
          const gridjsColumnsss = createGridColumnsss(allColumnsId,allColumnsName,titles)
          console.log(gridjsColumnsss)
          const gridjsColumns = createGridColumns(splitedColumnsId,splitedColumnsName);
          $(jiraJqlSnapshots[index]).append(
            `<div id="gridjs${index}"></div>`,
            `<script>
          document.addEventListener('DOMContentLoaded', function () {
          new gridjs.Grid({
            columns: ${gridjsColumnsss},
            data: ${JSON.stringify(preparedData)},
            sort: true,
            search: {
              enabled: true,
              selector: (cell, rowIndex, cellIndex) => cell?.data?.map(item => item?.name).filter(name => name).join(', ') || cell?.data 
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
        };
    
        await processJqlsWithKeys(jqls, columnIdsString);

      }
    };  
    await processJqls();
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

    function extractKeysColumns(issuesArray, allColumnsId): DataObject[] {
      const baseUrl = config.get('confluence.baseURL');
      const dataObjects: DataObject[] = [];
      
      issuesArray.forEach(issueArray => {
        if (issueArray) {
          const rowData: RowData = {};
          issueArray.forEach((issue, index) => {
            if (issue && allColumnsId[index].includes('key')) {
              rowData[`${'key'}${index}`]= {
                data: [FieldInterfaces.createLinkObject(issue.key, baseUrl)],
                name: 'Key',
                type: 'issuelinks',
                gridtype: 'link',
              };
            }
            if (issue.fields) {
              Object.keys(issue.fields).forEach(key => {
                const fieldTypeData = checkFieldExistence(jiraFields, key);
                let fieldValue = issue.fields[key];
                let columnProcess = '';
    
                if (fieldTypeData === undefined) {
                  fieldValue = ['column undefined'];
                  columnProcess = 'normal';
                  rowData[`${key}${index}`] = {
                    data: fieldValue,
                    name: key,
                    type: 'string',
                    gridtype: columnProcess,
                  };
                } else {
                  if (fieldTypeData.type in fieldFunctions) {
                    [fieldValue, columnProcess] = fieldFunctions[fieldTypeData.type](fieldValue, baseUrl);
                  } else {
                    fieldValue = ['Type not treated'];
                    columnProcess = 'normal';
                  }
    
                  rowData[`${key}${index}`] = {
                    data: fieldValue,
                    name: fieldTypeData.name,
                    type: fieldTypeData.type,
                    gridtype: columnProcess,
                  };
                }
              });
            }
          });
          dataObjects.push(rowData);
        }
      });
    
      return dataObjects;
    }
    
    function traverseIssues(issue: Issues, parentStructure: Issues['item'][] = []): Issues['item'][][] {
      // Append the current issue's item to the parent structure
      const currentStructure = [...parentStructure, issue.item];
    
      // If the current issue has no children, return the current structure
      if (!issue.children || issue.children.length === 0) {
        return [currentStructure];
      }
    
      // Otherwise, traverse each child and accumulate the results
      let results: Issues['item'][][] = [];
      for (const child of issue.children) {
        results = results.concat(traverseIssues(child, currentStructure));
      }
    
      return results;
    }
    function extractKeys(issuesResponse: any[][]): string[] {
      const keys: string[] = [];

      issuesResponse.forEach(issueArray => {
        issueArray.forEach(issue => {
          if (issue.key) {
            keys.push(issue.key);
          }
        });
      });   
      return keys;
    }
    function splitStrings(inputArray: string[]): string[] {
      return inputArray.flatMap(str => str.split(','));
    }
    
    
    function buildHierarchy(data: any[][][]): Issues[] {
      const hierarchy = [];
    
      // Parcourir le premier niveau de données
      data[0][0].forEach((item: any, index: number) => {
        const node = {
          item: item,
          children: buildChildren(data, 1, index)
        };
        hierarchy.push(node);
      });
      
      return hierarchy;
    }
    
    function buildChildren(data: any[][][], level: number, parentIndex: number): Issues[] {
      const children = [];
    
      // Si le niveau dépasse la profondeur des données, retourner les enfants actuels
      if (level >= data.length) {
        return children;
      }
    
      // Parcourir les éléments du niveau actuel et ajouter des enfants
      data[level][parentIndex].forEach((childItem: any, index: number) => {
        const childNode = {
          item: childItem,
          children: buildChildren(data, level + 1, index)
        };
        children.push(childNode);
      });
      return children;
    }

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
     
  context.getPerfMeasure('addJiraSnapshot');
};
