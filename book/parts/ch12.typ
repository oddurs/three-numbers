#import "../lib/book.typ": *

#chapter(
  12,
  epigraph: [Eight bits is not enough, and has never been enough; the transfer function has been hiding it for you.],
)[Quantisation and Banding]

#lead[
  Banding is a quantisation artefact, and like all quantisation artefacts it is best
  understood as a signal-processing problem: a smooth signal, a coarse quantiser, and
  a viewer whose visual system happens to amplify exactly the kind of error a naive
  quantiser produces.
]

== Where the levels go

#stub(sources: ("poynton-video",), words: 1400)[
  Count them. How many distinguishable steps does 8-bit sRGB provide, where are they
  too coarse, and how does the transfer function redistribute them. The answer to 'why
  do gradients band in the shadows' is arithmetic, not mysticism.
]

== Mach bands and why the eye finds edges

#stub(words: 1200)[
  Lateral inhibition means the visual system differentiates. A quantiser produces step
  discontinuities. Those two facts multiply, which is why banding is far more visible
  than its amplitude suggests.
]

== Bit depth, and where to spend it

#stub(sources: ("itu-bt2100",), words: 1100)[
  10-bit, 12-bit, half-float. What HDR requires, and the specific argument for why PQ
  at 10 bits beats sRGB at 10 bits over the same range.
]

== Dither as noise shaping

#stub(sources: ("ulichney-1993-void",), words: 1400)[
  Reframe: dithering adds noise before quantising in order to decorrelate the error
  from the signal. This is the same trick as in audio, and stating it that way makes
  every later algorithm a question about the *spectrum* of the added noise.
]

#fig("dither-methods")

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
