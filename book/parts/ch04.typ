#import "../lib/book.typ": *

#chapter(
  4,
  epigraph: [The horseshoe is a shadow. Almost every claim people make by pointing at it is a claim about the shadow.],
)[Chromaticity and Its Shadows]

#lead[
  Normalise away intensity and two dimensions remain. The resulting diagram is the
  most recognisable image in the field and the most abused: it is a projective
  picture, distances in it mean nothing, and the areas people compare on it are not
  the quantities they think they are comparing.
]

== Projecting out intensity

#stub(sources: ("cie-15-colorimetry",), words: 850)[
  x = X/(X+Y+Z). A perspective projection from the origin onto a plane, and therefore
  a projective map: straight lines are preserved, which is why additive mixtures lie
  on chords, and *nothing else is*.
]

Returns to #figref("cie-1931-chromaticity").

== Reading the diagram correctly

#stub(words: 1000)[
  What the locus is, what the line of purples is and why it has no wavelength, where
  white sits and why that is a choice, and what the interior colours in every printed
  version of this diagram are --- which is: made up, because the page cannot show
  them.
]

Returns to #figref("cie-1931-chromaticity").

== Distances that lie

#stub(sources: ("macadam-1942-visual",), words: 1100)[
  MacAdam's ellipses: the discrimination threshold varies by an order of magnitude
  across the diagram. Therefore any statement of the form 'these two colours are close
  on the chromaticity diagram' is unfounded, and the widespread practice of comparing
  gamut *areas* on it is worse.
]

== $u' v'$ and the partial repair

#stub(sources: ("cie-15-colorimetry",), words: 700)[
  The 1976 UCS transform as a projective correction. It makes the ellipses rounder and
  is still not uniform. Useful as a lesson in how far a linear- fractional fix can
  take you.
]

== Dominant wavelength, purity, and colour temperature

#stub(words: 900)[
  The quantities people want from this diagram, defined properly, plus correlated
  colour temperature and why a single number for 'how blue is this white' requires a
  metric that the diagram does not have.
]

Returns to #figref("blackbody-spectra").

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
