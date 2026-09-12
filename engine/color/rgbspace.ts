/**
 * RGB colour spaces.
 *
 * An RGB space is exactly four things: three primary chromaticities, a white
 * point, and a transfer function. Everything else — the 3x3 matrices everyone
 * copies off the internet — is *derived* here, by the construction in
 * Chapter 5. Nothing in this file is a magic constant except the standards'
 * own published primaries.
 */

import type { Mat3, Vec3 } from "./math.ts";
import { diag, inverse, matmul, mul } from "./math.ts";
import { whitePointsXy, xyToXyz, type WhitePointName } from "./illuminant.ts";
import type { TransferFunction } from "./transfer.ts";
import {
  adobeTransfer, dciTransfer, linearTransfer, prophotoTransfer,
  rec2020Transfer, srgbTransfer,
} from "./transfer.ts";

export interface Chromaticity { readonly x: number; readonly y: number }

export interface RgbSpace {
  readonly id: string;
  readonly name: string;
  readonly primaries: { readonly r: Chromaticity; readonly g: Chromaticity; readonly b: Chromaticity };
  readonly white: WhitePointName;
  readonly transfer: TransferFunction;
  readonly note: string;
  /**
   * Optional explicit white in XYZ. ICC profiles and several published matrices
   * quote a *rounded* white (D65 as 0.95047, 1, 1.08883) rather than deriving
   * it from xy; that rounding is the entire reason two "the" sRGB matrices are
   * in circulation. Set this to reproduce a specific vendor's numbers.
   */
  readonly whiteOverride?: Vec3;
}

/**
 * Build the linear-RGB -> XYZ matrix from primaries and white point.
 *
 * Each primary fixes a *direction* in XYZ; the white point fixes the three
 * scale factors that make (1,1,1) land on white. That is the entire derivation,
 * and it is four lines of linear algebra.
 */
export function rgbToXyzMatrix(space: RgbSpace): Mat3 {
  const { r, g, b } = space.primaries;
  const col = (c: Chromaticity): Vec3 => [c.x / c.y, 1, (1 - c.x - c.y) / c.y];
  const [cr, cg, cb] = [col(r), col(g), col(b)];
  const M: Mat3 = [
    [cr[0], cg[0], cb[0]],
    [cr[1], cg[1], cb[1]],
    [cr[2], cg[2], cb[2]],
  ];
  const w = whiteXyz(space);
  const s = mul(inverse(M), w);
  return matmul(M, diag(s));
}

export const xyzToRgbMatrix = (space: RgbSpace): Mat3 => inverse(rgbToXyzMatrix(space));

export const whiteXyz = (space: RgbSpace): Vec3 => {
  if (space.whiteOverride) return space.whiteOverride;
  const { x, y } = whitePointsXy[space.white];
  return xyToXyz(x, y, 1);
};

/** A variant of `space` whose white is stated directly in XYZ. */
export const withWhiteXyz = (space: RgbSpace, white: Vec3, id = `${space.id}+wp`): RgbSpace => ({
  ...space, id, whiteOverride: white,
});

/**
 * Luminance weights: the middle row of the RGB->XYZ matrix. The famous
 * (0.2126, 0.7152, 0.0722) of Rec.709 is not a perceptual constant handed down
 * from on high — it falls out of where the primaries happen to sit.
 */
export const luminanceWeights = (space: RgbSpace): Vec3 => rgbToXyzMatrix(space)[1];

// --- The standards ----------------------------------------------------------

export const sRGB: RgbSpace = {
  id: "srgb", name: "sRGB",
  primaries: { r: { x: 0.64, y: 0.33 }, g: { x: 0.3, y: 0.6 }, b: { x: 0.15, y: 0.06 } },
  white: "D65", transfer: srgbTransfer,
  note: "IEC 61966-2-1. Rec.709 primaries with a different transfer curve; the default of the web.",
};

export const rec709: RgbSpace = {
  id: "rec709", name: "Rec.709",
  primaries: sRGB.primaries, white: "D65", transfer: rec2020Transfer,
  note: "ITU-R BT.709. Same primaries as sRGB, camera OETF instead of the sRGB curve.",
};

export const displayP3: RgbSpace = {
  id: "display-p3", name: "Display P3",
  primaries: { r: { x: 0.68, y: 0.32 }, g: { x: 0.265, y: 0.69 }, b: { x: 0.15, y: 0.06 } },
  white: "D65", transfer: srgbTransfer,
  note: "DCI-P3 primaries, D65 white, sRGB transfer. What every recent Apple display actually is.",
};

