// Placing generated figures, and referring to them.
//
// The engine renders every figure to `build/figures/<id>.svg` at its exact
// printed size and writes a manifest of captions and widths. Prose refers to a
// figure by id and nothing else. The caption lives beside the code that draws
// the data, which is the only way to stop the two from drifting apart.
//
// A figure is *placed* once with `#fig("id")` and referred to everywhere else
// with `#figref("id")`. Placing the same figure twice prints it twice under two
// different numbers, so `fig` detects that and says so on the page.

#import "theme.typ": *
#import "margin.typ": in-margin
#import "template.typ": chapter-number
#import "/build/figures/manifest.typ": figures

#let figure-counter = counter("book-figure")

// Every placement registers itself here, so `figref` can report the number a
// figure actually received instead of guessing at the current counter value.
#let figure-marker = <cac-figure>

/// "5.2" inside chapter 5; a bare index in the unnumbered front and back matter.
#let figure-label(chapter, index) = {
  if chapter == none { str(index) } else { str(chapter) + "." + str(index) }
}

/// Horizontal offset needed to place a block of `w` so that it bleeds into the
/// outer margin (for `wide`) or is centred on the trim (for `full`).
///
/// Must be called from inside a `context` block: it needs the page parity,
/// because "outer" is the right margin on a recto and the left on a verso.
#let bleed-offset(w, mode, recto) = {
  if mode == "full" {
    let left-margin = if recto { margins.inside } else { margins.outside }
    (trim.width - w) / 2 - left-margin
  } else if recto {
    0pt
  } else {
    -(w - measure-width)
  }
}

#let figure-error(message) = block(
  width: 100%,
  fill: rgb("#fde8e8"),
  stroke: 0.5pt + rgb("#c46b6b"),
  radius: 2pt,
  inset: 10pt,
  text(size: 9pt, fill: rgb("#8a2b2b"), font: fonts.mono)[#message],
)

#let caption-block(label, meta, width) = block(width: width, above: 0.75em, {
  set text(size: type-scale.caption, fill: ink.secondary)
  set par(leading: leading.tight, justify: false, first-line-indent: 0pt)
  [#strong[Figure #label] #h(0.45em) #meta.caption]
})

/// Place a figure by id. Width and placement come from the manifest unless
/// overridden here.
#let fig(id, placement: auto, caption: true) = {
  let meta = figures.at(id, default: none)
  if meta == none { return figure-error("missing figure: " + id) }

  figure-counter.step()

  context {
    let self = here()
    let label = figure-label(chapter-number.get(), figure-counter.get().first())

    // Register before checking, so that the *first* placement always wins and
    // every later one reports against it.
    [#metadata((id: id, label: label))#figure-marker]

    let earlier = query(figure-marker).filter(m => m.value.id == id and m.location() != self)
    if earlier.len() > 0 and earlier.first().value.label != label {
      return figure-error(
        "figure " + id + " is already placed as Figure " + earlier.first().value.label
          + " — use #figref(\"" + id + "\") here instead",
      )
    }

    let mode = if placement == auto { meta.placement } else { placement }

    if mode == "margin" {
      in-margin({
        image("/build/figures/" + meta.path, width: side-width)
        if caption {
          block(above: 0.5em, {
            set text(size: type-scale.side, fill: ink.muted)
            set par(leading: leading.side, justify: false, first-line-indent: 0pt)
            [#strong[Fig. #label] #h(0.3em) #meta.caption]
          })
        }
      }, dy: -0.3em)
    } else {
      let w = if mode == "wide" {
        wide-width
      } else if mode == "full" {
        full-width
      } else {
        measure-width
      }
      block(width: 100%, above: spacing.figure, below: spacing.figure, breakable: false, {
        move(dx: bleed-offset(w, mode, calc.odd(self.page())), block(width: w, {
          image("/build/figures/" + meta.path, width: w)
          if caption { caption-block(label, meta, w) }
        }))
      })
    }
  }
}

/// A reference to a figure placed elsewhere: "see Figure 5.2".
///
/// Resolves by querying the placements, so it prints the number the figure
/// actually received and links to it. A reference to a figure that is never
/// placed is a visible error rather than a silently wrong number.
#let figref(id, supplement: "Figure") = context {
  let hits = query(figure-marker).filter(m => m.value.id == id)
  if hits.len() == 0 {
    let known = figures.at(id, default: none) != none
    text(fill: rgb("#8a2b2b"), font: fonts.mono)[
      #if known { "?" + id + " not placed" } else { "?unknown figure " + id }
    ]
  } else {
    let target = hits.first()
    link(target.location())[#supplement #target.value.label]
  }
}

/// The list of figures, for the back matter.
#let list-of-figures() = context {
  let numbers = (:)
  for m in query(figure-marker) {
    if m.value.id not in numbers { numbers.insert(m.value.id, m.value.label) }
  }

  set text(size: type-scale.small)
  for (id, meta) in figures.pairs().sorted(key: p => (p.at(1).chapter, p.at(0))) {
    block(above: 0.5em, below: 0.5em, {
      set par(leading: leading.tight, justify: false, first-line-indent: 0pt)
      grid(
        columns: (5em, 1fr),
        column-gutter: 0.6em,
        text(fill: ink.muted, size: type-scale.side, numbers.at(id, default: "—")),
        {
          meta.title
          linebreak()
          text(size: type-scale.side, fill: ink.faint, raw(id))
        },
      )
    })
  }
}
