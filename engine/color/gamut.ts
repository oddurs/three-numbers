/**
 * Gamut geometry and gamut mapping.
 *
 * A gamut is a solid, not a triangle: the triangle you see on a chromaticity
 * diagram is its shadow, and the shadow throws away the fact that a display
 * cannot make a bright saturated blue. Everything here works on the solid.
 */

import type { Vec3 } from "./math.ts";
import { clamp, mul } from "./math.ts";
import {
  sRGB, decode, encode, rgbToXyzMatrix, xyzToRgbMatrix, type RgbSpace,
} from "./rgbspace.ts";
import { fromPolar, oklabToXyz, toPolar, xyzToOklab } from "./spaces.ts";
import { deltaEOk } from "./difference.ts";

const EPS = 1e-7;

export const inGamut = (linear: Vec3, tol = EPS): boolean =>
  linear.every((c) => c >= -tol && c <= 1 + tol);

export const xyzInGamut = (xyz: Vec3, space: RgbSpace = sRGB, tol = EPS): boolean =>
  inGamut(mul(xyzToRgbMatrix(space), xyz), tol);

/** Naive per-channel clipping. Fast, and it shifts hue — the figure in §8.3 shows how much. */
export const clipLinear = (linear: Vec3): Vec3 =>
  [clamp(linear[0]), clamp(linear[1]), clamp(linear[2])];

/**
 * The CSS Color Module Level 4 gamut-mapping algorithm: hold lightness and hue
 * fixed in Oklch, binary-search chroma downwards, and accept the first value
 * whose clipped version is within ΔE_ok 0.02 of the unclipped one. It is a
 * remarkably good algorithm for how little it is.
 */
export function gamutMapOklch(
  oklch: Vec3,
  space: RgbSpace = sRGB,
  jnd = 0.02,
  iterations = 32,
): { oklch: Vec3; linear: Vec3; clipped: boolean } {
  const toLinear = (c: Vec3): Vec3 => mul(xyzToRgbMatrix(space), oklabToXyz(fromPolar(c)));

  const [L] = oklch;
  if (L >= 1) return { oklch: [1, 0, oklch[2]], linear: [1, 1, 1], clipped: true };
  if (L <= 0) return { oklch: [0, 0, oklch[2]], linear: [0, 0, 0], clipped: true };

  const direct = toLinear(oklch);
  if (inGamut(direct)) return { oklch, linear: direct, clipped: false };

  let lo = 0;
  let hi = oklch[1];
  let current: Vec3 = [...oklch] as unknown as Vec3;
  for (let i = 0; i < iterations && hi - lo > 1e-5; i++) {
    const mid = (lo + hi) / 2;
    current = [L, mid, oklch[2]];
    const lin = toLinear(current);
    if (inGamut(lin)) { lo = mid; continue; }
    const clippedLab = xyzToOklab(mul(rgbToXyzMatrix(space), clipLinear(lin)));
    if (deltaEOk(clippedLab, xyzToOklab(oklabToXyz(fromPolar(current)))) < jnd) { lo = mid; break; }
    hi = mid;
  }
  const result: Vec3 = [L, lo, oklch[2]];
  return { oklch: result, linear: clipLinear(toLinear(result)), clipped: true };
}

/** Gamut-map an out-of-range XYZ into `space`, returning display-encoded RGB. */
export function toGamut(xyz: Vec3, space: RgbSpace = sRGB): Vec3 {
  const lin = mul(xyzToRgbMatrix(space), xyz);
  if (inGamut(lin)) return encode(lin, space);
  return encode(gamutMapOklch(toPolar(xyzToOklab(xyz)), space).linear, space);
}

/**
 * Maximum in-gamut chroma at a given Oklab lightness and hue: the *cusp-free*
 * boundary search that generates every gamut-slice figure in the book.
 */
export function maxChroma(L: number, hueDeg: number, space: RgbSpace = sRGB, iterations = 40): number {
  let lo = 0, hi = 0.5;
  const ok = (C: number): boolean =>
    inGamut(mul(xyzToRgbMatrix(space), oklabToXyz(fromPolar([L, C, hueDeg]))));
  if (!ok(0)) return 0;
  while (ok(hi) && hi < 4) hi *= 2;
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) lo = mid; else hi = mid;
  }
  return lo;
}

/** The (L, C) outline of a constant-hue slice through a gamut solid. */
export function hueSliceBoundary(
  hueDeg: number, space: RgbSpace = sRGB, steps = 128,
): Array<{ L: number; C: number }> {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const L = i / steps;
    return { L, C: maxChroma(L, hueDeg, space) };
  });
}

/** The cusp: the most saturated colour of a given hue, and where clipping hurts most. */
export function hueCusp(hueDeg: number, space: RgbSpace = sRGB, steps = 256): { L: number; C: number } {
  let best = { L: 0, C: 0 };
  for (let i = 0; i <= steps; i++) {
    const L = i / steps;
    const C = maxChroma(L, hueDeg, space);
    if (C > best.C) best = { L, C };
  }
  return best;
}

