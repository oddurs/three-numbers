#import "../lib/book.typ": *

#chapter(
  2,
  epigraph: [the Rays to speak properly are not coloured. In them there is nothing else than a certain Power and Disposition to stir up a Sensation of this or that Colour. \\#todo[verify wording against the 1730 fourth edition]],
  epigraph-source: [Isaac Newton, Opticks, 1704],
)[Three Numbers]

#lead[
  This is the pivot of Part I. Three cone types, three inner products, one 3-vector.
  From that single fact derive Grassmann's laws, the existence of metamers, and the
  reason colour arithmetic is linear at all --- which is the property that makes every
  matrix in the rest of the book legitimate.
]

== Cones as inner products

#stub(sources: ("stockman-2000-spectral", "cvrl-database"), words: 1400)[
  The L, M and S fundamentals from Stockman and Sharpe, plotted from the measured
  data. Emphasise the overlap between L and M: they are far more similar than
  intuition suggests, which is why red-green deficiency is common and blue-yellow is
  rare.
]

== Grassmann's laws and why colour is linear

#stub(words: 1200)[
  State the laws as the empirical claim that colour matching is a linear map, note
  that this is a *contingent experimental fact* rather than a necessity, and note
  where it breaks down --- very low light, very high saturation, very small fields.
]

== Metamerism, constructed

#stub(sources: ("cie-15-colorimetry",), words: 1800)[
  Build a metamer explicitly by solving a 3x3 system rather than by searching: pick
  three emission lines, solve for the weights that reproduce a target's tristimulus
  values, and observe that the answer is exact and the spectra share nothing.
  Distinguish illuminant metamerism, observer metamerism, and geometric metamerism,
  and note which one ruins car paint.
]

#fig("metamer-pair")

== The null space, and what lives in it

#stub(sources: ("wyszecki-stiles",), words: 1300)[
  Formalise: the set of spectra invisible to the eye is a closed subspace of enormous
  dimension. Fundamental metamers and the black-metamer decomposition. This is the
  cleanest statement of what colour vision discards.
]

== Rods, and the part of the model we are ignoring

#stub(words: 800)[
  Scotopic vision, the Purkinje shift, and an honest statement that this book assumes
  photopic conditions throughout and that mesopic vision is a unsolved practical
  problem.
]

#exercises[
  #exercise(kind: "code")[
    Construct a metamer for a given reflectance using four narrow lines instead of
    three. The system is now underdetermined: describe the solution space, and find
    the member of it with the smallest total power.
  ]
  #exercise(kind: "proof")[
    Prove that the set of spectra invisible to a trichromat is a linear subspace, and
    give its dimension for a spectrum sampled at 5 nm from 380 to 730 nm.
  ]
  #exercise(kind: "think")[
    Two paints match under D65 and diverge under illuminant A. Using only the
    definition of the tristimulus integral, explain why no choice of three-number
    colour space can prevent this.
  ]
]

#chapter-end()
