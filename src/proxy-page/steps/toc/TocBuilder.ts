import Toc from './Toc';
import TocFlatRenderingStrategy from './TocFlatRenderingStrategy';
import TocListRenderingStrategy from './TocListRenderingStrategy';
import TocFilter from './TocFilter';
import TocSectionLevelFilter from './TocSectionLevelFilter';
import TocIncludeRegexFilter from './TocIncludeRegexFilter';
import TocExcludeRegexFilter from './TocExcludeRegexFilter';

interface ConfluenceTocSettings {
  structure?: string; // "flat" or "list"
  midseparator?: string;
  headerelements?: string; // comma separated list of elements to include. Example: H1,H2,H3
  includeheaderregex?: string;
  excludeheaderregex?: string;
}

export default class TocBuilder {
  private readonly root: Toc;

  private currentSection: Toc;

  constructor(readonly settings: ConfluenceTocSettings) {
    // Rendering strategy
    const tocRenderingStrategy = settings.structure === 'flat'
      ? new TocFlatRenderingStrategy(settings.midseparator || '')
      : new TocListRenderingStrategy();

    // Filters
    const filters: TocFilter[] = [];
    if (settings.headerelements) {
      filters.push(
        new TocSectionLevelFilter(
          settings.headerelements
            .split(',')
            .map((tag) => parseInt(tag.replace('H', ''), 10))
            .filter((level) => !Number.isNaN(level)),
        ),
      );
    }
    if (settings.includeheaderregex) {
      filters.push(new TocIncludeRegexFilter(settings.includeheaderregex));
    }
    if (settings.excludeheaderregex) {
      filters.push(new TocExcludeRegexFilter(settings.excludeheaderregex));
    }

    this.root = new Toc(tocRenderingStrategy, filters);
    this.currentSection = this.root;
  }

  addSection(level: number, title: string, id: string): void {
    if (level <= 0) {
      throw new Error('Level must be > 0');
    }

    if (level < this.currentSection.getLevel() + 1) {
      // eg: section to add = H2, current section = H2 -> we have to step back from one level
      if (this.currentSection.parent === undefined) {
        throw new Error('Never happens thanks to recursion');
      }
      this.currentSection = this.currentSection.parent;
      this.addSection(level, title, id);
    } else if (level > this.currentSection.getLevel() + 1) {
      // eg: section to add = H4, current section = H2 -> we have to create an empty intermediate section
      this.currentSection = this.currentSection.createChild('', '');
      this.addSection(level, title, id);
    } else if (level === this.currentSection.getLevel() + 1) {
      // recursion stop condition
      // eg: section to add = H2, current section = H1
      this.currentSection = this.currentSection.createChild(title, id);
    }
  }

  getToc(): Toc {
    return this.root;
  }
}
