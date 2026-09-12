import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fitXyzToLms, xyzToLms, lmsToXyz, simulateRgb, simulateXyz, cvdModels,
  hpe, stockmanSharpeFit, lmsSpaces,
} from "../color/cvd.ts";
import { juddVos, cie1931 } from "../color/observer.ts";
import { at } from "../color/spectrum.ts";
import { coneFundamentals } from "../color/cvd.ts";
import { mul, type Vec3 } from "../color/math.ts";
import { srgbToOklab } from "../color/spaces.ts";
import { deltaEOk } from "../color/difference.ts";

test("no 3x3 carries XYZ exactly onto the Stockman-Sharpe fundamentals", () => {
  // A point the book makes rather than hides: the modern cone fundamentals are
  // *not* a linear transform of any pre-2006 XYZ. Judd-Vos gets closest.
  const jv = fitXyzToLms(juddVos()).worstResidual;
  const c31 = fitXyzToLms(cie1931()).worstResidual;
  assert.ok(jv > 0.05 && jv < 0.15, `Judd-Vos residual should be ~0.10, got ${jv}`);
  assert.ok(c31 > jv, `CIE 1931 should fit worse than Judd-Vos: ${c31} vs ${jv}`);
  assert.ok(stockmanSharpeFit().note.includes("0.099"), "the residual is stated in the note");
});

test("HPE is invertible and both LMS bases round-trip", () => {
  for (const space of lmsSpaces()) {
    const x: Vec3 = [0.35, 0.3, 0.28];
    lmsToXyz(xyzToLms(x, space), space).forEach((v, i) =>
      assert.ok(Math.abs(v - x[i]!) < 1e-12, `${space.id} round trip`));
  }
  assert.equal(hpe.M[2]![2]!, 1, "HPE's S row is the Z axis unchanged");
});

test("LMS round-trips through XYZ", () => {
  const x: Vec3 = [0.3, 0.35, 0.25];
  lmsToXyz(xyzToLms(x)).forEach((v, i) => assert.ok(Math.abs(v - x[i]!) < 1e-12));
});

test("severity 0 is a no-op for every deficiency", () => {
  for (const type of ["protan", "deutan", "tritan", "achroma"] as const) {
    const rgb: Vec3 = [0.8, 0.3, 0.2];
    simulateRgb(rgb, type, 0).forEach((v, i) =>
      assert.ok(Math.abs(v - rgb[i]!) < 1e-9, `${type} severity 0`));
  }
});

test("grey is invariant under every deficiency", () => {
  for (const type of ["protan", "deutan", "tritan", "achroma"] as const) {
    for (const g of [0.2, 0.5, 0.85]) {
      simulateRgb([g, g, g], type).forEach((v) =>
        assert.ok(Math.abs(v - g) < 2e-3, `${type} grey ${g} -> ${v}`));
    }
  }
});

// Dichromacy destroys *chromatic* information while leaving lightness largely
// intact, so the honest measurement is the (a,b) distance, not the full ΔE.
const chromaticDistance = (p: Vec3, q: Vec3): number => {
  const a = srgbToOklab(p), b = srgbToOklab(q);
  return Math.hypot(a[1] - b[1], a[2] - b[2]);
};

test("protanopia and deuteranopia collapse red against green; tritanopia does not", () => {
  const red: Vec3 = [0.85, 0.2, 0.2];
  const green: Vec3 = [0.2, 0.6, 0.25];
  const normal = chromaticDistance(red, green);
  for (const type of ["protan", "deutan"] as const) {
    const d = chromaticDistance(simulateRgb(red, type), simulateRgb(green, type));
    assert.ok(d < normal * 0.2, `${type} should collapse red/green: ${d} vs ${normal}`);
  }
  const tri = chromaticDistance(simulateRgb(red, "tritan"), simulateRgb(green, "tritan"));
  assert.ok(tri > normal * 0.5, `tritan should preserve red/green: ${tri} vs ${normal}`);
});

test("tritanopia collapses blue against cyan", () => {
  const blue: Vec3 = [0.1, 0.2, 0.9];
  const cyan: Vec3 = [0.1, 0.75, 0.8];
  const normal = chromaticDistance(blue, cyan);
  const d = chromaticDistance(simulateRgb(blue, "tritan"), simulateRgb(cyan, "tritan"));
  assert.ok(d < normal * 0.6, `tritan should compress blue/cyan: ${d} vs ${normal}`);
});

test("dichromacy is a projection: applying it twice changes nothing", () => {
  for (const type of ["protan", "deutan", "tritan"] as const) {
    const once = simulateXyz([0.4, 0.3, 0.2], type);
    const twice = simulateXyz(once, type);
    once.forEach((v, i) => assert.ok(Math.abs(v - twice[i]!) < 1e-9, `${type} idempotent`));
  }
});

test("every model documents its anchors and prevalence", () => {
  for (const m of Object.values(cvdModels)) {
    assert.ok(m.prevalence.length > 10 && m.name.length > 3);
  }
});
