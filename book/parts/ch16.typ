#import "../lib/book.typ": *

#chapter(
  16,
  epigraph: [A renderer is a machine for adding up light. Feed it code values and it adds up the wrong thing, very fast, in parallel.],
)[Colour in the Rendering Pipeline]

#lead[
  Real-time and offline rendering are where every idea in this book has to be made
  cheap. The pipeline has a specific shape --- decode, work in scene-linear, tone-
  map, encode --- and almost every rendering artefact with a colour flavour comes from
  doing one of those steps in the wrong place.
]

== Texture encoding and hardware sRGB

#stub(sources: ("poynton-video",), words: 1000)[
  Why sRGB texture formats exist, what the hardware does, and the specific bug of
  filtering an sRGB texture without the sRGB flag: the GPU interpolates code values
  and the result is dark.
]

== Scene-linear working spaces

#stub(sources: ("aces-system",), words: 850)[
  Why ACEScg rather than linear sRGB: negative values, wide-gamut light sources, and
  the fact that a renderer's intermediate values are radiance, not colour.
]

== Tone mapping

#stub(sources: ("aces-system",), words: 1200)[
  The problem statement: map an unbounded radiance range onto a bounded display.
  Reinhard, filmic curves, and the ACES output transform as three points on a spectrum
  from arbitrary to principled. What each does to hue.
]

== Colour in shaders

#stub(words: 900)[
  Practical rules: what to store, when to decode, why to do lighting in linear and
  grading in a perceptual space, and the cost of an Oklab conversion in a fragment
  shader --- with the actual instruction count.
]

== The output chain

#stub(sources: ("itu-bt2100",), words: 750)[
  Swapchain formats, display profiles, HDR metadata, and the depressing gap between
  what an application asks for and what the compositor does.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
