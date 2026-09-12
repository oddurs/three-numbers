/**
 * The chromaticity diagram, drawn honestly.
 *
 * The horseshoe is the single most reproduced image in colour science and the
 * single most misleading. The interior *cannot* be shown on an sRGB page: most
 * of it is outside any display's gamut. Rather than pretend otherwise, this
 * renderer gamut-maps the fill and can draw the in-gamut boundary explicitly,
 * so the reader can see exactly how much of the picture is a polite fiction.
 */

import type { Vec3 } from "../../color/math.ts";
import { mul } from "../../color/math.ts";
import { cie1931, spectrumLocus, type Observer } from "../../color/observer.ts";
import { xyToXyz } from "../../color/illuminant.ts";
import { sRGB, xyzToRgbMatrix, encode, type RgbSpace } from "../../color/rgbspace.ts";
import { gamutBoundary, toGamut } from "../../color/gamut.ts";
import { oklchToSrgb, srgbToOklch, xyzToOklch } from "../../color/spaces.ts";
import { Raster } from "../../draw/raster.ts";
import type { Plot } from "../../draw/plot.ts";
import { familyFor, theme } from "../../draw/theme.ts";
import { srgbToHex } from "../../draw/format.ts";

export interface HorseshoeOptions {
  observer?: Observer;
  /** Colours outside `space` are gamut-mapped rather than clipped. */
  space?: RgbSpace;
  /**
   * How to choose a lightness. A chromaticity is a *ray* in XYZ, so the diagram
   * has to pick a point on it, and the choice changes the picture completely.
   *
   *  - "max"   : the brightest version the display can make. The usual choice,
   *              and the one that makes the shape look like colour.
   *  - "fixed" : a constant luminance, which is more honest about the fact that
   *              chromaticity says nothing about brightness, and looks muddy.
   */
  lightness?: "max" | "fixed";
  /** Luminance used when `lightness` is "fixed". */
  luminance?: number;
  /** Desaturate out-of-gamut regions instead of silently gamut-mapping them. */
  markOutOfGamut?: boolean;
  /** Fraction of chroma retained by out-of-gamut regions. */
  outOfGamutChroma?: number;
  resolution?: number;
}

/**
 * A constant-time membership test for the visible region.
 *
 * The naive approach — even-odd point-in-polygon against all 321 locus points,
 * per sample — costs a billion operations for one supersampled diagram, and it
 * dominated the entire build. But the set of visible chromaticities is *convex*
 * (it is the convex hull of the spectrum locus, which is why the line of
 * purples is a straight chord), so for each x there is exactly one interval of
 * y inside it. Precomputing those intervals into bins turns the test into two
 * comparisons.
 */
class LocusMask {
  readonly #lo: Float64Array;
  readonly #hi: Float64Array;
  readonly #x0: number;
  readonly #x1: number;
  readonly #bins: number;

