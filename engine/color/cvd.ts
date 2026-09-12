/**
 * Colour vision deficiency.
 *
 * Not a filter, and not "removing the red channel". A dichromat's visual system
 * genuinely projects the three-dimensional cone space onto a two-dimensional
 * subspace, and Brettel, Viénot & Mollon (1997) worked out exactly which one:
 * a pair of half-planes hinged on the neutral axis, anchored at two specific
 * wavelengths. This module builds that projection from the measured Stockman &
 * Sharpe cone fundamentals rather than copying a matrix.
 */

import type { Mat3, Vec3 } from "./math.ts";
import { inverse, lerp, mul } from "./math.ts";
import { loadTriple } from "./data.ts";
import { at, type Spectrum } from "./spectrum.ts";
import { cie1931, juddVos, type Observer } from "./observer.ts";
import { whitePoint } from "./illuminant.ts";
import { decode, encode, rgbToXyzMatrix, sRGB, xyzToRgbMatrix, type RgbSpace } from "./rgbspace.ts";

let _cones: [Spectrum, Spectrum, Spectrum] | undefined;

/** Stockman & Sharpe (2000) 2° cone fundamentals, linear energy units. */
export const coneFundamentals = (): [Spectrum, Spectrum, Spectrum] =>
  (_cones ??= loadTriple("linss2_10e_5.csv", ["l̄", "m̄", "s̄"]));

/**
 * An LMS basis: a specific claim about what the three cone classes respond to,
 * expressed as a linear transform of XYZ.
 *
 * There is no single right answer here, and the difference matters. HPE is a
 * transform of the CIE 1931 observer *by definition*, so it is exact within
 * that observer's world. The Stockman–Sharpe fundamentals are better physiology
 * but are not a linear transform of any pre-2006 XYZ, so reaching them from
 * XYZ requires a fit — and that fit has a documented residual. §12.2 plots it.
 */
export interface LmsSpace {
  readonly id: string;
  readonly name: string;
  readonly M: Mat3;
  readonly note: string;
}

/** Hunt–Pointer–Estévez, normalised to equal energy. Exact w.r.t. CIE 1931. */
export const hpe: LmsSpace = {
  id: "hpe", name: "Hunt–Pointer–Estévez",
  M: [
    [0.38971, 0.68898, -0.07868],
    [-0.22981, 1.1834, 0.04641],
    [0.0, 0.0, 1.0],
  ],
  note: "Defined as a linear transform of CIE 1931 XYZ; used by Viénot (1999) and CIECAM97.",
};

/**
 * Least-squares fit of XYZ -> LMS against the measured cone fundamentals.
 *
 * Returns the matrix and the worst residual over 400–700 nm so that callers —
 * and figure captions — can state how good the approximation actually is.
 */
export function fitXyzToLms(obs: Observer = juddVos()): { M: Mat3; worstResidual: number } {
  const [lbar, mbar, sbar] = coneFundamentals();
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const B = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let lambda = 390; lambda <= 780; lambda += 5) {
    const x: Vec3 = [at(obs.xbar, lambda), at(obs.ybar, lambda), at(obs.zbar, lambda)];
    const y: Vec3 = [at(lbar, lambda), at(mbar, lambda), at(sbar, lambda)];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) A[i]![j]! += x[i]! * x[j]!;
      for (let k = 0; k < 3; k++) B[k]![i]! += y[k]! * x[i]!;
    }
  }
  const Ainv = inverse(A.map((r) => r as unknown as Vec3) as unknown as Mat3);
  const rows = [0, 1, 2].map((k) => mul(Ainv, B[k] as unknown as Vec3));
  const M: Mat3 = [rows[0]!, rows[1]!, rows[2]!];

  let worstResidual = 0;
  for (let lambda = 400; lambda <= 700; lambda += 5) {
    const got = mul(M, [at(obs.xbar, lambda), at(obs.ybar, lambda), at(obs.zbar, lambda)]);
    const want: Vec3 = [at(lbar, lambda), at(mbar, lambda), at(sbar, lambda)];
    for (let i = 0; i < 3; i++) worstResidual = Math.max(worstResidual, Math.abs(got[i]! - want[i]!));
  }
  return { M, worstResidual };
}

let _ssFit: LmsSpace | undefined;
/** Stockman & Sharpe reached from Judd–Vos XYZ by least squares. */
export const stockmanSharpeFit = (): LmsSpace => {
  if (!_ssFit) {
    const { M, worstResidual } = fitXyzToLms(juddVos());
    _ssFit = {
      id: "ss-fit", name: "Stockman & Sharpe (fitted)",
      M,
      note: `Least-squares fit from Judd–Vos XYZ; worst residual ${worstResidual.toFixed(3)} over 400–700 nm.`,
    };
  }
  return _ssFit;
};

export const lmsSpaces = (): LmsSpace[] => [hpe, stockmanSharpeFit()];

/** The basis every function below uses unless told otherwise. */
export const defaultLmsSpace: LmsSpace = hpe;

export const xyzToLms = (xyz: Vec3, space: LmsSpace = defaultLmsSpace): Vec3 => mul(space.M, xyz);
export const lmsToXyz = (lms: Vec3, space: LmsSpace = defaultLmsSpace): Vec3 =>
  mul(inverseOf(space), lms);

const invCache = new Map<string, Mat3>();
function inverseOf(space: LmsSpace): Mat3 {
  let m = invCache.get(space.id);
  if (!m) { m = inverse(space.M); invCache.set(space.id, m); }
  return m;
}

