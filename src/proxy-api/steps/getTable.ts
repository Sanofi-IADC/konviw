import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { ContextService } from '../../context/context.service';
import { StepRadar } from '../proxy-api.step';
import { RadarContent, RadarContentPeriod } from '../proxy-api.interface';

// This module search for the right image and a blockquote to set them as blog post header image and headline
export default (config: ConfigService, period:string): StepRadar => async (context: ContextService): Promise<RadarContent> | null => {
  context.setPerfMark('getTableProperties');

  const $ = context.getCheerioBody();

  let validPeriod = true;
  const colData = {};
  const rowData: RadarContentPeriod = {
    period: '',
    name: '',
    ring: 'hold',
    quadrant: 'techniques',
    isNew: 'TRUE',
    description: '',
  };
  $(".plugin-tabmeta-details[data-macro-name='details'] > div > table")
    .first()
    .find('tr').each((_i, rowElement: cheerio.Element) => {
      // Iterate over each cell headings to capture the name of the columns
      $(rowElement).find('th').each((thIndex:number, thElement: cheerio.Element) => {
        // Add the columns headings to the columns object
        colData[thIndex] = $(thElement).text();
      });

      validPeriod = false;
      $(rowElement).find('td').each((tdIndex:number, tdElement: cheerio.Element) => {
        // If the first cell has title 'period' and value is matching the params.period, then we capture values
        if ((colData[tdIndex] === 'period') && ($(tdElement).text() === period)) validPeriod = true;
        if (validPeriod) {
          rowData[colData[tdIndex]] = (colData[tdIndex] === 'description') ? $(tdElement).html() : $(tdElement).text();
        }
      });
    });

  context.getPerfMeasure('getTableProperties');
  if (rowData.name === '') {
    return null;
  }

  return {
    name: rowData.name,
    ring: rowData.ring,
    quadrant: rowData.quadrant,
    isNew: rowData.isNew,
    description: rowData.description,
  };
};
