# Changelog

Notable changes to the book and to the engine that builds it.

Versions follow `MAJOR.MINOR.PATCH`, read for a book rather than a library:

- **MAJOR** — a new edition. Chapter numbering may change; page references break.
- **MINOR** — new or substantially rewritten chapters and figures.
- **PATCH** — corrections, typography, engine work with no effect on the text.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
