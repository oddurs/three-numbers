#import "../lib/book.typ": *

#chapter(
  8,
  epigraph: [Two colours have no midpoint. They have a midpoint in a space, and you have to say which one.],
)[Mixing Light]

#lead[
  Interpolation is the operation programs perform most often on colour and get wrong
  most often. The fix is not a better formula; it is noticing that `lerp` needs a
  space argument and that the default choice is the worst available one.
]

== What a gradient is

#stub(sources: ("css-color-4",), words: 900)[
  Framing: a gradient is a curve through a colour space, and its appearance depends
  entirely on which space it is a curve through. Show the same two endpoints
  interpolated five ways.
]

#fig("interpolation-spaces")

== Interpolating code values, and why it is wrong

#stub(figures: ("interpolation-spaces",), sources: ("poynton-video",), words: 1100)[
  Work through blue-to-yellow in sRGB byte values and show exactly where the light
  goes. Then show the same failure in its other costumes: image resizing, box blur,
  mipmaps, and font antialiasing.
]

== Linear light, and its own failure mode

#stub(words: 750)[
  Physically correct interpolation is not perceptually even --- it spends most of the
  ramp near the bright end. Explain why, and why 'just work in linear' is necessary
  but not sufficient.
]

== Hue paths

#stub(figures: ("interpolation-spaces",), sources: ("css-color-4",), words: 700)[
  In a cylindrical space, two colours are joined by two arcs. Shorter, longer,
  increasing, decreasing --- the CSS Color 4 vocabulary --- and the specific artefact
  of accidentally taking the long way round through a hue nobody asked for.
]

== Compositing and alpha

#stub(sources: ("porter-duff-1984",), words: 1050)[
  Porter-Duff, in linear light, with premultiplied alpha, and the three distinct bugs
  that come from getting any one of those three wrong. The dark- fringe artefact as a
  diagnostic.
]

== Blend modes

#stub(words: 650)[
  Multiply, screen, overlay and the rest as pointwise functions, why they are defined
  on linear light, and what the separable/non-separable distinction means.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
