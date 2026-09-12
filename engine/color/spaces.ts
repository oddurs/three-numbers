/**
 * Colour appearance and colour-difference spaces.
 *
 * Three genuinely different kinds of thing live in this file, and the book
 * insists on the distinction:
 *
 *  1. `Lab` / `Luv` / `Oklab` are attempts at a *perceptually uniform* metric
 *     space — Euclidean distance is meant to mean something.
 *  2. `ICtCp` is an HDR transmission space derived from cone responses.
 *  3. `HSL` / `HSV` / `HWB` are cylindrical re-parameterisations of the
 *     gamma-encoded RGB cube. They have no perceptual content whatsoever, and
 *     Chapter 7 is largely about what goes wrong when you pretend otherwise.
 */

import type { Mat3, Vec3 } from "./math.ts";
import { deg, mul, rad, spow, wrapDeg } from "./math.ts";
import { whitePoint, type WhitePointName } from "./illuminant.ts";
import { rec2020, rgbToXyzMatrix, xyzToRgbMatrix, sRGB, encode, decode, type RgbSpace } from "./rgbspace.ts";
import { pqTransfer } from "./transfer.ts";
import { inverse, matmul } from "./math.ts";

// --- CIELAB -----------------------------------------------------------------

/** The CIE's own rational constants: ε = 216/24389, κ = 24389/27. */
export const LAB_EPSILON = 216 / 24389;
export const LAB_KAPPA = 24389 / 27;

const labF = (t: number): number =>
  t > LAB_EPSILON ? Math.cbrt(t) : (LAB_KAPPA * t + 16) / 116;

const labFInv = (t: number): number => {
  const t3 = t * t * t;
  return t3 > LAB_EPSILON ? t3 : (116 * t - 16) / LAB_KAPPA;
};

/** Lab and Luv divide by the white point, so a zero component is not usable. */
function assertWhite(white: Vec3): void {
  if (!(white[0] > 0 && white[1] > 0 && white[2] > 0)) {
    throw new RangeError(`white point must be positive in all components, got [${white.join(", ")}]`);
  }
}

