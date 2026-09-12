import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../color/index.ts";
import { GamutBoundary, gamutBoundary, maxChroma } from "../color/gamut.ts";
import { displayP3, sRGB } from "../color/rgbspace.ts";
import { verifyFigure } from "../figures/verify.ts";
import { lintCaption } from "../figures/lint.ts";
import { parseSource, parseClaims, SourceError } from "../research/source.ts";
import { splitFrontmatter, FrontmatterError } from "../research/frontmatter.ts";
import { defineFigure } from "../figures/define.ts";
import { theme } from "../draw/theme.ts";
import { Plot } from "../draw/plot.ts";
import type { Vec3 } from "../color/math.ts";

// --- Colour library guards --------------------------------------------------

test("physically meaningless temperatures are rejected, not silently NaN", () => {
  for (const T of [0, -100, NaN]) {
    assert.throws(() => C.blackbody(T), RangeError, `blackbody(${T})`);
    assert.throws(() => C.planckianChromaticity(T), RangeError, `planckian(${T})`);
    assert.throws(() => C.wienPeakNm(T), RangeError, `wien(${T})`);
  }
  assert.ok(Number.isFinite(C.planckianChromaticity(2856).x));
});

test("inverted or zero-step spectral ranges are rejected", () => {
  assert.throws(() => C.fromFunction(() => 1, 500, 400), RangeError);
  assert.throws(() => C.fromFunction(() => 1, 400, 500, 0), RangeError);
  assert.throws(() => C.resample(C.flat(1), 500, 400, 5), RangeError);
});

test("Lab and Luv refuse a degenerate white point", () => {
  const black: Vec3 = [0, 0, 0];
  assert.throws(() => C.xyzToLab([0.3, 0.3, 0.3], black), RangeError);
  assert.throws(() => C.labToXyz([50, 0, 0], black), RangeError);
  assert.throws(() => C.xyzToLuv([0.3, 0.3, 0.3], black), RangeError);
  assert.throws(() => C.luvToXyz([50, 0, 0], black), RangeError);
});

test("a neutral with an undefined hue converts to a neutral, not to NaN", () => {
  // toPolar of a perfect grey can hand back NaN for the hue; zero chroma has to
  // absorb it rather than propagate it through every downstream conversion.
  //
  // The channels agree to about 2e-4 rather than exactly. Oklab's matrices are
  // a *fit*, so its neutral axis is not precisely the sRGB neutral axis — a
  // small permanent reminder that the space is empirical, not derived.
  for (const h of [NaN, Infinity, 0]) {
    const rgb = C.oklchToSrgb([0.5, 0, h]);
    assert.ok(rgb.every(Number.isFinite), `hue ${h} should still give a colour`);
    const spread = Math.max(...rgb) - Math.min(...rgb);
    assert.ok(spread < 1e-3, `hue ${h} should give a grey, spread was ${spread}`);
  }
});

test("McCamy's approximation refuses its own pole", () => {
  assert.throws(() => C.cctMcCamy(0.332, 0.1858), RangeError);
  assert.ok(Math.abs(C.cctMcCamy(0.3127, 0.329) - 6503) < 30);
});

test("palette sizes and ramp lengths must be positive integers", () => {
  const pixels: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (const bad of [0, -1, 2.5]) {
    assert.throws(() => C.medianCut(pixels, bad), RangeError);
    assert.throws(() => C.kMeansOklab(pixels, bad), RangeError);
    assert.throws(() => C.categoricalPalette({ count: bad }), RangeError);
    assert.throws(() => C.ramp([0, 0, 0], [1, 1, 1], bad), RangeError);
    assert.throws(() => C.sequentialRamp(30, bad), RangeError);
  }
});

test("mixing clamps its parameter instead of extrapolating", () => {
  const a: Vec3 = [0.1, 0.2, 0.8];
  const b: Vec3 = [0.9, 0.7, 0.1];
  C.mix(a, b, -1).forEach((v, i) => assert.ok(Math.abs(v - a[i]!) < 5e-3, "t < 0 is the first colour"));
  C.mix(a, b, 2).forEach((v, i) => assert.ok(Math.abs(v - b[i]!) < 5e-3, "t > 1 is the second"));
  assert.throws(() => C.gradient([], 0.5), RangeError);
});

// --- The gamut boundary table ----------------------------------------------

