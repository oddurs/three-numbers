/**
 * Palette extraction and generation.
 *
 * Two different problems that look alike: *reducing* a set of colours to k
 * representatives (a clustering problem, and the answer depends entirely on
 * which space you measure distance in), and *constructing* a set of k colours
 * that are maximally distinguishable (a packing problem).
 */

import type { Vec3 } from "./math.ts";
import { wrapDeg } from "./math.ts";
import { oklabToSrgb, srgbToOklab, srgbToOklch, oklchToSrgb } from "./spaces.ts";
import { deltaEOk } from "./difference.ts";
import { maxChroma } from "./gamut.ts";
import { sRGB, type RgbSpace } from "./rgbspace.ts";
import { simulateRgb, type CvdType } from "./cvd.ts";

/**
 * Median cut (Heckbert, 1980). Splits the colour box along its longest axis at
 * the median, recursively. Fast, deterministic, and biased in a characteristic
 * way that the figure in §14.2 makes visible.
 */
export function medianCut(colors: Vec3[], k: number): Vec3[] {
  if (!Number.isInteger(k) || k < 1) throw new RangeError(`palette size must be a positive integer, got ${k}`);
  if (colors.length === 0) return [];
  let boxes: Vec3[][] = [colors];
  while (boxes.length < k) {
    let bestIdx = -1, bestRange = -1, bestAxis = 0;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      for (let a = 0; a < 3; a++) {
        const vals = box.map((c) => c[a]!);
        const range = Math.max(...vals) - Math.min(...vals);
        if (range > bestRange) { bestRange = range; bestIdx = i; bestAxis = a; }
      }
    });
    if (bestIdx < 0) break;
    const box = [...boxes[bestIdx]!].sort((p, q) => p[bestAxis]! - q[bestAxis]!);
    const mid = box.length >> 1;
    boxes = boxes.flatMap((b, i) => (i === bestIdx ? [box.slice(0, mid), box.slice(mid)] : [b]));
  }
  return boxes.filter((b) => b.length > 0).map(mean);
}

const mean = (box: Vec3[]): Vec3 => {
  const s = box.reduce((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]] as Vec3, [0, 0, 0] as Vec3);
  return [s[0] / box.length, s[1] / box.length, s[2] / box.length];
};

/**
 * k-means, run in Oklab so that "nearest colour" means nearest *perceptually*.
 * Seeded with k-means++ and a fixed PRNG, so builds are reproducible.
 */
export function kMeansOklab(colors: Vec3[], k: number, iterations = 24, seed = 3): Vec3[] {
  if (!Number.isInteger(k) || k < 1) throw new RangeError(`palette size must be a positive integer, got ${k}`);
  if (colors.length === 0) return [];
  const pts = colors.map((c) => srgbToOklab(c));
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

  const centers: Vec3[] = [pts[Math.floor(rnd() * pts.length)]!];
  while (centers.length < Math.min(k, pts.length)) {
    const d2 = pts.map((p) => Math.min(...centers.map((c) => deltaEOk(p, c) ** 2)));
    const total = d2.reduce((a, b) => a + b, 0);
    let r = rnd() * total;
    let idx = 0;
    while (idx < d2.length - 1 && (r -= d2[idx]!) > 0) idx++;
    centers.push(pts[idx]!);
  }

  for (let it = 0; it < iterations; it++) {
    const buckets: Vec3[][] = centers.map(() => []);
    for (const p of pts) {
      let best = 0, bestD = Infinity;
      centers.forEach((c, i) => { const d = deltaEOk(p, c); if (d < bestD) { bestD = d; best = i; } });
      buckets[best]!.push(p);
    }
    buckets.forEach((b, i) => { if (b.length) centers[i] = mean(b); });
  }
  return centers.map((c) => oklabToSrgb(c));
}

/**
 * A categorical palette built by farthest-point sampling in Oklab.
 *
 * The constraint that matters: separation is measured as the *minimum* over
 * normal vision and every requested deficiency, so a pair that only survives
 * trichromacy is rejected. Dichromacy collapses the hue circle onto roughly one
 * axis, which is why `lightness` is a *range* rather than a value — beyond about
 * four entries, lightness is the only dimension left to separate them with, and
 * a palette that refuses to use it is a palette that will fail.
 */