export const dciP3: RgbSpace = {
  id: "dci-p3", name: "DCI-P3",
  primaries: displayP3.primaries, white: "DCI", transfer: dciTransfer,
  note: "SMPTE RP 431-2 digital cinema projection, greenish DCI white, gamma 2.6.",
};

export const rec2020: RgbSpace = {
  id: "rec2020", name: "Rec.2020",
  primaries: { r: { x: 0.708, y: 0.292 }, g: { x: 0.17, y: 0.797 }, b: { x: 0.131, y: 0.046 } },
  white: "D65", transfer: rec2020Transfer,
  note: "ITU-R BT.2020 UHDTV. Primaries sit on the spectrum locus — no real display reaches them.",
};

export const adobeRgb: RgbSpace = {
  id: "adobe-rgb", name: "Adobe RGB (1998)",
  primaries: { r: { x: 0.64, y: 0.33 }, g: { x: 0.21, y: 0.71 }, b: { x: 0.15, y: 0.06 } },
  white: "D65", transfer: adobeTransfer,
  note: "Built to cover CMYK cyan-green; gamma 563/256, an artefact of an 8-bit rounding choice.",
};

export const proPhoto: RgbSpace = {
  id: "prophoto", name: "ProPhoto RGB",
  primaries: { r: { x: 0.7347, y: 0.2653 }, g: { x: 0.1596, y: 0.8404 }, b: { x: 0.0366, y: 0.0001 } },
  white: "D50", transfer: prophotoTransfer,
  note: "Kodak ROMM. Two of its primaries are imaginary: about 13% of the space is not a colour.",
};

export const acesCg: RgbSpace = {
  id: "acescg", name: "ACEScg (AP1)",
  primaries: { r: { x: 0.713, y: 0.293 }, g: { x: 0.165, y: 0.83 }, b: { x: 0.128, y: 0.044 } },
  white: "ACES", transfer: linearTransfer,
  note: "Academy AP1 primaries, scene-linear. The working space of modern VFX rendering.",
};

export const acesAp0: RgbSpace = {
  id: "aces-ap0", name: "ACES2065-1 (AP0)",
  primaries: { r: { x: 0.7347, y: 0.2653 }, g: { x: 0.0, y: 1.0 }, b: { x: 0.0001, y: -0.077 } },
  white: "ACES", transfer: linearTransfer,
  note: "AP0 encloses the entire spectrum locus by putting all three primaries outside it.",
};

export const rgbSpaces: RgbSpace[] = [
  sRGB, rec709, displayP3, dciP3, rec2020, adobeRgb, proPhoto, acesCg, acesAp0,
];

export const rgbSpaceById = (id: string): RgbSpace => {
  const s = rgbSpaces.find((x) => x.id === id);
  if (!s) throw new Error(`unknown RGB space: ${id}`);
  return s;
};

// --- Conversions ------------------------------------------------------------

const matrixCache = new Map<string, { fwd: Mat3; inv: Mat3 }>();
function matrices(space: RgbSpace) {
  let m = matrixCache.get(space.id);
  if (!m) {
    const fwd = rgbToXyzMatrix(space);
    m = { fwd, inv: inverse(fwd) };
    matrixCache.set(space.id, m);
  }
  return m;
}

export const linearRgbToXyz = (rgb: Vec3, space: RgbSpace = sRGB): Vec3 =>
  mul(matrices(space).fwd, rgb);

export const xyzToLinearRgb = (xyz: Vec3, space: RgbSpace = sRGB): Vec3 =>
  mul(matrices(space).inv, xyz);

export const encode = (linear: Vec3, space: RgbSpace = sRGB): Vec3 =>
  [space.transfer.encode(linear[0]), space.transfer.encode(linear[1]), space.transfer.encode(linear[2])];

export const decode = (coded: Vec3, space: RgbSpace = sRGB): Vec3 =>
  [space.transfer.decode(coded[0]), space.transfer.decode(coded[1]), space.transfer.decode(coded[2])];

/** Full round trip: display-encoded RGB (0–1) -> XYZ, relative to the space's own white. */
export const rgbToXyz = (coded: Vec3, space: RgbSpace = sRGB): Vec3 =>
  linearRgbToXyz(decode(coded, space), space);

export const xyzToRgb = (xyz: Vec3, space: RgbSpace = sRGB): Vec3 =>
  encode(xyzToLinearRgb(xyz, space), space);

/** Relative luminance Y of an encoded RGB triple. */
export const relativeLuminance = (coded: Vec3, space: RgbSpace = sRGB): number =>
  rgbToXyz(coded, space)[1];
