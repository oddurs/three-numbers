#import "../lib/book.typ": *

#chapter(
  9,
  epigraph: [CIEDE2000 has five correction terms. Each one is an apology for a failure of the space it corrects.],
)[Distance]

#lead[
  How different are two colours? The question sounds simple and has consumed seventy
  years of committee work. Follow the sequence from Euclidean distance to CIEDE2000 as
  a series of empirical failures and patches, then ask what Oklab's claim to need no
  patches amounts to.
]

== Just-noticeable differences

#stub(sources: ("macadam-1942-visual",), words: 1400)[
  MacAdam's experiment and its result: discrimination thresholds are ellipses, they
  vary by an order of magnitude, and they are oriented. Any metric that ignores this
  is wrong by a factor of ten somewhere.
]

== CIE76 and its failure

#stub(sources: ("cie-15-colorimetry",), words: 1200)[
  Euclidean distance in CIELAB, the reason it was expected to work, and where it does
  not: saturated blues, near-neutrals, and lightness at the extremes.
]

#fig("delta-e-contours")

== CIEDE2000, term by term

#stub(figures: ("delta-e-contours",), sources: ("sharma-2004-ciede2000",), words: 2000)[
  Walk the formula and attribute every term to the failure it repairs: the chroma
  rescaling of $a^*$, the three weighting functions, and the notorious rotation term
  that exists solely to fix the blue region. Verify the implementation against
  Sharma's published conformance set --- all thirty- four pairs --- and say so.
]

== What a delta-E means

#stub(sources: ("sharma-2004-ciede2000",), words: 1200)[
  A sober section on interpretation. One unit is not one JND except approximately,
  under specific viewing conditions, for large uniform patches. Tolerancing in print,
  textiles and manufacturing, and the CMC formula's asymmetry as a cautionary tale.
]

== Oklab, ICtCp, and modern metrics

#stub(figures: ("delta-e-contours",), sources: ("itu-bt2100", "ottosson-oklab"), words: 1300)[
  Euclidean distance in Oklab as a claim that the space is uniform enough not to need
  corrections. Delta-E ITP for HDR, where the old metrics have no defined behaviour
  above 100 nits.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