export type CvdType = "protan" | "deutan" | "tritan" | "achroma";

export interface CvdModel {
  readonly type: CvdType;
  readonly name: string;
  /** The cone class that is missing or shifted. */
  readonly cone: "L" | "M" | "S" | "none";
  /** Brettel's two anchor wavelengths, in nm. */
  readonly anchors: readonly [number, number];
  readonly prevalence: string;
}

export const cvdModels: Record<CvdType, CvdModel> = {
  protan: {
    type: "protan", name: "Protanopia", cone: "L", anchors: [575, 475],
    prevalence: "≈1.0% of men; the L cone is absent, and deep reds go dark as well as grey.",
  },
  deutan: {
    type: "deutan", name: "Deuteranopia", cone: "M", anchors: [575, 475],
    prevalence: "≈1.1% of men; the M cone is absent. The most common dichromacy.",
  },
  tritan: {
    type: "tritan", name: "Tritanopia", cone: "S", anchors: [660, 485],
    prevalence: "≈0.01%, and not sex-linked; the S cone is absent.",
  },
  achroma: {
    type: "achroma", name: "Achromatopsia", cone: "none", anchors: [0, 0],
    prevalence: "≈0.003%; no functioning cone signal at all.",
  },
};

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/**
 * The LMS response to a monochromatic stimulus, expressed in whichever basis
 * the caller is working in — the anchors have to live in the same space as the
 * stimulus or the half-planes are hinged on the wrong line.
 */
const lmsOfWavelength = (lambda: number, space: LmsSpace, obs: Observer = cie1931()): Vec3 =>
  xyzToLms([at(obs.xbar, lambda), at(obs.ybar, lambda), at(obs.zbar, lambda)], space);

/**
 * Brettel/Viénot/Mollon projection in LMS.
 *
 * `severity` linearly interpolates between normal trichromacy (0) and full
 * dichromacy (1). That interpolation is a convenience, not a physiological
 * model of anomalous trichromacy — Chapter 12 says so explicitly.
 */
export function simulateLms(
  lms: Vec3,
  type: CvdType,
  severity = 1,
  white: Vec3 = whitePoint("D65"),
  space: LmsSpace = defaultLmsSpace,
): Vec3 {
  if (type === "achroma") {
    // Rod vision: V(λ)-weighted luminance, spread across all three channels.
    const w = xyzToLms(white, space);
    const y = (lms[0] / w[0]) * 0.2126 + (lms[1] / w[1]) * 0.7152 + (lms[2] / w[2]) * 0.0722;
    const grey: Vec3 = [y * w[0], y * w[1], y * w[2]];
    return [lerp(lms[0], grey[0], severity), lerp(lms[1], grey[1], severity), lerp(lms[2], grey[2], severity)];
  }

  const model = cvdModels[type];
  const w = xyzToLms(white, space);
  const [warm, cool] = model.anchors;

  // Which half-plane? The two anchors sit on opposite sides of white in the
  // one opponent dimension the dichromat still has.
  const onCoolSide =
    type === "tritan"
      ? lms[1] / lms[0] > w[1] / w[0]   // tritan keeps L and M: compare M/L
      : lms[2] / lms[1] > w[2] / w[1];  // protan/deutan keep S: compare S/M
  const anchor = lmsOfWavelength(onCoolSide ? cool! : warm!, space);

  // The half-plane through the origin containing the neutral axis and the anchor.
  const n = cross(w, anchor);
  const projected: Vec3 =
    type === "protan"
      ? [-(n[1] * lms[1] + n[2] * lms[2]) / n[0], lms[1], lms[2]]
      : type === "deutan"
        ? [lms[0], -(n[0] * lms[0] + n[2] * lms[2]) / n[1], lms[2]]
        : [lms[0], lms[1], -(n[0] * lms[0] + n[1] * lms[1]) / n[2]];

  return [
    lerp(lms[0], projected[0], severity),
    lerp(lms[1], projected[1], severity),
    lerp(lms[2], projected[2], severity),
  ];
}

export const simulateXyz = (
  xyz: Vec3, type: CvdType, severity = 1, space: LmsSpace = defaultLmsSpace,
): Vec3 => lmsToXyz(simulateLms(xyzToLms(xyz, space), type, severity, whitePoint("D65"), space), space);

/** Simulate on display-encoded RGB, doing the work in linear light where it belongs. */
export function simulateRgb(coded: Vec3, type: CvdType, severity = 1, space: RgbSpace = sRGB): Vec3 {
  const xyz = mul(rgbToXyzMatrix(space), decode(coded, space));
  const out = simulateXyz(xyz, type, severity);
  const lin = mul(xyzToRgbMatrix(space), out);
  return encode([
    Math.min(Math.max(lin[0], 0), 1),
    Math.min(Math.max(lin[1], 0), 1),
    Math.min(Math.max(lin[2], 0), 1),
  ], space);
}

/**
 * Confusion lines: the families of colours a dichromat cannot tell apart.
 * They are straight lines in xy meeting at a copunctal point — the chromaticity
 * of the missing cone's primary.
 */
export const copunctalPoints: Record<Exclude<CvdType, "achroma">, { x: number; y: number }> = {
  protan: { x: 0.7465, y: 0.2535 },
  deutan: { x: 1.4, y: -0.4 },
  tritan: { x: 0.1748, y: 0.0 },
};
