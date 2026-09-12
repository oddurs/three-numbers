/**
 * Chromatic adaptation.
 *
 * Moving a colour from one illuminant to another is not a colour conversion —
 * it is a model of what your visual system does when you walk from daylight
 * into a tungsten-lit room. Every method here is the same three-step shape:
 * rotate into a cone-ish basis, scale each channel by the ratio of whites,
 * rotate back. The methods differ only in the basis.
 */

import type { Mat3, Vec3 } from "./math.ts";
import { diag, inverse, matmul, mul } from "./math.ts";
import { whitePoint, type WhitePointName } from "./illuminant.ts";

export interface CatMethod {
  readonly id: string;
  readonly name: string;
  /** XYZ -> the adaptation basis. */
  readonly M: Mat3;
  readonly note: string;
}

/** The identity: scale XYZ directly. Crude, and a useful baseline to plot against. */
export const xyzScaling: CatMethod = {
  id: "xyz-scaling", name: "XYZ scaling",
  M: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  note: "No cone basis at all. Included to show how much the basis matters.",
};

/** Hunt–Pointer–Estévez, normalised to equal energy: an actual cone estimate. */
export const vonKries: CatMethod = {
  id: "von-kries", name: "von Kries (HPE)",
  M: [
    [0.40024, 0.7076, -0.08081],
    [-0.2263, 1.16532, 0.0457],
    [0.0, 0.0, 0.91822],
  ],
  note: "Hunt–Pointer–Estévez cone fundamentals; the historical original.",
};

/** Bradford: a "sharpened" basis fitted to corresponding-colour data. */
export const bradford: CatMethod = {
  id: "bradford", name: "Bradford",
  M: [
    [0.8951, 0.2664, -0.1614],
    [-0.7502, 1.7135, 0.0367],
    [0.0389, -0.0685, 1.0296],
  ],
  note: "Sharpened beyond physiology to improve prediction. What ICC profiles use.",
};

/** CAT02, from CIECAM02. The current default for appearance work. */
export const cat02: CatMethod = {
  id: "cat02", name: "CAT02",
  M: [
    [0.7328, 0.4296, -0.1624],
    [-0.7036, 1.6975, 0.0061],
    [0.003, 0.0136, 0.9834],
  ],
  note: "CIECAM02's transform; can produce negative cone responses for saturated blues.",
};

/** CAT16, CAT02's replacement, tamed to stay non-negative. */
export const cat16: CatMethod = {
  id: "cat16", name: "CAT16",
  M: [
    [0.401288, 0.650173, -0.051461],
    [-0.250268, 1.204414, 0.045854],
    [-0.002079, 0.048952, 0.953127],
  ],
  note: "CAM16's transform; fixes CAT02's negative-response problem.",
};

export const catMethods: CatMethod[] = [xyzScaling, vonKries, bradford, cat02, cat16];

/** Build the 3x3 that carries XYZ under `source` white to XYZ under `dest` white. */
export function adaptationMatrix(source: Vec3, dest: Vec3, method: CatMethod = bradford): Mat3 {
  const s = mul(method.M, source);
  const d = mul(method.M, dest);
  const gain = diag([d[0] / s[0], d[1] / s[1], d[2] / s[2]]);
  return matmul(inverse(method.M), matmul(gain, method.M));
}

export const adapt = (xyz: Vec3, source: Vec3, dest: Vec3, method: CatMethod = bradford): Vec3 =>
  mul(adaptationMatrix(source, dest, method), xyz);

export const adaptNamed = (
  xyz: Vec3, from: WhitePointName, to: WhitePointName, method: CatMethod = bradford,
): Vec3 => adapt(xyz, whitePoint(from), whitePoint(to), method);

/** The von Kries gain factors themselves — the quantity Chapter 9 plots. */
export function coneGains(source: Vec3, dest: Vec3, method: CatMethod = bradford): Vec3 {
  const s = mul(method.M, source);
  const d = mul(method.M, dest);
  return [d[0] / s[0], d[1] / s[1], d[2] / s[2]];
}
