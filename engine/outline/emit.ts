/**
 * Emitting the outline as Typst.
 *
 * Two jobs the Python generator this replaces also did, and which are the whole
 * reason this is code rather than copy-and-paste:
 *
 *  1. **Escaping.** Typst markup and a TypeScript string literal disagree about
 *     `#`, `@`, `*` and `_`. A bare `L*` in prose is an unclosed emphasis
 *     delimiter that swallows the rest of the paragraph, and `#4%` is a code
 *     expression. Star notation goes to math; the rest is escaped.
 *  2. **Voice.** The reassurance adverbs in `docs/voice.md` are stripped here
 *     rather than policed by hand, because a style rule nobody enforces is a
 *     style rule nobody follows.
 *
 * Only chapters with `status: "outline"` are written. Once prose is being
 * written into `book/parts/`, set the status to `drafting` and the engine stops
 * touching the file.
 */

import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { paths } from "../paths.ts";
import { writeIfChanged } from "../build/figures.ts";
import type { ChapterOutline, Exercise, Section } from "./define.ts";
import { isGenerated } from "./define.ts";
import type { Outline } from "./registry.ts";

/** Figures printed in the front matter; chapters cross-reference them instead. */
const PLACED_IN_FRONT: Record<string, string> = {
  "cie-1931-chromaticity": "preface",
};

const REASSURANCE: Array<[RegExp, string]> = [
  [/\bbe honest(ly)? about\b/g, "state"],
  [/\bbe explicit that\b/g, "say that"],
  [/\band be honest that\b/g, "and say that"],
  [/\bbe honest that\b/g, "say plainly that"],
  [/\bgenuinely unsolved\b/g, "unsolved"],
  [/\bgenuinely (?=\w)/g, ""],
  [/\ba genuine\b/g, "a real"],
  [/\bactually (?=\w)/g, ""],
  [/\bprecisely (?=the|what|how|which|where)/g, ""],
  [/\bin fact\b,? /g, ""],
  [/\bhonestly\b,? /g, ""],
];

/** Strip the adverbs that assert rigour instead of demonstrating it. */
export function deReassure(text: string): string {
  let out = text;
  for (const [pattern, replacement] of REASSURANCE) out = out.replace(pattern, replacement);
  return out.replace(/ {2,}/g, " ");
}

/**
 * Prepare prose for Typst markup.
 *
 * `@` starts a citation and `#` starts code, so both are escaped when literal.
 * Star notation must become math or Typst reads it as emphasis; deliberate
 * `*emphasis*` in the outline is left alone.
 */
