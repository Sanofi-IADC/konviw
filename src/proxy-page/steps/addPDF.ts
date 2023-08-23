import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import { ConfluenceService } from '../../confluence/confluence.service';

/* eslint-disable no-useless-escape, prefer-regex-literals */
export default (config: ConfigService, confluence: ConfluenceService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addPDF');

  const $ = context.getCheerioBody();
  const webBasePath = config.get('web.absoluteBasePath');

  const attachments = await confluence.getAttachments(context.getPageId());
  const attachmentsPDF = attachments.filter((attachemnt) => attachemnt.mediaType === 'application/pdf');
  const attachmentsPDFPromises = attachmentsPDF.map(async (pdfData) => {
    const { data } = await axios.get(`${webBasePath}/wiki${pdfData.downloadLink}`, {
      responseType: 'arraybuffer',
    });
    return {
      data: data.toString('base64'),
      pdfData,
    };
  });

  const attachmentsPDFResponse = await Promise.all(attachmentsPDFPromises);

  $('.media-viewer-content').each((_, element) => {
    const filename = element.attribs['data-attachment-name'];
    const relatedPDFResponse = attachmentsPDFResponse.find((attachment) => attachment.pdfData.title === filename);
    if (relatedPDFResponse) {
      $(element).replaceWith(`<iframe src="data:application/pdf;base64,${relatedPDFResponse.data}" width="800px" height="400px"></iframe>`);
    }
  });

  context.getPerfMeasure('addPDF');
};
