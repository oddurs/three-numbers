# Authoring

## A chapter

Chapters are **generated** from `outline/outline_a.py` and `outline_b.py` by
`outline/gen.py`, which emits `book/parts/chNN.typ`. Edit the outline data while
a chapter is still a plan; once you start writing prose into a chapter file,
remove it from the generator's output so it stops being overwritten.

```sh
python3 outline/gen.py     # regenerate the stub chapters
```

The generator also strips the reassurance adverbs listed in
[`voice.md`](voice.md) and escapes the characters where Typst markup and Python
strings disagree — a bare `*` in prose is emphasis, and `L*` will swallow the
rest of the paragraph.

## A figure

```sh
node engine/cli.ts new figure spectral-locus-labels --chapter ch04
```

A figure is a pure function from nothing to an SVG document:

```ts
export default defineFigure({
  id: "cie-1931-chromaticity",
  chapter: "ch04",
  title: "The CIE 1931 chromaticity diagram",
  caption: `Every colour a human eye can be shown…`,
  claim: "The gamut of any display is a small triangle inside the visible set.",
  sources: ["cie-15-colorimetry"],
  placement: "wide",
  render() { /* … */ return plot.document(); },
});
```

Rules the engine enforces:

- The rendered width must equal the placement width. Use `theme.widths.wide`,
  not a number you liked the look of.
- Any label containing a glyph ET Book lacks must go through `familyFor()`.
- A figure is placed **once** with `#fig("id")`; everywhere else uses
  `#figref("id")`.
- Captions may not contain `#4%` (Typst code) or a bare `L*` (emphasis).

Then:

```sh
node engine/cli.ts figures <id> --verbose
node engine/cli.ts proof --figures --ppi 120
```

## A source

```sh
node engine/cli.ts cite add 10.1002/col.20070 --tier primary
node engine/cli.ts cite add https://bottosson.github.io/posts/oklab/ --key ottosson-oklab
```

Then open the record and write the two things the fetcher cannot: **Why it
matters**, and at least one distilled claim with a locator and a confidence.
See [`research.md`](research.md).

## The loop

```sh
node engine/cli.ts watch    # figures rebuild on change; Typst recompiles
```

Watch re-renders in a child process, because ES module caches cannot be evicted
and an in-process rebuild would serve you the figure you had at startup.
