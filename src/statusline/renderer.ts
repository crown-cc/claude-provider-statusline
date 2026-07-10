import type {
  StatusLineContext,
  StatusLineRendererOptions,
  StatusLineSegment,
} from "./types";

export class StatusLineRenderer {
  private readonly separator: string;
  private readonly segments: StatusLineSegment[];

  constructor(options: StatusLineRendererOptions = {}) {
    this.separator = options.separator ?? " │ ";
    this.segments = [...(options.segments ?? [])];
  }

  register(...segments: StatusLineSegment[]): this {
    this.segments.push(...segments);
    return this;
  }

  replace(segment: StatusLineSegment): this {
    const index = this.segments.findIndex((item) => item.id === segment.id);
    if (index >= 0) this.segments[index] = segment;
    else this.segments.push(segment);
    return this;
  }

  remove(id: string): this {
    const index = this.segments.findIndex((item) => item.id === id);
    if (index >= 0) this.segments.splice(index, 1);
    return this;
  }

  list(): readonly StatusLineSegment[] {
    return [...this.segments].sort((a, b) => a.order - b.order);
  }

  async render(context: StatusLineContext): Promise<string> {
    const values: string[] = [];

    for (const segment of this.list()) {
      if (segment.enabled && !(await segment.enabled(context))) continue;

      const value = await segment.render(context);
      if (value?.trim()) values.push(value.trim());
    }

    return values.join(this.separator);
  }
}
