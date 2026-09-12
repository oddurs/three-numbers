---
key: itu-bt2100
type: standard
title: "Image parameter values for high dynamic range television for use in production and international programme exchange"
year: 2018
publisher: International Telecommunication Union
number: ITU-R BT.2100-2
url: https://www.itu.int/rec/R-REC-BT.2100
accessed: 2026-09-11
tier: primary
author:
  - "International Telecommunication Union"
---

## Why it matters

Defines the two HDR transfer functions (PQ and HLG), the ICtCp colour
representation, and the Rec.2020 primaries in their HDR context. Chapters 7 and
11 take their HDR material from here.

## Claims

- [high | Table 4] {#ictcp-matrices} ICtCp is derived by transforming Rec.2020 linear RGB to an LMS basis, applying the transfer function per cone channel, and then applying a fixed 3×3 to reach I, Ct and Cp. #hdr
- [high | Table 4] {#nonlinearity-in-cone-space} Applying the nonlinearity in cone space rather than per display primary is what gives ICtCp better hue linearity than Y'CbCr. #hdr
- [medium | §7] {#hlg-relative} HLG is a relative, display-referred encoding while PQ is absolute and display-independent, which is why the two cannot be interchanged by a simple curve swap. #hdr

## Notes

BT.2124 defines ΔE_ITP on top of this and is cited separately where the metric
itself is the subject.
