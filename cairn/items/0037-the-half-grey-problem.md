---
id: 37
title: The half-grey problem
type: figure
status: done
milestone: v0.2
created: 2026-09-11
updated: 2026-09-12
priority: p0
part: II
chapter: ch06
effort: m
---

## What it must show

<!-- The claim the figure makes. If it does not make one, it is decoration. -->

## Data

<!-- Which dataset or derivation. Nothing traced from another book. -->

- [x] Renders at its declared placement width
- [x] Direct labels rather than a legend, unless a legend carries more
- [x] No gridlines; range frame
- [x] Caption argues rather than describes
- [x] `check` green (width, glyph coverage, caption lint)

## 2026-09-11

**What it must show.** 128 next to the 21.4% grey it actually is, and the same image downscaled in encoded values and in linear light. The claim: the canonical bug, shown rather than asserted.

**Data.** Computed. Pairs with a real photograph if licensing allows; otherwise a synthetic test pattern.

## 2026-09-12

Drawn as part of the pilot (0015). `figures/ch06/half-grey.fig.ts`: a checkerboard emitting half the light, beside code 128 and code 188, so the reader can see the 2.3× error rather than be told it.

One thing worth recording for other figures: the demonstration is self-referential. If the software displaying the figure resamples it, that software will very likely average the code values and turn the checkerboard into the middle patch. The caption says so, which turns a rendering hazard into the point.
