/**
 * The chapter outline contract.
 *
 * One file per chapter under `outline/`, the same shape as a figure: a typed
 * declaration the engine discovers, validates and emits from. Before this, the
 * outline lived in two arbitrarily-split Python files with no types, no
 * validation, and figure and source references that nothing checked — so a
 * chapter could plan a figure that did not exist and nobody found out until
 * someone read the PDF.
 *
 * A section carries the *argument* it will make, not just a heading. A heading
 * with nothing under it is not an outline, and `check` enforces that too.
 */

export type ChapterStatus =
  /** Planned. The engine generates the chapter file from this outline. */
  | "outline"
  /** Prose is being written into `book/parts/`. The engine stops overwriting it. */
  | "drafting"
  /** Finished. Left alone entirely. */
  | "written";

/** What an exercise asks the reader to do. */
export type ExerciseKind = "code" | "proof" | "think";

export interface Exercise {
  readonly prompt: string;
  readonly kind: ExerciseKind;
  readonly hint?: string;
}

export interface Epigraph {
  readonly text: string;
  /** Attribution. Omit for an unattributed line of the author's own. */
  readonly source?: string;
  /**
   * True while the wording is quoted from memory and has not been checked
   * against the edition cited. Emits a visible marker in the draft, and `check`
   * lists them, so no unverified quotation can reach a release unnoticed.
   */
  readonly unverified?: boolean;
}

export interface Section {
  readonly title: string;
  /** What this section argues. Two or three sentences, not a topic list. */
  readonly argument: string;
  /** Planned length. Used for progress and for spotting a section that is secretly a chapter. */
  readonly words: number;
  /** Figure ids this section needs. Checked against the figure registry. */
  readonly figures?: readonly string[];
  /** Citation keys. Checked against the research store. */
  readonly sources?: readonly string[];
}

export interface ChapterOutline {
  /** `ch07`. Must match the filename and the emitted `book/parts/ch07.typ`. */
  readonly id: string;
  /** Printed chapter number. */
  readonly number: number;
  /** The part this chapter belongs to, e.g. `"II"`. */
  readonly part: string;
  readonly title: string;
  readonly status: ChapterStatus;
  readonly epigraph?: Epigraph;
  /** The opening paragraph: what the chapter is for. */
  readonly lead: string;
  readonly sections: readonly Section[];
  readonly exercises?: readonly Exercise[];
}

export const defineChapter = (chapter: ChapterOutline): ChapterOutline => chapter;

export interface Part {
  /** Roman numeral, as printed. */
  readonly number: string;
  readonly title: string;
  readonly blurb: string;
}

export const definePart = (part: Part): Part => part;

// --- Derived ----------------------------------------------------------------

export const chapterWords = (c: ChapterOutline): number =>
  c.sections.reduce((sum, s) => sum + s.words, 0);

export const chapterFigures = (c: ChapterOutline): string[] =>
  [...new Set(c.sections.flatMap((s) => s.figures ?? []))];

export const chapterSources = (c: ChapterOutline): string[] =>
  [...new Set(c.sections.flatMap((s) => s.sources ?? []))].sort();

/** Chapters the engine is allowed to overwrite. */
export const isGenerated = (c: ChapterOutline): boolean => c.status === "outline";
