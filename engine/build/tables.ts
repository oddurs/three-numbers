/**
 * Generated reference tables.
 *
 * Appendix A is not typed out; it is computed. Every matrix in it is derived by
 * the same code the figures use, so the appendix cannot disagree with the book.
 * If a primary changes, the appendix changes.
 */

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { paths } from "../paths.ts";
import { writeIfChanged } from "./figures.ts";
import type { Mat3, Vec3 } from "../color/math.ts";
import {
  luminanceWeights, rgbSpaces, rgbToXyzMatrix, sRGB, withWhiteXyz, xyzToRgbMatrix,
} from "../color/rgbspace.ts";
import { whitePoint, whitePointsXy } from "../color/illuminant.ts";
import { adaptationMatrix, catMethods, bradford } from "../color/adaptation.ts";
import { gamutVolumeOklab } from "../color/gamut.ts";
import { hpe, stockmanSharpeFit } from "../color/cvd.ts";
import { transferFunctions } from "../color/transfer.ts";

const fmt = (v: number, d = 7): string => {
  const s = v.toFixed(d);
  return s === "-0.0000000" ? (0).toFixed(d) : s;
};

/** A matrix as a Typst math block. */
const mat = (m: Mat3, digits = 7): string =>
  `$ mat(\n  ${m.map((r) => r.map((v) => fmt(v, digits)).join(", ")).join(";\n  ")}\n) $`;