test("the boundary table agrees with the bisection it replaces", () => {
  const table = gamutBoundary(sRGB);
  let worst = 0;
  for (let i = 1; i < 40; i++) {
    for (let h = 0; h < 360; h += 7) {
      const L = i / 40;
      worst = Math.max(worst, Math.abs(table.at(L, h) - maxChroma(L, h, sRGB)));
    }
  }
  // The default grid interpolates to within about 0.013 of chroma. The error
  // concentrates at the cusp, where the boundary has a crease that bilinear
  // interpolation rounds off; elsewhere it is far smaller. That is below a
  // just-noticeable difference (ΔE_ok ≈ 0.02) but not negligible, which is why
  // `clampChroma` is documented as approximate and `gamutMapOklch` remains the
  // exact route.
  assert.ok(worst < 0.013, `worst interpolation error ${worst}`);
  assert.ok(worst > 0, "the table is an approximation and should be measured as one");

  // A finer grid must do better, or the interpolation is not converging.
  const fine = new GamutBoundary(sRGB, 129, 512);
  let fineWorst = 0;
  for (let i = 1; i < 40; i++) {
    for (let h = 0; h < 360; h += 7) {
      const L = i / 40;
      fineWorst = Math.max(fineWorst, Math.abs(fine.at(L, h) - maxChroma(L, h, sRGB)));
    }
  }
  assert.ok(fineWorst < worst / 2, `refining should converge: ${fineWorst} vs ${worst}`);
});

test("the boundary table wraps in hue and clamps in lightness", () => {
  const t = gamutBoundary(sRGB);
  assert.ok(Math.abs(t.at(0.6, 0) - t.at(0.6, 360)) < 1e-9, "hue wraps");
  assert.ok(Math.abs(t.at(0.6, -30) - t.at(0.6, 330)) < 1e-9, "negative hue wraps");
  assert.equal(t.at(-1, 30), t.at(0, 30), "lightness clamps below");
  assert.equal(t.at(2, 30), t.at(1, 30), "lightness clamps above");
  assert.throws(() => new GamutBoundary(sRGB, 1, 8), RangeError);
});

test("a wider space has a boundary at least as far out everywhere", () => {
  const small = gamutBoundary(sRGB);
  const big = gamutBoundary(displayP3);
  for (let h = 0; h < 360; h += 23) {
    assert.ok(big.at(0.6, h) >= small.at(0.6, h) - 1e-6, `P3 should reach at least as far at hue ${h}`);
  }
});

test("clampChroma holds lightness and hue", () => {
  const t = gamutBoundary(sRGB);
  const wild: Vec3 = [0.6, 0.9, 140];
  const [L, Ch, h] = t.clampChroma(wild);
  assert.equal(L, 0.6);
  assert.equal(h, 140);
  assert.ok(Ch < wild[1] && Ch > 0);
});

// --- Figure verification ----------------------------------------------------

const makeFigure = (over: Partial<Parameters<typeof defineFigure>[0]> = {}) =>
  defineFigure({
    id: "test-figure",
    chapter: "ch01",
    title: "Test",
    caption: "A caption long enough to pass the minimum length rule for captions.",
    placement: "column",
    render() {
      const p = new Plot({
        width: theme.widths.column, height: 100,
        x: { domain: [0, 1] }, y: { domain: [0, 1] },
      });
      p.line([[0, 0], [1, 1]]);
      return p.document();
    },
    ...over,
  });

test("a well-formed figure verifies clean", () => {
  assert.deepEqual(verifyFigure(makeFigure()), []);
});

test("a figure rendered at the wrong width is an error", () => {
  // The book's central typographic claim: type inside a diagram is set at the
  // same optical size as the type beside it. That fails silently if Typst has
  // to rescale the SVG, so it is checked rather than trusted.
  const issues = verifyFigure(makeFigure({
    render() {
      const p = new Plot({
        width: theme.widths.wide, height: 100,
        x: { domain: [0, 1] }, y: { domain: [0, 1] },
      });
      p.line([[0, 0], [1, 1]]);
      return p.document();
    },
  }));
  assert.equal(issues.length, 1);
  assert.equal(issues[0]!.code, "width-mismatch");
  assert.equal(issues[0]!.severity, "error");
});

test("a figure whose render throws is reported, not propagated", () => {
  const issues = verifyFigure(makeFigure({ render() { throw new Error("boom"); } }));
  assert.equal(issues[0]!.code, "render-failed");
  assert.match(issues[0]!.message, /boom/);
});

test("ids must be kebab-case and should match the filename", () => {
  assert.ok(verifyFigure(makeFigure({ id: "Test_Figure" })).some((i) => i.code === "bad-id"));
  assert.ok(
    verifyFigure(makeFigure(), "figures/ch01/other-name.fig.ts").some((i) => i.code === "id-filename-mismatch"),
  );
  assert.ok(
    verifyFigure(makeFigure({ chapter: "ch09" }), "figures/ch01/test-figure.fig.ts")
      .some((i) => i.code === "chapter-dir-mismatch"),
  );
});

// --- Caption linting --------------------------------------------------------

