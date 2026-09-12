---
id: 19
title: Ch 10 — Gamuts, Clipping and Mapping
type: chapter
status: backlog
milestone: v0.5
depends_on:
- 53
created: 2026-09-11
updated: 2026-09-11
priority: p1
chapter: ch10
words: '6400'
part: III
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

**The argument.** Every display can produce a bounded set of colours, and every real pipeline eventually asks for one outside it. What happens next is a design decision that most software makes by accident, in the form of a clamp.

5 sections · 6,400 planned words · part III
Outline: `outline/ch10.outline.ts`

**Figures.** `oklch-gamut-slice`

**Sources.** `css-color-4`, `icc-v4`
