import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { Tabletojson } from 'tabletojson';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';

/**
 * ### Proxy page step to replace chart macro by the image generated by Confluence as attachment in the page.
 *
 * This module gets Cheerio to parse the page body and search for `div.chart-bootstrap-wrapper`
 * ... which is used to wrap the chart macro meta-data for Confluence charts.
 *
 * @param  {ConfigService} config
 * @returns void
 */
/* eslint-disable no-useless-escape, prefer-regex-literals, no-loop-func, no-unreachable-loop, no-restricted-syntax */
export default (config: ConfigService): Step => (context: ContextService): void => {
  context.setPerfMark('fixChartMacro');
  const $ = context.getCheerioBody();
  const webBasePath = config.get('web.absoluteBasePath');

  // Div with div.chart-bootstrap-wrapper is used for Chart marcros
  $('.chart-bootstrap-wrapper').each(
    (index: number, elementChart: cheerio.Element) => {
      const thisBlock = $(elementChart).html();
      if (!thisBlock) {
        return;
      }
      let chartRenderData;
      const $2 = cheerio.load(thisBlock);
      chartRenderData = $2('script').html();
      // remove the wrapper //<![CDATA[ .. //]]>
      const chartRenderDataRegex = new RegExp(
        // /\/\/<!\[CDATA\[(\s*(?:.(?<!\]\]>)\s*)*)\/\/\]\]>/g,
        /\/\/\<\!\[CDATA\[((.|\n)*)\/\/\]\]>/g,
      ).exec(chartRenderData);
      [, chartRenderData] = chartRenderDataRegex ?? [];

      // parse the remaining clean JSON object
      chartRenderData = JSON.parse(chartRenderData);

      // ==== get in separate variables each of the parameters of the chart ====
      const {
        typeofChart,
        orientationChart,
        legendChart,
        markersChart,
        stackedChart,
        alternativeChart,
        colorsChart,
        dataOrientation,
        titleChart,
        subtitleChart,
        attachmentChart,
      } = getChartParams(chartRenderData);

      if (attachmentChart) {
        // The attachment parameter follows the structure
        // described in https://support.atlassian.com/confluence-cloud/docs/insert-the-chart-macro/#ChartMacro-AttachmentParameters
        // with options (only covering today the two first ones)
        // - ^attachmentName.png — the chart is saved as an attachment to the current page.
        // - page^attachmentName.png — the chart is saved as an attachment to the page name provided.
        // - space:page^attachmentName.png — the chart is saved as an attachment to the page name provided in the space indicated.
        const page = attachmentChart.slice(0, attachmentChart.indexOf('^'));
        const attachment = attachmentChart.slice(
          attachmentChart.indexOf('^') + 1,
          attachmentChart.length,
        );
        if (attachment) {
          $(elementChart).prepend(
            `<figure><img class="img-zoomable"
                  src="${webBasePath}/wiki/download/attachments/${
  page !== '' ? page : context.getPageId()
}/${attachment}"
                  alt="${attachment}" /></figure>`,
          );
        }
      } else {
        // no attachment file is defined so let's render it with ApexChart

        // get the body of the macro, suposed to be several html tables
        const tablesHtml = chartRenderData.bodyHtml;

        // Let's convert the HTML table(s) to JSON via the npm package tabletojson
        const tables = Tabletojson.convert(tablesHtml);

        // ==== Let's prepare all the options to configure accordingly ApexCharts ====

        let opGrid = '';
        // grid does not look nice with the radar chart
        if (typeofChart !== 'radar') {
          opGrid = `grid: {
              borderColor: '#e7e7e7',
              row: {colors: ['#f3f3f3', 'transparent'], opacity: 0.5},},`;
        }
        let opTypeofChart = `type: '${typeofChart}'`;
        let opStroke = '';
        let opShadow = 'dropShadow: { enabled: false}';
        if (alternativeChart === 'true' && typeofChart === 'pie') {
          opTypeofChart = 'type: \'donut\'';
        }
        if (alternativeChart === 'true' && typeofChart === 'line') {
          opStroke = 'stroke: {curve: \'smooth\'},';
          opShadow = `dropShadow: { enabled: true, color: '#000', top: 18,
                          left: 7, blur: 10, opacity: 0.2 }`;
        }
        if (
          stackedChart === 'true'
            && (typeofChart === 'area' || typeofChart === 'bar')
        ) {
          opTypeofChart = `type: '${typeofChart}', stacked: true`;
        }

        // ==== Everything ready to intance ApexChart and render the chart ====
        const addChart = `<div id="chart${index}"></div>
              <script type="module">
              document.addEventListener('DOMContentLoaded', function () {
                var options = {
                  chart: {
                  ${opTypeofChart},
                    ${opShadow},
                    ${opLegend(legendChart)}
                  },
                  plotOptions: {
                    ${opBar(orientationChart)}
                  },
                  ${opColors(colorsChart)}
                  ${opTitle(titleChart)}
                  ${opSubtitle(subtitleChart)}
                  ${opStroke}
                  ${opMarkers(markersChart)}
                  ${opGrid}
                  ${opDataLabels(typeofChart, markersChart)}
                  ${opSeries(tables, typeofChart, dataOrientation)}
                  ${opXaxis(tables, typeofChart, dataOrientation)}
              }
              const chart${index} = new ApexCharts(document.querySelector("#chart${index}"), options);
              chart${index}.render();
            })
          </script>`;
        $(elementChart).append(addChart);
      }
    },
  );

  // add apexchart  library
  $('body').append(
    // TODO: install ApexCharts via npm package and include the script via a local publich folder
    // `<script defer src="${basePath}/apexcharts/apexchartsjs.production.min.js?cache=${version}"></script>`,
    '<script defer src="https://cdn.jsdelivr.net/npm/apexcharts"></script>',
  );

  // Remove this Chart script to remove unnecessary noise in the final HTML
  $('script.chart-render-data').each(
    (_index: number, elementChart: cheerio.Element) => {
      $(elementChart).remove();
    },
  );

  context.getPerfMeasure('fixChartMacro');
};

