import * as cheerio from 'cheerio';
import { Content } from '../../confluence/confluence.interface';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';
import fetch from 'node-fetch';
import * as blobUtil from 'blob-util';
import { arrayBuffer } from 'stream/consumers';
import path from 'path';
import { Buffer } from 'buffer';
import { Injectable, HttpService} from '@nestjs/common';

/**
 * ### Proxy page step to fix image caiption
 *
 * This module gets Cheerio to search all images ('img')
 * and set the caption according to child 'ac:caption'
 *
 * @param  {ConfigService} config
 * @returns void
 */
export default (content: Content): Step => async (context: ContextService): Promise<void> => {
    context.setPerfMark('addPdf');
    const $ = context.getCheerioBody();
    const url = 'http://localhost:4000/cpv/wiki/download/attachments/64125995704/11.STD-000445-v1.0_Author-feedback_3_MJK.pdf?version=2&amp;modificationDate=1688559643860&amp;cacheVersion=1&amp;api=v2';
    const headersRequest = new Headers();
    headersRequest.append('Content-Disposition', 'inline; filename="11.STD-000445-v1.0_Author-feedback_3_MJK.pdf"');
    try {
        const response = await fetch(url, {
          method: 'GET',
          headers: headers,
        });
    
        if (response.ok) {
          console.log(response.headers);
          const pdfData = await response.buffer(); // Buffer the response data
          console.log('Downloaded PDF data:', pdfData);
          
          const pdfBlob = new Blob([Buffer.from(pdfData)], { type: 'application/pdf' });
          const pdfBlobUrl = URL.createObjectURL(pdfBlob);
          console.log(pdfBlob);
          $('body').find('#Content').append(`<embed src="${pdfBlobUrl}" width="800" height="600" type="application/pdf">`);
          // Save the PDF data to a local file (optional)
          // Here you can process or display the PDF data as needed
        } else {
          console.error('Failed to fetch PDF:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching PDF:', error);
      }
    
    context.getPerfMeasure('addPdf');
  };
  