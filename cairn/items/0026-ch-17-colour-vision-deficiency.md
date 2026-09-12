---
id: 26
title: Ch 17 — Colour Vision Deficiency
type: chapter
status: backlog
milestone: v0.7
depends_on:
- 53
created: 2026-09-11
updated: 2026-09-12
priority: p1
chapter: ch17
words: '4750'
part: V
effort: l
---

## The argument

<!-- One sentence: what this chapter has to establish. Copy from the outline's `lead`. -->

## Before drafting

- [ ] Read the evidence sheet: `node engine/cli.ts research evidence`
- [ ] Every non-obvious claim traces to a distilled claim, or a source is added
- [ ] Figures this chapter needs exist, or have their own items
- [ ] Re-read the outline declaration; fix it now if the plan is wrong

## Drafting

- [ ] Prose written to the word budget, ±20%
- [ ] `status: "drafting"` set in `outline/chNN.outline.ts` *before* writing
      into `book/parts/`, or the next `outline sync` overwrites it
- [ ] Every figure placed once, cross-referenced after
- [ ] Exercises: three to five, at least one of each kind

## Revising

- [ ] Reassurance adverbs gone (honestly, genuinely, actually, precisely)
- [ ] Em-dashes under ~3 per 1,000 words
- [ ] No paragraph asserts something a reader could not check
- [ ] Read aloud once, start to finish
- [ ] `node engine/cli.ts check` green
- [ ] `status: "written"` set in the outline declaration

## Notes

## 2026-09-11

**The argument.** Around eight percent of men have some form of colour vision deficiency. Simulating it correctly is not a matter of desaturating the red channel; it is a well-defined geometric operation in cone space, and once you have it, designing for it becomes an optimisation problem rather than a guess.

5 sections · 6,800 planned words · part V
Outline: `outline/ch17.outline.ts`

**Figures.** `cvd-simulation`

**Sources.** `brettel-1997-computerized`, `machado-2009-cvd`, `stockman-2000-spectral`
