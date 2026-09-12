/**
 * Transfer functions.
 *
 * The single most misunderstood object in graphics programming: the nonlinear
 * map between a stored code value and a linear light quantity. Every one of
 * these is a *pair*, and the book is careful to name which direction it means.
 *
 *  - `encode` : linear light  ->  code value   (OETF / "gamma encoding")
 *  - `decode` : code value    ->  linear light (EOTF / "gamma decoding")
 */

import { spow } from "./math.ts";

export interface TransferFunction {
  readonly id: string;
  readonly name: string;
  /** linear -> encoded */
  readonly encode: (linear: number) => number;
  /** encoded -> linear */
  readonly decode: (encoded: number) => number;
  /** Human-readable summary for figure captions. */
  readonly summary: string;
}

/** Straight-through: used by scene-linear working spaces such as ACEScg. */
export const linearTransfer: TransferFunction = {
  id: "linear", name: "linear", encode: (x) => x, decode: (x) => x,
  summary: "V = L",
};

/** A pure power law, signed so it survives negative (out-of-gamut) values. */
export function pureGamma(gamma: number, id = `gamma${gamma}`, name = `gamma ${gamma}`): TransferFunction {
  return {
    id, name,
    encode: (x) => spow(x, 1 / gamma),
    decode: (x) => spow(x, gamma),
    summary: `V = L^(1/${gamma})`,
  };
}

/**
 * The sRGB transfer function: a 12.92x linear toe below 0.0031308 spliced to a
 * 2.4 power law. Its effective exponent is about 2.2, which is why the "sRGB is
 * gamma 2.2" folklore survives despite being wrong.
 */
export const srgbTransfer: TransferFunction = {
  id: "srgb", name: "sRGB",
  encode: (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * spow(x, 1 / 2.4) - 0.055),
  decode: (x) => (x <= 0.04045 ? x / 12.92 : spow((x + 0.055) / 1.055, 2.4)),
  summary: "piecewise: 12.92·L below 0.0031308, else 1.055·L^(1/2.4) − 0.055",
};

/** Rec.709 camera OETF — *not* the same curve as sRGB, a classic production bug. */
export const rec709Transfer: TransferFunction = {
  id: "rec709", name: "Rec.709 OETF",
  encode: (x) => (x < 0.018 ? 4.5 * x : 1.099 * spow(x, 0.45) - 0.099),
  decode: (x) => (x < 0.081 ? x / 4.5 : spow((x + 0.099) / 1.099, 1 / 0.45)),
  summary: "4.5·L below 0.018, else 1.099·L^0.45 − 0.099",
};

/** Rec.2020 at 12-bit precision (alpha and beta carried to more digits). */
const A2020 = 1.09929682680944;
const B2020 = 0.018053968510807;
export const rec2020Transfer: TransferFunction = {
  id: "rec2020", name: "Rec.2020 OETF",
  encode: (x) => (x < B2020 ? 4.5 * x : A2020 * spow(x, 0.45) - (A2020 - 1)),
  decode: (x) => (x < 4.5 * B2020 ? x / 4.5 : spow((x + (A2020 - 1)) / A2020, 1 / 0.45)),
  summary: "Rec.709's shape with 12-bit α = 1.09930, β = 0.018054",
};

/** ProPhoto (ROMM RGB): gamma 1.8 with a 16x linear toe below 1/512. */
export const prophotoTransfer: TransferFunction = {
  id: "prophoto", name: "ProPhoto (ROMM)",
  encode: (x) => (x < 1 / 512 ? 16 * x : spow(x, 1 / 1.8)),
  decode: (x) => (x < 16 / 512 ? x / 16 : spow(x, 1.8)),
  summary: "16·L below 1/512, else L^(1/1.8)",
};

/** Adobe RGB (1998): a pure 563/256 power law, not 2.2. */
export const adobeTransfer = pureGamma(563 / 256, "adobe98", "Adobe RGB (1998)");

/** DCI-P3 projection: pure gamma 2.6. */
export const dciTransfer = pureGamma(2.6, "dci", "DCI 2.6");

// --- High dynamic range -----------------------------------------------------

const PQ_M1 = 2610 / 16384;
const PQ_M2 = (2523 / 4096) * 128;
const PQ_C1 = 3424 / 4096;
const PQ_C2 = (2413 / 4096) * 32;
const PQ_C3 = (2392 / 4096) * 32;

/**
 * SMPTE ST 2084 "PQ". Absolute, not relative: `linear` is luminance in cd/m²
 * divided by 10000. Derived from Barten's contrast-sensitivity model, which is
 * why it is the only transfer function in this file with a perceptual argument
 * behind its shape rather than a CRT.
 */
export const pqTransfer: TransferFunction = {
  id: "pq", name: "PQ (ST 2084)",
  encode: (x) => {
    const y = Math.pow(Math.max(x, 0), PQ_M1);
    return Math.pow((PQ_C1 + PQ_C2 * y) / (1 + PQ_C3 * y), PQ_M2);
  },
  decode: (x) => {
    const e = Math.pow(Math.max(x, 0), 1 / PQ_M2);
    const num = Math.max(e - PQ_C1, 0);
    return Math.pow(num / (PQ_C2 - PQ_C3 * e), 1 / PQ_M1);
  },
  summary: "ST 2084 perceptual quantiser, 0–10 000 cd/m²",
};

const HLG_A = 0.17883277;
const HLG_B = 1 - 4 * HLG_A;
const HLG_C = 0.5 - HLG_A * Math.log(4 * HLG_A);

/** ARIB STD-B67 "hybrid log-gamma": a square root toe joined to a logarithm. */
export const hlgTransfer: TransferFunction = {
  id: "hlg", name: "HLG (ARIB STD-B67)",
  encode: (x) => (x <= 1 / 12 ? Math.sqrt(3 * x) : HLG_A * Math.log(12 * x - HLG_B) + HLG_C),
  decode: (x) => (x <= 0.5 ? (x * x) / 3 : (Math.exp((x - HLG_C) / HLG_A) + HLG_B) / 12),
  summary: "√(3L) below 1/12, else a·ln(12L − b) + c",
};

export const transferFunctions: TransferFunction[] = [
  linearTransfer, srgbTransfer, rec709Transfer, rec2020Transfer,
  prophotoTransfer, adobeTransfer, dciTransfer, pqTransfer, hlgTransfer,
];
