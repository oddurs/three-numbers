/**
 * Mixing, interpolation and compositing.
 *
 * The single highest-yield correction in this book: interpolating two colours
 * means interpolating *light*, and sRGB code values are not light. The same
 * gradient computed in three spaces is three different gradients, and only some
 * of them are defensible.
 */

import type { Vec3 } from "./math.ts";
import { clamp, lerp, wrapDeg } from "./math.ts";
import { decode, encode, rgbToXyzMatrix, sRGB, xyzToRgbMatrix, type RgbSpace } from "./rgbspace.ts";
import { mul } from "./math.ts";
import {
  fromPolar, oklabToXyz, toPolar, xyzToLab, labToXyz, xyzToOklab,
} from "./spaces.ts";
import { whitePoint } from "./illuminant.ts";
import { toGamut } from "./gamut.ts";

export type MixSpace = "srgb" | "linear" | "xyz" | "lab" | "lch" | "oklab" | "oklch";

/** How a cylindrical space should travel between two hues. */
export type HueStrategy = "shorter" | "longer" | "increasing" | "decreasing";

export function interpolateHue(h1: number, h2: number, t: number, how: HueStrategy = "shorter"): number {
  let a = wrapDeg(h1), b = wrapDeg(h2);
  let d = b - a;
  switch (how) {
    case "shorter": if (d > 180) d -= 360; else if (d < -180) d += 360; break;
    case "longer": if (Math.abs(d) < 180) d += d <= 0 ? 360 : -360; break;
    case "increasing": if (d < 0) d += 360; break;
    case "decreasing": if (d > 0) d -= 360; break;
  }
  return wrapDeg(a + d * t);
}

const W = whitePoint("D65");

/**
 * Mix two display-encoded colours at parameter `t`, in the named space.
 * The result is gamut-mapped back, because perceptual spaces will happily hand
 * you a colour your display cannot make.
 */
export function mix(
  c1: Vec3, c2: Vec3, tRaw: number,
  space: MixSpace = "oklab",
  rgbSpace: RgbSpace = sRGB,
  hue: HueStrategy = "shorter",
): Vec3 {
  // Extrapolating past the endpoints is never what a caller means, and in a
  // perceptual space it silently produces a colour outside every gamut, which
  // the gamut mapper then quietly turns back into the endpoint.
  const t = clamp(tRaw);
  const l1 = decode(c1, rgbSpace), l2 = decode(c2, rgbSpace);
  const M = rgbToXyzMatrix(rgbSpace), Minv = xyzToRgbMatrix(rgbSpace);
  const lin3 = (a: Vec3, b: Vec3): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  switch (space) {
    case "srgb":
      return lin3(c1, c2).map((v) => clamp(v)) as unknown as Vec3;
    case "linear":
      return encode(lin3(l1, l2).map((v) => clamp(v)) as unknown as Vec3, rgbSpace);
    case "xyz":
      return toGamut(lin3(mul(M, l1), mul(M, l2)), rgbSpace);
    case "lab":
      return toGamut(labToXyz(lin3(xyzToLab(mul(M, l1), W), xyzToLab(mul(M, l2), W)), W), rgbSpace);
    case "oklab":
      return toGamut(oklabToXyz(lin3(xyzToOklab(mul(M, l1)), xyzToOklab(mul(M, l2)))), rgbSpace);
    case "lch": {
      const p = toPolar(xyzToLab(mul(M, l1), W)), q = toPolar(xyzToLab(mul(M, l2), W));
      const r: Vec3 = [lerp(p[0], q[0], t), lerp(p[1], q[1], t), interpolateHue(p[2], q[2], t, hue)];
      return toGamut(labToXyz(fromPolar(r), W), rgbSpace);
    }
    case "oklch": {
      const p = toPolar(xyzToOklab(mul(M, l1))), q = toPolar(xyzToOklab(mul(M, l2)));
      const r: Vec3 = [lerp(p[0], q[0], t), lerp(p[1], q[1], t), interpolateHue(p[2], q[2], t, hue)];
      return toGamut(oklabToXyz(fromPolar(r)), rgbSpace);
    }
  }
}

