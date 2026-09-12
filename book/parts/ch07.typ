#import "../lib/book.typ": *

#chapter(
  7,
  epigraph: [CIELAB was built so that Euclidean distance would mean something. Chapter 9 is the story of how badly that went.],
)[Perceptual Spaces, and the Cylinders on Top of Them]

#lead[
  XYZ is linear and useless for judgement; RGB is device-bound. A perceptual space is
  an attempt to warp tristimulus space so that geometry matches experience. This
  chapter presents those attempts in order, then the cylindrical coordinates the
  industry ships on top of them --- because the gap between the two is where most
  interface colour bugs live.
]

== What 'uniform' would mean

#stub(sources: ("fairchild-appearance",), words: 900)[
  Define the goal precisely --- equal distances should be equally noticeable --- and
  note immediately that this is a strong claim about a metric space and that no such
  space exists exactly.
]

== CIELAB

#stub(sources: ("cie-15-colorimetry",), words: 1600)[
  The cube root as a compressive nonlinearity, the linear segment near black and why
  it is there, the opponent axes, and the relationship between $L^*$ and luminance.
  Derive why $L^*$ = 50 is not half the light.
]

== CIELUV and the road not taken

#stub(sources: ("cie-15-colorimetry",), words: 700)[
  The alternative that kept a projective chromaticity diagram, why the television
  industry preferred it, and why it lost.
]

== Oklab

#stub(sources: ("ottosson-oklab",), words: 1600)[
  A modern fit: same architecture as CIELAB, better cone matrix, better exponent,
  fitted against newer data. Show the matrices, note that it is a fit and not a
  theory, and show where it improves on CIELAB --- particularly the blue hue shift
  that CIELAB gets visibly wrong. Note also that its neutral axis misses sRGB's by
  about two parts in ten thousand, which is what being a fit costs.
]

== The cylinders: HSL, HSV and how they are built

#stub(words: 1300)[
  Derive HSL and HSV from the gamma-encoded RGB cube geometrically, so the reader sees
  exactly what they are: max, min, and a hue angle determined by which face you are
  on. No perceptual data enters anywhere. Then give them a fair hearing --- they are
  cheap, they are in every picker, and for nudging one hue they are adequate.
]

== Measuring the damage

#stub(sources: ("ottosson-oklab",), words: 1500)[
  Sweep the hue circle at fixed HSL lightness and plot what three other models say.
  HSL reports a flat line; CIE $L^*$ swings by sixty units. Quantify it, and show what
  it does to a real interface.
]

#fig("lightness-comparison")

== LCh, Oklch and HWB

#stub(sources: ("css-color-4", "ottosson-oklab"), words: 1500)[
  The replacements with the same ergonomics and a real metric underneath, plus the
  Ostwald-flavoured HWB. The one genuine difficulty: a cylindrical perceptual space
  has a gamut boundary that varies with hue, so a chroma slider cannot have a fixed
  range. That is a real cost and the chapter should not pretend otherwise.
]

Returns to #figref("oklch-gamut-slice").

== Appearance models, briefly

#stub(sources: ("fairchild-appearance",), words: 1100)[
  CIECAM02 and CAM16 exist because a colour's appearance depends on the surround, the
  adapting luminance and the background, and none of the spaces above know any of
  that. Sketch the architecture, state what it buys, and be clear that most software
  will never use it.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
