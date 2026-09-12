---
id: 25
title: Ch 16 — Colour in the Rendering Pipeline
type: chapter
status: backlog
milestone: v0.6
depends_on:
- 53
created: 2026-09-11
updated: 2026-09-11
priority: p1
chapter: ch16
words: '6700'
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

**The argument.** Real-time and offline rendering are where every idea in this book has to be made cheap. The pipeline has a specific shape --- decode, work in scene-linear, tone- map, encode --- and almost every rendering artefact with a colour flavour comes from doing one of those steps in the wrong place.

5 sections · 6,700 planned words · part IV
Outline: `outline/ch16.outline.ts`

**Sources.** `aces-system`, `itu-bt2100`, `poynton-video`
