---
id: 55
title: Retrospective on the pilot
type: docs
status: done
milestone: v0.2
assignee: Oddur Sigurdsson
labels:
- pilot
created: 2026-09-11
updated: 2026-09-12
priority: p0
effort: s
part: whole
---

## 2026-09-11

**Method.** With Chapter 6 finished: how long did each stage take, what did the checklist miss, what did `check` catch that a human would not have, and what did a human catch that `check` should have.

Amend the chapter template in `cairn.toml` and the process doc. The cost of getting this wrong is paid eighteen more times.

## 2026-09-12

**Retrospective on the pilot — Chapter 6, The Transfer Function**

Written end to end: research, figures, draft, revision, gate. 4,388 words, two figures, five exercises, three listings, thirteen margin items. `check` green.

## What the process got wrong

**1. The evidence sheet was empty for the chapter about to be written.**
The process opens with 'read the evidence sheet'. `renderEvidence` only knew about `@key` citations in prose and figure `sources` — neither of which exists before a chapter is drafted. The outline declaration, the one place sources live beforehand, was not consulted. Fixed: evidence sheets now read the outline.

**2. The word budgets were 40% too high.**
Planned 7,500; the chapter came out at 4,388 and reads complete. The budgets were estimated before a single section existed. Recalibrated all 94 remaining sections by 0.70 — deliberately not the measured 0.585, because one chapter is a sample of one and this one is unusually figure-dense. The book is now planned at 90,950 words rather than 130,600, about 227 pages of prose. **Re-measure after Part I.**

**3. The budget assumed one column; the layout has two.**
The first draft used three margin items in the whole chapter and left the 56 mm column empty for pages at a time. Margin content is additional words that do not lengthen the main text, and nothing in the outline accounted for it. The finished chapter has thirteen.

**4. Voice rules were written down and unenforced.**
`docs/writing-process.md` said the generator 'cannot touch a hand-written chapter, so this is where that debt is paid' — by a person, from memory. It was not paid: the first draft had 40 em-dashes in 4,583 words (8.7 per 1,000 against a budget of 3) and five reassurance adverbs. Built `engine/book/lint.ts`; `check` now measures both. Chapter 6 is clean; six warnings remain in generated stubs.

## Engine defects the pilot exposed

- **Figure chapter drift.** Eleven of thirteen figures still declared pre-restructure chapter numbers. Invisible because each figure's `chapter` field agreed with its directory and nothing compared either against the outline. Fixed, moved, and `outline check` now reports `figure-chapter-drift`.
- **Margin notes collided.** No avoidance: two notes anchored a few lines apart drew on top of each other. The margin column now keeps a cursor.
- **Listings overflowed the measure.** Typst wraps a 79-character code line silently, turning a table of numbers into gibberish. `check` now errors above 54 characters.
- **A units regex rewrote text inside a code block**, injecting `#qty()` into raw output. Caught by the width check, not by anything designed to catch it.
- **The `honestly` rule required a trailing space**, so an adverb ending a heading survived into the book.

## What the process got right

Setting `status: "drafting"` before writing was the correct first instruction and would have cost a whole chapter without it. Separating revision from drafting worked: every voice problem was found in the revision pass, none during drafting. The figure-before-prose rule paid off — writing the half-grey figure first changed what the section needed to say, because the picture carries the argument and the prose only has to point at it.

## Changes to make

- [x] Evidence sheets read the outline
- [x] Budgets recalibrated by 0.70
- [x] Prose linter built and wired into `check`
- [x] Figure-chapter drift detection
- [x] Margin collision avoidance
- [x] Listing width check
- [x] Loosen the word gate from ±20% to ±35% and say the argument matters more
- [x] Add 'margin apparatus: aim for one item per two pages' to the chapter template
- [ ] Clean the six em-dash warnings in the generated stubs

## 2026-09-12

All three open actions applied: gate loosened to ±35% with the reasoning recorded, margin apparatus added to the chapter template, and the voice warnings wired into the checklist as `check --all`.
