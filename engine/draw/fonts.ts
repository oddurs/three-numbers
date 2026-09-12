/**
 * Font coverage, read from the font.
 *
 * Typst falls back per glyph, so a λ in prose quietly comes from Libertinus
 * when ET Book lacks it. The SVG renderer does not: it resolves one family per
 * text element, so a label reading `x̄(λ)` picks ET Book — because `x` is
 * present — and then draws two tofu boxes for the macron and the lambda. The
 * same label written `ȳ(λ)` happens to render, because U+0233 has a precomposed
 * form ET Book lacks, which sends the whole run to the fallback. The behaviour
 * is not wrong so much as per-element, and depending on it is a coin flip.
 *
 * So the decision is made here instead, by parsing the font's own `cmap` and
 * choosing a family the whole string is covered by. No guessing, no tofu, and
 * it stays correct if the font is ever replaced.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { paths } from "../paths.ts";

/** Codepoints a TrueType/OpenType font maps, from its `cmap` table. */
export function readCoverage(file: string): Set<number> {
  const buf = readFileSync(file);
  const covered = new Set<number>();

  const numTables = buf.readUInt16BE(4);
  let cmapOffset = -1;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (buf.toString("latin1", rec, rec + 4) === "cmap") {
      cmapOffset = buf.readUInt32BE(rec + 8);
      break;
    }
  }
  if (cmapOffset < 0) return covered;

  const subtables = buf.readUInt16BE(cmapOffset + 2);
  for (let i = 0; i < subtables; i++) {
    const rec = cmapOffset + 4 + i * 8;
    const sub = cmapOffset + buf.readUInt32BE(rec + 4);
    const format = buf.readUInt16BE(sub);

    if (format === 4) {
      const segX2 = buf.readUInt16BE(sub + 6);
      const segs = segX2 / 2;
      for (let s = 0; s < segs; s++) {
        const end = buf.readUInt16BE(sub + 14 + s * 2);
        const start = buf.readUInt16BE(sub + 16 + segX2 + s * 2);
        if (end === 0xffff) continue;
        for (let c = start; c <= end; c++) covered.add(c);
      }
    } else if (format === 12) {
      const groups = buf.readUInt32BE(sub + 12);
      for (let gi = 0; gi < groups; gi++) {
        const g = sub + 16 + gi * 12;
        const start = buf.readUInt32BE(g);
        const end = buf.readUInt32BE(g + 4);
        // Guard against a pathological range claiming the whole plane.
        for (let c = start; c <= Math.min(end, start + 0xffff); c++) covered.add(c);
      }
    }
  }
  return covered;
}

let bodyCoverage: Set<number> | undefined;

/** Codepoints the body face covers. Read once. */
export function bodyFaceCoverage(): Set<number> {
  if (!bodyCoverage) {
    try {
      bodyCoverage = readCoverage(join(paths.fonts, "ETBookOT-Roman.otf"));
    } catch {
      // No vendored font: assume everything is covered and let the renderer
      // fall back as it sees fit.
      bodyCoverage = new Set();
    }
  }
  return bodyCoverage;
}

/** Is every character of `text` drawable in the body face? */
export function coveredByBodyFace(text: string): boolean {
  const coverage = bodyFaceCoverage();
  if (coverage.size === 0) return true;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    // Whitespace is never a coverage problem.
    if (cp === 0x20 || cp === 0x0a || cp === 0x09) continue;
    if (!coverage.has(cp)) return false;
  }
  return true;
}

/** Characters of `text` the body face cannot draw. For diagnostics. */
export function uncoveredCharacters(text: string): string[] {
  const coverage = bodyFaceCoverage();
  if (coverage.size === 0) return [];
  const missing = new Set<string>();
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp === 0x20 || cp === 0x0a || cp === 0x09) continue;
    if (!coverage.has(cp)) missing.add(ch);
  }
  return [...missing];
}
