#import "../lib/book.typ": *

#chapter(
  15,
  epigraph: [Every model so far has assumed the colour arrives as light. Half the colour in the world arrives as the light that was left over.],
)[Ink]

#lead[
  Additive mixing is the easy case: two lights add, and the arithmetic is linear. A
  surface does not add anything. It removes, multiplicatively, and then the ink sits
  in a layer with thickness and scatter and a substrate underneath. This chapter is
  the one place the book leaves the comfort of a three-by-three matrix, and it is the
  reason CMYK is not a colour space.
]

== Subtractive mixing is multiplication

#stub(sources: ("wyszecki-stiles",), words: 1400)[
  Reflectance multiplies where radiance adds. Derive why that makes the arithmetic
  non-linear in any tristimulus coordinate, and why two inks that each look fine can
  overprint to mud.
]

== Why CMYK is not a colour space

#stub(sources: ("icc-v4",), words: 1500)[
  CMYK is a set of *instructions to a device*, not a coordinate system: the same four
  numbers mean different colours on different presses, papers and screening. There is
  no CMYK-to-RGB matrix and there never can be, which is why the conversion needs a
  measured profile.
]

== Black, and why there are four inks

#stub(sources: ("icc-v4",), words: 1300)[
  Grey component replacement and under-colour removal. Three inks can in principle
  make black; the reasons they do not are register, ink load, drying and cost --- and
  the resulting choice of how much K to substitute is a free parameter with visible
  consequences.
]

== Halftones and dot gain

#stub(sources: ("ulichney-1993-void",), words: 1400)[
  The screening problem is Chapter 13's dithering problem with physics attached: ink
  spreads. Amplitude-modulated versus frequency-modulated screening, and why FM
  screening is blue noise under another name.
]

== Spot colours and the limits of process

#stub(words: 1000)[
  Why Pantone exists, what a spot colour buys that four-colour process cannot, and
  what happens to brand colours that live outside CMYK.
]

== Profiling a press

#stub(sources: ("cie-15-colorimetry", "icc-v4"), words: 1200)[
  Measurement, the characterisation target, and the fact that a print pipeline is the
  one place in this book where the only honest answer is to go and measure the device.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
