# The writing process

Nineteen chapters written by improvisation will be nineteen different chapters.
This is the loop each one goes through, why the stages are separate, and which
gates are machine-checked and which are not.

The work itself is tracked in [`cairn/items/`](../cairn/items); the rendered
view is [`ROADMAP.md`](../ROADMAP.md).

```sh
cairn next            # what is ready to start
cairn claim <ID>      # take it
cairn board           # where every chapter stands
cairn roadmap         # progress towards the release
```

## The unit of work is a chapter

Not a section, not a part. A section is too small to have an argument, and a
part is too large to hold in your head while revising. Each chapter is one cairn
item carrying the same checklist, so the process is visible in the work rather
than remembered.

## Five stages, deliberately separate

A chapter moves left to right across the board:

```
backlog → planned → researching → drafting → revising → review → done
```

The three active stages are separate on purpose, and collapsing them is the
failure mode this process exists to prevent.

**Research before drafting**, because research done *during* drafting produces
prose shaped around whatever was easy to find. You write the paragraph, you need
a citation for it, and you go looking for one — which is how a book ends up
arguing what its sources happened to say rather than what is true. Read the
evidence sheet first, distil the claims, then write.

**Revision after drafting, not during**, because a sentence revised as it is
written is a sentence that never gets finished. Draft to the word budget, then
stop, then revise as a separate act on a separate day.

**Review after revision**, because handing a reviewer a draft you already know
is rough spends their attention on things you would have caught yourself.

## The per-chapter loop

### 1. Research

```sh
node engine/cli.ts research evidence     # per-chapter sources and claims
node engine/cli.ts outline show ch06     # the plan, in full
```

Read the evidence sheet before writing anything. Every non-obvious claim the
chapter will make needs a distilled claim behind it, with a locator and a
confidence — or a new source, added with metadata that was *looked up*:

```sh
node engine/cli.ts cite add 10.1364/JOSAA.14.002647 --tier primary
```

Then re-read the outline declaration. If the plan is wrong, fix it now: an
outline is cheap to change and a draft is not.

### 2. Figures first

Identify what the chapter needs before drafting, because a figure changes what
the prose has to do. A paragraph explaining a shape the reader can see is a
different paragraph from one substituting for a picture.

Each figure gets its own item, and the item states **the claim the figure
makes** before anyone draws it. A figure that makes no claim is decoration and
does not get an item.

### 3. Draft

Set the outline status **before** writing a word into `book/parts/`:

```ts
// outline/ch06.outline.ts
status: "drafting",
```

Miss this and the next `outline sync` overwrites you. The declaration stays
useful either way — it still supplies the running order, the word budget, and
which figures the chapter owns, so later chapters keep cross-referencing rather
than reprinting them.

Draft to the budget, ±20%. A chapter running 50% long is usually two chapters,
and finding that out at the outline stage is free.

### 4. Revise

Separately, and preferably not the same day. The things to look for are in
[`voice.md`](voice.md), and they are measurable rather than matters of taste:
reassurance adverbs, em-dash rate, the *is not X; it is Y* construction.

The generator strips those adverbs from outline prose automatically, but it
cannot touch a hand-written chapter. This is where that debt is paid.

Then read it aloud, start to finish. Nothing else finds a sentence that is
correct and unreadable.

### 5. Close the gate

```sh
node engine/cli.ts check
```

Then set `status: "written"` and close the item.

## What the machine checks, and what it cannot

`check` is a floor, not a standard. It knows about:

| | |
|---|---|
| Citations | a `@key` pointing at nothing; a figure asserting a claim with no sources |
| Sources | collected but never read; web sources gone stale; `disputed` claims still standing |
| Outline | numbering gaps, starved parts, sections stating a topic instead of an argument |
| Figures | rendered at the wrong width; placed twice; referenced but never placed; a label the body face cannot draw |
| Captions | `#4%` parsed as code; a bare `L*` swallowing the paragraph |

It cannot tell whether the argument is sound, whether the chapter earns its
length, or whether a sentence is worth reading. That is what the revision stage
and the technical review are for, and no amount of tooling replaces them.

## The passes

Five sweeps over the whole book, after all chapters are drafted, each its own
item with a stated method so it can be repeated identically:

- **Structural** — does the spine still carry? Part IV stops being downstream of
  the thesis *by design*; check that the transition is signposted rather than a
  place the book quietly becomes a reference manual.
- **Technical review** — readers who will disagree, from colour science, from
  graphics, from print. The highest-risk item in the plan: a book that computes
  everything is falsifiable in a way most books are not, which is the point and
  also the exposure.
- **Line** — the voice tics, measured.
- **Accessibility** — every figure under each dichromacy and in greyscale. A
  book that argues for designing under simulation and does not do it will not
  survive review. This belongs in `check`, not in a person's discipline.
- **Print** — on paper, at trim, ideally on a press. Given Chapter 15, figures
  that fail in CMYK would be an unusually pointed failure.

## Cadence

The milestone dates in the roadmap are a **guess** until one chapter has been
written end to end. That is what v0.2 is for: write Chapter 6, measure how long
each stage actually took, then replace the dates with the measured rate and say
in the changelog that they changed.

Chapter 6 is the pilot because it is self-contained, its argument is crisp, its
central figure is already drawn, and it carries the highest-value correction in
the book. You prove a process on a chapter you can write well, not on Chapter 1.

## Adding work

Never an ad-hoc TODO file. `cairn new` puts it on the board and in the roadmap:

```sh
cairn new "Find citable MacAdam ellipse data" --type research --milestone v0.4 --set priority=p0
```

Types are `chapter`, `figure`, `research`, `pass`, `engine` and `docs`. Each
seeds a template, so a figure item always states what it must show and a
research item always states the question.
