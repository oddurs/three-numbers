---
key: css-color-4
type: web
title: "CSS Color Module Level 4"
url: https://www.w3.org/TR/css-color-4/
accessed: 2026-09-11
tier: primary
---

## Why it matters

The specification that brought Lab, Oklab, Oklch, wide-gamut colour and an
explicit gamut-mapping algorithm to the web, and in doing so made these ideas
mainstream. Its sample code is also the most widely deployed reference
implementation of several conversions in this book.

## Claims

- [high | §12] {#css-gamut-map} The gamut-mapping algorithm holds Oklch lightness and hue fixed and binary-searches chroma, accepting a result once its clipped form is within ΔE_ok 0.02 of the unclipped one. #gamut
- [high | §14] {#css-srgb-matrix} The sRGB matrix in the sample code derives D65 from its xy chromaticity rather than quoting a rounded XYZ triple, which is why it differs in the fourth decimal from the commonly copied table. #matrices
- [high | §12.3] {#css-hue-strategies} Cylindrical interpolation must specify a hue strategy — shorter, longer, increasing or decreasing — because two hues are joined by two arcs. #interpolation
- [medium | §10] {#css-interpolation-default} Interpolation defaults to Oklab for colour mixing, rather than to sRGB. #interpolation

## Claims

<!-- - [high | §1.2] {#some-id} The distilled claim, in your own words. -->
