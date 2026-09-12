#import "../lib/book.typ": *

#chapter(
  1,
  epigraph: [A spectrum is a vector. Everything else in this chapter is that sentence with units attached.],
)[Light as a Signal]

#lead[
  Treat spectral power distributions as what they are --- elements of a function space
  --- and the operations that matter become familiar. Reflection is pointwise
  multiplication. Mixing lights is addition. Measurement is an inner product. The only
  unusual thing is that the space is infinite-dimensional and the measurements number
  three.
]

== Spectral power distributions

#stub(sources: ("cie-15-colorimetry",), words: 1050)[
  Define the SPD, its units, and the difference between radiometric and photometric
  quantities --- the distinction that makes 'brightness' ambiguous and 'luminance'
  precise. Introduce the repository's `Spectrum` type as a uniformly sampled function
  and be explicit about what sampling costs. Open with the visible band itself, and
  with the fact that no display has ever shown the reader a single wavelength.
]

#fig("visible-spectrum")

== Black bodies and Planck's law

#stub(words: 1200)[
  Derive the thermal spectrum, in enough detail that the reader sees where the
  constants come from, and show that colour temperature is a real physical
  parameterisation rather than a marketing term. Wien's law as the peak; the Planckian
  locus as the trajectory.
]

#fig("blackbody-spectra")

== Real sources and their spectra

#stub(sources: ("cvrl-database",), words: 900)[
  Daylight, tungsten, fluorescent, LED. The key contrast: thermal sources are smooth,
  and everything else is spiky. Narrow-band sources are why two paints can match in a
  shop and not in a car park.
]

== Reflectance, transmittance, and the surface

#stub(words: 700)[
  Pointwise multiplication, and why 'the colour of an object' is a category error that
  we get away with because daylight is smooth and broadly flat.
]

== Standard illuminants

#stub(sources: ("cie-15-colorimetry", "cvrl-database"), words: 850)[
  Why the CIE had to standardise light before it could standardise colour. D65, A, E,
  and the daylight locus as a cubic fit to measured sky. Note that the engine computes
  the illuminant A white point from its published SPD and lands within 0.0005 of the
  published chromaticity --- a small demonstration that the tables are consistent.
]

#exercises[
  #exercise(kind: "code")[
    Integrate the published D65 spectrum against the 1931 observer and recover its
    chromaticity. How far from the published (0.3127, 0.3290) do you land, and is the
    difference in the data or in your quadrature?
  ]
  #exercise(kind: "think")[
    Wien's law puts a 2856 K black body's peak at about 1015 nm, well outside the
    visible band. Explain why illuminant A nonetheless looks yellow rather than dark
    red.
  ]
  #exercise(kind: "code", hint: [You are constructing a pair of illuminant metamers.])[
    Take two light sources with the same correlated colour temperature — one
    Planckian, one a three-line LED. Show that CCT is not sufficient to predict how a
    surface will look under them.
  ]
]

#chapter-end()
