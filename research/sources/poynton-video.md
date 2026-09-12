---
key: poynton-video
type: book
title: "Digital Video and HD: Algorithms and Interfaces"
year: 2012
publisher: Morgan Kaufmann
edition: 2
isbn: "978-0-12-391926-7"
tier: secondary
author:
  - "Poynton, Charles"
---

## Why it matters

The clearest available treatment of transfer functions, luma versus luminance,
and the practical consequences of doing arithmetic on gamma-encoded values.
Poynton is the source most responsible for the industry noticing that these were
distinct questions at all, and Chapters 7, 10 and 14 lean on him heavily.

## Claims

- [high | ch. 24] {#gamma-not-a-mistake} The gamma-encoded representation is not merely a CRT artefact retained for compatibility: its rough match to perceptual lightness makes it an efficient coding of light for a fixed number of bits. #transfer
- [high | ch. 24] {#luma-vs-luminance} Luma (Y') computed from gamma-encoded components is not luminance (Y), and the industry's use of the same letter for both has caused persistent, specific errors. #luminance
- [high | ch. 25] {#linear-filtering} Filtering, resampling and blending must be performed on linear light; performing them on encoded values darkens the result in a way that is characteristic and diagnosable. #interpolation

## Notes

Poynton's "Gamma FAQ" and "Color FAQ" cover much of the same ground and are
freely available, but the book is the citable form.

## Notes

No book-level DOI; the ISBN is confirmed by the chapter DOIs Crossref
indexes under the prefix 10.1016/b978-0-12-391926-7.
