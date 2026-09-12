---
key: smpte-st2084
type: standard
title: "High Dynamic Range Electro-Optical Transfer Function of Mastering Reference Displays"
year: 2014
publisher: Society of Motion Picture and Television Engineers
number: SMPTE ST 2084:2014
tier: primary
author:
  - "Society of Motion Picture and Television Engineers"
---

## Why it matters

The perceptual quantiser. The only transfer function in this book whose shape
comes from a model of human contrast sensitivity rather than from display
hardware, which makes it the right example for Chapter 7's closing argument.

## Claims

- [high | §Annex A] {#pq-from-barten} The PQ curve is derived from Barten's contrast sensitivity model so that quantisation steps fall below the visibility threshold across 0 to 10 000 cd/m². #hdr #transfer
- [high | §5] {#pq-absolute} PQ encodes absolute luminance in cd/m², not a relative value, so a PQ code means the same light level regardless of the display. #hdr

## Notes

The constants (m1, m2, c1, c2, c3) are rational numbers with denominators that
are powers of two, which is a hint about the fixed-point hardware they were
designed for.