/** Sample a two-stop ramp. The workhorse of half the figures in the book. */
export const ramp = (
  c1: Vec3, c2: Vec3, steps: number, space: MixSpace = "oklab",
  rgbSpace: RgbSpace = sRGB, hue: HueStrategy = "shorter",
): Vec3[] => {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError(`ramp length must be a positive integer, got ${steps}`);
  }
  return Array.from({ length: steps }, (_, i) =>
    mix(c1, c2, steps === 1 ? 0 : i / (steps - 1), space, rgbSpace, hue));
};

/** A multi-stop ramp with stops at arbitrary positions. */
export function gradient(
  stops: Array<{ at: number; color: Vec3 }>, t: number,
  space: MixSpace = "oklab", rgbSpace: RgbSpace = sRGB,
): Vec3 {
  if (stops.length === 0) throw new RangeError("a gradient needs at least one stop");
  const sorted = [...stops].sort((a, b) => a.at - b.at);
  if (t <= sorted[0]!.at) return sorted[0]!.color;
  if (t >= sorted.at(-1)!.at) return sorted.at(-1)!.color;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!, b = sorted[i + 1]!;
    if (t >= a.at && t <= b.at) {
      const local = (t - a.at) / (b.at - a.at);
      return mix(a.color, b.color, local, space, rgbSpace);
    }
  }
  return sorted.at(-1)!.color;
}

// --- Compositing ------------------------------------------------------------

/** Porter–Duff source-over, done in linear light with premultiplied alpha. */
export function over(
  src: Vec3, srcAlpha: number, dst: Vec3, dstAlpha = 1, rgbSpace: RgbSpace = sRGB,
): { color: Vec3; alpha: number } {
  const s = decode(src, rgbSpace), d = decode(dst, rgbSpace);
  const a = srcAlpha + dstAlpha * (1 - srcAlpha);
  if (a === 0) return { color: [0, 0, 0], alpha: 0 };
  const out = s.map((v, i) => (v * srcAlpha + d[i]! * dstAlpha * (1 - srcAlpha)) / a) as unknown as Vec3;
  return { color: encode(out, rgbSpace), alpha: a };
}

/** The separable blend modes, as specified by PDF and CSS. All in linear light. */
export const blendModes = {
  normal: (_b: number, s: number) => s,
  multiply: (b: number, s: number) => b * s,
  screen: (b: number, s: number) => b + s - b * s,
  overlay: (b: number, s: number) => (b <= 0.5 ? 2 * b * s : 1 - 2 * (1 - b) * (1 - s)),
  darken: (b: number, s: number) => Math.min(b, s),
  lighten: (b: number, s: number) => Math.max(b, s),
  difference: (b: number, s: number) => Math.abs(b - s),
  exclusion: (b: number, s: number) => b + s - 2 * b * s,
  hardLight: (b: number, s: number) => (s <= 0.5 ? 2 * b * s : 1 - 2 * (1 - b) * (1 - s)),
} as const;

export type BlendMode = keyof typeof blendModes;

export function blend(backdrop: Vec3, source: Vec3, mode: BlendMode, rgbSpace: RgbSpace = sRGB): Vec3 {
  const b = decode(backdrop, rgbSpace), s = decode(source, rgbSpace);
  const f = blendModes[mode];
  return encode([f(b[0], s[0]), f(b[1], s[1]), f(b[2], s[2])], rgbSpace);
}

// --- Contrast ---------------------------------------------------------------

/** WCAG 2.x contrast ratio. Widely mandated, and widely known to be wrong for dark themes. */
export function wcagContrast(a: Vec3, b: Vec3, rgbSpace: RgbSpace = sRGB): number {
  const lum = (c: Vec3) => mul(rgbToXyzMatrix(rgbSpace), decode(c, rgbSpace))[1];
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Difference in Oklab lightness — a blunt but honest alternative to WCAG 2. */
export const lightnessContrast = (a: Vec3, b: Vec3, rgbSpace: RgbSpace = sRGB): number =>
  Math.abs(
    xyzToOklab(mul(rgbToXyzMatrix(rgbSpace), decode(a, rgbSpace)))[0] -
    xyzToOklab(mul(rgbToXyzMatrix(rgbSpace), decode(b, rgbSpace)))[0],
  );
