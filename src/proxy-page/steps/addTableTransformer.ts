import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';
import { JiraService } from '../../jira/jira.service';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import Database from 'better-sqlite3';

export default (): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addTableTransformer');
  const $ = context.getCheerioBody();
  const $xml = cheerio.load(context.getBodyStorage(), { xmlMode: true });

  // Function to extract data from HTML tables
  function extractTableData(htmlString: string): string[][][] {
    const $ = cheerio.load(htmlString);
    const tables = $('table');
    const allTablesData: string[][][] = [];

    tables.each((i, table) => {
      const tableData: string[][] = [];
      const rows = $(table).find('tr');

      rows.each((j, row) => {
        const rowData: string[] = [];
        const cells = $(row).find('th, td');

        cells.each((k, cell) => {
          rowData.push($(cell).text().trim());
        });

        tableData.push(rowData);
      });

      allTablesData.push(tableData);
    });

    return allTablesData;
  }

  // Function to insert data into SQLite database
  function insertDataIntoDatabase(db: Database.Database, tableName: string, tableData: string[][]): void {
    const columns = tableData[0].join(', ');
    const placeholders = tableData[0].map(() => '?').join(', ');

    db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`);

    const insertStmt = db.prepare(`INSERT INTO ${tableName} VALUES (${placeholders})`);
    const insertMany = db.transaction((rows: string[][]) => {
      for (const row of rows) {
        insertStmt.run(row);
      }
    });

    insertMany(tableData.slice(1));
  }

  // Function to run SQL queries on the data and convert the result to HTML
  function runSQLQueriesAndConvertToHTML(db: Database.Database, sqlQuery: string): string {
    const rows = db.prepare(sqlQuery).all();
    return convertToHTMLTable(rows);
  }

  function convertFullOuterJoinToSpecificTables(baseTable: string, dynamicTables: string[], targetColumn: string): string {
    let convertedQuery = `SELECT * FROM ${baseTable}`;
  
    dynamicTables.forEach((table, index) => {
      if (index === 0) {
        convertedQuery += ` FULL OUTER JOIN ${table} ON ${baseTable}.${targetColumn} = ${table}.${targetColumn}`;
      } else {
        const previousTable = dynamicTables[index - 1];
        convertedQuery += ` FULL OUTER JOIN ${table} ON ${previousTable}.${targetColumn} = ${table}.${targetColumn}`;
      }
    });
  
    return convertedQuery;
  }

  function extractTargetTable(sqlQuery: string): string | null {
    const outerJoinRegex = /SELECT \* FROM (\w+) OUTER JOIN \w+ ON \w+\.\w+ = \w+\.\w+/i;
    const match = sqlQuery.match(outerJoinRegex);
  
    if (match && match.length > 1) {
      return match[1];
    }
  
    return null;
  }

  function extractTargetRow(sqlQuery: string): string | null {
    const outerJoinRegex = /SELECT \* FROM \w+ OUTER JOIN \w+ ON \w+\.(\w+) = \w+\.\w+/i;
    const match = sqlQuery.match(outerJoinRegex);
  
    if (match && match.length > 1) {
      return match[1];
    }
  
    return null;
  }


  // Function to merge tables data
  function mergeTables(tables: string[][][]): Record<string, string>[] {
    // Step 1: Extract unique headers
    const headersSet = new Set<string>();
    tables.forEach(table => {
      table[0].forEach(header => headersSet.add(header));
    });
    const headersArray = Array.from(headersSet);

    // Step 2: Initialize an array to hold the merged data
    const mergedData: Record<string, string>[] = [];

    // Step 3: Fill the merged data array
    tables.forEach(table => {
      const [headers, ...rows] = table;

      rows.forEach(row => {
        const rowObject: Record<string, string> = {};
        headersArray.forEach(header => {
          const index = headers.indexOf(header);
          rowObject[header] = index !== -1 ? row[index] : '';
        });
        mergedData.push(rowObject);
      });
    });

    return mergedData;
  }

  // Function to convert SQL query result to HTML table
  function convertToHTMLTable(rows: any[]): string {
    if (rows.length === 0) {
      return '<table><tr><td>No results found</td></tr></table>';
    }

    let html = '<table border="1"><thead><tr>';

    // Add header row
    Object.keys(rows[0]).forEach(column => {
      html += `<th>${column}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Add data rows
    rows.forEach(row => {
      html += '<tr>';
      Object.values(row).forEach(value => {
        html += `<td>${value}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  const structuredMacros = $xml('ac\\:structured-macro[ac\\:name="table-joiner"]');
  const outerJoinRegex = /SELECT \* FROM \w+ OUTER JOIN \w+ ON \w+\.(\w+) = \w+\.\w+/i;

  for (let i = 0; i < structuredMacros.length; i++) {
    const macro = structuredMacros[i];
    const richTextBody = $xml(macro).find('ac\\:rich-text-body').html();
    const tableData = extractTableData(richTextBody);
    let sqlQuery = $xml(macro).find('ac\\:parameter[ac\\:name="sql"]').text().trim();
    console.log("voici",[sqlQuery])
    const targetRow = extractTargetRow(sqlQuery)
    const targetTable = extractTargetTable(sqlQuery)
    console.log(targetRow,targetTable)
    if (sqlQuery.match(outerJoinRegex)){
        // Connect to SQLite database
        const db = new Database(':memory:');

        // Insert data into database
        tableData.forEach((data, index) => {
          insertDataIntoDatabase(db, `T${index + 1}`, data);
      })
    }
    if (sqlQuery !== 'SELECT * FROM T*') {
      try {
        // Connect to SQLite database
        const db = new Database(':memory:');

        // Insert data into database
        tableData.forEach((data, index) => {
          insertDataIntoDatabase(db, `T${index + 1}`, data);
        });

        // Run SQL queries and convert the result to HTML
        const htmlTable = runSQLQueriesAndConvertToHTML(db, sqlQuery);
        console.log(`HTML Table for macro #${i + 1}:\n`, htmlTable);

        // Append the generated HTML table to the desired div
        $('div.ap-container.conf-macro.output-block[data-macro-name="table-joiner"]').each((j, element) => {
          $(element).append(htmlTable);
        });

        db.close();
      } catch (error) {
        console.error(`Error running SQL query for macro #${i + 1}:`, error);
      }
    } else if (sqlQuery === 'SELECT * FROM T*') {
      try {
        console.log(tableData);
        const db = new Database(':memory:');
        const mergedData = mergeTables(tableData);
        const htmlTable = convertToHTMLTable(mergedData);
        console.log(htmlTable);

        // Append the generated HTML table to the desired div
        $('div.ap-container.conf-macro.output-block[data-macro-name="table-joiner"]').each((j, element) => {
          $(element).append(htmlTable);
        });

        db.close();
      } catch (error) {
        console.error(`Error merging tables for macro #${i + 1}:`, error);
      }
    }
  }

  context.getPerfMeasure('addTableTransformer');
};