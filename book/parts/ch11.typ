#import "../lib/book.typ": *

#chapter(
  11,
  epigraph: [You have never seen the colour of anything. You have seen its colour relative to what your visual system has decided is white.],
)[Adaptation and White]

#lead[
  The eye re-normalises. A sheet of paper reads as white under tungsten and under noon
  daylight, though the light reaching the eye differs by a factor of three in the
  blue. Modelling that re-normalisation is chromatic adaptation, and it is the one
  piece of genuine perceptual modelling that ordinary pipelines cannot avoid.
]

== Von Kries and independent gain control

#stub(sources: ("fairchild-appearance",), words: 850)[
  The hypothesis: each cone class scales independently to normalise the white. Three
  numbers, three gains. Show that this crude model explains most of what happens.
]

== Sharpened bases

#stub(sources: ("fairchild-appearance",), words: 900)[
  Bradford, CAT02 and CAT16 are all the same three-step construction with a different
  middle basis, and the bases are sharpened *beyond* physiology because doing so
  predicts the data better. That fact deserves a paragraph of discomfort.
]

== Doing it in code

#stub(sources: ("icc-v4",), words: 700)[
  The adaptation matrix as a product of three matrices, the D50/D65 transform that
  every ICC profile contains, and where in a pipeline adaptation belongs.
]

== White balance

#stub(words: 850)[
  Camera white balance as adaptation applied before capture is encoded, illuminant
  estimation as an ill-posed inverse problem, and grey-world and its descendants.
]

== The dress

#stub(sources: ("lafer-sousa-2015",), words: 1000)[
  A serious treatment of the 2015 photograph, because it is the best available
  demonstration that colour is an inference. The ambiguity is real, the two answers
  correspond to two different assumptions about the illuminant, and the image
  underdetermines the question.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
