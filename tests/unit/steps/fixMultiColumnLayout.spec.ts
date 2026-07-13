import * as cheerio from 'cheerio';
import { ContextService } from '../../../src/context/context.service';
import fixMultiColumnLayout from '../../../src/proxy-page/steps/fixMultiColumnLayout';
import { createModuleRefForStep } from './utils';

// Confluence's HTML "view" API collapses 4/5 column layouts into a 3-column
// `three-equal`, merging the content of columns 3..N into the 3rd cell. These
// tests feed the collapsed view HTML plus the matching storage format and check
// that fixMultiColumnLayout rebuilds the original columns.

const layoutView = (thirdCellInner: string): string =>
  '<div class="contentLayout2">'
  + '<div class="columnLayout three-equal" data-layout="three-equal">'
  + '<div class="cell normal" data-type="normal"><div class="innerCell"><p>C1</p></div></div>'
  + '<div class="cell normal" data-type="normal"><div class="innerCell"><p>C2</p></div></div>'
  + `<div class="cell normal" data-type="normal"><div class="innerCell">${thirdCellInner}</div></div>`
  + '</div>'
  + '</div>';

const layoutStorage = (type: string, cells: string[]): string =>
  `<ac:layout><ac:layout-section ac:type="${type}">`
  + cells.map((cell) => `<ac:layout-cell>${cell}</ac:layout-cell>`).join('')
  + '</ac:layout-section></ac:layout>';

// Composable builders for pages that contain several layout sections.
const viewCell = (inner: string): string =>
  `<div class="cell normal" data-type="normal"><div class="innerCell">${inner}</div></div>`;

const viewLayout = (layoutClass: string, cellInners: string[]): string =>
  `<div class="columnLayout ${layoutClass}" data-layout="${layoutClass}">`
  + cellInners.map(viewCell).join('')
  + '</div>';

const storageSection = (type: string, cells: string[]): string =>
  `<ac:layout-section ac:type="${type}">`
  + cells.map((cell) => `<ac:layout-cell>${cell}</ac:layout-cell>`).join('')
  + '</ac:layout-section>';

