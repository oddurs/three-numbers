#import "../lib/book.typ": *

#chapter(
  6,
  epigraph: [The single most expensive misunderstanding in graphics is that a pixel value is an amount of light.],
)[The Transfer Function]

#lead[
  Between a stored number and an emitted photon sits a nonlinear curve. It exists for
  two unrelated reasons --- a physical accident of cathode ray tubes and a genuine
  perceptual argument about coding efficiency --- and conflating those two reasons is
  how the folklore got so confused.
]

== Why there is a curve at all

#stub(sources: ("poynton-video",), words: 1400)[
  The CRT's power law, the happy coincidence that its inverse resembles perceptual
  lightness, and the resulting efficient allocation of code values. Modern displays
  have no such physics and emulate the curve anyway, for compatibility.
]

== sRGB is not gamma 2.2

#stub(sources: ("css-color-4",), words: 1500)[
  Show the two curves, show the error, and be precise about where it matters: about
  two percent through the midtones, and catastrophic in the deep shadows where the
  linear toe lives. Name the bug this causes.
]

#fig("transfer-functions")

== The half-grey problem

#stub(sources: ("poynton-video",), words: 1700)[
  Work the canonical example all the way through. 128 is not half of 255 in any sense
  that matters; the light is about 21.4 percent. Then show the consequences: image
  downscaling, alpha blending, antialiasing and blur all performed in the wrong space,
  with the same characteristic darkening.
]

== Linear workflows

#stub(words: 1300)[
  What it means to 'work in linear': where to decode, where to encode, what to store,
  and why a 16-bit or float buffer is not optional once you decode. The precision
  argument, quantitatively.
]

== High dynamic range

#stub(figures: ("transfer-functions",), sources: ("itu-bt2100", "smpte-st2084"), words: 1600)[
  PQ and HLG. PQ as the first transfer function in this book derived from a perceptual
  model rather than from hardware, absolute versus relative encoding, and why HDR
  forces the question 'how bright is white' to have a real answer.
]

#exercises[
  #exercise(kind: "proof")[
    Find the encoded value V at which decoding sRGB as a pure 2.2 power law is exactly
    correct, and explain why there are two such values rather than one.
  ]
  #exercise(kind: "code")[
    Resize an image by half in encoded values and in linear light. Measure the mean
    luminance of each result against the original and explain the sign of the error.
  ]
  #exercise(kind: "think")[
    PQ encodes absolute luminance. Work out what happens when PQ content mastered for
    1000 cd/m² is shown on a 400 cd/m² display with no tone mapping.
  ]
]

#chapter-end()