export function xyzToLab(xyz: Vec3, white: Vec3 = whitePoint("D65")): Vec3 {
  assertWhite(white);
  const fx = labF(xyz[0] / white[0]);
  const fy = labF(xyz[1] / white[1]);
  const fz = labF(xyz[2] / white[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function labToXyz(lab: Vec3, white: Vec3 = whitePoint("D65")): Vec3 {
  assertWhite(white);
  const fy = (lab[0] + 16) / 116;
  const fx = fy + lab[1] / 500;
  const fz = fy - lab[2] / 200;
  return [labFInv(fx) * white[0], labFInv(fy) * white[1], labFInv(fz) * white[2]];
}

// --- CIELUV -----------------------------------------------------------------

/** The u'v' uniform chromaticity scale — a projective map of xy, nothing more. */
export function xyzToUv(xyz: Vec3): [number, number] {
  const d = xyz[0] + 15 * xyz[1] + 3 * xyz[2];
  if (d === 0) return [0, 0];
  return [(4 * xyz[0]) / d, (9 * xyz[1]) / d];
}

export function xyToUv(x: number, y: number): [number, number] {
  const d = -2 * x + 12 * y + 3;
  return [(4 * x) / d, (9 * y) / d];
}

export function uvToXy(u: number, v: number): [number, number] {
  const d = 6 * u - 16 * v + 12;
  return [(9 * u) / d, (4 * v) / d];
}

export function xyzToLuv(xyz: Vec3, white: Vec3 = whitePoint("D65")): Vec3 {
  assertWhite(white);
  const [u, v] = xyzToUv(xyz);
  const [un, vn] = xyzToUv(white);
  const yr = xyz[1] / white[1];
  const L = yr > LAB_EPSILON ? 116 * Math.cbrt(yr) - 16 : LAB_KAPPA * yr;
  return [L, 13 * L * (u - un), 13 * L * (v - vn)];
}

export function luvToXyz(luv: Vec3, white: Vec3 = whitePoint("D65")): Vec3 {
  assertWhite(white);
  const [L, U, V] = luv;
  if (L === 0) return [0, 0, 0];
  const [un, vn] = xyzToUv(white);
  const u = U / (13 * L) + un;
  const v = V / (13 * L) + vn;
  const Y = L > 8 ? white[1] * ((L + 16) / 116) ** 3 : white[1] * (L / LAB_KAPPA);
  const X = Y * ((9 * u) / (4 * v));
  const Z = Y * ((12 - 3 * u - 20 * v) / (4 * v));
  return [X, Y, Z];
}

// --- Oklab (Björn Ottosson, 2020) -------------------------------------------

/** XYZ(D65) -> a cone-like LMS basis, fitted rather than physiological. */
const OKLAB_M1: Mat3 = [
  [0.8189330101, 0.3618667424, -0.1288597137],
  [0.0329845436, 0.9293118715, 0.0361456387],
  [0.0482003018, 0.2643662691, 0.6338517070],
];
/** Cube-rooted LMS -> the opponent axes. */
const OKLAB_M2: Mat3 = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
];
const OKLAB_M1_INV = inverse(OKLAB_M1);
const OKLAB_M2_INV = inverse(OKLAB_M2);

export function xyzToOklab(xyz: Vec3): Vec3 {
  const lms = mul(OKLAB_M1, xyz);
  return mul(OKLAB_M2, [Math.cbrt(lms[0]), Math.cbrt(lms[1]), Math.cbrt(lms[2])]);
}

export function oklabToXyz(lab: Vec3): Vec3 {
  const l = mul(OKLAB_M2_INV, lab);
  return mul(OKLAB_M1_INV, [l[0] ** 3, l[1] ** 3, l[2] ** 3]);
}

/** The fused matrix Ottosson publishes for linear sRGB, kept for the figure that compares them. */
export const oklabFromLinearSrgbMatrix = (): Mat3 => matmul(OKLAB_M1, rgbToXyzMatrix(sRGB));

// --- Cylindrical forms ------------------------------------------------------

/** Rectangular opponent pair -> (chroma, hue°). Works for Lab, Luv and Oklab alike. */
export function toPolar(rect: Vec3): Vec3 {
  const [L, a, b] = rect;
  return [L, Math.hypot(a, b), wrapDeg(deg(Math.atan2(b, a)))];
}

export function fromPolar(polar: Vec3): Vec3 {
  const [L, C, h] = polar;
  // At zero chroma the hue is undefined, and `toPolar` of a neutral may well
  // hand back a NaN. Multiplying it by zero must give zero, not NaN.
  if (C === 0 || !Number.isFinite(h)) return [L, 0, 0];
  return [L, C * Math.cos(rad(h)), C * Math.sin(rad(h))];
}

export const xyzToLch = (xyz: Vec3, white?: Vec3): Vec3 => toPolar(xyzToLab(xyz, white));
export const lchToXyz = (lch: Vec3, white?: Vec3): Vec3 => labToXyz(fromPolar(lch), white);
export const xyzToOklch = (xyz: Vec3): Vec3 => toPolar(xyzToOklab(xyz));
export const oklchToXyz = (lch: Vec3): Vec3 => oklabToXyz(fromPolar(lch));

// --- ICtCp (ITU-R BT.2100) --------------------------------------------------

const ICTCP_LMS: Mat3 = [
  [1688 / 4096, 2146 / 4096, 262 / 4096],
  [683 / 4096, 2951 / 4096, 462 / 4096],
  [99 / 4096, 309 / 4096, 3688 / 4096],
];
const ICTCP_FROM_PQLMS: Mat3 = [
  [0.5, 0.5, 0],
  [6610 / 4096, -13613 / 4096, 7003 / 4096],
  [17933 / 4096, -17390 / 4096, -543 / 4096],
];
const ICTCP_LMS_INV = inverse(ICTCP_LMS);
const ICTCP_TO_PQLMS = inverse(ICTCP_FROM_PQLMS);

/**
 * ICtCp from linear Rec.2020 RGB in *absolute* units (1.0 = 10 000 cd/m²).
 * The nonlinearity is applied in cone space rather than per-primary, which is
 * the whole reason ICtCp keeps hue straight where Y'CbCr does not.
 */
export function linearRec2020ToIctcp(rgb: Vec3): Vec3 {
  const lms = mul(ICTCP_LMS, rgb);
  const pq: Vec3 = [pqTransfer.encode(lms[0]), pqTransfer.encode(lms[1]), pqTransfer.encode(lms[2])];
  return mul(ICTCP_FROM_PQLMS, pq);
}

export function ictcpToLinearRec2020(ictcp: Vec3): Vec3 {
  const pq = mul(ICTCP_TO_PQLMS, ictcp);
  const lms: Vec3 = [pqTransfer.decode(pq[0]), pqTransfer.decode(pq[1]), pqTransfer.decode(pq[2])];
  return mul(ICTCP_LMS_INV, lms);
}

export function xyzToIctcp(xyz: Vec3): Vec3 {
  return linearRec2020ToIctcp(mul(xyzToRgbMatrix(rec2020), xyz));
}

export function ictcpToXyz(ictcp: Vec3): Vec3 {
  return mul(rgbToXyzMatrix(rec2020), ictcpToLinearRec2020(ictcp));
}

// --- HSL / HSV / HWB: geometry on the encoded cube --------------------------

/**
 * These operate on *display-encoded* RGB in [0,1]. That is not an oversight —
 * it is the definition, and it is why "same lightness, different hue" in HSL is
 * a claim about nothing.
 */
export function rgbToHsl(rgb: Vec3): Vec3 {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [wrapDeg(h * 60), s, l];
}

export function hslToRgb(hsl: Vec3): Vec3 {
  const [h, s, l] = hsl;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = wrapDeg(h) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] :
    hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  return [r! + m, g! + m, b! + m];
}

export function rgbToHsv(rgb: Vec3): Vec3 {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const h = d === 0 ? 0 : max === r ? (((g - b) / d) % 6) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [wrapDeg(h * 60), max === 0 ? 0 : d / max, max];
}

export function hsvToRgb(hsv: Vec3): Vec3 {
  const [h, s, v] = hsv;
  const c = v * s;
  const hp = wrapDeg(h) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] :
    hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  return [r! + m, g! + m, b! + m];
}

