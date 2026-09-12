import { test } from "node:test";
import assert from "node:assert/strict";
import {
  xyzToLab, labToXyz, xyzToLuv, luvToXyz, xyzToOklab, oklabToXyz,
  rgbToHsl, hslToRgb, rgbToHsv, hsvToRgb, rgbToHwb, hwbToRgb,
  srgbToOklab, srgbToLab, xyzToIctcp, ictcpToXyz, toPolar, fromPolar, xyToUv, uvToXy,
} from "../color/spaces.ts";
import { whitePoint } from "../color/illuminant.ts";
import type { Vec3 } from "../color/math.ts";

const close = (a: number, b: number, tol: number, what: string) =>
  assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b}`);
const closeV = (a: Vec3, b: readonly number[], tol: number, what: string) =>
  a.forEach((v, i) => close(v, b[i]!, tol, `${what}[${i}]`));

const W = whitePoint("D65");

test("the white point is the origin of every opponent space", () => {
  closeV(xyzToLab(W, W), [100, 0, 0], 1e-9, "Lab(white)");
  closeV(xyzToLuv(W, W), [100, 0, 0], 1e-9, "Luv(white)");
  closeV(xyzToOklab(W), [1, 0, 0], 1e-3, "Oklab(white)");
});

test("Lab, Luv and Oklab all round-trip", () => {
  const samples: Vec3[] = [[0.3, 0.2, 0.1], [0.95, 1.0, 1.089], [0.01, 0.005, 0.02], [0.5, 0.5, 0.5]];
  for (const xyz of samples) {
    closeV(labToXyz(xyzToLab(xyz, W), W), xyz, 1e-9, "Lab");
    closeV(luvToXyz(xyzToLuv(xyz, W), W), xyz, 1e-9, "Luv");
    closeV(oklabToXyz(xyzToOklab(xyz)), xyz, 1e-9, "Oklab");
    closeV(ictcpToXyz(xyzToIctcp(xyz)), xyz, 1e-6, "ICtCp");
  }
});

test("Oklab of pure sRGB red matches Ottosson's published value", () => {
  closeV(srgbToOklab([1, 0, 0]), [0.62796, 0.22486, 0.12585], 2e-4, "Oklab(red)");
});

test("CIELAB of pure sRGB primaries matches published values", () => {
  closeV(srgbToLab([1, 0, 0]), [53.24, 80.09, 67.20], 0.05, "Lab(red)");
  closeV(srgbToLab([0, 1, 0]), [87.74, -86.18, 83.18], 0.05, "Lab(green)");
  closeV(srgbToLab([0, 0, 1]), [32.30, 79.20, -107.86], 0.05, "Lab(blue)");
});

test("sub-epsilon lightness uses the linear branch, and it is continuous", () => {
  const eps = 216 / 24389;
  const below = xyzToLab([0, W[1] * (eps - 1e-9), 0], W)[0];
  const above = xyzToLab([0, W[1] * (eps + 1e-9), 0], W)[0];
  close(below, above, 1e-5, "Lab L* is continuous at ε");
  close(above, 8, 1e-4, "L* at ε is exactly 8");
});

test("HSL, HSV and HWB round-trip and agree on hue", () => {
  const samples: Vec3[] = [[1, 0, 0], [0.2, 0.7, 0.4], [0.5, 0.5, 0.5], [0, 0, 0], [1, 1, 1]];
  for (const rgb of samples) {
    closeV(hslToRgb(rgbToHsl(rgb)), rgb, 1e-9, "HSL");
    closeV(hsvToRgb(rgbToHsv(rgb)), rgb, 1e-9, "HSV");
    closeV(hwbToRgb(rgbToHwb(rgb)), rgb, 1e-9, "HWB");
    close(rgbToHsl(rgb)[0], rgbToHsv(rgb)[0], 1e-9, "hue agrees");
  }
});

test("HSL lightness is not lightness: pure blue and pure yellow both read 0.5", () => {
  close(rgbToHsl([0, 0, 1])[2], 0.5, 1e-12, "HSL L of blue");
  close(rgbToHsl([1, 1, 0])[2], 0.5, 1e-12, "HSL L of yellow");
  // ...while their actual CIE lightness differs by more than 65 units.
  const dL = srgbToLab([1, 1, 0])[0] - srgbToLab([0, 0, 1])[0];
  assert.ok(dL > 64 && dL < 65, `L* gap is ~64.8, got ${dL}`);
});

test("polar and rectangular opponent forms are inverse", () => {
  const p: Vec3 = [50, 30, -20];
  closeV(fromPolar(toPolar(p)), p, 1e-12, "polar round trip");
});

test("u'v' and xy are projectively equivalent", () => {
  const [u, v] = xyToUv(0.3127, 0.329);
  close(u, 0.1978, 1e-3, "u' of D65");
  close(v, 0.4683, 1e-3, "v' of D65");
  const [x, y] = uvToXy(u, v);
  close(x, 0.3127, 1e-9, "xy round trip x");
  close(y, 0.329, 1e-9, "xy round trip y");
});
