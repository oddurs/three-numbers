#import "../lib/book.typ": *

#chapter(
  17,
  epigraph: [A dichromat's visual system is not a filtered version of yours. It is a projection onto a plane, and the plane is computable.],
)[Colour Vision Deficiency]

#lead[
  Around eight percent of men have some form of colour vision deficiency. Simulating
  it correctly is not a matter of desaturating the red channel; it is a well-defined
  geometric operation in cone space, and once you have it, designing for it becomes an
  optimisation problem rather than a guess.
]

== The genetics and the numbers

#stub(sources: ("stockman-2000-spectral",), words: 1300)[
  L, M and S cone opsins, why the L and M genes sit adjacent on the X chromosome and
  recombine, and where the prevalence figures come from. Anomalous trichromacy versus
  dichromacy, and why the former is more common and less discussed.
]

== Confusion lines

#stub(sources: ("brettel-1997-computerized",), words: 1400)[
  The geometry: a dichromat's confusions are straight lines in chromaticity meeting at
  a copunctal point --- the missing cone's own chromaticity. Derive this, because it
  makes everything else obvious.
]

== The Brettel projection

#stub(sources: ("brettel-1997-computerized", "stockman-2000-spectral"), words: 1800)[
  Build the simulation properly: project onto two half-planes hinged on the neutral
  axis, anchored at two specific wavelengths. Derive the half-planes from the measured
  cone fundamentals rather than copying a matrix, and be explicit about which LMS
  basis is being used and why the choice matters.
]

Returns to #figref("cvd-simulation").

== Anomalous trichromacy

#stub(sources: ("machado-2009-cvd",), words: 1000)[
  Why linear interpolation between normal and dichromatic vision is a convenience
  rather than a model, what Machado's approach does instead, and how much confidence
  any of it deserves.
]

== Designing for it

#stub(words: 1300)[
  Practical consequences: redundant encoding, the lightness constraint from Chapter
  14, testing under simulation as part of a build rather than as an audit, and the
  specific failure of red-green status indicators.
]

Returns to #figref("cvd-simulation").

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
