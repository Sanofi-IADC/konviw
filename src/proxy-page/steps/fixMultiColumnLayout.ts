import * as cheerio from 'cheerio';
import { Logger } from '@nestjs/common';
import { ContextService } from '../../context/context.service';
import { Step } from '../proxy-page.step';

/**
 * ### Proxy page step to fix layouts with more than 3 columns
 *
 * Confluence's HTML "view" API (the format konviw renders) does not support
 * layouts with 4 or 5 columns. It collapses them into a 3-column
 * `columnLayout three-equal` and concatenates the content of columns 3..N
 * into the 3rd rendered cell, which makes columns 4 and 5 stack below the
 * third column (WEB-2894).
 *
 * The storage format, however, preserves the real structure via
 * `<ac:layout-section ac:type="four_equal|five_equal">` with one
 * `<ac:layout-cell>` per column. This step uses the storage format to rebuild
 * the missing columns: it splits the merged 3rd cell back into the original
 * columns (using the per-cell block counts as boundaries) and relabels the
 * layout so the CSS grid renders them side by side
 * (see `_content-layout.scss` `.four-equal` / `.five-equal`).
 *
 * The transformation is only applied when the storage and view structures line
 * up exactly (same number of layout sections, and block counts that add up),
 * so it never corrupts content it cannot confidently reconstruct.
 *
 * @returns Step
 */

// Map the number of columns that Confluence collapses to the layout class that
// the konviw CSS grid understands. Only 4 and 5 column layouts are collapsed.
const LAYOUT_CLASS_BY_COLUMN_COUNT: Record<number, string> = {
  4: 'four-equal',
  5: 'five-equal',
};

export default (): Step => (context: ContextService): void => {
  context.setPerfMark('fixMultiColumnLayout');
  const logger = new Logger('fixMultiColumnLayout');
  const storage = context.getBodyStorage();

  if (storage) {
    const $ = context.getCheerioBody();
    const $storage = cheerio.load(storage, { xmlMode: true });

    const storageSections = $storage('ac\\:layout-section').toArray();
    const viewLayouts = $('.columnLayout').toArray();

    // Pair storage sections with rendered layouts by document order. If the two
    // structures don't match one-to-one (e.g. layouts injected by included
    // pages) we skip the whole page to avoid misaligned reconstruction.
    if (storageSections.length > 0 && storageSections.length === viewLayouts.length) {
      storageSections.forEach((section: cheerio.Element, index: number) => {
        const storageCells = $storage(section).children('ac\\:layout-cell').toArray();
        const columnCount = storageCells.length;
        const targetClass = LAYOUT_CLASS_BY_COLUMN_COUNT[columnCount];

        // Only 4 and 5 column layouts are collapsed by Confluence's view API.
        if (!targetClass) {
          return;
        }

        const $viewLayout = $(viewLayouts[index]);

        // Confluence collapses 4/5 column layouts specifically into a
        // `three-equal` layout. Other 3-cell layouts (e.g.
        // `three-with-sidebars`) share the same cell count but a different
        // structure, so we must never rewrite them.
        if (!$viewLayout.hasClass('three-equal') || $viewLayout.attr('data-layout') !== 'three-equal') {
          return;
        }

        const viewCells = $viewLayout.children('.cell').toArray();

        // Confluence always collapses the extra columns into exactly 3 cells.
        if (viewCells.length !== 3) {
          return;
        }

        // Number of top-level blocks Confluence rendered for each storage cell.
        // Storage block counts map 1:1 to the rendered blocks in the view.
        const storageBlockCounts = storageCells.map(
          (cell: cheerio.Element) => $storage(cell).children().length,
        );

        const viewInnerCells = viewCells.map((cell: cheerio.Element) =>
          $(cell).children('.innerCell'));
        const mergedChildren = viewInnerCells[2].children().toArray();
        const expectedMergedCount = storageBlockCounts
          .slice(2)
          .reduce((sum: number, count: number) => sum + count, 0);

        // Safety: only rebuild when every cell's block count matches what the
        // storage format describes, so we never split content incorrectly.
        const firstTwoMatch = viewInnerCells[0].children().length === storageBlockCounts[0]
          && viewInnerCells[1].children().length === storageBlockCounts[1];
        if (!firstTwoMatch || mergedChildren.length !== expectedMergedCount) {
          logger.warn(
            `Skipping ${targetClass} layout reconstruction: `
            + 'view and storage block counts do not match',
          );
          return;
        }

        // Rebuild the columns 3..N from the merged 3rd cell by slicing its
        // children according to the storage block counts.
        let offset = 0;
        const rebuiltCells = storageBlockCounts.slice(2).map((count: number) => {
          const innerHtml = mergedChildren
            .slice(offset, offset + count)
            .map((element: cheerio.Element) => $.html(element))
            .join('');
          offset += count;
          return `<div class="cell normal" data-type="normal"><div class="innerCell">${innerHtml}</div></div>`;
        });

        $(viewCells[2]).replaceWith(rebuiltCells.join(''));
        $viewLayout
          .removeClass('three-equal')
          .addClass(targetClass)
          .attr('data-layout', targetClass);

        logger.log(`Rebuilt a ${columnCount}-column layout collapsed by Confluence into 3 columns`);
      });
    }
  }

  context.getPerfMeasure('fixMultiColumnLayout');
};
