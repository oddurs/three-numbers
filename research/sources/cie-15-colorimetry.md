---
key: cie-15-colorimetry
type: standard
title: "Colorimetry, 4th Edition"
year: 2018
publisher: International Commission on Illumination (CIE)
number: CIE 015:2018
doi: 10.25039/TR.015.2018
tier: primary
author:
  - "International Commission on Illumination"
---

## Why it matters

The document that defines the objects this book spends four chapters building:
the standard colorimetric observers, the standard illuminants, the tristimulus
integrals, CIELAB and CIELUV, and the conventions for normalising them. Where
this book and a secondary source disagree, this is the tiebreaker.

## Claims

- [high | §3.1] {#cmf-definition} The 1931 standard colorimetric observer is defined by tabulated x̄, ȳ, z̄ functions from 360 to 830 nm at 1 nm, with the 5 nm table as the abridged form. #observer
- [high | §7.1] {#ybar-is-v-lambda} ȳ(λ) is identical to the photopic luminous efficiency function V(λ), by construction of the XYZ basis. #observer #luminance
- [high | §7.2] {#tristimulus-integral} Tristimulus values of a reflecting object are computed as a normalised sum over the product of illuminant SPD, reflectance and colour-matching function, with k chosen so that a perfect diffuser gives Y = 100. #integration
- [high | §8.2] {#lab-constants} CIELAB's nonlinearity uses ε = 216/24389 and κ = 24389/27, chosen so that the cube-root branch and the linear branch meet with matching value and slope. #cielab
- [medium | §11] {#observer-known-wrong} The 1931 observer is known to under-predict sensitivity in the short-wavelength region; the 2006 physiologically-based observer exists but has not displaced it in industry. #observer

## Notes

The 2018 edition supersedes CIE 15:2004. Section numbering differs between
editions, so locators here refer to the 4th edition only.
