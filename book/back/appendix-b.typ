#import "../lib/book.typ": *

#chapter(none)[Appendix B — Data and provenance]

#lead[
  Every number in this book that could be looked up, was. This appendix says
  where each dataset came from, what it is, and how the engine checks that it
  has not been mis-transcribed.
]

== The datasets

#stub(sources: ("cvrl-database", "cie-15-colorimetry", "stockman-2000-spectral"), words: 900)[
  A table of the six colorimetric datasets in `data/`, each with its source,
  wavelength grid, and the standard that defines it: the CIE 1931 and 1964
  observers, the Judd--Vos modification, the Stockman--Sharpe cone
  fundamentals, and the D65 and A illuminant SPDs, all from the CVRL database.
]

== Conformance checks

#stub(sources: ("sharma-2004-ciede2000", "cie-15-colorimetry"), words: 1100)[
  The engine's test suite is itself an argument. It integrates the published
  D65 spectrum against the published observer and recovers the published white
  point to within five parts in ten thousand; it derives the sRGB matrix from
  primaries and reproduces the CSS Color 4 values to seven decimal places; and
  it reproduces all thirty-four of Sharma, Wu and Dalal's CIEDE2000
  conformance pairs. List what each test establishes and what it does not.
]

== What is computed rather than tabulated

#stub(words: 800)[
  A list of the quantities this book derives instead of quoting: every RGB
  matrix, the Planckian locus, the adaptation matrices, the cone-space
  projections used for colour vision deficiency, and the book's own figure
  palette. For each, note the published value it agrees with and the size of
  any discrepancy.
]

#chapter-end()
