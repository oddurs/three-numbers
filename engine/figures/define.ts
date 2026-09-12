/**
 * The figure contract.
 *
 * A figure is a pure function from nothing to an SVG document, plus the
 * metadata the book needs to place it: where it goes, how wide it is, what it
 * claims, and which sources back the claim. Keeping the caption and the sources
 * next to the code that draws the data is the whole point — a figure and its
 * evidence cannot drift apart if they live in one file.
 */

import type { SvgDocument } from "../draw/svg.ts";
import { theme } from "../draw/theme.ts";

export type FigureWidth = keyof typeof theme.widths | number;

export interface FigureDefinition {
  /** Stable kebab-case id. Becomes the filename and the Typst label. */
  readonly id: string;
  /** Short title, used in the list of figures. */
  readonly title: string;
  /** Full caption. Typst markup is allowed. */
  readonly caption: string;
  /** Chapter id this figure belongs to, e.g. "ch02". */
  readonly chapter: string;
  readonly width?: FigureWidth;
  /** Where the figure sits on the page. */
  readonly placement?: "column" | "wide" | "margin" | "full";
  /** Citation keys from the research store that this figure's claim rests on. */
  readonly sources?: readonly string[];
  /** A one-line statement of what the figure is *for*. Checked by `cli check`. */
  readonly claim?: string;
  readonly render: () => SvgDocument;
}

export const defineFigure = (def: FigureDefinition): FigureDefinition => def;

export const figureWidthPt = (def: FigureDefinition): number => {
  const w = def.width ?? def.placement ?? "column";
  return typeof w === "number" ? w : theme.widths[w];
};
