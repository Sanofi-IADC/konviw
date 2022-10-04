import TocRenderingStrategy from './TocRenderingStrategy';
import TocFilter from './TocFilter';

export default class TocSection {
  readonly children: TocSection[] = [];

  // root element
  constructor(renderingStrategy: TocRenderingStrategy, filters: TocFilter[]);

  // standard element
  constructor(
    renderingStrategy: TocRenderingStrategy,
    filters: TocFilter[],
    parent: TocSection,
    title: string,
    id: string,
  );

  constructor(
    protected readonly renderingStrategy: TocRenderingStrategy,
    private readonly filters: TocFilter[],
    readonly parent?: TocSection,
    readonly title?: string,
    readonly id?: string,
  ) {}

  createChild(title: string, id: string): TocSection {
    const child = new TocSection(
      this.renderingStrategy,
      this.filters,
      this,
      title,
      id,
    );
    this.children.push(child);
    return child;
  }

  getChildIndex(child: TocSection): number {
    const index = this.children.indexOf(child);
    if (index === -1) {
      throw new Error(`Child TocSection not found: ${child}`);
    }
    return index + 1; // we deal with human indices here, not array indices ;)
  }

  getLevel(): number {
    if (this.parent === undefined) {
      return 0; // root element
    }
    return this.parent.getLevel() + 1;
  }

  getIndex(): number | undefined {
    if (this.parent === undefined) {
      return undefined;
    }
    return this.parent.getChildIndex(this);
  }

  getOutline(): string | undefined {
    if (this.parent === undefined) {
      return undefined;
    }
    if (this.parent.getOutline() === undefined) {
      return `${this.getIndex()}`;
    }
    return `${this.parent.getOutline()}.${this.getIndex()}`;
  }

  render(): string {
    const isHidden = this.filters
      .map((filter) => filter.isHidden(this))
      .reduce((previous, current) => previous || current, false);

    return this.renderingStrategy.renderTocSection(this, isHidden);
  }
}
