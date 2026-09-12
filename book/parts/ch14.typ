#import "../lib/book.typ": *

#chapter(
  14,
  epigraph: [Choosing k colours is a clustering problem. Choosing k *distinguishable* colours is a packing problem. They are not the same problem and they do not have the same answer.],
)[Palettes]

#lead[
  Two questions that look alike. Reducing an image to k colours is clustering, and the
  answer depends entirely on the metric. Designing k colours that a reader can tell
  apart is sphere packing under a perceptual metric with constraints, and the
  constraints are where the interesting work is.
]

== Median cut and octrees

#stub(sources: ("heckbert-1982-color",), words: 900)[
  Heckbert's algorithm, its speed, and its characteristic bias. Octree quantisation as
  the streaming alternative. Both operate on RGB, which is the problem.
]

== k-means in a perceptual space

#stub(sources: ("ottosson-oklab",), words: 850)[
  The same clustering with a metric that means something, and a demonstration of how
  much the choice of space changes the result. k-means++ seeding, and determinism as a
  requirement for reproducible builds.
]

== Sequential and diverging ramps

#stub(sources: ("moreland-diverging",), words: 1050)[
  What a colourmap for continuous data owes the reader: monotone lightness above all,
  so that it survives greyscale printing and so that the data's ordering is visible to
  a dichromat. Why the rainbow map fails all of this and why it persists.
]

== Categorical palettes

#stub(sources: ("brettel-1997-computerized",), words: 1100)[
  Farthest-point sampling under a perceptual metric, and the key move: measure
  separation as the *worst case* across normal vision and each deficiency, so that a
  pair which only survives trichromacy is rejected during generation rather than
  caught in review.
]

#fig("cvd-simulation")

== The constraint nobody mentions

#stub(figures: ("cvd-simulation",), sources: ("brettel-1997-computerized",), words: 850)[
  Beyond about four entries, hue alone cannot separate a palette for a dichromat,
  because dichromacy collapses the hue circle to roughly one dimension. Lightness must
  do the work. Derive the number, and note that the book's own figure palette was
  generated under exactly this constraint.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
