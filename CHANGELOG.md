# Changelog

Notable changes to the book and to the engine that builds it.

Versions follow `MAJOR.MINOR.PATCH`, read for a book rather than a library:

- **MAJOR** — a new edition. Chapter numbering may change; page references break.
- **MINOR** — new or substantially rewritten chapters and figures.
- **PATCH** — corrections, typography, engine work with no effect on the text.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Chapter 6, The Transfer Function** — the first written chapter. 4,388 words,
  two figures, five exercises, thirteen margin items.
- **Figure: the half-grey problem.** A checkerboard emitting half the light,
  beside code 128 and code 188, so the reader can see that averaging code values
  lands 2.3× too dark.
- **`engine/book/lint.ts`** — voice and layout checks on hand-written prose:
  code listings wider than the measure (an error; Typst wraps them silently),
  reassurance adverbs, and em-dash rate.
- **Margin collision avoidance.** Two notes anchored a few lines apart drew on
  top of each other; the column now keeps a cursor.
- **`figure-chapter-drift` detection.** Eleven of thirteen figures still declared
  pre-restructure chapter numbers, invisible because each figure's field agreed
  with its own directory.
- Evidence sheets read the outline, so they are useful *before* a chapter is
  written — which is when the process asks for them.

### Changed

- **Word budgets recalibrated from measurement.** 130,600 planned words became
  90,950 after the pilot came in at 59% of its budget without being thin. The
  drafting gate loosened from ±20% to ±35%, because a section that discharges
  its argument is finished.
- Milestone dates recomputed from the new scope. The rate they assume is still
  an assumption, and says so.

### Added

- **A process-driven plan to the release candidate.** Nine milestones and
  sixty-nine items, tracked with `cairn` as Markdown in the repository. The
  statuses are a writing pipeline rather than a software one — research,
  drafting and revision are separate stages on purpose — and every chapter item
  carries the same checklist. `docs/writing-process.md` says why.

### Changed

- **The outline is now per-chapter and owned by the engine.** One typed
  declaration in `outline/chNN.outline.ts` per chapter, replacing two
  arbitrarily-split Python files. The figure ids and citation keys a section
  plans are validated against the real registries, `outline check` reports
  numbering gaps, interrupted parts, starved parts, thin arguments and
  unverified epigraphs, and a `status` field stops the engine overwriting a
  chapter once prose is being written into it.
- `docs/outline.md` is generated from the same declarations, so the
  documentation cannot describe a different book from the one that builds.

## [0.1.0] - 2026-09-12

### Added

- **The engine.** A dependency-free colour library, a diagram engine that
  renders figures to SVG at their exact printed size, a research and citation
  system, a Typst book template, and the CLI that drives them. Node 24 runs the
  TypeScript directly; the only external dependency is Typst.
- **The outline.** Five parts, nineteen chapters, ninety-nine sections, each
  carrying the argument it will make rather than only a heading.
- **Twelve computed figures**, including the CIE 1931 chromaticity diagram with
  out-of-gamut regions desaturated rather than invented.
- **Twenty-four sources** with seventy distilled claims, every one of them with
  a locator and a confidence, and metadata fetched rather than typed.
- **112 tests**, mostly conformance checks against published values: D65
  integrates to its published white point, the sRGB matrix derived from
  primaries matches CSS Color 4 to seven decimals, and CIEDE2000 reproduces all
  thirty-four of Sharma, Wu & Dalal's conformance pairs.

### Design

- Set in ET Book — Edward Tufte's own digitisation of Bembo — on a
  203 × 254 mm page with a 68 mm outer margin carrying notes and diagrams.
- Diagram grammar after Tufte: range frames rather than boxes, direct labels
  rather than legends, no gridlines, neutral furniture.

[Unreleased]: https://github.com/oddurs/three-numbers/commits/main