export function escapeTypst(text: string): string {
  return deReassure(text)
    .replace(/@/g, "\\@")
    .replace(/#/g, "\\#")
    .replace(/\b([LabCh])\*/g, "$$$1^*$$")
    .replace(/u'v'/g, "$u' v'$");
}

/** Emphasis delimiters must pair up, or the rest of the file goes italic. */
export function markupIsBalanced(text: string): { ok: true } | { ok: false; marker: string } {
  const prose = text
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("#import") && !l.trimStart().startsWith("//"))
    .join("\n")
    .replace(/`[^`]*`/g, "")
    .replace(/\$[^$]*\$/g, "");
  for (const marker of ["*", "_"]) {
    const count = prose.split(marker).length - 1;
    if (count % 2 !== 0) return { ok: false, marker };
  }
  return { ok: true };
}

const collapse = (s: string): string => s.trim().replace(/\s+/g, " ");

function wrap(text: string, indent = "  ", width = 86): string {
  const words = collapse(text).split(" ");
  const lines: string[] = [];
  let line = indent;
  for (const word of words) {
    if (line.length + word.length + 1 > width && line.trim()) {
      lines.push(line.trimEnd());
      line = indent;
    }
    line += (line === indent ? "" : " ") + word;
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines.join("\n");
}

const tuple = (items: readonly string[]): string =>
  items.length === 0 ? "()" : `(${items.map((i) => JSON.stringify(i)).join(", ")}${items.length === 1 ? "," : ""})`;

function emitSection(section: Section, drawn: string[], recalled: string[]): string[] {
  const lines = [`== ${escapeTypst(section.title)}`, ""];
  const named: string[] = [];
  const planned = (section.figures ?? []).filter((f) => !drawn.includes(f) && !recalled.includes(f));
  if (planned.length) named.push(`figures: ${tuple(planned)}`);
  if (section.sources?.length) named.push(`sources: ${tuple(section.sources)}`);
  named.push(`words: ${section.words}`);

  lines.push(`#stub(${named.join(", ")})[`);
  lines.push(wrap(escapeTypst(section.argument)));
  lines.push("]", "");

  for (const id of drawn) lines.push(`#fig("${id}")`, "");
  if (recalled.length) {
    lines.push(`Returns to ${recalled.map((f) => `#figref("${f}")`).join(" and ")}.`, "");
  }
  return lines;
}

function emitExercises(exercises: readonly Exercise[] | undefined): string[] {
  const lines = ["#exercises["];
  if (exercises?.length) {
    for (const ex of exercises) {
      const args = [`kind: "${ex.kind}"`];
      if (ex.hint) args.push(`hint: [${escapeTypst(ex.hint)}]`);
      lines.push(`  #exercise(${args.join(", ")})[`);
      lines.push(wrap(escapeTypst(ex.prompt), "    "));
      lines.push("  ]");
    }
  } else {
    lines.push("  #exercise-plan[");
    lines.push("    Three to five problems, each doable against this repository: one");
    lines.push("    derivation, one measurement, and one that asks the reader to decide");
    lines.push("    something rather than compute it. See Chapters 1--3 for the pattern.");
    lines.push("  ]");
  }
  lines.push("]", "");
  return lines;
}

export function renderChapter(
  chapter: ChapterOutline,
  placed: Map<string, string>,
  existingFigures: ReadonlySet<string>,
): string {
  const lines = ['#import "../lib/book.typ": *', ""];

  if (chapter.epigraph) {
    const text = escapeTypst(chapter.epigraph.text) +
      (chapter.epigraph.unverified ? " #todo[verify this wording against the edition cited]" : "");
    lines.push("#chapter(");
    lines.push(`  ${chapter.number},`);
    lines.push(`  epigraph: [${collapse(text)}],`);
    if (chapter.epigraph.source) {
      lines.push(`  epigraph-source: [${escapeTypst(chapter.epigraph.source)}],`);
    }
    lines.push(`)[${escapeTypst(chapter.title)}]`);
  } else {
    lines.push(`#chapter(${chapter.number})[${escapeTypst(chapter.title)}]`);
  }
  lines.push("");

  lines.push("#lead[");
  lines.push(wrap(escapeTypst(chapter.lead)));
  lines.push("]", "");

  for (const section of chapter.sections) {
    const wanted = section.figures ?? [];
    const drawn = wanted.filter((f) => existingFigures.has(f) && !placed.has(f));
    const recalled = wanted.filter(
      (f) => existingFigures.has(f) && placed.has(f) && placed.get(f) !== chapter.id,
    );
    lines.push(...emitSection(section, drawn, recalled));
    for (const id of drawn) placed.set(id, chapter.id);
  }

  lines.push(...emitExercises(chapter.exercises));
  lines.push("#chapter-end()", "");
  return lines.join("\n");
}

export function renderMain(outline: Outline): string {
  const lines = [
    '#import "lib/book.typ": *',
    "",
    "// Generated by `node engine/cli.ts outline sync` -- do not edit.",
    "// The structure lives in outline/; add a chapter by adding a file there.",
    "",
    "#show: book.with(",
    '  title: "Three Numbers",',
    '  subtitle: "Colour theory for people who would rather see the derivation",',
    '  author: "TODO",',
    ")",
    "",
    '#include "front/title.typ"',
    '#pagebreak(to: "odd", weak: true)',
    '#include "front/contents.typ"',
    '#pagebreak(to: "odd", weak: true)',
    '#include "front/preface.typ"',
    "",
    "#begin-body()",
    "",
  ];

  for (const part of outline.parts) {
    lines.push(`#part-page("${part.number}", blurb: [`);
    lines.push(wrap(escapeTypst(part.blurb)));
    lines.push(`])[${escapeTypst(part.title)}]`);
    lines.push("");
    for (const { chapter } of outline.byPart.get(part.number) ?? []) {
      lines.push(`#include "parts/${chapter.id}.typ"`);
    }
    lines.push("");
  }

  lines.push(
    '#include "back/appendix-a.typ"',
    '#include "back/appendix-b.typ"',
    '#include "back/appendix-c.typ"',
    '#include "back/appendix-d.typ"',
    '#include "back/bibliography.typ"',
    '#include "back/colophon.typ"',
    "",
  );
  return lines.join("\n");
}

export interface SyncResult {
  readonly written: string[];
  readonly unchanged: string[];
  readonly skipped: Array<{ id: string; status: string }>;
}

/** Write `book/parts/*.typ` and `book/main.typ` from the outline. */
export function syncOutline(outline: Outline, existingFigures: ReadonlySet<string>): SyncResult {
  mkdirSync(join(paths.book, "parts"), { recursive: true });

  const placed = new Map<string, string>(Object.entries(PLACED_IN_FRONT));
  const written: string[] = [];
  const unchanged: string[] = [];
  const skipped: Array<{ id: string; status: string }> = [];

  for (const { chapter } of outline.chapters) {
    const file = join(paths.book, "parts", `${chapter.id}.typ`);
    if (!isGenerated(chapter)) {
      skipped.push({ id: chapter.id, status: chapter.status });
      // A hand-written chapter still owns its figures, so later chapters keep
      // cross-referencing rather than reprinting them.
      for (const s of chapter.sections) {
        for (const f of s.figures ?? []) if (existingFigures.has(f) && !placed.has(f)) placed.set(f, chapter.id);
      }
      if (!existsSync(file)) {
        throw new Error(
          `${chapter.id} is marked "${chapter.status}" but book/parts/${chapter.id}.typ does not exist`,
        );
      }
      continue;
    }

    const content = renderChapter(chapter, placed, existingFigures);
    const balanced = markupIsBalanced(content);
    if (!balanced.ok) {
      throw new Error(`${chapter.id}: unbalanced "${balanced.marker}" in generated markup`);
    }
    (writeIfChanged(file, content) ? written : unchanged).push(chapter.id);
  }

  const main = renderMain(outline);
  if (writeIfChanged(join(paths.book, "main.typ"), main)) written.push("main.typ");

  return { written, unchanged, skipped };
}

/**
 * Render the outline as Markdown for `docs/outline.md`.
 *
 * The same declarations that produce the book produce its documentation, so the
 * two cannot describe different structures.
 */
export function renderOutlineDoc(outline: Outline): string {
  const totalWords = outline.chapters.reduce(
    (n, c) => n + c.chapter.sections.reduce((m, s) => m + s.words, 0), 0,
  );
  const totalSections = outline.chapters.reduce((n, c) => n + c.chapter.sections.length, 0);

  const lines: string[] = [
    "# Outline",
    "",
    "Generated by `node engine/cli.ts outline docs` from the per-chapter",
    "declarations in `outline/`. Each section carries the argument it will make,",
    "a word budget, the figures it needs and the sources it rests on — a heading",
    "with nothing under it is not an outline, and `check` enforces that.",
    "",
    "| Part | Chapters | Sections | Planned words |",
    "|---|---|---|---|",
  ];

  for (const part of outline.parts) {
    const chapters = outline.byPart.get(part.number) ?? [];
    const words = chapters.reduce((n, c) => n + c.chapter.sections.reduce((m, s) => m + s.words, 0), 0);
    const sections = chapters.reduce((n, c) => n + c.chapter.sections.length, 0);
    lines.push(`| **${part.number} — ${part.title}** | ${chapters.length} | ${sections} | ${words.toLocaleString()} |`);
  }
  lines.push(
    `| | **${outline.chapters.length}** | **${totalSections}** | **${totalWords.toLocaleString()}** |`,
    "",
  );

  for (const part of outline.parts) {
    lines.push(`## Part ${part.number} — ${part.title}`, "", collapse(part.blurb), "");
    for (const { chapter } of outline.byPart.get(part.number) ?? []) {
      const words = chapter.sections.reduce((n, s) => n + s.words, 0);
      lines.push(`### ${chapter.number}. ${chapter.title}`, "");
      if (chapter.epigraph) {
        const attribution = chapter.epigraph.source ? ` — ${chapter.epigraph.source}` : "";
        const flag = chapter.epigraph.unverified ? " *(wording unverified)*" : "";
        lines.push(`> ${collapse(chapter.epigraph.text)}${attribution}${flag}`, "");
      }
      lines.push(
        collapse(chapter.lead),
        "",
        `*${chapter.sections.length} sections · ${words.toLocaleString()} words · status: ${chapter.status}*`,
        "",
      );
      for (const s of chapter.sections) {
        const bits = [`**${s.title}** (${s.words.toLocaleString()} w)`];
        if (s.figures?.length) bits.push(`fig: ${s.figures.map((f) => `\`${f}\``).join(", ")}`);
        if (s.sources?.length) bits.push(`src: ${s.sources.map((x) => `\`${x}\``).join(", ")}`);
        lines.push(`- ${bits.join(" · ")}`, `  <br>${collapse(s.argument)}`);
      }
      lines.push("");
      if (chapter.exercises?.length) {
        lines.push(`**Exercises**`, "");
        for (const ex of chapter.exercises) {
          lines.push(`- *(${ex.kind})* ${collapse(ex.prompt)}`);
        }
        lines.push("");
      }
    }
  }
  return lines.join("\n");
}
