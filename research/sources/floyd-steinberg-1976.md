---
key: floyd-steinberg-1976
type: article
title: "An adaptive algorithm for spatial greyscale"
year: 1976
journal: Proceedings of the Society for Information Display
volume: 17
issue: 2
pages: 75-77
tier: primary
author:
  - "Floyd, Robert W."
  - "Steinberg, Louis"
---

## Why it matters

Two pages that defined error diffusion and are still the default half a century
later. Chapter 15 reconstructs the algorithm from the paper rather than from the
folklore version, which usually omits the serpentine scan.

## Claims

- [high | p. 76] {#fs-weights} The error from quantising a pixel is distributed to four not-yet-processed neighbours with weights 7, 3, 5 and 1 over 16. #dither
- [medium | p. 76] {#fs-serpentine} Alternating the scan direction on each row reduces the directional artefacts that a fixed left-to-right scan produces. #dither

## Notes

No DOI; the Proceedings are not indexed by Crossref. Verified against the
reproduction in Ulichney's *Digital Halftoning* (MIT Press, 1987).
