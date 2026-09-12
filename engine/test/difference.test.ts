import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deltaE2000, deltaE76, deltaE94, deltaECmc, deltaEItp, deltaEOkSrgb } from "../color/difference.ts";
import { adaptNamed, adaptationMatrix, catMethods, bradford } from "../color/adaptation.ts";
import { whitePoint } from "../color/illuminant.ts";
import { srgbToLab } from "../color/spaces.ts";
import type { Vec3 } from "../color/math.ts";
import { mul } from "../color/math.ts";

test("CIEDE2000 reproduces all 34 of Sharma's conformance pairs", () => {
  const rows = readFileSync(new URL("../../data/ciede2000-testdata.txt", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l.trim()).map((l) => l.trim().split(/\s+/).map(Number));
  assert.equal(rows.length, 34, "expected Sharma's 34 test pairs");
  for (const [L1, a1, b1, L2, a2, b2, expected] of rows as number[][]) {
    const got = deltaE2000([L1!, a1!, b1!], [L2!, a2!, b2!]);
    assert.ok(
      Math.abs(got - expected!) < 1e-4,
      `ΔE00([${L1},${a1},${b1}],[${L2},${a2},${b2}]) = ${got.toFixed(4)}, expected ${expected}`,
    );
  }
});

test("every metric is a metric: zero on identity, symmetric, positive", () => {
  const a: Vec3 = [50, 20, -30], b: Vec3 = [55, -10, 25];
  for (const [name, f] of [
    ["ΔE76", deltaE76], ["ΔE94", deltaE94], ["ΔE00", deltaE2000], ["CMC", deltaECmc],
  ] as const) {
    assert.equal(f(a, a), 0, `${name} identity`);
    assert.ok(f(a, b) > 0, `${name} positive`);
  }
  // CIEDE2000 is symmetric; CMC famously is not, which is a real usability trap.
  assert.ok(Math.abs(deltaE2000(a, b) - deltaE2000(b, a)) < 1e-12, "ΔE00 symmetric");
  assert.ok(Math.abs(deltaECmc(a, b) - deltaECmc(b, a)) > 1e-6, "CMC is asymmetric by construction");
});

test("ΔE00 shrinks the blue-region distances that ΔE76 overstates", () => {
  const p: Vec3 = [50, 2.6772, -79.7751];
  const q: Vec3 = [50, 0, -82.7485];
  assert.ok(deltaE76(p, q) > 4, "ΔE76 overstates this pair");
  assert.ok(Math.abs(deltaE2000(p, q) - 2.0425) < 1e-4, "ΔE00 halves it");
});

test("Oklab and ITP distances agree that black-to-white is a long way", () => {
  assert.ok(deltaEOkSrgb([0, 0, 0], [1, 1, 1]) > 0.9, "Oklab ΔL of the full range is ~1");
  const dark = mul(adaptationMatrix(whitePoint("D65"), whitePoint("D65")), [0.01, 0.01, 0.01] as Vec3);
  assert.ok(deltaEItp(dark, [0.02, 0.02, 0.02]) > 1, "ΔE_ITP resolves deep shadow steps");
});

test("adaptation is invertible and white maps to white", () => {
  for (const m of catMethods) {
    const there = adaptNamed(whitePoint("D65"), "D65", "D50", m);
    const w50 = whitePoint("D50");
    there.forEach((v, i) => assert.ok(Math.abs(v - w50[i]!) < 1e-12, `${m.id} white->white`));
    const x: Vec3 = [0.3, 0.25, 0.2];
    const back = adaptNamed(adaptNamed(x, "D65", "A", m), "A", "D65", m);
    back.forEach((v, i) => assert.ok(Math.abs(v - x[i]!) < 1e-12, `${m.id} invertible`));
  }
});

test("Bradford D65->D50 matches the matrix ICC profiles ship", () => {
  const M = adaptationMatrix(whitePoint("D65"), whitePoint("D50"), bradford);
  assert.ok(Math.abs(M[0]![0]! - 1.0479) < 2e-3, `Bradford m00 = ${M[0]![0]}`);
  assert.ok(Math.abs(M[2]![2]! - 0.7521) < 2e-3, `Bradford m22 = ${M[2]![2]}`);
});

test("a 1 ΔE00 step is near the threshold of noticeability in sRGB", () => {
  const grey = srgbToLab([0.5, 0.5, 0.5]);
  const nudged = srgbToLab([0.5, 0.5, 0.52]);
  const d = deltaE2000(grey, nudged);
  assert.ok(d > 0.5 && d < 3, `expected a small but real difference, got ${d}`);
});
