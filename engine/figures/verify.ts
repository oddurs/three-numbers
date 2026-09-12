/**
 * Structural checks on figures.
 *
 * The book's central typographic claim is that a diagram's type is set at the
 * same optical size as the type beside it. That holds only while the SVG's
 * intrinsic width in points equals the width Typst places it at. If a figure
 * is authored at `theme.widths.wide` but declared `placement: "column"`, Typst
 * scales it down and every label inside shrinks with it — silently, and
 * invisibly in any single-figure proof. So it is checked.
 */

import { figureWidthPt, type FigureDefinition } from "./define.ts";
import { theme } from "../draw/theme.ts";
import { uncoveredCharacters } from "../draw/fonts.ts";
import type { Node } from "../draw/svg.ts";

export interface FigureIssue {
  readonly figure: string;
  readonly code: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

/** Widths must match to within a rounding of a point. */
const WIDTH_TOLERANCE_PT = 0.5;

export function verifyFigure(def: FigureDefinition, file?: string): FigureIssue[] {
  const issues: FigureIssue[] = [];
  const add = (severity: "error" | "warning", code: string, message: string) =>
    issues.push({ figure: def.id, code, message, severity });

  if (!/^[a-z][a-z0-9-]*$/.test(def.id)) {
    add("error", "bad-id", `id "${def.id}" must be lowercase kebab-case`);
  }
  if (file) {
    const base = file.split("/").pop()!.replace(/\.fig\.ts$/, "");
    if (base !== def.id) {
      add("warning", "id-filename-mismatch", `id "${def.id}" does not match filename "${base}.fig.ts"`);
    }
    const dir = file.split("/").at(-2);
    if (dir && /^(ch|app)\d/.test(dir) && dir !== def.chapter) {
      add("warning", "chapter-dir-mismatch", `chapter "${def.chapter}" does not match directory "${dir}"`);
    }
  }

  let doc: ReturnType<FigureDefinition["render"]>;
  try {
    doc = def.render();
  } catch (err) {
    add("error", "render-failed", `render() threw: ${(err as Error).message}`);
    return issues;
  }

  if (!(doc.width > 0 && doc.height > 0)) {
    add("error", "empty-document", `rendered to ${doc.width}x${doc.height} pt`);
    return issues;
  }
  if (doc.children.length === 0) {
    add("error", "empty-document", "rendered no content");
  }

  const declared = figureWidthPt(def);
  if (Math.abs(doc.width - declared) > WIDTH_TOLERANCE_PT) {
    const names = Object.entries(theme.widths)
      .map(([k, v]) => `${k} ${v.toFixed(1)}pt`)
      .join(", ");
    add(
      "error",
      "width-mismatch",
      `renders ${doc.width.toFixed(1)}pt wide but is placed at ${declared.toFixed(1)}pt ` +
      `(placement "${def.placement ?? "column"}") — Typst will rescale it and the type ` +
      `inside will no longer match the page. Available: ${names}`,
    );
  }

  // Tofu check. The SVG renderer resolves one family per text element, so a
  // label set in the body face containing a glyph that face lacks renders as
  // boxes — silently, and only visibly at proof size. Walk the document and
  // ask the font itself.
  for (const bad of findTofu(doc.children)) {
    add(
      "error",
      "missing-glyph",
      `label "${bad.text}" is set in ${theme.font.serif}, which cannot draw ` +
      `${bad.missing.map((c) => JSON.stringify(c)).join(", ")} — use familyFor() ` +
      `to pick the family from the string`,
    );
  }

  // A figure taller than the text block cannot be placed without breaking.
  const maxHeight = 560;
  if (doc.height > maxHeight) {
    add("warning", "too-tall", `${doc.height.toFixed(0)}pt tall; the text block is about ${maxHeight}pt`);
  }

  return issues;
}

export const verifyFigures = (
  figures: Array<{ def: FigureDefinition; file?: string }>,
): FigureIssue[] => figures.flatMap((f) => verifyFigure(f.def, f.file));

interface Tofu {
  readonly text: string;
  readonly missing: readonly string[];
}

/** Text nodes set in the body face that contain glyphs it does not have. */
function findTofu(nodes: Array<Node | string>): Tofu[] {
  const found: Tofu[] = [];
  const walk = (list: Array<Node | string>): void => {
    for (const node of list) {
      if (typeof node === "string") continue;
      if (node.tag === "text") {
        const family = String(node.attrs["font-family"] ?? "");
        if (family.includes(theme.font.serif)) {
          const text = node.children.filter((c) => typeof c === "string").join("");
          const missing = uncoveredCharacters(text);
          if (missing.length > 0) found.push({ text, missing });
        }
      }
      walk(node.children);
    }
  };
  walk(nodes);
  return found;
}
