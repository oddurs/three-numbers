#import "../lib/book.typ": *

#chapter(
  18,
  epigraph: [WCAG 2's contrast ratio is a formula from 1988 wearing the clothes of a legal requirement.],
)[Contrast, Legibility and the Standards]

#lead[
  Text has to be readable. The web has a mandated formula for deciding whether it is,
  the formula is known to be wrong in specific and predictable ways, and it is
  nonetheless load-bearing in law and procurement. Treat this carefully and fairly.
]

== The WCAG 2 formula

#stub(sources: ("wcag-2",), words: 1100)[
  Where the (L1+0.05)/(L2+0.05) ratio comes from, what the 0.05 is doing, and what the
  4.5:1 threshold was calibrated against.
]

== Where it fails

#stub(sources: ("apca", "wcag-2"), words: 1500)[
  Two documented failure modes: it is roughly symmetric under polarity inversion when
  perception is not, so dark-mode pairs are systematically mis- scored; and it ignores
  font size and weight beyond a single coarse threshold. Show pairs that pass and are
  unreadable, and pairs that fail and are fine.
]

== APCA and the successor problem

#stub(sources: ("apca",), words: 1300)[
  What a perceptually-grounded replacement looks like, why it is polarity- aware, and
  the standards-politics reality that a better formula must also be adoptable.
]

== Contrast beyond text

#stub(sources: ("wcag-2",), words: 1000)[
  Non-text contrast, focus indicators, charts, and the fact that most contrast
  guidance assumes a large uniform patch on a uniform ground, which describes almost
  nothing in a real interface.
]

== Dark mode as a colour problem

#stub(words: 1200)[
  Why a naive inversion fails: pure black backgrounds, halation with saturated text,
  and the fact that the eye's adaptation state differs between the two modes so the
  same ratio does not mean the same thing.
]

#exercises[
  #exercise-plan[
    Three to five problems, each doable against this repository: one
    derivation, one measurement, and one that asks the reader to decide
    something rather than compute it. See Chapters 1--3 for the pattern.
  ]
]

#chapter-end()
