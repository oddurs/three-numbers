/**
 * Linting hand-written prose.
 *
 * The outline emitter applies the rules in `docs/voice.md` to generated
 * chapters, and `docs/writing-process.md` says in as many words that it "cannot
 * touch a hand-written chapter, so this is where that debt is paid" — by a
 * person, during revision. Leaving a measurable rule to discipline is how it
 * stops being followed, so the measurable parts are measured here.
 *
 * These are *warnings*, not errors, with one exception. A rule about voice
 * should inform a revision, not block a build; a code listing wider than the
 * measure is simply broken on the page.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { paths } from "../paths.ts";

export interface ProseIssue {
  readonly file: string;
  readonly line: number;
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

/**
 * Characters that fit on one line of a code listing.
 *
 * The measure is 113 mm (320.3 pt), a listing insets 8 pt each side, and
 * JetBrains Mono at 9.2 pt advances 5.52 pt per character: 55 characters, with
 * one held back for rounding.
 */
export const LISTING_MAX_CHARS = 54;

/** Em-dashes per thousand words, above which the tic is visible. */
export const EM_DASH_BUDGET = 3;

const REASSURANCE = /\b(honestly|genuinely|actually|precisely)\b/gi;

const IGNORED_DIRS = new Set(["dev", "lib"]);

function proseFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    let entries: string[];
    try { entries = readdirSync(d); } catch { return; }
    for (const name of entries.sort()) {
      if (IGNORED_DIRS.has(name)) continue;
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".typ")) out.push(full);
    }
  };
  walk(dir);
  return out;
}

/** Strip math and inline raw, where the markup rules do not apply. */
const stripSpans = (s: string): string =>
  s.replace(/\$[^$]*\$/g, " ").replace(/`[^`\n]*`/g, " ");

export function lintProse(file: string, text: string): ProseIssue[] {
  const rel = relative(paths.root, file);
  const issues: ProseIssue[] = [];
  const add = (line: number, severity: ProseIssue["severity"], code: string, message: string) =>
    issues.push({ file: rel, line, code, message, severity });

  const lines = text.split("\n");

  // Code listings that do not fit the measure. Typst will not warn: it wraps
  // them, and a wrapped table of numbers reads as gibberish.
  let inRaw = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { inRaw = !inRaw; return; }
    if (inRaw && line.length > LISTING_MAX_CHARS) {
      add(
        i + 1,
        "error",
        "listing-too-wide",
        `${line.length} characters; the measure fits ${LISTING_MAX_CHARS}`,
      );
    }
  });

  // Everything below is about prose, so code and math are out of scope.
  inRaw = false;
  const prose: Array<{ line: number; text: string }> = [];
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { inRaw = !inRaw; return; }
    if (inRaw || line.trimStart().startsWith("//") || line.trimStart().startsWith("#import")) return;
    prose.push({ line: i + 1, text: stripSpans(line) });
  });

  for (const { line, text: t } of prose) {
    for (const m of t.matchAll(REASSURANCE)) {
      add(line, "warning", "reassurance-adverb", `"${m[0]}" — the prose is asserting rigour rather than having it`);
    }
    for (const m of t.matchAll(/\b[LabCh]\*(?!\*)/g)) {
      add(line, "warning", "bare-star", `"${m[0]}" outside math will read as an emphasis delimiter`);
    }
  }

  const body = prose.map((p) => p.text).join("\n");
  const words = (body.match(/[A-Za-z][A-Za-z'-]+/g) ?? []).length;
  const emDashes = (body.match(/—|---/g) ?? []).length;
  if (words > 400) {
    const rate = (emDashes / words) * 1000;
    if (rate > EM_DASH_BUDGET) {
      add(
        1,
        "warning",
        "em-dash-rate",
        `${emDashes} em-dashes in ${words} words (${rate.toFixed(1)} per 1,000; budget ${EM_DASH_BUDGET})`,
      );
    }
  }

  return issues;
}

export const lintBook = (dir = paths.book): ProseIssue[] =>
  proseFiles(dir).flatMap((f) => lintProse(f, readFileSync(f, "utf8")));
