import { test } from "node:test";
import assert from "node:assert/strict";
import { cie1931, xyzFromSpd, spectrumLocus } from "../color/observer.ts";
import {
  spdD65, spdA, planckianChromaticity, daylightChromaticity, cctMcCamy,
} from "../color/illuminant.ts";

const xy = (v: readonly [number, number, number]) => {
  const s = v[0] + v[1] + v[2];
  return [v[0] / s, v[1] / s] as const;
};
const near = (a: number, b: number, tol: number, what: string) =>
  assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b} (tol ${tol})`);

test("D65 SPD integrates to the published white point", () => {
  const [x, y] = xy(xyzFromSpd(spdD65(), cie1931()));
  near(x, 0.31272, 5e-4, "D65 x");
  near(y, 0.32903, 5e-4, "D65 y");
});

test("Illuminant A SPD integrates to the published white point", () => {
  const [x, y] = xy(xyzFromSpd(spdA(), cie1931()));
  near(x, 0.44758, 5e-4, "A x");
  near(y, 0.40745, 5e-4, "A y");
});

test("Illuminant A is a 2856 K Planckian radiator", () => {
  const p = planckianChromaticity(2856);
  near(p.x, 0.44758, 2e-3, "Planck 2856 K x");
  near(p.y, 0.40745, 2e-3, "Planck 2856 K y");
});

test("daylight locus at 6504 K lands on D65", () => {
  const d = daylightChromaticity(6504);
  near(d.x, 0.3127, 1e-3, "D65 locus x");
  near(d.y, 0.3290, 1e-3, "D65 locus y");
});

test("McCamy CCT recovers D65", () => {
  near(cctMcCamy(0.3127, 0.329), 6503, 30, "CCT(D65)");
});

test("spectrum locus hits known chromaticities", () => {
  const loc = spectrumLocus(cie1931(), 380, 700, 5);
  const p520 = loc.find((p) => p.lambda === 520)!;
  near(p520.x, 0.0743, 2e-3, "520 nm x");
  near(p520.y, 0.8338, 2e-3, "520 nm y");
  const p700 = loc.at(-1)!;
  near(p700.x, 0.7347, 2e-3, "700 nm x");
  near(p700.y, 0.2653, 2e-3, "700 nm y");
});
