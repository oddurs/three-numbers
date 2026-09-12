/**
 * Loading of the measured datasets in `data/`.
 *
 * These are the real tables, not analytic fits: every chromaticity diagram in
 * the book traces the actual CIE data. See `data/SOURCES.md` for provenance.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Spectrum } from "./spectrum.ts";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data");

/** Parse a CVRL-style CSV: `wavelength, c1[, c2, c3]` with blanks meaning zero. */
function parseCsv(file: string): { lambda: number[]; cols: number[][] } {
  const text = readFileSync(join(DATA_DIR, file), "utf8");
  const lambda: number[] = [];
  const cols: number[][] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split(",").map((p) => p.trim());
    const l = Number(parts[0]);
    if (!Number.isFinite(l)) continue;
    lambda.push(l);
    for (let i = 1; i < parts.length; i++) {
      (cols[i - 1] ??= []).push(parts[i] === "" ? 0 : Number(parts[i]));
    }
  }
  return { lambda, cols };
}

function gridOf(lambda: number[]): { start: number; step: number } {
  const start = lambda[0]!;
  const step = lambda.length > 1 ? lambda[1]! - start : 1;
  for (let i = 1; i < lambda.length; i++) {
    if (Math.abs(lambda[i]! - (start + i * step)) > 1e-6)
      throw new Error("dataset is not on a uniform wavelength grid");
  }
  return { start, step };
}

/** Load a three-column table (x,y,z or l,m,s) as three aligned spectra. */
export function loadTriple(file: string, labels: [string, string, string]): [Spectrum, Spectrum, Spectrum] {
  const { lambda, cols } = parseCsv(file);
  const { start, step } = gridOf(lambda);
  if (cols.length < 3) throw new Error(`${file}: expected 3 data columns`);
  return [0, 1, 2].map((i) => ({
    start, step, values: cols[i]!, label: labels[i]!,
  })) as unknown as [Spectrum, Spectrum, Spectrum];
}

/** Load a single-column table (an illuminant SPD). */
export function loadSingle(file: string, label: string): Spectrum {
  const { lambda, cols } = parseCsv(file);
  const { start, step } = gridOf(lambda);
  return { start, step, values: cols[0]!, label };
}
