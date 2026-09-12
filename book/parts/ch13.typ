#import "../lib/book.typ": *

#chapter(
  13,
  epigraph: [You are trading spatial resolution for amplitude resolution. The only question is which frequencies you pay in.],
)[Dithering]

#lead[
  Four families of algorithm, one criterion. Because the eye is a low-pass filter,
  error at high spatial frequency is nearly free and error at low frequency is
  expensive. Every dithering method is a different attempt to push the error upward in
  frequency.
]

== Ordered dithering

#stub(words: 1300)[
  The recursive Bayer construction, why it tiles, and its defect: a Bayer matrix has
  strong low-frequency content, which is exactly the energy the eye is most sensitive
  to. Derive the matrix rather than tabulating it.
]

Returns to #figref("dither-methods").

== Error diffusion

#stub(sources: ("floyd-steinberg-1976",), words: 1500)[
  Floyd-Steinberg, Jarvis-Judice-Ninke, Atkinson, Sierra. Serpentine scanning, the
  worm artefact, and Atkinson's deliberate choice to discard a quarter of the error.
]

Returns to #figref("dither-methods").

== Blue noise

#stub(sources: ("ulichney-1993-void",), words: 1500)[
  Void-and-cluster, what 'blue' means spectrally, and why a precomputed mask beats
  error diffusion for anything that has to be evaluated per-pixel in parallel. The GPU
  argument.
]

Returns to #figref("dither-methods").

== Measuring it properly

#stub(words: 1200)[
  The measurement trap: per-pixel error *rises* when you dither. Only after a low-pass
  filter --- the eye's, approximated by a Gaussian --- does the ordering invert. Give
  the numbers, and note that a paper reporting raw RMSE for a dithering method is
  reporting the wrong thing.
]

Returns to #figref("dither-methods").

== Doing it in the right space

#stub(words: 1000)[
  Diffusing error in gamma-encoded values distributes it unevenly in light. Show the
  difference, which is visible in the midtones and is one of the more satisfying one-
  line fixes in this book.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
