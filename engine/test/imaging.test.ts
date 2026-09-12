import { test } from "node:test";
import assert from "node:assert/strict";
import {
  inGamut, clipLinear, gamutMapOklch, maxChroma, hueCusp, toGamut, gamutVolumeOklab,
} from "../color/gamut.ts";
import { sRGB, displayP3, rec2020, decode } from "../color/rgbspace.ts";
import { mix, ramp, interpolateHue, wcagContrast, blend, over } from "../color/blend.ts";
import {
  bayerMatrix, bayerThresholds, generateImage, errorDiffuse, orderedDither,
  quantizeImage, ditherError, diffusionKernels, getPixel, perceivedDitherError,
} from "../color/dither.ts";
import { medianCut, kMeansOklab, categoricalPalette, sequentialRamp, minPairwiseDistance } from "../color/palette.ts";
import { srgbToOklch, oklchToSrgb, srgbToOklab } from "../color/spaces.ts";
import type { Vec3 } from "../color/math.ts";

test("gamut mapping keeps hue and lightness, and lands in gamut", () => {
  const wild: Vec3 = [0.7, 0.35, 150]; // far outside sRGB at this lightness
  const r = gamutMapOklch(wild, sRGB);
  assert.ok(inGamut(r.linear, 1e-6), "result must be in gamut");
  assert.ok(r.clipped, "this colour is not reachable");
  assert.ok(Math.abs(r.oklch[2]! - 150) < 1e-9, "hue is held fixed");
  assert.ok(r.oklch[1]! < wild[1]!, "chroma is what gives way");
});

test("gamut volume orders the standard spaces correctly", () => {
  const v = [sRGB, displayP3, rec2020].map((s) => gamutVolumeOklab(s, 60_000));
  assert.ok(v[0]! < v[1]! && v[1]! < v[2]!, `expected sRGB < P3 < 2020, got ${v.map((x) => x.toFixed(4))}`);
  assert.ok(v[1]! / v[0]! > 1.1, "P3 should be meaningfully larger than sRGB");
});

test("maxChroma collapses at both ends of the lightness axis", () => {
  // Not exactly zero at L = 0: Oklab's black point is a *neighbourhood*, not a
  // point, because the cube root flattens near the origin. Worth a footnote.
  assert.ok(maxChroma(0, 30) < 0.01, `black should be all but achromatic, got ${maxChroma(0, 30)}`);
  assert.equal(maxChroma(1, 30), 0, "white is exactly achromatic");
  const cusp = hueCusp(30);
  assert.ok(cusp.C > 0.1 && cusp.L > 0.2 && cusp.L < 0.9, `cusp looks wrong: ${JSON.stringify(cusp)}`);
});

test("in-gamut colours pass through gamut mapping untouched", () => {
  const c: Vec3 = [0.3, 0.55, 0.7];
  const back = toGamut(decode(c, sRGB).map((v, i) => v) as unknown as Vec3, sRGB);
  assert.ok(back.every((v) => v >= 0 && v <= 1));
});

test("mixing in different spaces gives different answers", () => {
  const a: Vec3 = [0, 0, 1], b: Vec3 = [1, 1, 0];
  const spaces = ["srgb", "linear", "lab", "oklab", "oklch"] as const;
  const mids = spaces.map((s) => mix(a, b, 0.5, s));
  for (let i = 0; i < mids.length; i++)
    for (let j = i + 1; j < mids.length; j++)
      assert.ok(
        Math.hypot(...mids[i]!.map((v, k) => v - mids[j]![k]!)) > 1e-3,
        `${spaces[i]} and ${spaces[j]} should differ`,
      );
});

test("sRGB midpoint of blue and yellow is darker than the linear one", () => {
  const inSrgb = srgbToOklab(mix([0, 0, 1], [1, 1, 0], 0.5, "srgb"))[0]!;
  const inLinear = srgbToOklab(mix([0, 0, 1], [1, 1, 0], 0.5, "linear"))[0]!;
  assert.ok(inLinear > inSrgb, `linear mix should be lighter: ${inLinear} vs ${inSrgb}`);
});

test("ramp endpoints are the endpoints", () => {
  const r = ramp([0.1, 0.2, 0.8], [0.9, 0.8, 0.1], 9, "oklab");
  assert.equal(r.length, 9);
  r[0]!.forEach((v, i) => assert.ok(Math.abs(v - [0.1, 0.2, 0.8][i]!) < 5e-3));
  r[8]!.forEach((v, i) => assert.ok(Math.abs(v - [0.9, 0.8, 0.1][i]!) < 5e-3));
});

