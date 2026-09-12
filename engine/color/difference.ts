/**
 * Colour-difference metrics.
 *
 * The recurring joke of this subject is that CIELAB was designed so that
 * Euclidean distance would measure perceived difference, and then four
 * successive committees had to publish increasingly baroque corrections to the
 * Euclidean distance. `deltaE2000` is the current state of that apology.
 */

import type { Vec3 } from "./math.ts";
import { deg, rad, wrapDeg } from "./math.ts";
import { srgbToOklab, toPolar, xyzToIctcp } from "./spaces.ts";

const P25_7 = Math.pow(25, 7);

/** CIE76: plain Euclidean distance in CIELAB. */
export const deltaE76 = (a: Vec3, b: Vec3): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export interface De94Weights { kL: number; K1: number; K2: number }
export const DE94_GRAPHIC: De94Weights = { kL: 1, K1: 0.045, K2: 0.015 };
export const DE94_TEXTILE: De94Weights = { kL: 2, K1: 0.048, K2: 0.014 };

/** CIE94: the first attempt to bend the metric around chroma. */
export function deltaE94(a: Vec3, b: Vec3, w: De94Weights = DE94_GRAPHIC): number {
  const C1 = Math.hypot(a[1], a[2]);
  const C2 = Math.hypot(b[1], b[2]);
  const dL = a[0] - b[0];
  const dC = C1 - C2;
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  const dH2 = Math.max(da * da + db * db - dC * dC, 0);
  const SL = 1, SC = 1 + w.K1 * C1, SH = 1 + w.K2 * C1;
  return Math.hypot(dL / (w.kL * SL), dC / SC, Math.sqrt(dH2) / SH);
}

/**
 * CIEDE2000, in full. Five corrections stacked on CIE76:
 * a chroma-dependent rescaling of a*, lightness/chroma/hue weightings, and a
 * rotation term that exists solely to fix the blue region.
 */
export function deltaE2000(lab1: Vec3, lab2: Vec3, kL = 1, kC = 1, kH = 1): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const C1ab = Math.hypot(a1, b1);
  const C2ab = Math.hypot(a2, b2);
  const Cbar = (C1ab + C2ab) / 2;
  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + P25_7)));

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = a1p === 0 && b1 === 0 ? 0 : wrapDeg(deg(Math.atan2(b1, a1p)));
  const h2p = a2p === 0 && b2 === 0 ? 0 : wrapDeg(deg(Math.atan2(b2, a2p)));

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp: number;
  if (C1p * C2p === 0) dhp = 0;
  else if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
  else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
  else dhp = h2p - h1p + 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp) / 2);

  const Lbar = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbar: number;
  if (C1p * C2p === 0) hbar = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbar = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) hbar = (h1p + h2p + 360) / 2;
  else hbar = (h1p + h2p - 360) / 2;

  const T =
    1 - 0.17 * Math.cos(rad(hbar - 30)) + 0.24 * Math.cos(rad(2 * hbar)) +
    0.32 * Math.cos(rad(3 * hbar + 6)) - 0.2 * Math.cos(rad(4 * hbar - 63));

  const dTheta = 30 * Math.exp(-(((hbar - 275) / 25) ** 2));
  const Cbarp7 = Math.pow(Cbarp, 7);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + P25_7));
  const SL = 1 + (0.015 * (Lbar - 50) ** 2) / Math.sqrt(20 + (Lbar - 50) ** 2);
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;
  const RT = -Math.sin(rad(2 * dTheta)) * RC;

  const tL = dLp / (kL * SL);
  const tC = dCp / (kC * SC);
  const tH = dHp / (kH * SH);
  return Math.sqrt(tL * tL + tC * tC + tH * tH + RT * tC * tH);
}

/** CMC l:c — the textile industry's answer, still in use in BS and ISO standards. */
export function deltaECmc(lab1: Vec3, lab2: Vec3, l = 2, c = 1): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const dL = L1 - L2, dC = C1 - C2;
  const dH2 = Math.max((a1 - a2) ** 2 + (b1 - b2) ** 2 - dC * dC, 0);
  const h1 = wrapDeg(deg(Math.atan2(b1, a1)));
  const SL = L1 < 16 ? 0.511 : (0.040975 * L1) / (1 + 0.01765 * L1);
  const SC = (0.0638 * C1) / (1 + 0.0131 * C1) + 0.638;
  const F = Math.sqrt(C1 ** 4 / (C1 ** 4 + 1900));
  const T = h1 >= 164 && h1 <= 345
    ? 0.56 + Math.abs(0.2 * Math.cos(rad(h1 + 168)))
    : 0.36 + Math.abs(0.4 * Math.cos(rad(h1 + 35)));
  const SH = SC * (F * T + 1 - F);
  return Math.hypot(dL / (l * SL), dC / (c * SC), Math.sqrt(dH2) / SH);
}

/** Euclidean distance in Oklab: uniform enough that no correction terms are needed. */
export const deltaEOk = (a: Vec3, b: Vec3): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export const deltaEOkSrgb = (a: Vec3, b: Vec3): number =>
  deltaEOk(srgbToOklab(a), srgbToOklab(b));

/**
 * ΔE_ITP (ITU-R BT.2124) for HDR. The 720 is a scale factor chosen so that
 * 1.0 is roughly one just-noticeable difference, matching ΔE2000's convention.
 */
export function deltaEItp(xyz1: Vec3, xyz2: Vec3): number {
  const a = xyzToIctcp(xyz1);
  const b = xyzToIctcp(xyz2);
  return 720 * Math.hypot(a[0] - b[0], 0.5 * (a[1] - b[1]), a[2] - b[2]);
}

/** Hue difference in a polar opponent space, taking the short way round. */
export function hueDifference(lab1: Vec3, lab2: Vec3): number {
  const h1 = toPolar(lab1)[2];
  const h2 = toPolar(lab2)[2];
  const d = wrapDeg(h2 - h1);
  return d > 180 ? d - 360 : d;
}
