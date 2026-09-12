/**
 * Standard colorimetric observers: the three-channel projection that turns an
 * infinite-dimensional spectrum into a 3-vector, and with it every collapse and
 * coincidence the rest of the book is about.
 */

import { loadTriple } from "./data.ts";
import type { Spectrum } from "./spectrum.ts";
import { at, end, multiply, integrate, wavelengths } from "./spectrum.ts";
import type { Vec3 } from "./math.ts";

export interface Observer {
  readonly id: string;
  readonly name: string;
  /** x̄, ȳ, z̄ colour-matching functions on a shared grid. */
  readonly xbar: Spectrum;
  readonly ybar: Spectrum;
  readonly zbar: Spectrum;
}

function makeObserver(id: string, name: string, file: string): Observer {
  const [xbar, ybar, zbar] = loadTriple(file, ["x̄", "ȳ", "z̄"]);
  return { id, name, xbar, ybar, zbar };
}

let _cie1931: Observer | undefined;
let _cie1964: Observer | undefined;
let _juddVos: Observer | undefined;

/** CIE 1931 2° standard observer — the one every screen you own is calibrated against. */
export const cie1931 = (): Observer =>
  (_cie1931 ??= makeObserver("cie1931", "CIE 1931 2° standard observer", "ciexyz31.csv"));

/** CIE 1964 10° supplementary observer — better for large fields. */
export const cie1964 = (): Observer =>
  (_cie1964 ??= makeObserver("cie1964", "CIE 1964 10° supplementary observer", "ciexyz64.csv"));

/** Judd–Vos corrected 2° observer — fixes 1931's known blue deficiency. */
export const juddVos = (): Observer =>
  (_juddVos ??= makeObserver("juddvos", "Judd–Vos modified 2° observer", "ciexyzjv.csv"));

export const observers = (): Observer[] => [cie1931(), cie1964(), juddVos()];

export const observerRange = (o: Observer): [number, number] => [o.xbar.start, end(o.xbar)];

/**
 * Tristimulus values of a light source, in the SPD's own units.
 * This is the inner product in equation (2.1): X = ∫ Φ(λ) x̄(λ) dλ.
 */
export function xyzFromSpd(spd: Spectrum, obs: Observer = cie1931()): Vec3 {
  const grid = obs.xbar;
  let X = 0, Y = 0, Z = 0;
  for (let i = 0; i < grid.values.length; i++) {
    const lambda = grid.start + i * grid.step;
    const phi = at(spd, lambda);
    X += phi * grid.values[i]!;
    Y += phi * obs.ybar.values[i]!;
    Z += phi * obs.zbar.values[i]!;
  }
  const dl = grid.step;
  return [X * dl, Y * dl, Z * dl];
}

/**
 * Tristimulus values of a *reflecting surface* under an illuminant, normalised
 * so that a perfect diffuser gives Y = 100. This is the definition that makes
 * "the colour of an object" meaningful at all.
 */
export function xyzFromReflectance(
  reflectance: Spectrum,
  illuminant: Spectrum,
  obs: Observer = cie1931(),
): Vec3 {
  const grid = obs.xbar;
  let X = 0, Y = 0, Z = 0, k = 0;
  for (let i = 0; i < grid.values.length; i++) {
    const lambda = grid.start + i * grid.step;
    const s = at(illuminant, lambda);
    const r = at(reflectance, lambda);
    const ybar = obs.ybar.values[i]!;
    k += s * ybar;
    X += s * r * grid.values[i]!;
    Y += s * r * ybar;
    Z += s * r * obs.zbar.values[i]!;
  }
  const n = 100 / k;
  return [X * n, Y * n, Z * n];
}

/** Tristimulus values of the spectrum locus at a single wavelength. */
export function xyzOfWavelength(lambda: number, obs: Observer = cie1931()): Vec3 {
  return [at(obs.xbar, lambda), at(obs.ybar, lambda), at(obs.zbar, lambda)];
}

/**
 * The spectrum locus as a polyline in chromaticity space: the curved boundary
 * of everything a human eye can be shown.
 */
export function spectrumLocus(
  obs: Observer = cie1931(),
  from = 360,
  to = 830,
  step = 1,
): Array<{ lambda: number; x: number; y: number }> {
  const pts: Array<{ lambda: number; x: number; y: number }> = [];
  for (let l = from; l <= to + 1e-9; l += step) {
    const [X, Y, Z] = xyzOfWavelength(l, obs);
    const sum = X + Y + Z;
    if (sum <= 0) continue;
    pts.push({ lambda: l, x: X / sum, y: Y / sum });
  }
  return pts;
}

/** Luminous efficiency V(λ) is exactly ȳ — a fact worth a paragraph. */
export const luminousEfficiency = (obs: Observer = cie1931()): Spectrum => obs.ybar;

/** Integral of each CMF, useful for showing why ȳ is normalised the way it is. */
export const cmfIntegrals = (obs: Observer): Vec3 => [
  integrate(obs.xbar), integrate(obs.ybar), integrate(obs.zbar),
];

export { multiply, wavelengths };
