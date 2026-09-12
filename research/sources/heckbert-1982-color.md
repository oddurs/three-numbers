---
key: heckbert-1982-color
type: article
title: "Color image quantization for frame buffer display"
year: 1982
journal: ACM SIGGRAPH Computer Graphics
volume: 16
issue: 3
pages: 297-307
doi: 10.1145/965145.801294
url: https://doi.org/10.1145/965145.801294
tier: primary
author:
  - "Heckbert, Paul"
---

## Why it matters

TODO: one paragraph on why this source is in the bibliography.

## Claims

- [high | §4] {#median-cut} Median cut recursively splits the colour box along its longest axis at the median, producing k boxes whose means become the palette. #palette
- [medium | §4] {#median-cut-bias} Splitting at the median gives each box roughly equal *population* rather than equal volume, which biases the palette toward densely populated regions of the image. #palette
