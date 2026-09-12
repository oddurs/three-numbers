/**
 * Outline validation.
 *
 * The outline is the part of the book most likely to drift, because it is
 * written before the things it refers to exist. A section can plan a figure
 * nobody ever draws, cite a source nobody ever adds, or quietly become a
 * chapter's worth of material under one heading. None of that is visible by
 * reading, and all of it is checkable.
 */

import { basename } from "node:path";
import type { ChapterOutline, Part } from "./define.ts";
import { chapterWords } from "./define.ts";
import type { Outline } from "./registry.ts";

export interface OutlineIssue {
  readonly where: string;
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning" | "info";
}

export interface ValidateContext {
  /** Figure ids that exist. */
  readonly figureIds: ReadonlySet<string>;
  /** Citation keys that exist in the research store. */
  readonly sourceKeys: ReadonlySet<string>;
}

/** A section this long is a chapter wearing a heading. */
const SECTION_WORD_CEILING = 2400;
/** Below this, a section is a paragraph and should be folded into its neighbour. */
const SECTION_WORD_FLOOR = 400;
/** An argument shorter than this is a topic label, not an argument. */
const MIN_ARGUMENT_CHARS = 80;

export function validateOutline(outline: Outline, ctx: ValidateContext): OutlineIssue[] {
  const issues: OutlineIssue[] = [];
  const add = (severity: OutlineIssue["severity"], where: string, code: string, message: string) =>
    issues.push({ where, code, message, severity });

  validateStructure(outline, add);

  for (const { chapter, file } of outline.chapters) {
    const expected = `${chapter.id}.outline.ts`;
    if (basename(file) !== expected) {
      add("error", file, "id-filename-mismatch", `id "${chapter.id}" should live in ${expected}`);
    }
    if (!/^ch\d{2}$/.test(chapter.id)) {
      add("error", file, "bad-id", `id "${chapter.id}" must look like ch07`);
    }
    validateChapter(chapter, file, ctx, add);
  }

  // Figures that exist but no chapter plans. Not an error — a figure may be
  // drawn before its chapter is outlined — but worth knowing about.
  const planned = new Set(
    outline.chapters.flatMap((c) => c.chapter.sections.flatMap((s) => s.figures ?? [])),
  );
  for (const id of ctx.figureIds) {
    if (!planned.has(id)) {
      add("info", "outline", "unplanned-figure", `figure "${id}" is not planned by any section`);
    }
  }

  return issues.sort(
    (a, b) =>
      ({ error: 0, warning: 1, info: 2 })[a.severity] - ({ error: 0, warning: 1, info: 2 })[b.severity] ||
      a.where.localeCompare(b.where),
  );
}

type Add = (s: OutlineIssue["severity"], where: string, code: string, message: string) => void;

function validateStructure(outline: Outline, add: Add): void {
  const numbers = outline.chapters.map((c) => c.chapter.number);
  numbers.forEach((n, i) => {
    if (n !== i + 1) {
      add(
        "error",
        outline.chapters[i]!.file,
        "numbering-gap",
        `chapter numbers must run 1..n with no gaps; found ${n} at position ${i + 1}`,
      );
    }
  });

  // Chapters must be contiguous within their part, or the printed order and the
  // part pages disagree.
  let seen: string[] = [];
  for (const { chapter, file } of outline.chapters) {
    if (seen.at(-1) !== chapter.part) {
      if (seen.includes(chapter.part)) {
        add("error", file, "part-not-contiguous", `part ${chapter.part} is interrupted and resumed`);
      }
      seen.push(chapter.part);
    }
  }

  for (const [part, chapters] of outline.byPart) {
    if (chapters.length === 0) {
      add("warning", "outline/parts.ts", "empty-part", `part ${part} has no chapters`);
    }
  }

  const words = outline.parts.map((p: Part) => ({
    part: p.number,
    words: (outline.byPart.get(p.number) ?? []).reduce((s, c) => s + chapterWords(c.chapter), 0),
  }));
  const total = words.reduce((s, w) => s + w.words, 0);
  if (total > 0) {
    for (const w of words) {
      const share = w.words / total;
      // A part carrying under a twelfth of the book is starved, and the
      // imbalance is far easier to see here than by reading.
      if (share < 1 / 12) {
        add(
          "warning",
          "outline/parts.ts",
          "part-imbalance",
          `part ${w.part} is ${(share * 100).toFixed(0)}% of the book (${w.words.toLocaleString()} words)`,
        );
      }
    }
  }
}

function validateChapter(chapter: ChapterOutline, file: string, ctx: ValidateContext, add: Add): void {
  if (chapter.sections.length === 0) {
    add("error", file, "no-sections", "a chapter outline with no sections is not an outline");
  }

  const seen = new Set<string>();
  for (const section of chapter.sections) {
    const where = `${file} · ${section.title}`;

    if (seen.has(section.title)) add("error", where, "duplicate-section", "two sections share a title");
    seen.add(section.title);

    const argument = section.argument.trim();
    if (argument.length < MIN_ARGUMENT_CHARS) {
      add("error", where, "thin-argument", "the argument is a topic label, not an argument");
    }
    if (!/[.!?]$/.test(argument)) {
      add("warning", where, "argument-punctuation", "the argument should end in a full stop");
    }
    if (section.words > SECTION_WORD_CEILING) {
      add("warning", where, "section-too-long", `${section.words} words — this is a chapter, not a section`);
    }
    if (section.words < SECTION_WORD_FLOOR) {
      add("warning", where, "section-too-short", `${section.words} words — fold it into a neighbour`);
    }

    for (const id of section.figures ?? []) {
      if (!ctx.figureIds.has(id)) {
        add("warning", where, "figure-not-drawn", `plans figure "${id}", which does not exist yet`);
      }
    }
    for (const key of section.sources ?? []) {
      if (!ctx.sourceKeys.has(key)) {
        add("error", where, "unknown-source", `cites "${key}", which is not in the research store`);
      }
    }
  }

  if (chapter.epigraph?.unverified) {
    add(
      "warning",
      file,
      "unverified-epigraph",
      "the epigraph is quoted from memory and has not been checked against its edition",
    );
  }
  if (chapter.epigraph && !chapter.epigraph.source && chapter.epigraph.unverified) {
    add("error", file, "unattributed-quote", "an unverified epigraph must name the source it is quoting");
  }

  if (chapter.lead.trim().length < MIN_ARGUMENT_CHARS) {
    add("error", file, "thin-lead", "the lead should say what the chapter is for");
  }

  const total = chapterWords(chapter);
  if (total > 12_000) {
    add("warning", file, "chapter-too-long", `${total.toLocaleString()} words — consider splitting`);
  }
}

export const countOutlineIssues = (issues: OutlineIssue[]) => ({
  error: issues.filter((i) => i.severity === "error").length,
  warning: issues.filter((i) => i.severity === "warning").length,
  info: issues.filter((i) => i.severity === "info").length,
});
