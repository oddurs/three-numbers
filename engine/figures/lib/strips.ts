/**
 * Swatch strips and ramps.
 *
 * Half the figures in a colour book are "here are some colours, side by side".
 * This module makes that one call, with consistent labelling, so the comparison
 * is between the colours and not between two people's idea of a swatch.
 */

import type { Vec3 } from "../../color/math.ts";
import { Canvas, el, type Plot } from "../../draw/plot.ts";
import { Raster } from "../../draw/raster.ts";
import { theme } from "../../draw/theme.ts";
import { srgbToHex } from "../../draw/format.ts";
import type { Node } from "../../draw/svg.ts";

export interface StripOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Draw a hairline border around each swatch. */
  border?: boolean;
  gap?: number;
  radius?: number;
}

/** A row of discrete swatches. */
export function swatchRow(colors: Vec3[], opts: StripOptions): Node[] {
  const { x, y, width, height, border = false, gap = 0, radius = 0 } = opts;
  const w = (width - gap * (colors.length - 1)) / colors.length;
  return colors.map((c, i) =>
    el("rect", {
      x: x + i * (w + gap), y, width: w, height,
      fill: srgbToHex(c), rx: radius,
      stroke: border ? theme.ink.hairline : undefined,
      "stroke-width": border ? theme.stroke.hairline : undefined,
      "shape-rendering": gap === 0 ? "crispEdges" : undefined,
    }),
  );
}

/**
 * A continuous ramp, rendered as a raster so that it is genuinely continuous
 * rather than a few hundred rectangles pretending to be.
 */
export function rampRaster(sample: (t: number) => Vec3, samples = 900): Raster {
  const r = new Raster(samples, 1);
  r.fill((u) => sample(u));
  return r;
}

/** A ramp plus a thin label above it. */
export function labelledRamp(
  canvas: Canvas,
  sample: (t: number) => Vec3,
  opts: StripOptions & { label?: string; note?: string; samples?: number },
): void {
  const { x, y, width, height, label, note, samples = 900 } = opts;
  if (label) {
    canvas.text(x, y - 4, label, {
      size: theme.font.size.annotation, fill: theme.ink.primary,
    });
  }
  if (note) {
    canvas.text(x + width, y - 4, note, {
      size: theme.font.size.tiny, fill: theme.ink.muted, anchor: "end",
    });
  }
  canvas.raster(rampRaster(sample, samples), x, y, width, height, true);
  canvas.add(el("rect", {
    x, y, width, height, fill: "none",
    stroke: theme.ink.hairline, "stroke-width": theme.stroke.hairline,
  }));
}

/** A two-dimensional field, evaluated per pixel. */
export function fieldRaster(
  width: number, height: number,
  sample: (u: number, v: number) => Vec3 | null,
  scale = 2,
): Raster {
  const r = new Raster(Math.round(width * scale), Math.round(height * scale));
  r.fill((u, v) => sample(u, v));
  return r;
}

/** Tick marks and numbers under a ramp, for when the axis matters. */
export function rampAxis(
  canvas: Canvas,
  opts: { x: number; y: number; width: number; ticks: Array<{ at: number; label: string }> },
): void {
  const { x, y, width, ticks } = opts;
  for (const t of ticks) {
    const px = x + t.at * width;
    canvas.add(el("line", {
      x1: px, x2: px, y1: y, y2: y + 2.5,
      stroke: theme.ink.rule, "stroke-width": theme.stroke.hairline,
    }));
    canvas.text(px, y + 9, t.label, {
      size: theme.font.size.tiny, fill: theme.ink.secondary, anchor: "middle",
    });
  }
}

export { Canvas, el };
export type { Plot };