test("the caption linter catches the two ways Typst and TypeScript disagree", () => {
  const codes = (caption: string) => lintCaption(makeFigure({ caption })).map((i) => i.code);
  assert.ok(codes("It exceeds #4% in the deep shadows, which is a long enough caption.").includes("hash-number"));
  assert.ok(codes("Plotted in the a*b* plane, which is a long enough caption to pass.").includes("bare-star"));
  assert.ok(codes("An *unbalanced emphasis marker in a caption long enough to pass.").includes("unbalanced-emphasis"));
  assert.ok(codes("Short.").includes("thin-caption"));
  assert.ok(codes("A caption long enough to pass but with no full stop at the end").includes("no-full-stop"));
  assert.deepEqual(codes("Set in the $a^*b^*$ plane, with *balanced* emphasis and a full stop."), []);
});

test("a citation in a caption must be declared in sources", () => {
  const withCite = makeFigure({
    caption: "As shown by @someone, this is a caption long enough to pass the checks.",
    sources: [],
  });
  assert.ok(lintCaption(withCite).some((i) => i.code === "stray-citation"));
  const declared = makeFigure({
    caption: "As shown by @someone, this is a caption long enough to pass the checks.",
    sources: ["someone"],
  });
  assert.ok(!lintCaption(declared).some((i) => i.code === "stray-citation"));
});

// --- The research store -----------------------------------------------------

const RECORD = `---
key: a-source
type: article
title: "A Title"
year: 2020
tier: primary
author:
  - "Last, First"
---

## Why it matters

Because it does.

## Claims

- [high | §2.1] {#a-claim} Something true. #tag
- [medium | p. 7] Something else.
`;

test("a well-formed source parses, including its claims", () => {
  const s = parseSource(RECORD, "a-source.md");
  assert.equal(s.key, "a-source");
  assert.equal(s.year, 2020);
  assert.deepEqual([...s.authors], ["Last, First"]);
  assert.equal(s.claims.length, 2);
  assert.equal(s.claims[0]!.id, "a-claim");
  assert.equal(s.claims[0]!.locator, "§2.1");
  assert.deepEqual([...s.claims[0]!.tags], ["tag"]);
  assert.equal(s.claims[0]!.text, "Something true.");
  assert.ok(s.claims[1]!.id.length > 0, "an id is derived when none is given");
});

test("frontmatter problems are reported with a line number", () => {
  assert.throws(() => splitFrontmatter("no fence here", "x.md"), FrontmatterError);
  assert.throws(() => splitFrontmatter("---\nkey: a\n", "x.md"), FrontmatterError, "unterminated");
  assert.throws(() => splitFrontmatter("---\nnot a pair\n---\n", "x.md"), FrontmatterError);
  assert.throws(() => splitFrontmatter("---\n  - orphan\n---\n", "x.md"), FrontmatterError, "list before key");
});

test("a source without provenance or rationale is rejected", () => {
  const drop = (line: string) => RECORD.split("\n").filter((l) => !l.startsWith(line)).join("\n");
  assert.throws(() => parseSource(drop("key:"), "x.md"), SourceError, "missing key");
  assert.throws(() => parseSource(drop("type:"), "x.md"), SourceError, "missing type");
  assert.throws(() => parseSource(RECORD.replace("type: article", "type: pamphlet"), "x.md"), SourceError);
  assert.throws(() => parseSource(RECORD.replace("tier: primary", "tier: excellent"), "x.md"), SourceError);
  assert.throws(() => parseSource(RECORD.replace("key: a-source", "key: A_Source"), "x.md"), SourceError);
  assert.throws(
    () => parseSource(RECORD.replace("## Why it matters\n\nBecause it does.\n", ""), "x.md"),
    SourceError,
    "no rationale",
  );
});

test("a web source must record when it was last checked", () => {
  const web = RECORD.replace("type: article", "type: web");
  assert.throws(() => parseSource(web, "x.md"), SourceError, "web needs accessed");
  assert.ok(parseSource(web.replace("tier:", "accessed: 2026-01-02\ntier:"), "x.md").accessed);
  assert.throws(
    () => parseSource(web.replace("tier:", "accessed: last Tuesday\ntier:"), "x.md"),
    SourceError,
    "must be an ISO date",
  );
});

test("a claim without a locator is an assertion, and is refused", () => {
  assert.throws(() => parseClaims("## Claims\n\n- Just a bare sentence.\n", "x.md"), SourceError);
  assert.throws(() => parseClaims("## Claims\n\n- [certain | §1] Text.\n", "x.md"), SourceError, "bad confidence");
  assert.throws(() => parseClaims("## Claims\n\n- [high | §1]\n", "x.md"), SourceError, "no text");
  assert.equal(parseClaims("## Notes\n\n- not a claim\n", "x.md").length, 0);
});
