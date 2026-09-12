---
key: icc-v4
type: standard
title: "Image technology colour management — Architecture, profile format and data structure"
year: 2022
publisher: International Color Consortium
number: ICC.1:2022-05 (ISO 15076-1)
url: https://www.color.org/specification/ICC.1-2022-05.pdf
accessed: 2026-09-11
tier: primary
author:
  - "International Color Consortium"
---

## Why it matters

Defines what a colour profile actually is and what a rendering intent is
permitted to mean. Chapters 12 and 13 need it, and it is also the reason D50 is
the profile connection space's white, which surprises people who assume the
whole industry standardised on D65.

## Claims

- [high | §6.3] {#pcs-is-d50} The profile connection space is defined at D50, so every D65 space must be chromatically adapted on the way in and out. #adaptation
- [high | §Annex A] {#bradford-in-icc} The chromatic adaptation tag uses the Bradford transform; this is a specification choice, not a physical constant. #adaptation
- [medium | §6.4] {#intents-underspecified} The perceptual and saturation rendering intents are defined by intent rather than by transform, so two vendors' "perceptual" can legitimately differ. #gamut

## Notes

Free download from color.org; ISO 15076-1 is the paywalled identical text.
