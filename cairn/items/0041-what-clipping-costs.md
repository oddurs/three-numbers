---
id: 41
title: What clipping costs
type: figure
status: backlog
milestone: v0.5
created: 2026-09-11
updated: 2026-09-11
priority: p0
part: III
chapter: ch10
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

**What it must show.** An out-of-gamut ramp clipped per channel beside the same ramp gamut-mapped, with the hue shift measured. The claim: clipping rotates hue, worst exactly where the colour was most saturated.

**Data.** Computed — both paths already exist in engine/color/gamut.ts.
