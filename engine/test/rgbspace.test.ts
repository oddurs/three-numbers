import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sRGB, displayP3, rec2020, proPhoto, rgbToXyzMatrix, luminanceWeights,
  rgbToXyz, xyzToRgb, rgbSpaces, withWhiteXyz,
} from "../color/rgbspace.ts";
import { srgbTransfer, pqTransfer, hlgTransfer, transferFunctions } from "../color/transfer.ts";

const close = (a: number, b: number, tol: number, what: string) =>
  assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b}`);

test("sRGB matrix matches CSS Color 4, derived from xy", () => {
  // Derived from the published primaries and D65 = xy(0.3127, 0.3290) exactly.
  // These are the values in the CSS Color Module Level 4 sample code.
  const expected = [
    [0.4123908, 0.3575843, 0.1804808],
    [0.2126390, 0.7151687, 0.0721923],
    [0.0193308, 0.1191948, 0.9505322],
  ];
  const M = rgbToXyzMatrix(sRGB);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      close(M[i]![j]!, expected[i]![j]!, 1e-7, `M[${i}][${j}]`);
});

test("the 'other' sRGB matrix is just a rounded white point", () => {
  // Lindbloom's widely-copied table quotes D65 as XYZ (0.95047, 1, 1.08883)
  // instead of deriving it from xy. That single rounding moves the matrix in
  // the fourth decimal — the discrepancy readers keep rediscovering.
  const lindbloom = rgbToXyzMatrix(withWhiteXyz(sRGB, [0.95047, 1.0, 1.08883]));
  const expected = [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041],
  ];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      close(lindbloom[i]![j]!, expected[i]![j]!, 1e-6, `L[${i}][${j}]`);
});

test("Rec.709 luminance weights fall out of the primaries", () => {
  const [r, g, b] = luminanceWeights(sRGB);
  close(r, 0.2126, 1e-4, "Wr");
  close(g, 0.7152, 1e-4, "Wg");
  close(b, 0.0722, 1e-4, "Wb");
});

test("Display P3 and Rec.2020 matrices match published first rows", () => {
  close(rgbToXyzMatrix(displayP3)[0]![0]!, 0.4865709, 1e-6, "P3 Xr");
  close(rgbToXyzMatrix(rec2020)[0]![0]!, 0.6369580, 1e-6, "2020 Xr");
  // ProPhoto's published matrix likewise assumes D50 rounded to (0.9642, 1, 0.8249),
  // which shifts Xr by ~1e-4 relative to deriving the white from xy.
  const ppRounded = rgbToXyzMatrix(withWhiteXyz(proPhoto, [0.9642, 1, 0.8249]))[0]![0]!;
  const ppExact = rgbToXyzMatrix(proPhoto)[0]![0]!;
  close(ppRounded, 0.79767, 5e-5, "ProPhoto Xr (rounded D50)");
  assert.ok(Math.abs(ppRounded - ppExact) > 1e-5, "rounding the white point must move the matrix");
});

test("white maps to the space's white point in every space", () => {
  for (const s of rgbSpaces) {
    const xyz = rgbToXyz([1, 1, 1], s);
    close(xyz[1], 1, 1e-9, `${s.id} Y of white`);
  }
});

test("every transfer function round-trips", () => {
  for (const tf of transferFunctions) {
    for (const v of [0, 0.001, 0.01, 0.18, 0.5, 0.9, 1]) {
      close(tf.decode(tf.encode(v)), v, 1e-9, `${tf.id} round trip at ${v}`);
    }
  }
});

test("sRGB mid-grey 0.5 decodes to about 21.4% light", () => {
  close(srgbTransfer.decode(0.5), 0.2140, 1e-4, "0.5 -> linear");
});

test("PQ encodes 100 cd/m2 near code 0.508 and HLG is unity at 1", () => {
  close(pqTransfer.encode(100 / 10000), 0.5081, 2e-3, "PQ 100 nits");
  close(hlgTransfer.encode(1), 1, 1e-6, "HLG at 1");
});

test("RGB round-trips through XYZ in every space", () => {
  for (const s of rgbSpaces) {
    for (const c of [[0.2, 0.6, 0.9], [1, 0, 0], [0.05, 0.05, 0.05]] as const) {
      const back = xyzToRgb(rgbToXyz(c as never, s), s);
      for (let i = 0; i < 3; i++)
        assert.ok(Math.abs(back[i]! - c[i]!) < 1e-6, `${s.id} round trip: ${back[i]} vs ${c[i]}`);
    }
  }
});
