/**
 * Illuminants: the light you are actually looking at, plus the white points
 * that every appearance-based space is anchored to.
 */

import { loadSingle } from "./data.ts";
import type { Spectrum } from "./spectrum.ts";
import { blackbody, flat, normalizeAt } from "./spectrum.ts";
import type { Vec3 } from "./math.ts";
import { cie1931, xyzFromSpd, type Observer } from "./observer.ts";

let _d65: Spectrum | undefined;
let _a: Spectrum | undefined;

/** CIE D65 — average north-sky daylight, and the white of sRGB. */
export const spdD65 = (): Spectrum => (_d65 ??= loadSingle("Illuminantd65.csv", "D65"));

/** CIE A — a 2856 K tungsten filament, i.e. a Planckian radiator. */
export const spdA = (): Spectrum => (_a ??= loadSingle("IlluminantA.csv", "A"));

/** CIE E — the equal-energy illuminant; physically absurd, mathematically clean. */
export const spdE = (): Spectrum => normalizeAt(flat(1), 560, 100);

/**
 * CIE daylight chromaticity locus, 4000–25000 K. A cubic in 1/T fitted to
 * measured daylight, which is *not* the Planckian locus — real daylight sits
 * slightly above it.
 */
export function daylightChromaticity(T: number): { x: number; y: number } {
  if (T < 4000 || T > 25000) throw new RangeError("daylight locus is defined for 4000–25000 K");
  const t = 1e3 / T;
  const x =
    T <= 7000
      ? 0.244063 + 0.09911 * t + 2.9678 * t * t - 4.607 * t * t * t
      : 0.23704 + 0.24748 * t + 1.9018 * t * t - 2.0064 * t * t * t;
  const y = -3.0 * x * x + 2.87 * x - 0.275;
  return { x, y };
}

/** Planckian (black-body) locus in CIE 1931 chromaticity. */
export function planckianChromaticity(T: number, obs: Observer = cie1931()): { x: number; y: number } {
  if (!(T > 0)) throw new RangeError(`black-body temperature must be positive, got ${T} K`);
  const [X, Y, Z] = xyzFromSpd(blackbody(T, 360, 830, 1), obs);
  const s = X + Y + Z;
  return { x: X / s, y: Y / s };
}

/**
 * Canonical white points, as published (xy chromaticity). These are the rounded
 * values the standards actually specify — deriving them from the SPDs gives
 * answers that differ in the fourth decimal, which is itself a good sidebar.
 */
export const whitePointsXy = {
  A: { x: 0.44757, y: 0.40745, note: "tungsten, 2856 K" },
  C: { x: 0.31006, y: 0.31616, note: "obsolete average daylight" },
  D50: { x: 0.3457, y: 0.3585, note: "print / ICC profile connection space" },
  D55: { x: 0.33242, y: 0.34743, note: "mid-morning daylight" },
  D65: { x: 0.3127, y: 0.329, note: "sRGB, Rec.709, Display P3" },
  D75: { x: 0.29902, y: 0.31485, note: "north sky daylight" },
  E: { x: 1 / 3, y: 1 / 3, note: "equal energy" },
  DCI: { x: 0.314, y: 0.351, note: "DCI-P3 projector white" },
  ACES: { x: 0.32168, y: 0.33767, note: "ACES ~D60" },
} as const;

export type WhitePointName = keyof typeof whitePointsXy;

/** Convert an xy chromaticity to a tristimulus vector normalised to Y = 1. */
export function xyToXyz(x: number, y: number, Y = 1): Vec3 {
  return [(x * Y) / y, Y, ((1 - x - y) * Y) / y];
}

export const whitePoint = (name: WhitePointName): Vec3 => {
  const { x, y } = whitePointsXy[name];
  return xyToXyz(x, y, 1);
};

/** White point computed from the measured SPD rather than the rounded table. */
export function whitePointFromSpd(spd: Spectrum, obs: Observer = cie1931()): Vec3 {
  const [X, Y, Z] = xyzFromSpd(spd, obs);
  return [X / Y, 1, Z / Y];
}

/**
 * Correlated colour temperature by McCamy's cubic approximation. Fast, good to
 * about ±2 K over 2856–6500 K, and a nice example of a closed-form fit standing
 * in for a minimisation over the Planckian locus.
 */
export function cctMcCamy(x: number, y: number): number {
  // The fit has a pole at y = 0.1858, which is the epicentre the cubic is
  // expressed around. Nothing sensible can be returned there.
  if (Math.abs(y - 0.1858) < 1e-9) {
    throw new RangeError("McCamy's approximation is singular at y = 0.1858");
  }
  const n = (x - 0.332) / (0.1858 - y);
  return 449 * n ** 3 + 3525 * n ** 2 + 6823.3 * n + 5520.33;
}
