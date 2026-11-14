import type { Paragraph, Section } from '../types';

/** Part of one section that falls on a page. */
export interface PageSlice {
  section: Section;
  paragraphs: Paragraph[];
  /** The section begins on this page, so its heading goes here. */
  startsSection: boolean;
}

export interface Pagination {
  pages: PageSlice[][];
  /** Sentence id -> index of the page it is on. */
  pageOfSentence: Map<string, number>;
}

const paragraphChars = (p: Paragraph) => p.sentences.reduce((n, s) => n + s.cn.length, 0);

/**
 * Split a story into pages of about `targetChars` characters, breaking only
 * between paragraphs. Pages are balanced (seven pages of ~600 rather than six
 * of 700 and a stub), and a story up to 1.5 pages long stays on one page.
 */
export function paginate(sections: Section[], targetChars: number): Pagination {
  const flat = sections.flatMap(section =>
    section.paragraphs.map(paragraph => ({ section, paragraph, chars: paragraphChars(paragraph) })),
  );
  const total = flat.reduce((n, p) => n + p.chars, 0);
  const pageCount = total <= targetChars * 1.5 ? 1 : Math.ceil(total / targetChars);
  const perPage = total / pageCount;

  const pages: PageSlice[][] = [];
  const pageOfSentence = new Map<string, number>();
  let page: PageSlice[] = [];
  let pageChars = 0;
  let charsBefore = 0;
  const started = new Set<Section>();

  for (const { section, paragraph, chars } of flat) {
    // Start a new page once this paragraph sits mostly past the current
    // page's share of the text.
    const boundary = perPage * (pages.length + 1);
    if (pageChars > 0 && pages.length < pageCount - 1 && charsBefore + chars / 2 > boundary) {
      pages.push(page);
      page = [];
      pageChars = 0;
    }

    let slice = page[page.length - 1];
    if (slice?.section !== section) {
      slice = { section, paragraphs: [], startsSection: !started.has(section) };
      started.add(section);
      page.push(slice);
    }
    slice.paragraphs.push(paragraph);
    for (const s of paragraph.sentences) pageOfSentence.set(s.id, pages.length);

    pageChars += chars;
    charsBefore += chars;
  }
  if (page.length || !pages.length) pages.push(page);

  return { pages, pageOfSentence };
}