/** HWB: the same hue circle, parameterised by how much white and black you mix in. */
export function rgbToHwb(rgb: Vec3): Vec3 {
  const [h] = rgbToHsv(rgb);
  return [h, Math.min(...rgb), 1 - Math.max(...rgb)];
}

export function hwbToRgb(hwb: Vec3): Vec3 {
  let [h, w, b] = hwb;
  if (w + b >= 1) { const g = w / (w + b); return [g, g, g]; }
  const base = hsvToRgb([h, 1, 1]);
  return base.map((c) => c * (1 - w - b) + w) as unknown as Vec3;
}

// --- Convenience: encoded sRGB <-> perceptual spaces -------------------------

export const srgbToLab = (coded: Vec3, space: RgbSpace = sRGB): Vec3 =>
  xyzToLab(mul(rgbToXyzMatrix(space), decode(coded, space)), whitePoint(space.white as WhitePointName));

export const labToSrgb = (lab: Vec3, space: RgbSpace = sRGB): Vec3 =>
  encode(mul(xyzToRgbMatrix(space), labToXyz(lab, whitePoint(space.white as WhitePointName))), space);

export const srgbToOklab = (coded: Vec3, space: RgbSpace = sRGB): Vec3 =>
  xyzToOklab(mul(rgbToXyzMatrix(space), decode(coded, space)));

export const oklabToSrgb = (lab: Vec3, space: RgbSpace = sRGB): Vec3 =>
  encode(mul(xyzToRgbMatrix(space), oklabToXyz(lab)), space);

export const srgbToOklch = (coded: Vec3, space: RgbSpace = sRGB): Vec3 =>
  toPolar(srgbToOklab(coded, space));

export const oklchToSrgb = (lch: Vec3, space: RgbSpace = sRGB): Vec3 =>
  oklabToSrgb(fromPolar(lch), space);

export { spow };
