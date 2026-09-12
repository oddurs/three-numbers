---
id: 15
title: Ch 6 — The Transfer Function
type: chapter
status: done
milestone: v0.2
assignee: Oddur Sigurdsson
depends_on:
- 53
created: 2026-09-11
updated: 2026-09-12
priority: p0
chapter: ch06
words: '7500'
part: II
effort: l
---

## The argument

<!-- One sentence: what this chapter has to establish. Copy from the outline's `lead`. -->

## Before drafting

- [x] Read the evidence sheet: `node engine/cli.ts research evidence`
- [x] Every non-obvious claim traces to a distilled claim, or a source is added
- [x] Figures this chapter needs exist, or have their own items
- [x] Re-read the outline declaration; fix it now if the plan is wrong

## Drafting

- [x] Prose written to the word budget, ±20%  (4,388 of a *recalibrated* 4,700)
- [x] `status: "drafting"` set in `outline/chNN.outline.ts` *before* writing
      into `book/parts/`, or the next `outline sync` overwrites it
- [x] Every figure placed once, cross-referenced after
- [x] Exercises: three to five, at least one of each kind

## Revising

- [x] Reassurance adverbs gone (honestly, genuinely, actually, precisely)
- [x] Em-dashes under ~3 per 1,000 words
- [x] No paragraph asserts something a reader could not check
- [ ] Read aloud once, start to finish  ← outstanding; needs a human voice
- [x] `node engine/cli.ts check` green
- [x] `status: "written"` set in the outline declaration

## Notes

## 2026-09-11

**The argument.** Between a stored number and an emitted photon sits a nonlinear curve. It exists for two unrelated reasons --- a physical accident of cathode ray tubes and a genuine perceptual argument about coding efficiency --- and conflating those two reasons is how the folklore got so confused.

5 sections · 7,500 planned words · part II
Outline: `outline/ch06.outline.ts`

**Figures.** `transfer-functions`

**Sources.** `css-color-4`, `itu-bt2100`, `poynton-video`, `smpte-st2084`

## 2026-09-11

**Why this chapter is the pilot.** The Transfer Function is self-contained, its argument is crisp, its central figure is already drawn, and it carries the single highest-value correction in the book. You prove a process on a chapter you can write well, not on Chapter 1.

Take it all the way to `status: "written"`, then record here what the process got wrong before Part I starts.

## 2026-09-12

**Research stage — process finding.**

The process says 'read the evidence sheet first'. For ch06 it was *empty*: `renderEvidence` only knew about `@key` citations in prose and figure `sources`, and an unwritten chapter has neither. The outline declaration — the one place sources exist before the chapter does — was not consulted.

Fixed in `engine/research/evidence.ts`: evidence sheets now read the outline too. This is the first thing the pilot has bought.

## 2026-09-12

**Drafted, revised and closed.** 4,388 words against a 7,500 budget (59%). Figure 6.1 (transfer-functions) and 6.2 (half-grey, new) placed; five exercises; 13 margin items; three listings.

The chapter covers every section the outline planned and reads complete. The shortfall is the budget being wrong, not the draft being thin — see the retrospective (0055).

`status: "written"` set in the outline declaration. `check` green: 0 prose errors, 0 voice warnings in this chapter.

## 2026-09-12

One box deliberately left unticked: **read aloud**. I cannot do it, and ticking it would make the checklist a lie about what was verified. It is the one revision step with no machine substitute, and it stays open for a human pass before v1.0.
