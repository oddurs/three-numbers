// Design tokens for the printed book.
//
// These are the Typst half of a pair: `engine/draw/theme.ts` holds the same
// measurements for figures, so that a diagram's type is set at the same optical
// size as the text beside it. If you change a width here, change it there.

// --- Page geometry ---------------------------------------------------------
//
// A 203 x 254 mm trim with an asymmetric margin, after Tufte: a 113 mm measure
// for the text and a 68 mm outer margin wide enough to carry a real diagram,
// not just a note. The margin is the point — a figure belongs beside the
// sentence that discusses it, at whatever size the data needs, and a 38 mm
// column (the first draft) is too narrow for anything but text.

#let trim = (width: 203mm, height: 254mm)

#let margins = (
  inside: 22mm,
  outside: 68mm,
  top: 24mm,
  bottom: 28mm,
)

#let measure-width = trim.width - margins.inside - margins.outside // 113mm
#let side-gutter = 6mm
#let side-width = 56mm
#let wide-width = measure-width + side-gutter + side-width // 175mm
#let full-width = 181mm

// --- Type ------------------------------------------------------------------

// ET Book is Edward Tufte's own digitisation of Bembo — the face his books are
// set in — vendored in `fonts/`. Its old-style figures matter more here than
// anywhere: this book is full of numbers in running prose, and lining figures
// would make every "0.2126" and "6504 K" shout.
//
// There is no Bembo-matched math font in existence. New Computer Modern is the
// least-bad partner: it is also high-contrast and light, where STIX Two sits
// beside ET Book like a different weight class.
//
// ET Book maps 229 codepoints. It has no Greek, no combining macron and no math
// relations — which for a book whose every other sentence contains a λ is a
// real constraint, not a footnote. Two answers, used together:
//
//   1. Variables belong in math mode anyway. `$lambda$` is both correct
//      typography and a glyph New Computer Modern Math certainly has.
//   2. A fallback face catches anything that slips through, so a missing glyph
//      degrades to Libertinus rather than to a tofu box.
#let fonts = (
  serif: ("ETBookOT", "Libertinus Serif"),
  mono: "JetBrainsMono NFM",
  math: "New Computer Modern Math",
)

#let type-scale = (
  body: 11.5pt,
  lead: 12.5pt,
  small: 10pt,
  side: 9pt,
  caption: 9.5pt,
  code: 9.4pt,
  code-block: 9.2pt,
  part: 34pt,
  chapter: 25pt,
  section: 14.5pt,
  subsection: 12pt,
  running: 9pt,
  folio: 9.5pt,
)

#let leading = (
  body: 0.78em,
  tight: 0.58em,
  side: 0.54em,
  code: 0.62em,
)

// --- Ink -------------------------------------------------------------------
//
// Strictly neutral. In a book about colour, the only colour on the page is the
// colour under discussion; the furniture never competes with it.

#let ink = (
  primary: rgb("#1a1a1a"),
  secondary: rgb("#4a4a4a"),
  muted: rgb("#6f6f6f"),
  faint: rgb("#9a9a9a"),
  rule: rgb("#c4c4c4"),
  hairline: rgb("#dcdcdc"),
  panel: rgb("#f4f3f1"),
  panel-edge: rgb("#e2e0dc"),
  paper: rgb("#ffffff"),
)

#let rules = (
  hair: 0.4pt,
  thin: 0.5pt,
  regular: 0.8pt,
  thick: 1.4pt,
)

#let spacing = (
  para: 0.62em,
  block: 1.05em,
  section: 1.6em,
  figure: 1.4em,
)
