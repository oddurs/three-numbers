---
key: aces-system
type: standard
title: "Academy Color Encoding System (ACES) — System Overview"
year: 2022
publisher: Academy of Motion Picture Arts and Sciences
number: TB-2014-004
url: https://docs.acescentral.com/
accessed: 2026-09-11
tier: primary
author:
  - "Academy of Motion Picture Arts and Sciences"
---

## Why it matters

The reference architecture for a scene-linear pipeline: where to decode, what
to work in, and what the output transform is for. Chapter 17 is largely a
reading of this document for programmers who are not in film.

## Claims

- [high | §overview] {#ap0-encloses-locus} AP0's three primaries all lie outside the spectrum locus, so the ACES2065-1 encoding can represent every visible colour with non-negative values. #gamut
- [high | §overview] {#ap1-for-rendering} AP1 is a smaller, more practical set used for rendering and grading, because AP0's primaries are so far outside the locus that arithmetic in it is numerically awkward. #gamut
- [medium | §output] {#output-transform-is-opinion} The ACES output transform bundles tone mapping and gamut mapping into a single opinionated curve; it is a look, not a neutral conversion. #tonemapping

## Notes

ACEScct and ACEScc are log encodings for grading and are distinct from ACEScg;
the distinction bites in practice and should be spelled out in the chapter.
