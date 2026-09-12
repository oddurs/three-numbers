#import "../lib/book.typ": *

#chapter(
  10,
  epigraph: [A gamut is a solid. The triangle is its shadow, and the shadow is missing the dimension where the problem lives.],
)[Gamuts, Clipping and Mapping]

#lead[
  Every display can produce a bounded set of colours, and every real pipeline
  eventually asks for one outside it. What happens next is a design decision that most
  software makes by accident, in the form of a clamp.
]

== The gamut as a solid

#stub(sources: ("css-color-4",), words: 1500)[
  Take the RGB cube through the transfer function and the matrix and look at the shape
  it makes in a perceptual space. Constant-hue slices, the cusp, and how violently the
  cusp's position varies with hue.
]

Returns to #figref("oklch-gamut-slice").

== Clipping, and what it costs

#stub(words: 1100)[
  Per-channel clamping is the default everywhere. Show what it does to hue --- it
  rotates it, visibly, and worst exactly where the colour was most saturated.
]

== The CSS Color 4 algorithm

#stub(sources: ("css-color-4",), words: 1400)[
  Hold lightness and hue, binary-search chroma, accept when the clipped version is
  within a delta-E of the target. Explain why holding lightness rather than chroma is
  the right default, and implement it in twenty lines.
]

Returns to #figref("oklch-gamut-slice").

== Rendering intents

#stub(sources: ("icc-v4",), words: 1300)[
  Perceptual, relative colorimetric, saturation, absolute. What ICC specifies versus
  what vendors do, and why 'perceptual' is a vendor's opinion rather than a defined
  transform.
]

== Wider gamuts in practice

#stub(sources: ("css-color-4",), words: 1100)[
  Shipping P3 on the web, the fallback problem, and how to author once for two gamuts
  without either flattening the wide one or lying about the narrow one.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