const getChartParams = (chartData) => {
  // get the type of chart
  const typeofChart = chartData.parameters.type ?? 'pie';
  // vertical columns or horizontal bars
  const orientationChart = chartData.parameters.orientation ?? 'vertical';
  // display chart legend
  const legendChart = chartData.parameters.legend ?? 'true';
  // show markers
  const markersChart = chartData.parameters.showShapes ?? 'true';
  // display stacked bar or area
  const stackedChart = chartData.parameters.stacked ?? 'false';
  // display alternative chart display
  const alternativeChart = chartData.parameters['3D'] ?? 'false';
  // colors to fill the chart series
  const colorsChart = chartData.parameters.colors ?? '';
  // get the orientation of the series is 'vertical' or 'horizontal'
  const dataOrientation = chartData.parameters.dataOrientation ?? '';
  // get the color of the border
  // const borderColorChart =
  //   chartData['parameters']['borderColor'] ?? '';
  // get the parameter color of the background
  // const bgColorChart = chartData['parameters']['bgColor'] ?? '';
  // get the parameter chart title
  const titleChart = chartData.parameters.title ?? '';
  // get the parameter chart subtitle
  const subtitleChart = chartData.parameters.subTitle ?? '';
  // get the parameter for the attachment name
  const attachmentChart = chartData.parameters.attachment;

  return {
    typeofChart,
    orientationChart,
    legendChart,
    markersChart,
    stackedChart,
    alternativeChart,
    colorsChart,
    dataOrientation,
    titleChart,
    subtitleChart,
    attachmentChart,
  };
};

// ==== Functions to prepare all the options to configure accordingly ApexCharts ====

const opTitle = (titleChart): string => (titleChart !== ''
  ? `title: { text: "${titleChart}", align: "center", floating: false},`
  : 'title: { text: undefined},');

const opSubtitle = (subtitleChart): string => (subtitleChart !== ''
  ? `subtitle: { text: "${subtitleChart}", align: "center", floating: false},`
  : 'subtitle: { text: undefined},');

const opLegend = (legendChart): string => (legendChart === 'true'
  ? 'legend: { position: "bottom"}'
  : 'legend: { show: false}');

const opMarkers = (markersChart): string => (markersChart === 'true' ? 'markers: {size: 7},' : '');

const opDataLabels = (typeofChart: string, markersChart: string): string => {
  if (markersChart === 'true') {
    if (typeofChart === 'pie') {
      return `dataLabels: {
          enabled: true,
          textAnchor: 'middle',
          style: { fontSize: '20px' },
        },`;
    }
    if (typeofChart === 'bar') {
      return `dataLabels: {
          enabled: true,
          offsetY: -20,
          textAnchor: 'middle',
          style: { fontSize: '14px', colors: ["#304758"] },
        },`;
    }
    if (typeofChart === 'radar') {
      return `dataLabels: {
          enabled: true,
          offsetY: -10,
          style: { fontSize: '12px', colors: ["#304758"] },
          background: { enabled: false },
        },`;
    }
    return `dataLabels: {
          enabled: true,
        },`;
  }
  return '';
};

const opBar = (orientationChart) => (orientationChart === 'vertical'
  ? 'bar: {borderRadius: 6, dataLabels: {position: \'top\'}}'
  : 'bar: {borderRadius: 6, horizontal: true, dataLabels: {position: \'right\'}}');

const opColors = (colorsChart) => (colorsChart !== ''
  ? `colors: ${JSON.stringify(colorsChart.replace(/\s/g, '').split(','))},`
  : '');

// Function to get the series data in the right sequence
// TODO: horizontal series are not yet working with all charts
const getSeries = (matrix, dataOrientation) => {
  if (dataOrientation === 'horizontal') {
    return matrix;
  }
  return transpose(matrix);
};

// Function to transpose an array
const transpose = (arr: Array<any>) => arr[0].map((_, colIndex: number) => arr.map((row) => row[colIndex]));

// ==== Functions to prepare axis and series as data sources for ApexCharts ====
// TODO: replace both functions by a single one returning an object with 2 values { opXaxis, opSeries}
const opXaxis = (tables, typeofChart, dataOrientation): string => {
  const matrix = [];

  for (const table of tables) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(table).forEach(([key, row]) => {
      matrix.push(Object.values(row));
    });

    const labels = getSeries(matrix, dataOrientation)[0];

    if (typeofChart === 'pie') {
      return `labels: ${JSON.stringify(labels)},`;
    }
    return `xaxis: {categories: ${JSON.stringify(labels)}},`;
  }
  return '';
};

const opSeries = (tables, typeofChart, dataOrientation): string => {
  let tmpSeries = 'series: [';
  const matrix = [];

  for (const table of tables) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(table).forEach(([key, row]) => {
      matrix.push(Object.values(row));
    });

    const series = getSeries(matrix, dataOrientation).slice(1);

    if (typeofChart === 'pie') {
      tmpSeries = `series: [${series[0]}`;
    } else {
      series.forEach((element, j) => {
        tmpSeries = `${tmpSeries
        }{ name:"${
          Object.keys(table[0])[j + 1] // index+1 to skip the X axis name
        }", data: [${
          element
        }]},`;
      });
    }
  }
  return `${tmpSeries}],`;
};
