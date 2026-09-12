# Three Numbers

*Colour theory for people who would rather see the derivation* — a book, and the
engine that builds it.

Light arriving at the eye is a function of wavelength: a point in an
infinite-dimensional space. The eye reports three numbers. Almost every
practical difficulty in colour is a consequence of that compression, and this
book is an account of the consequences.

The engine's one commitment is that **nothing in the book is transcribed**.
Every figure, every matrix and every number is computed in this repository from
published colorimetric data, and the build fails if a citation points at
nothing.

```sh
npm install          # optional: only needed for `tsc` typechecking
node engine/cli.ts build
open build/three-numbers.pdf
```

Requires **Node 24+** (it runs the TypeScript directly — there is no build step)
and **Typst 0.13+**. Fonts are vendored; there are no runtime dependencies.

Set in **ET Book**, Edward Tufte's own digitisation of Bembo, on a 203 × 254 mm
page with a 68 mm outer margin carrying the notes and the smaller diagrams.
Full documentation is in [`docs/`](docs/) — start with
[`docs/concept.md`](docs/concept.md) for what the book argues and
[`docs/design.md`](docs/design.md) for why it looks like this.

---

## Layout

```
book/            the manuscript, in Typst
  lib/           page master, components, figure placement
  front/ parts/ back/
figures/         one .fig.ts per figure, grouped by chapter
engine/
  color/         the colour library (~200 exports, no dependencies)
  draw/          SVG builder, PNG encoder, scales, plots, design tokens
  figures/       figure contract, discovery, caption linting
  research/      source store, metadata lookup, bibliography, audit
  build/         figure rendering, generated tables, Typst driver
  test/          57 tests, most of them conformance checks
data/            measured colorimetric datasets (see data/SOURCES.md)
research/sources/  one Markdown record per source
build/           generated: figures, tables, bibliography, the PDF
```

## Commands

| | |
|---|---|
| `build` | figures, tables, bibliography, PDF |
| `figures [id…]` | render figures only (`--verbose` for timings and sizes) |
| `watch` | re-render on change and keep Typst watching |
| `proof --pages 1-6` | render pages to PNG for a quick look |
| `check` | typecheck, tests, figure rendering and widths, caption lint, citation audit |
| `stats` | words, figures, sources, planned page count |
| `cite add <doi\|url>` | look metadata up and write a source record |
| `cite search <words>` | search Crossref by title |
| `cite check` | audit the bibliography |
| `research evidence` | per-chapter evidence sheets |
| `tables` | regenerate the derived-matrix appendix |
| `outline` | `list` · `show <id>` · `sync` · `check` · `docs` |
| `new figure <name> --chapter ch07` | scaffold a figure |
| `release <major\|minor\|patch>` | verify, bump, changelog, tag |

## What `check` enforces

The build is only as trustworthy as what it refuses to let through. `check` runs
the typechecker and the tests, then:

- **renders every figure** — so a figure that throws is a build failure, not a
  surprise at typeset time;
- **verifies each figure's rendered width equals the width it is placed at**.
  This is the book's central typographic claim: if an SVG is authored 431 pt
  wide and placed in a 312 pt column, Typst rescales it and every label inside
  shrinks below the body size, silently and invisibly in any single-figure
  proof;
- **rejects a figure placed twice.** Two placements print it twice under two
  different numbers. A figure is placed once with `#fig()` and referred to with
  `#figref()`, which resolves to the number it actually received;
- **lints captions** for the two ways Typst markup and TypeScript string
  literals disagree: `#4%` is a code expression, `a*b*` is bold;
- **audits the bibliography** — citations pointing at nothing, sources nothing
  cites, figures asserting a claim with no evidence, records with no distilled
  claims, web sources going stale.

## The colour library

Dependency-free, and validated against published values rather than against
itself. `engine/test/` checks, among other things, that:

- integrating the published D65 spectrum against the published 1931 observer
  recovers the published white point to within 5 × 10⁻⁴;
- the sRGB matrix **derived** from primaries and white point reproduces the CSS
  Color 4 values to seven decimal places — and that the other widely-copied
  sRGB matrix is exactly what you get from a rounded white point;
- CIEDE2000 reproduces all 34 of Sharma, Wu & Dalal's conformance pairs;
- Oklab of pure sRGB red matches Ottosson's published value;
- dichromacy simulation is idempotent and leaves greys invariant;
- the PNG encoder's output decodes back to the exact pixels it was given, with
  CRCs that match an independent implementation.