const escape = (s: string): string => s.replace(/([#@*_$])/g, "\\$1");

function rgbSection(): string {
  const out: string[] = [];
  for (const space of rgbSpaces) {
    const { r, g, b } = space.primaries;
    out.push(`=== ${escape(space.name)}`, "");
    out.push(`#block(width: 100%)[`);
    out.push(`  #set text(size: 8.5pt, fill: rgb("#4a4a4a"))`);
    out.push(`  #set par(justify: false, first-line-indent: 0pt)`);
    out.push(`  ${escape(space.note)}`);
    out.push(`]`);
    out.push("");
    out.push("#table(");
    out.push("  columns: (auto, auto, auto, auto),");
    out.push("  stroke: none,");
    out.push("  align: (left, right, right, right),");
    out.push("  inset: (x: 5pt, y: 2.6pt),");
    out.push(`  [], [*x*], [*y*], [*note*],`);
    out.push(`  [red], [${r.x}], [${r.y}], [],`);
    out.push(`  [green], [${g.x}], [${g.y}], [],`);
    out.push(`  [blue], [${b.x}], [${b.y}], [],`);
    out.push(
      `  [white], [${whitePointsXy[space.white].x}], [${whitePointsXy[space.white].y}], [${space.white}],`,
    );
    out.push(`  [transfer], [], [], [${escape(space.transfer.name)}],`);
    out.push(")");
    out.push("");
    out.push("linear RGB to XYZ:");
    out.push(mat(rgbToXyzMatrix(space)));
    out.push("");
    out.push("XYZ to linear RGB:");
    out.push(mat(xyzToRgbMatrix(space)));
    out.push("");
    const w = luminanceWeights(space) as Vec3;
    out.push(
      `Luminance weights: ${fmt(w[0], 4)}, ${fmt(w[1], 4)}, ${fmt(w[2], 4)}.`,
      "",
    );
  }
  return out.join("\n");
}

function adaptationSection(): string {
  const out: string[] = ["The Bradford transform between the two white points every", "ICC profile has to reconcile:", ""];
  out.push("D65 to D50:");
  out.push(mat(adaptationMatrix(whitePoint("D65"), whitePoint("D50"), bradford)));
  out.push("");
  out.push("D50 to D65:");
  out.push(mat(adaptationMatrix(whitePoint("D50"), whitePoint("D65"), bradford)));
  out.push("");
  out.push("=== Cone bases", "");
  out.push("#table(");
  out.push("  columns: (auto, 1fr),");
  out.push("  stroke: none,");
  out.push("  align: (left, left),");
  out.push("  inset: (x: 5pt, y: 3pt),");
  out.push("  [*method*], [*note*],");
  for (const m of catMethods) {
    out.push(`  [${escape(m.name)}], [${escape(m.note)}],`);
  }
  out.push(")");
  out.push("");
  for (const m of catMethods.filter((c) => c.id !== "xyz-scaling")) {
    out.push(`${escape(m.name)}, XYZ to the adaptation basis:`);
    out.push(mat(m.M, 6));
    out.push("");
  }
  return out.join("\n");
}

function lmsSection(): string {
  const ss = stockmanSharpeFit();
  return [
    "Hunt–Pointer–Estévez, XYZ to LMS. Exact with respect to the CIE 1931 observer",
    "by construction:",
    mat(hpe.M, 5),
    "",
    `Stockman & Sharpe, reached from Judd–Vos XYZ by least squares. ${escape(ss.note)}`,
    mat(ss.M, 5),
    "",
  ].join("\n");
}

function volumeSection(): string {
  const rows = rgbSpaces.map((s) => ({
    name: s.name,
    volume: gamutVolumeOklab(s, 120_000),
  }));
  const base = rows.find((r) => r.name === "sRGB")!.volume;
  const out: string[] = [
    "Gamut volumes in Oklab, by Monte Carlo with a fixed seed, relative to sRGB.",
    "These are the numbers that should replace area comparisons on a chromaticity",
    "diagram.",
    "",
    "#table(",
    "  columns: (1fr, auto, auto),",
    "  stroke: none,",
    "  align: (left, right, right),",
    "  inset: (x: 5pt, y: 3pt),",
    "  [*space*], [*volume*], [*vs sRGB*],",
  ];
  for (const r of rows) {
    out.push(`  [${escape(r.name)}], [${r.volume.toFixed(4)}], [${(r.volume / base).toFixed(2)}×],`);
  }
  out.push(")", "");
  return out.join("\n");
}

function transferSection(): string {
  const out: string[] = [
    "#table(",
    "  columns: (auto, 1fr),",
    "  stroke: none,",
    "  align: (left, left),",
    "  inset: (x: 5pt, y: 3pt),",
    "  [*function*], [*definition*],",
  ];
  for (const tf of transferFunctions) {
    out.push(`  [${escape(tf.name)}], [${escape(tf.summary)}],`);
  }
  out.push(")", "");
  out.push("Selected decoded values, showing how far apart the curves actually are:", "");
  out.push("#table(");
  out.push("  columns: (auto, auto, auto, auto, auto),");
  out.push("  stroke: none,");
  out.push("  align: (right, right, right, right, right),");
  out.push("  inset: (x: 5pt, y: 3pt),");
  out.push("  [*V*], [*sRGB*], [*gamma 2.2*], [*Rec.709*], [*Rec.2020*],");
  const named = ["srgb", "rec709", "rec2020"];
  const picked = named.map((id) => transferFunctions.find((t) => t.id === id)!);
  for (const v of [0.02, 0.05, 0.1, 0.25, 0.5, 0.75, 1]) {
    const g22 = Math.pow(v, 2.2);
    out.push(
      `  [${v}], [${picked[0]!.decode(v).toFixed(5)}], [${g22.toFixed(5)}], ` +
      `[${picked[1]!.decode(v).toFixed(5)}], [${picked[2]!.decode(v).toFixed(5)}],`,
    );
  }
  out.push(")", "");
  return out.join("\n");
}

/** The whole of Appendix A, as a Typst file the book includes. */
export function writeTables(): void {
  mkdirSync(join(paths.build, "tables"), { recursive: true });

  const lindbloom = rgbToXyzMatrix(withWhiteXyz(sRGB, [0.95047, 1.0, 1.08883]));

  const body = [
    "// Generated by `node engine/cli.ts tables` -- do not edit.",
    "// Every matrix below is derived by the same code the figures use.",
    "",
    "#let generated-tables = [",
    "",
    "== RGB colour spaces",
    "",
    rgbSection(),
    "== The other sRGB matrix",
    "",
    "Quoting D65 as the rounded XYZ triple (0.95047, 1, 1.08883) rather than deriving",
    "it from its chromaticity gives the matrix that circulates most widely. Both are",
    "correct; they answer slightly different questions.",
    "",
    mat(lindbloom),
    "",
    "== Chromatic adaptation",
    "",
    adaptationSection(),
    "== Cone spaces",
    "",
    lmsSection(),
    "== Gamut volumes",
    "",
    volumeSection(),
    "== Transfer functions",
    "",
    transferSection(),
    "]",
    "",
  ].join("\n");

  writeIfChanged(join(paths.build, "tables", "matrices.typ"), body);
}
