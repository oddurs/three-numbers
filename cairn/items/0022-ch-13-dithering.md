---
id: 22
title: Ch 13 — Dithering
type: chapter
status: backlog
milestone: v0.6
depends_on:
- 53
created: 2026-09-11
updated: 2026-09-12
priority: p1
chapter: ch13
words: '4550'
part: IV
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

**The argument.** Four families of algorithm, one criterion. Because the eye is a low-pass filter, error at high spatial frequency is nearly free and error at low frequency is expensive. Every dithering method is a different attempt to push the error upward in frequency.

5 sections · 6,500 planned words · part IV
Outline: `outline/ch13.outline.ts`

**Figures.** `dither-methods`

**Sources.** `floyd-steinberg-1976`, `ulichney-1993-void`