Degenerate input fails loudly rather than propagating NaN: a black-body
temperature of zero, an inverted spectral range, a zero white point, a palette
of size zero and a raster of zero pixels are all `RangeError`s.

Covered: spectra and Planck's law, the standard observers, illuminants and the
daylight locus, nine transfer functions including PQ and HLG, nine RGB spaces
with matrices derived from their primaries, CIELAB / CIELUV / Oklab / Oklch /
ICtCp / HSL / HSV / HWB, five chromatic adaptation transforms, six difference
metrics, gamut mapping by the CSS Color 4 algorithm, Brettel colour-vision
deficiency simulation built from the measured cone fundamentals, ordered and
error-diffusion and blue-noise dithering, and palette generation under a
worst-case CVD constraint.

## The figure engine

A figure is a TypeScript module exporting a pure function from nothing to an SVG
document, alongside the metadata the book needs:

```ts
export default defineFigure({
  id: "cie-1931-chromaticity",
  chapter: "ch05",
  title: "The CIE 1931 chromaticity diagram",
  caption: `Every colour a human eye can be shown…`,
  claim: "The gamut of any display is a small triangle inside the visible set.",
  sources: ["cie-15-colorimetry"],
  placement: "wide",
  render() { /* … */ return plot.document(); },
});
```

Figures are rendered at their exact printed size in points, so type inside a
diagram is set at the same optical size as the type beside it. Raster layers
(gamut interiors, gradients, dither patterns) are encoded to PNG and embedded in
the SVG, so each figure is a single self-contained file. Captions live with the
code that draws the data, and a linter catches the two ways Typst markup and
TypeScript string literals quietly disagree.

## The research engine

One Markdown record per source in `research/sources/`, with the bibliographic
data in frontmatter and, in the body, the distilled claims the book is permitted
to rely on — each with a locator and a confidence:

```markdown
## Claims

- [high | §7.1] {#ybar-is-v-lambda} ȳ(λ) is identical to the photopic luminous
  efficiency function V(λ), by construction of the XYZ basis. #observer
```

`cite add` looks metadata up from Crossref, arXiv or a page's own metadata
rather than accepting it typed from memory. `cite check` cross-references the
store against every `@key` in the prose and every figure's declared sources, and
reports citations pointing at nothing, sources nothing cites, figures asserting
a claim with no evidence behind it, records with no distilled claims, and web
sources going stale. The Typst bibliography is generated from the store and is
never edited by hand.

## Notes on two approximations

Both are documented in the code and measured by a test, because an engine whose
premise is "nothing is transcribed" should be equally explicit about what it
approximates:

- **`GamutBoundary`** samples the gamut boundary onto a grid and interpolates,
  replacing a 40-iteration bisection per query. At the default resolution it is
  within ~0.013 of chroma, with the error concentrated at the cusp where the
  boundary has a crease. That is below a just-noticeable difference and fine for
  deciding how far to desaturate a region of a diagram; `gamutMapOklch` remains
  the exact route for a colour a reader will compare against something else.
  Replacing the per-pixel bisection took the chromaticity diagram from 3.6 s to
  0.4 s and the whole figure build from 4.5 s to 1.6 s.
- **The LMS basis for colour-vision-deficiency simulation** is Hunt–Pointer–
  Estévez, which is a linear transform of CIE 1931 by definition. The modern
  Stockman & Sharpe fundamentals are *not* a linear transform of any pre-2006
  XYZ; reaching them requires a fit whose worst residual (0.099 against
  Judd–Vos) the engine computes and states rather than hides.

## Status

The engine is complete and the book is an outline: **19 chapters in five parts,
99 sections**, each with the argument it will make rather than just a heading —
130,500 planned words. **12 figures** are drawn; the rest are named in the
sections that need them. See [`docs/outline.md`](docs/outline.md).

The route to a release candidate is planned in [`ROADMAP.md`](ROADMAP.md) —
nine milestones, sixty-nine items, tracked as Markdown in
[`cairn/items/`](cairn/items). The loop each chapter goes through is
[`docs/writing-process.md`](docs/writing-process.md).

Contributions, and especially corrections, are welcome:
[`CONTRIBUTING.md`](CONTRIBUTING.md).

Run `node engine/cli.ts stats` for the current numbers.

A full build — 12 figures, the generated appendix, the bibliography and a
113-page PDF — takes about 2 seconds.