/** The gamut triangle in xy — the shadow, plotted honestly as a shadow. */
export function gamutTriangleXy(space: RgbSpace = sRGB): Array<{ x: number; y: number }> {
  const { r, g, b } = space.primaries;
  return [r, g, b, r].map((p) => ({ x: p.x, y: p.y }));
}

/**
 * Volume of the gamut solid in Oklab, by Monte Carlo. A single number that
 * makes "Rec.2020 is bigger than sRGB" quantitative instead of rhetorical.
 */
export function gamutVolumeOklab(space: RgbSpace = sRGB, samples = 200_000, seed = 1): number {
  // A deterministic LCG keeps figures byte-identical across builds.
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const M = rgbToXyzMatrix(space);
  let minL = Infinity, maxL = -Infinity, minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
  const pts: Vec3[] = [];
  for (let i = 0; i < Math.min(samples, 20000); i++) {
    const lab = xyzToOklab(mul(M, [rnd(), rnd(), rnd()]));
    pts.push(lab);
    minL = Math.min(minL, lab[0]); maxL = Math.max(maxL, lab[0]);
    minA = Math.min(minA, lab[1]); maxA = Math.max(maxA, lab[1]);
    minB = Math.min(minB, lab[2]); maxB = Math.max(maxB, lab[2]);
  }
  const boxVol = (maxL - minL) * (maxA - minA) * (maxB - minB);
  const inv = xyzToRgbMatrix(space);
  let hits = 0;
  for (let i = 0; i < samples; i++) {
    const lab: Vec3 = [
      minL + rnd() * (maxL - minL),
      minA + rnd() * (maxA - minA),
      minB + rnd() * (maxB - minB),
    ];
    if (inGamut(mul(inv, oklabToXyz(lab)), 0)) hits++;
  }
  return (hits / samples) * boxVol;
}

export { decode, encode };

/**
 * A precomputed table of the gamut boundary: maximum in-gamut chroma as a
 * function of lightness and hue.
 *
 * `maxChroma` costs a forty-iteration bisection, which is fine for a handful of
 * queries and ruinous when a figure needs one per pixel — the chromaticity
 * diagram alone was spending three seconds of every build inside it. The
 * boundary is a mostly-smooth surface, so sampling it once and interpolating is
 * far cheaper.
 *
 * It is an *approximation*. At the default resolution it is within about 0.013
 * of chroma, and the error concentrates at the cusp, where the boundary has a
 * crease that bilinear interpolation rounds off. That is below a just-noticeable
 * difference, and fine for deciding how far to desaturate a region of a diagram.
 * It is not the right tool for mapping a specific colour a reader will compare
 * against something else: use `gamutMapOklch` for that, or build a finer table.
 */
export class GamutBoundary {
  readonly #table: Float64Array;
  readonly #lSteps: number;
  readonly #hSteps: number;
  readonly space: RgbSpace;

  constructor(space: RgbSpace = sRGB, lSteps = 65, hSteps = 256) {
    if (lSteps < 2 || hSteps < 2) throw new RangeError("gamut table needs at least 2 steps per axis");
    this.space = space;
    this.#lSteps = lSteps;
    this.#hSteps = hSteps;
    this.#table = new Float64Array(lSteps * hSteps);
    for (let i = 0; i < lSteps; i++) {
      const L = i / (lSteps - 1);
      for (let j = 0; j < hSteps; j++) {
        this.#table[i * hSteps + j] = maxChroma(L, (j / hSteps) * 360, space);
      }
    }
  }

  /** Bilinear lookup. Hue wraps; lightness clamps. */
  at(L: number, hueDeg: number): number {
    const li = Math.min(Math.max(L, 0), 1) * (this.#lSteps - 1);
    const i0 = Math.floor(li);
    const i1 = Math.min(i0 + 1, this.#lSteps - 1);
    const lf = li - i0;

    const h = ((hueDeg % 360) + 360) % 360;
    const hj = (h / 360) * this.#hSteps;
    const j0 = Math.floor(hj) % this.#hSteps;
    const j1 = (j0 + 1) % this.#hSteps;
    const hf = hj - Math.floor(hj);

    const a = this.#table[i0 * this.#hSteps + j0]!;
    const b = this.#table[i0 * this.#hSteps + j1]!;
    const c = this.#table[i1 * this.#hSteps + j0]!;
    const d = this.#table[i1 * this.#hSteps + j1]!;
    return (a * (1 - hf) + b * hf) * (1 - lf) + (c * (1 - hf) + d * hf) * lf;
  }

  /**
   * Clamp an Oklch colour to the boundary, holding lightness and hue.
   * Approximate — see the note on the class.
   */
  clampChroma(oklch: Vec3): Vec3 {
    return [oklch[0], Math.min(oklch[1], this.at(oklch[0], oklch[2])), oklch[2]];
  }
}

const boundaryCache = new Map<string, GamutBoundary>();

/** A shared, lazily-built boundary table per colour space. */
export function gamutBoundary(space: RgbSpace = sRGB): GamutBoundary {
  let b = boundaryCache.get(space.id);
  if (!b) { b = new GamutBoundary(space); boundaryCache.set(space.id, b); }
  return b;
}
