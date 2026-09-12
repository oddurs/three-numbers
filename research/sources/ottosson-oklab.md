---
key: ottosson-oklab
type: web
title: "A perceptual color space for image processing"
url: https://bottosson.github.io/posts/oklab/
accessed: 2026-09-11
tier: primary
---

## Why it matters

The primary description of Oklab, by its author, including the fitting procedure
and the matrices. Chapters 8, 9, 10 and 11 use Oklab throughout, and this is the
only authoritative statement of what it is and what it claims.

## Claims

- [high | post] {#oklab-architecture} Oklab has the same architecture as CIELAB — a cone-like basis, a cube-root nonlinearity, and two opponent axes — with the matrices and exponent refitted against newer data. #oklab
- [high | post] {#oklab-hue-linearity} Oklab is fitted to improve hue linearity, particularly in the blue region where CIELAB's hue lines visibly bend. #oklab
- [medium | post] {#oklab-is-a-fit} Oklab is an empirical fit optimised against specific datasets, not a derivation from a model of the visual system; its authority rests on how well it performs, not on first principles. #oklab

## Notes

Published as a blog post rather than a peer-reviewed paper. Its adoption in CSS
Color 4 gives it de facto standing, but the claim above about it being a fit
should be stated plainly whenever the book leans on it.

## Claims

<!-- - [high | §1.2] {#some-id} The distilled claim, in your own words. -->
