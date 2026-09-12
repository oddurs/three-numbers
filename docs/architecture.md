# Architecture

Node 24 executes the TypeScript directly — there is no transpiler and no
bundler. The only external dependency is Typst.

```
book/            the manuscript, in Typst
  lib/           page master, components, figure placement, margin apparatus
  front/ parts/ back/
outline/         the outline as data, plus the generator that emits book/parts/
figures/         one .fig.ts per figure, grouped by chapter
fonts/           ET Book, vendored (MIT)
data/            measured colorimetric datasets
research/sources/  one Markdown record per source
engine/
  color/         the colour library — no dependencies
  draw/          SVG builder, PNG encoder, scales, plots, fonts, design tokens
  figures/       figure contract, discovery, verification, caption linting
  research/      source store, metadata lookup, bibliography, audit
  build/         figure rendering, generated tables, version stamp, Typst driver
  test/          conformance and guard tests
build/           generated: figures, tables, bibliography, the PDF
```

## The two halves of the theme

`book/lib/theme.typ` and `engine/draw/theme.ts` hold the same measurements. They
have to agree, because a figure is rendered at a size Typst then places without
rescaling. `check` verifies the consequence rather than the duplication: every
figure's rendered width must equal its placement width.

## The figure pipeline

A figure is a TypeScript module exporting a pure function from nothing to an SVG
document, plus the metadata the book needs. `renderFigures()` writes each to
`build/figures/<id>.svg` and emits `manifest.typ`, which `#fig()` reads for
captions and widths. Raster layers are encoded to PNG and embedded as data URIs,
so each figure is one self-contained file.

Figures are pure and deterministic — a test asserts that rendering twice gives
byte-identical output — which is what makes the "changed / cached" build work.

## Why watch mode forks

ES module imports are cached for the life of a process and cannot be evicted, so
re-rendering in-process would serve stale figure modules forever, and editing a
shared module like the theme would not reload either. `watch` re-renders in a
child process: a fresh module graph every time, for about a tenth of a second.

## Generated artefacts

Nothing in `build/` is edited by hand.

| Artefact | From |
|---|---|
| `build/figures/*.svg` + `manifest.typ` | `figures/**.fig.ts` |
| `build/tables/matrices.typ` | `engine/build/tables.ts` — Appendix A is computed |
| `build/research/bibliography.yml` | `research/sources/*.md` |
| `build/version.typ` | git tag, SHA and date |
| `build/three-numbers.pdf` | Typst |
