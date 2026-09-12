---
id: 14
title: Ch 5 — Building an RGB Space
type: chapter
status: backlog
milestone: v0.4
depends_on:
- 53
created: 2026-09-11
updated: 2026-09-12
priority: p1
chapter: ch05
words: '4550'
part: II
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

**The argument.** Derive the sRGB matrix from scratch in four lines of linear algebra, then show that every other RGB space differs only in which numbers you feed the same derivation. The matrices everyone copies off web pages are outputs, not inputs.

5 sections · 6,500 planned words · part II
Outline: `outline/ch05.outline.ts`

**Figures.** `cie-1931-chromaticity`, `oklch-gamut-slice`

**Sources.** `css-color-4`, `poynton-video`
