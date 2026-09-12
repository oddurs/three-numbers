---
key: ulichney-1993-void
type: article
title: "Void-and-cluster method for dither array generation"
year: 1993
journal: SPIE Proceedings
volume: 1913
pages: 332-343
doi: 10.1117/12.152707
url: https://doi.org/10.1117/12.152707
tier: primary
author:
  - "Ulichney, Robert A."
---

## Why it matters

TODO: one paragraph on why this source is in the bibliography.

## Claims

- [high | §2] {#void-cluster-algorithm} The void-and-cluster method builds a dither array by repeatedly locating the tightest cluster and the largest void in a binary pattern and swapping them, then ranking pixels by the order in which they are removed and added. #dither
- [high | §1] {#blue-noise-spectrum} A blue-noise dither pattern has its energy concentrated at high spatial frequencies, where the visual system's contrast sensitivity is lowest, which is why its grain reads as texture rather than as pattern. #dither
- [medium | §3] {#mask-is-tileable} The resulting threshold array tiles without seams and can be evaluated per pixel independently, which is what makes it suitable for parallel hardware. #dither
