---
key: sharma-2004-ciede2000
type: article
title: "The CIEDE2000 color-difference formula: Implementation notes, supplementary test data, and mathematical observations"
year: 2004
journal: Color Research & Application
volume: 30
issue: 1
pages: 21-30
doi: 10.1002/col.20070
url: https://doi.org/10.1002/col.20070
tier: primary
author:
  - "Sharma, Gaurav"
  - "Wu, Wencheng"
  - "Dalal, Edul N."
---

## Why it matters

TODO: one paragraph on why this source is in the bibliography.

## Claims

- [high | §2] {#de2000-terms} CIEDE2000 adds five corrections to CIE76: a chroma-dependent rescaling of a*, weighting functions for lightness, chroma and hue, and a rotation term. #difference
- [high | §4] {#de2000-rotation} The rotation term exists specifically to correct the blue region, where the earlier metrics failed most badly. #difference
- [high | Table 1] {#de2000-testdata} The paper supplies 34 reference pairs with expected ΔE00 values, which any implementation should reproduce; this book's implementation reproduces all of them to within 1e-4. #difference #conformance
- [medium | §3] {#de2000-discontinuity} The formula contains discontinuities in the hue-difference term that implementations must handle explicitly, and the paper documents several published implementations that do not. #difference

## Notes

The definitive implementation note. Cite this rather than CIE 142 when the
subject is *implementing* the formula rather than its normative status.
