#import "../lib/book.typ": *

#chapter(none)[Appendix C — How this book is built]

#lead[
  A book about computed colour ought to be computed. This appendix documents the
  engine in this repository, both because readers may want to reproduce or
  disagree with a figure, and because the build system makes arguments that the
  prose only asserts.
]

== The pipeline

#stub(words: 1200)[
  Figures are TypeScript modules that export a pure function from nothing to an
  SVG document. The engine renders each to `build/figures/` at its exact
  printed size in points and emits a manifest of captions; Typst places them by
  id. Because figure size is fixed in points, type inside a diagram is set at
  the same optical size as the type beside it. There is no transpiler: Node 24
  executes the TypeScript directly.
]

== The colour library

#stub(words: 1400)[
  A tour of `engine/color/`: spectra, observers, illuminants, transfer
  functions, RGB spaces with derived matrices, the perceptual spaces, chromatic
  adaptation, the difference metrics, gamut mapping, cone-space CVD simulation,
  dithering and palette generation. Roughly two hundred exported functions, all
  dependency-free, with the test suite as the specification.
]

== The research engine

#stub(words: 1400)[
  How sources are managed: one Markdown record per source under
  `research/sources/`, with the bibliographic data in frontmatter and, in the
  body, the distilled claims the book is allowed to rely on --- each with a
  locator and a confidence. `cite add` looks metadata up from Crossref or arXiv
  rather than accepting it typed from memory. `cite check` cross-references the
  store against every citation in the prose and every figure's declared
  sources, and reports citations pointing at nothing, sources nothing cites,
  figures asserting a claim with no evidence, and records going stale.
]

== Reproducing a figure

#stub(figures: ("cie-1931-chromaticity",), words: 900)[
  A worked example: take the chromaticity diagram, change the observer from
  1931 to 1964, rebuild, and see what moves. The point being that a figure here
  is an executable claim.
]

#chapter-end()