  constructor(points: Array<{ x: number; y: number }>, bins = 4096) {
    this.#bins = bins;
    this.#x0 = Math.min(...points.map((p) => p.x));
    this.#x1 = Math.max(...points.map((p) => p.x));
    this.#lo = new Float64Array(bins).fill(Infinity);
    this.#hi = new Float64Array(bins).fill(-Infinity);

    const span = this.#x1 - this.#x0 || 1;
    const binOf = (x: number) =>
      Math.min(bins - 1, Math.max(0, Math.floor(((x - this.#x0) / span) * bins)));

    // Walk the closed polygon, projecting each edge onto the bins it spans.
    for (let i = 0; i < points.length; i++) {
      const a = points[i]!;
      const b = points[(i + 1) % points.length]!;
      const [lo, hi] = a.x <= b.x ? [a, b] : [b, a];
      const first = binOf(lo.x);
      const last = binOf(hi.x);
      for (let k = first; k <= last; k++) {
        const x = this.#x0 + ((k + 0.5) / bins) * span;
        const t = hi.x === lo.x ? 0 : (Math.min(Math.max(x, lo.x), hi.x) - lo.x) / (hi.x - lo.x);
        const y = lo.y + (hi.y - lo.y) * t;
        if (y < this.#lo[k]!) this.#lo[k] = y;
        if (y > this.#hi[k]!) this.#hi[k] = y;
      }
    }
  }

  contains(x: number, y: number): boolean {
    if (x < this.#x0 || x > this.#x1) return false;
    const span = this.#x1 - this.#x0 || 1;
    const k = Math.min(this.#bins - 1, Math.max(0, Math.floor(((x - this.#x0) / span) * this.#bins)));
    return y >= this.#lo[k]! && y <= this.#hi[k]!;
  }
}

/**
 * Render the horseshoe interior as a raster layer sized to the plot area.
 * Returns the raster; the caller places it and draws the vector furniture.
 */
export function horseshoeRaster(plot: Plot, opts: HorseshoeOptions = {}): Raster {
  const {
    observer = cie1931(), space = sRGB, lightness = "max", luminance = 0.62,
    markOutOfGamut = true, outOfGamutChroma = 0.32, resolution = 3,
  } = opts;

  const locus = spectrumLocus(observer, 380, 700, 1);
  const mask = new LocusMask(locus);
  const boundary = gamutBoundary(space);
  const w = Math.round(plot.innerWidth * resolution);
  const h = Math.round(plot.innerHeight * resolution);
  const raster = new Raster(w, h);
  const inv = xyzToRgbMatrix(space);

  const [x0, x1] = plot.x.domain;
  const [y0, y1] = plot.y.domain;

  raster.fillAA((u, v) => {
    const x = x0 + u * (x1 - x0);
    const y = y1 - v * (y1 - y0);
    if (y <= 1e-6 || !mask.contains(x, y)) return null;

    const unit = mul(inv, xyToXyz(x, y, 1));
    const brightest = Math.max(unit[0], unit[1], unit[2]);

    if (Math.min(unit[0], unit[1], unit[2]) >= -1e-6 && brightest > 0) {
      // Reachable: show it at the brightest the display can manage.
      const scale = lightness === "max" ? 1 / brightest : luminance;
      const lin: Vec3 = [unit[0] * scale, unit[1] * scale, unit[2] * scale];
      return encode([
        Math.min(Math.max(lin[0], 0), 1),
        Math.min(Math.max(lin[1], 0), 1),
        Math.min(Math.max(lin[2], 0), 1),
      ], space);
    }

    // Unreachable by this display.
    //
    // The chroma has to be reduced relative to what the display can actually
    // show, not relative to the true colour's own chroma — which is unbounded
    // out here, so scaling that down still lands on something vivid. Clamp to
    // the gamut boundary first, then desaturate. The boundary comes from a
    // precomputed table rather than a per-pixel bisection.
    const xyz = xyToXyz(x, y, lightness === "max" ? 0.72 : luminance);
    if (!markOutOfGamut) return toGamut(xyz, space);
    const lch = xyzToOklch(xyz);
    const L = Math.min(0.97, lch[0] * 0.28 + 0.7);
    const C = Math.min(lch[1], boundary.at(L, lch[2])) * outOfGamutChroma;
    return oklchToSrgb([L, C, lch[2]], space);
  }, 2);

  return raster;
}

/** The spectrum locus and the line of purples, as a closed polyline. */
export const locusPolygon = (observer: Observer = cie1931(), from = 380, to = 700, step = 1) =>
  spectrumLocus(observer, from, to, step).map((p) => [p.x, p.y] as const);

/** Draw the locus outline, purple line, and wavelength ticks. */
export function drawLocus(
  plot: Plot,
  opts: { observer?: Observer; labels?: number[]; stroke?: string; tickLength?: number } = {},
): void {
  const {
    observer = cie1931(),
    labels = [460, 480, 490, 500, 520, 540, 560, 580, 600, 620, 700],
    stroke = theme.ink.primary,
    tickLength = 3.2,
  } = opts;

  const pts = locusPolygon(observer);
  plot.line([...pts] as Array<readonly [number, number]>, { stroke, width: theme.stroke.regular });
  // The line of purples closes the shape but is not a spectral colour: no
  // single wavelength lies on it, which is worth the dashed treatment.
  plot.line([pts.at(-1)!, pts[0]!] as Array<readonly [number, number]>, {
    stroke, width: theme.stroke.regular, dash: "2 1.6",
  });

  const locus = spectrumLocus(observer, 380, 700, 1);
  const at = (lambda: number) => locus.reduce((best, p) =>
    Math.abs(p.lambda - lambda) < Math.abs(best.lambda - lambda) ? p : best);

  for (const lambda of labels) {
    const p = at(lambda);
    const before = at(lambda - 4), after = at(lambda + 4);
    // Outward normal of the locus, so ticks and labels lean away from the curve.
    const dx = after.x - before.x, dy = after.y - before.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dy / len, ny = -dx / len;

    const [px, py] = plot.p(p.x, p.y);
    const sx = plot.p(p.x + nx * 0.01, p.y + ny * 0.01);
    const ux = sx[0] - px, uy = sx[1] - py;
    const ul = Math.hypot(ux, uy) || 1;

    plot.add({
      tag: "line",
      attrs: {
        x1: px, y1: py,
        x2: px + (ux / ul) * tickLength, y2: py + (uy / ul) * tickLength,
        stroke: theme.ink.secondary, "stroke-width": theme.stroke.hairline,
      },
      children: [],
    }, "over");

    plot.add({
      tag: "text",
      attrs: {
        x: px + (ux / ul) * (tickLength + 3.5),
        y: py + (uy / ul) * (tickLength + 3.5),
        "font-family": familyFor(String(lambda)),
        "font-size": theme.font.size.tiny,
        fill: theme.ink.secondary,
        "text-anchor": ux > 0.5 ? "start" : ux < -0.5 ? "end" : "middle",
        "dominant-baseline": "middle",
      },
      children: [String(lambda)],
    }, "over");
  }
}

/** Draw a colour space's gamut triangle, with optional primary dots. */
export function drawGamutTriangle(
  plot: Plot,
  space: RgbSpace,
  opts: { stroke?: string; width?: number; dash?: string; dots?: boolean; label?: string } = {},
): void {
  const { r, g, b } = space.primaries;
  const pts = [r, g, b, r].map((p) => [p.x, p.y] as const);
  plot.line([...pts], {
    stroke: opts.stroke ?? theme.ink.primary,
    width: opts.width ?? theme.stroke.regular,
    dash: opts.dash,
  });
  if (opts.dots) {
    plot.scatter([r, g, b].map((p) => [p.x, p.y] as const), {
      r: 1.6, fill: opts.stroke ?? theme.ink.primary,
    });
  }
}

/**
 * A swatch of a chromaticity for use in legends, shown at the brightest form
 * the display can produce. A fixed luminance turns every saturated hue into a
 * pastel, which is misleading in a legend that is claiming "this is the colour".
 */
export function chromaticityHex(x: number, y: number, _Y = 1, space: RgbSpace = sRGB): string {
  const unit = mul(xyzToRgbMatrix(space), xyToXyz(x, y, 1));
  const brightest = Math.max(unit[0], unit[1], unit[2]);
  if (brightest <= 0) return srgbToHex(toGamut(xyToXyz(x, y, 0.8), space));
  // Scale to full brightness, then clip. For a chromaticity just outside the
  // gamut — 1500 K is out by a few percent in blue — this gives the brightest
  // reproducible colour of nearly that chromaticity, which is what a legend
  // swatch should show. Gamut-mapping instead would desaturate it to a pastel
  // and misrepresent the thing being labelled.
  const k = 1 / brightest;
  return srgbToHex(encode([
    Math.min(Math.max(unit[0] * k, 0), 1),
    Math.min(Math.max(unit[1] * k, 0), 1),
    Math.min(Math.max(unit[2] * k, 0), 1),
  ], space));
}

