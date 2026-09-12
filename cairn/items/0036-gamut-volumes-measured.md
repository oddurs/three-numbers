---
id: 36
title: Gamut volumes, measured
type: figure
status: backlog
milestone: v0.4
created: 2026-09-11
updated: 2026-09-11
priority: p1
part: II
chapter: ch05
effort: m
---

## What it must show

<!-- The claim the figure makes. If it does not make one, it is decoration. -->

## Data

<!-- Which dataset or derivation. Nothing traced from another book. -->

- [ ] Renders at its declared placement width
- [ ] Direct labels rather than a legend, unless a legend carries more
- [ ] No gridlines; range frame
- [ ] Caption argues rather than describes
- [ ] `check` green (width, glyph coverage, caption lint)

## 2026-09-11

**What it must show.** Oklab volumes of the nine RGB spaces as a bar chart, relative to sRGB. The claim: this is what should replace comparing areas on a chromaticity diagram, and the sRGB-to-P3 difference is smaller than the marketing suggests.

**Data.** engine already computes this — gamutVolumeOklab, and the numbers are in Appendix A.
