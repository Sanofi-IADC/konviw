import { Step } from '../proxy-page.step';
import { ContextService } from '../../context/context.service';
import { ConfluenceService } from '../../confluence/confluence.service';

/* eslint-disable no-useless-escape, prefer-regex-literals */
export default (confluence: ConfluenceService): Step => async (context: ContextService): Promise<void> => {
  context.setPerfMark('addPDF');

  const $ = context.getCheerioBody();

  const pdfViewContainers = $('.media-viewer-content');

  if (pdfViewContainers.length > 0) {
    const attachments = await confluence.getAttachments(context.getPageId());
    const attachmentsPDF = attachments.filter((attachemnt) => attachemnt.mediaType === 'application/pdf');
    const attachmentsPDFPromises = attachmentsPDF.map(async (pdfData) => {
      const data = await confluence.getAttachmentBase64(pdfData.downloadLink);
      return {
        data,
        pdfData,
      };
    });

    const attachmentsPDFResponse = await Promise.all(attachmentsPDFPromises);

    pdfViewContainers.each((_, element) => {
      const filename = element.attribs['data-attachment-name'];
      const relatedPDFResponse = attachmentsPDFResponse.find((attachment) => attachment.pdfData.title === filename);
      if (relatedPDFResponse) {
        $(element).replaceWith(
          `<iframe src="data:application/pdf;base64,${relatedPDFResponse.data}" width="800px" height="400px"></iframe>`,
        );
      }
    });
  }

  context.getPerfMeasure('addPDF');
};