export function categoricalPalette(opts: {
  count: number;
  /** A single lightness, or a range to sample across. */
  lightness?: number | [number, number];
  chromaFraction?: number;
  cvdSafeFor?: CvdType[];
  minSeparation?: number;
  space?: RgbSpace;
  hueOffset?: number;
  lightnessSteps?: number;
}): Vec3[] {
  const {
    count, lightness = [0.48, 0.82], chromaFraction = 0.85, cvdSafeFor = [],
    minSeparation = 0.08, space = sRGB, hueOffset = 25, lightnessSteps = 5,
  } = opts;
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`palette count must be a positive integer, got ${count}`);
  }

  const [lo, hi] = typeof lightness === "number" ? [lightness, lightness] : lightness;
  const levels = lo === hi
    ? [lo]
    : Array.from({ length: lightnessSteps }, (_, i) => lo + ((hi - lo) * i) / (lightnessSteps - 1));

  const candidates: Vec3[] = [];
  for (const L of levels) {
    for (let h = 0; h < 360; h += 2) {
      const hue = wrapDeg(h + hueOffset);
      const C = maxChroma(L, hue, space) * chromaFraction;
      candidates.push(oklchToSrgb([L, C, hue]));
    }
  }

  const cache = new Map<string, Vec3[]>();
  const variants = (c: Vec3): Vec3[] => {
    const key = c.join(",");
    let v = cache.get(key);
    if (!v) {
      v = [srgbToOklab(c), ...cvdSafeFor.map((t) => srgbToOklab(simulateRgb(c, t)))];
      cache.set(key, v);
    }
    return v;
  };

  const separation = (a: Vec3, b: Vec3): number => {
    const va = variants(a), vb = variants(b);
    let d = Infinity;
    for (let i = 0; i < va.length; i++) d = Math.min(d, deltaEOk(va[i]!, vb[i]!));
    return d;
  };

  const chosen: Vec3[] = [candidates[0]!];
  while (chosen.length < count) {
    let best: Vec3 | undefined, bestD = -1;
    for (const c of candidates) {
      let d = Infinity;
      for (const p of chosen) {
        d = Math.min(d, separation(p, c));
        if (d <= bestD) break;
      }
      if (d > bestD) { bestD = d; best = c; }
    }
    if (!best || bestD < minSeparation * 0.25) break;
    chosen.push(best);
  }
  return chosen;
}

/**
 * The worst-case separation a palette achieves, across normal vision and any
 * deficiencies given. The single number to judge a categorical palette by.
 */
export function paletteSeparation(palette: Vec3[], cvdTypes: CvdType[] = []): number {
  let min = Infinity;
  const views = [undefined, ...cvdTypes];
  for (const view of views) {
    const labs = palette.map((c) => srgbToOklab(view ? simulateRgb(c, view) : c));
    for (let i = 0; i < labs.length; i++)
      for (let j = i + 1; j < labs.length; j++)
        min = Math.min(min, deltaEOk(labs[i]!, labs[j]!));
  }
  return palette.length < 2 ? Infinity : min;
}

/**
 * A sequential ramp with monotone lightness and controlled chroma — the only
 * kind of ramp that survives being printed in greyscale.
 */
export function sequentialRamp(
  hue: number, steps: number, opts: { from?: number; to?: number; chromaFraction?: number; space?: RgbSpace } = {},
): Vec3[] {
  const { from = 0.98, to = 0.28, chromaFraction = 0.8, space = sRGB } = opts;
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError(`ramp length must be a positive integer, got ${steps}`);
  }
  return Array.from({ length: steps }, (_, i) => {
    const t = steps === 1 ? 0 : i / (steps - 1);
    const L = from + (to - from) * t;
    // Chroma peaks in the middle: pale at the light end, deep at the dark end.
    const bell = Math.sin(Math.PI * t) * 0.35 + 0.65;
    return oklchToSrgb([L, maxChroma(L, hue, space) * chromaFraction * bell, hue]);
  });
}

/** A diverging ramp: two sequential ramps meeting at a light neutral. */
export function divergingRamp(hueA: number, hueB: number, steps: number, space: RgbSpace = sRGB): Vec3[] {
  const half = Math.ceil(steps / 2);
  const left = sequentialRamp(hueA, half, { from: 0.35, to: 0.96, space });
  const right = sequentialRamp(hueB, half, { from: 0.96, to: 0.35, space });
  return steps % 2 === 0 ? [...left, ...right] : [...left, ...right.slice(1)];
}

/** Classical hue-wheel harmonies, computed in Oklch so lightness stays put. */
export function harmony(base: Vec3, kind: "complement" | "triad" | "tetrad" | "analogous" | "split"): Vec3[] {
  const [L, C, h] = srgbToOklch(base);
  const offsets =
    kind === "complement" ? [0, 180] :
    kind === "triad" ? [0, 120, 240] :
    kind === "tetrad" ? [0, 90, 180, 270] :
    kind === "analogous" ? [-30, 0, 30] : [0, 150, 210];
  return offsets.map((d) => oklchToSrgb([L, C, wrapDeg(h + d)]));
}

/** The smallest perceptual gap within a palette — one number to judge it by. */
export function minPairwiseDistance(palette: Vec3[], type?: CvdType): number {
  const labs = palette.map((c) => srgbToOklab(type ? simulateRgb(c, type) : c));
  let min = Infinity;
  for (let i = 0; i < labs.length; i++)
    for (let j = i + 1; j < labs.length; j++)
      min = Math.min(min, deltaEOk(labs[i]!, labs[j]!));
  return labs.length < 2 ? Infinity : min;
}