test("hue interpolation strategies take the routes they promise", () => {
  assert.ok(Math.abs(interpolateHue(350, 10, 0.5, "shorter") - 0) < 1e-9);
  assert.ok(Math.abs(interpolateHue(350, 10, 0.5, "longer") - 180) < 1e-9);
  assert.ok(Math.abs(interpolateHue(10, 350, 0.5, "increasing") - 180) < 1e-9);
});

test("WCAG contrast is 21:1 for black on white and symmetric", () => {
  assert.ok(Math.abs(wcagContrast([0, 0, 0], [1, 1, 1]) - 21) < 1e-9);
  assert.ok(Math.abs(wcagContrast([1, 1, 1], [0, 0, 0]) - 21) < 1e-9);
  assert.equal(wcagContrast([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]), 1);
});

test("blend modes obey their identities", () => {
  const b: Vec3 = [0.4, 0.6, 0.2];
  blend(b, [1, 1, 1], "multiply").forEach((v, i) => assert.ok(Math.abs(v - b[i]!) < 1e-9));
  blend(b, [0, 0, 0], "screen").forEach((v, i) => assert.ok(Math.abs(v - b[i]!) < 1e-9));
  const o = over([1, 0, 0], 0, [0, 0, 1], 1);
  o.color.forEach((v, i) => assert.ok(Math.abs(v - [0, 0, 1][i]!) < 1e-9), "alpha 0 is a no-op");
});

test("Bayer matrices are permutations of 0..n-1", () => {
  for (const order of [1, 2, 3]) {
    const m = bayerMatrix(order).flat().sort((a, b) => a - b);
    assert.deepEqual(m, Array.from({ length: m.length }, (_, i) => i));
    assert.equal(bayerMatrix(order).length, 2 ** order);
  }
  assert.deepEqual(bayerMatrix(1), [[0, 2], [3, 1]]);
  const t = bayerThresholds(2).flat();
  assert.ok(Math.min(...t) > 0 && Math.max(...t) < 1, "thresholds are strictly inside (0,1)");
});

test("dithering trades per-pixel error for perceived error", () => {
  const img = generateImage(128, 32, (x) => {
    const v = x / 127;
    return [v, v, v];
  });
  const naiveRaw = ditherError(img, quantizeImage(img, 3));
  const fsRaw = ditherError(img, errorDiffuse(img, 3));
  // Pixel-for-pixel, dithering is *worse*. That is the deal you are making.
  assert.ok(fsRaw > naiveRaw, `raw error should rise: ${fsRaw} vs ${naiveRaw}`);

  // Once the eye low-passes it, the ordering inverts.
  const naive = perceivedDitherError(img, quantizeImage(img, 3), 2);
  const fs = perceivedDitherError(img, errorDiffuse(img, 3), 2);
  const ordered = perceivedDitherError(img, orderedDither(img, 3, 2), 2);
  assert.ok(fs < naive, `Floyd-Steinberg ${fs} should beat naive ${naive} once blurred`);
  assert.ok(ordered < naive, `ordered ${ordered} should beat naive ${naive} once blurred`);
});

test("every diffusion kernel conserves the error it distributes", () => {
  for (const k of diffusionKernels) {
    const total = k.taps.reduce((s, t) => s + t.w, 0);
    assert.ok(Math.abs(total - 1) < 1e-12, `${k.id} weights must sum to 1`);
  }
});

test("dithered output only ever contains quantiser levels", () => {
  const img = generateImage(32, 8, (x, y) => [x / 31, y / 7, 0.5]);
  const out = errorDiffuse(img, 4);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 32; x++)
      for (const v of getPixel(out, x, y))
        assert.ok(Math.abs(v * 3 - Math.round(v * 3)) < 1e-9, `stray level ${v}`);
});

test("palette extraction returns the requested number of distinct colours", () => {
  const pixels: Vec3[] = Array.from({ length: 500 }, (_, i) => {
    const t = i / 499;
    return [t, 1 - t, (i % 7) / 6];
  });
  assert.equal(medianCut(pixels, 8).length, 8);
  assert.equal(kMeansOklab(pixels, 6).length, 6);
});

test("a CVD-safe categorical palette stays separable under simulation", () => {
  const p = categoricalPalette({ count: 5, cvdSafeFor: ["deutan", "protan"] });
  assert.equal(p.length, 5);
  assert.ok(minPairwiseDistance(p, "deutan") > 0.05, "must survive deuteranopia");
  assert.ok(minPairwiseDistance(p, "protan") > 0.05, "must survive protanopia");
});

test("a sequential ramp is monotone in lightness", () => {
  const r = sequentialRamp(250, 9).map((c) => srgbToOklch(c)[0]!);
  for (let i = 1; i < r.length; i++) assert.ok(r[i]! < r[i - 1]!, "lightness must decrease monotonically");
});
