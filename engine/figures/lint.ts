/**
 * Caption linting.
 *
 * Captions are Typst markup embedded in TypeScript string literals, which is a
 * seam where two syntaxes meet and quietly disagree. `#4%` is a Typst code
 * expression, not the number four; `a*b*` is bold, not star notation. Both
 * compile without error and render as nonsense. These checks exist because both
 * of them shipped into the first draft of this book's figures.
 */

import type { FigureDefinition } from "./define.ts";

export interface CaptionIssue {
  readonly figure: string;
  readonly code: string;
  readonly message: string;
}

/** Spans of `$...$` are Typst math, where the markup rules do not apply. */
const stripMath = (s: string): string => s.replace(/\$[^$]*\$/g, (m) => " ".repeat(m.length));

/** Spans of `` `...` `` are raw. */
const stripRaw = (s: string): string => s.replace(/`[^`]*`/g, (m) => " ".repeat(m.length));

export function lintCaption(def: FigureDefinition): CaptionIssue[] {
  const issues: CaptionIssue[] = [];
  const add = (code: string, message: string) => issues.push({ figure: def.id, code, message });
  const text = def.caption;
  const prose = stripRaw(stripMath(text));

  // `#` followed by a digit is a Typst code expression.
  for (const m of prose.matchAll(/#\d[\d.]*%?/g)) {
    add("hash-number", `"${m[0]}" will be parsed as Typst code, not text — drop the #`);
  }

  // Star notation for CIELAB must go through math mode, or it becomes bold.
  for (const m of prose.matchAll(/\b[LabCh]\*(?!\*)/g)) {
    add("bare-star", `"${m[0]}" — star notation must be written as math, e.g. $L^*$`);
  }

  // Emphasis markers must pair up, or the rest of the caption goes bold. Count
  // every unescaped marker: the closing one of *word* is preceded by a letter,
  // so anchoring on word boundaries undercounts and reports false positives.
  const stars = (prose.match(/(?<!\\)\*/g) ?? []).length;
  if (stars % 2 !== 0) add("unbalanced-emphasis", `${stars} emphasis markers — they must pair up`);
  const unders = (prose.match(/(?<![\w\\])_|_(?![\w])/g) ?? []).length;
  if (unders % 2 !== 0) add("unbalanced-emphasis", `${unders} underscore markers — they must pair up`);

  // An unescaped @ is a citation; a stray one points at nothing.
  for (const m of prose.matchAll(/(?<![\w.])@([a-z][a-z0-9-]*)/g)) {
    if (!(def.sources ?? []).includes(m[1]!)) {
      add("stray-citation", `@${m[1]} is cited in the caption but not listed in sources`);
    }
  }

  if (text.trim().length < 40) add("thin-caption", "caption is too short to explain the figure");
  if (!/[.!?]\s*$/.test(text.trim())) add("no-full-stop", "caption should end in a full stop");

  return issues;
}

export const lintFigures = (figures: FigureDefinition[]): CaptionIssue[] =>
  figures.flatMap((f) => lintCaption(f));