describe('ConfluenceProxy / fixMultiColumnLayout', () => {
  let context: ContextService;

  beforeEach(async () => {
    const moduleRef = await createModuleRefForStep();
    context = moduleRef.get<ContextService>(ContextService);
    context.initPageContext('v2', 'XXX', '123456', 'dark');
  });

  const countCells = (): number => {
    const $ = cheerio.load(context.getHtmlBody());
    return $('.columnLayout > .cell').length;
  };

  it('rebuilds a four-column layout collapsed into three columns', () => {
    context.setBodyStorage(
      layoutStorage('four_equal', ['<p>C1</p>', '<p>C2</p>', '<p>C3</p>', '<p>C4</p>']),
    );
    context.setHtmlBody(layoutView('<p>C3</p><p>C4</p>'));

    fixMultiColumnLayout()(context);

    const $ = cheerio.load(context.getHtmlBody());
    expect($('.columnLayout').hasClass('four-equal')).toBe(true);
    expect($('.columnLayout').hasClass('three-equal')).toBe(false);
    expect($('.columnLayout').attr('data-layout')).toBe('four-equal');
    expect($('.columnLayout > .cell').length).toBe(4);
    // Each column ends up isolated in its own cell, in order and without loss.
    const cellTexts = $('.columnLayout > .cell').map((_i, el) => $(el).text()).get();
    expect(cellTexts).toEqual(['C1', 'C2', 'C3', 'C4']);
  });

  it('rebuilds a five-column layout collapsed into three columns', () => {
    context.setBodyStorage(
      layoutStorage('five_equal', [
        '<p>C1</p>', '<p>C2</p>', '<p>C3</p>', '<p>C4</p>', '<p>C5</p>',
      ]),
    );
    context.setHtmlBody(layoutView('<p>C3</p><p>C4</p><p>C5</p>'));

    fixMultiColumnLayout()(context);

    const $ = cheerio.load(context.getHtmlBody());
    expect($('.columnLayout').hasClass('five-equal')).toBe(true);
    expect($('.columnLayout').attr('data-layout')).toBe('five-equal');
    expect($('.columnLayout > .cell').length).toBe(5);
    const cellTexts = $('.columnLayout > .cell').map((_i, el) => $(el).text()).get();
    expect(cellTexts).toEqual(['C1', 'C2', 'C3', 'C4', 'C5']);
  });

  it('preserves multi-block columns using the storage block counts as boundaries', () => {
    // Column 3 has two blocks (a heading + a table) and column 4 has two blocks.
    context.setBodyStorage(
      layoutStorage('four_equal', [
        '<p>C1</p>',
        '<p>C2</p>',
        '<h3>Third</h3><table><tbody><tr><td>t</td></tr></tbody></table>',
        '<h3>Fourth</h3><p>C4</p>',
      ]),
    );
    context.setHtmlBody(
      layoutView(
        '<h3>Third</h3><div class="table-wrap"><table><tbody><tr><td>t</td></tr></tbody></table></div>'
        + '<h3>Fourth</h3><p>C4</p>',
      ),
    );

    fixMultiColumnLayout()(context);

    const $ = cheerio.load(context.getHtmlBody());
    expect($('.columnLayout > .cell').length).toBe(4);
    const thirdCell = $('.columnLayout > .cell').eq(2);
    const fourthCell = $('.columnLayout > .cell').eq(3);
    expect(thirdCell.find('h3').text()).toBe('Third');
    expect(thirdCell.find('table').length).toBe(1);
    expect(fourthCell.find('h3').text()).toBe('Fourth');
    expect(fourthCell.find('table').length).toBe(0);
  });

  it('leaves a genuine three-column layout untouched', () => {
    context.setBodyStorage(
      layoutStorage('three_equal', ['<p>C1</p>', '<p>C2</p>', '<p>C3</p>']),
    );
    context.setHtmlBody(layoutView('<p>C3</p>'));

    fixMultiColumnLayout()(context);

    const $ = cheerio.load(context.getHtmlBody());
    expect($('.columnLayout').hasClass('three-equal')).toBe(true);
    expect($('.columnLayout > .cell').length).toBe(3);
  });

  it('does not modify the layout when block counts do not match (safety)', () => {
    // Storage says column 3 has 1 block and column 4 has 1 block (merged = 2),
    // but the view's merged cell only has 1 block. The counts disagree so the
    // step must leave the content untouched to avoid corrupting it.
    context.setBodyStorage(
      layoutStorage('four_equal', ['<p>C1</p>', '<p>C2</p>', '<p>C3</p>', '<p>C4</p>']),
    );
    context.setHtmlBody(layoutView('<p>C3 only</p>'));

    fixMultiColumnLayout()(context);

    expect(countCells()).toBe(3);
    const $ = cheerio.load(context.getHtmlBody());
    expect($('.columnLayout').hasClass('four-equal')).toBe(false);
    expect($('.columnLayout').hasClass('three-equal')).toBe(true);
  });

  it('does nothing when there is no storage format available', () => {
    context.setBodyStorage('');
    context.setHtmlBody(layoutView('<p>C3</p><p>C4</p>'));

    fixMultiColumnLayout()(context);

    expect(countCells()).toBe(3);
  });

  it('rebuilds several collapsed layouts on the same page, paired by document order', () => {
    // A single-column section, then a 4-column and a 5-column section, all of
    // which Confluence renders one after another. The step must pair each
    // rendered layout with the matching storage section by order.
    context.setBodyStorage(
      '<ac:layout>'
      + storageSection('fixed-width', ['<p>F</p>'])
      + storageSection('four_equal', ['<p>A1</p>', '<p>A2</p>', '<p>A3</p>', '<p>A4</p>'])
      + storageSection('five_equal', [
        '<p>B1</p>', '<p>B2</p>', '<p>B3</p>', '<p>B4</p>', '<p>B5</p>',
      ])
      + '</ac:layout>',
    );
    context.setHtmlBody(
      '<div class="contentLayout2">'
      + viewLayout('fixed-width', ['<p>F</p>'])
      + viewLayout('three-equal', ['<p>A1</p>', '<p>A2</p>', '<p>A3</p><p>A4</p>'])
      + viewLayout('three-equal', ['<p>B1</p>', '<p>B2</p>', '<p>B3</p><p>B4</p><p>B5</p>'])
      + '</div>',
    );

    fixMultiColumnLayout()(context);

    const $ = cheerio.load(context.getHtmlBody());
    const layouts = $('.columnLayout');
    expect(layouts.length).toBe(3);
    // The fixed-width single column section stays untouched.
    expect(layouts.eq(0).hasClass('fixed-width')).toBe(true);
    expect(layouts.eq(0).children('.cell').length).toBe(1);
    // The 4 and 5 column sections are rebuilt in place.
    expect(layouts.eq(1).hasClass('four-equal')).toBe(true);
    expect(layouts.eq(1).children('.cell').length).toBe(4);
    expect(
      layouts.eq(1).children('.cell').map((_i, el) => $(el).text()).get(),
    ).toEqual(['A1', 'A2', 'A3', 'A4']);
    expect(layouts.eq(2).hasClass('five-equal')).toBe(true);
    expect(layouts.eq(2).children('.cell').length).toBe(5);
    expect(
      layouts.eq(2).children('.cell').map((_i, el) => $(el).text()).get(),
    ).toEqual(['B1', 'B2', 'B3', 'B4', 'B5']);
  });

  it('does not modify anything when section counts differ between storage and view', () => {
    // Storage describes a single 4-column section, but the rendered body has an
    // extra columnLayout (e.g. injected by an included page). Since the two
    // structures cannot be aligned one-to-one, the step leaves everything as-is.
    context.setBodyStorage(
      layoutStorage('four_equal', ['<p>C1</p>', '<p>C2</p>', '<p>C3</p>', '<p>C4</p>']),
    );
    context.setHtmlBody(
      '<div class="contentLayout2">'
      + viewLayout('three-equal', ['<p>C1</p>', '<p>C2</p>', '<p>C3</p><p>C4</p>'])
      + viewLayout('two-equal', ['<p>X1</p>', '<p>X2</p>'])
      + '</div>',
    );

    fixMultiColumnLayout()(context);

    const $ = cheerio.load(context.getHtmlBody());
    expect($('.columnLayout').eq(0).hasClass('four-equal')).toBe(false);
    expect($('.columnLayout').eq(0).hasClass('three-equal')).toBe(true);
    expect($('.columnLayout').eq(0).children('.cell').length).toBe(3);
  });

  it('leaves the layout untouched when the rendered form is not the collapsed 3-cell shape', () => {
    // Storage describes 4 columns and the rendered layout already has 4 cells
    // (not Confluence's collapsed 3-cell form), so there is nothing to rebuild.
    context.setBodyStorage(
      layoutStorage('four_equal', ['<p>C1</p>', '<p>C2</p>', '<p>C3</p>', '<p>C4</p>']),
    );
    context.setHtmlBody(
      '<div class="contentLayout2">'
      + viewLayout('four-equal', ['<p>C1</p>', '<p>C2</p>', '<p>C3</p>', '<p>C4</p>'])
      + '</div>',
    );

    fixMultiColumnLayout()(context);

    expect(countCells()).toBe(4);
    const $ = cheerio.load(context.getHtmlBody());
    const cellTexts = $('.columnLayout > .cell').map((_i, el) => $(el).text()).get();
    expect(cellTexts).toEqual(['C1', 'C2', 'C3', 'C4']);
  });

  it('rebuilt columns keep the expected cell / innerCell structure', () => {
    context.setBodyStorage(
      layoutStorage('four_equal', ['<p>C1</p>', '<p>C2</p>', '<p>C3</p>', '<p>C4</p>']),
    );
    context.setHtmlBody(layoutView('<p>C3</p><p>C4</p>'));

    fixMultiColumnLayout()(context);

    const $ = cheerio.load(context.getHtmlBody());
    const cells = $('.columnLayout > .cell');
    expect(cells.length).toBe(4);
    cells.each((_i, el) => {
      const cell = $(el);
      expect(cell.hasClass('cell')).toBe(true);
      expect(cell.hasClass('normal')).toBe(true);
      expect(cell.attr('data-type')).toBe('normal');
      // Each cell wraps its content in a single innerCell div.
      expect(cell.children('.innerCell').length).toBe(1);
    });
  });
});
