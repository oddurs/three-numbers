// The book's semantic elements.
//
// Prose should say what a thing *is* — a key idea, an aside, a definition, a
// piece of margin commentary — and never how it should look. Everything visual
// is decided here, once.

#import "theme.typ": *
#import "margin.typ": in-margin

// --- Margin apparatus ------------------------------------------------------
//
// The outer margin carries three kinds of thing: numbered sidenotes, unnumbered
// margin commentary, and small figures. All three flip to the correct side of
// the spread automatically.

#let sidenote-counter = counter("sidenote")

#let margin-block(body, dy: -0.35em) = in-margin({
  set text(size: type-scale.side, fill: ink.secondary)
  set par(leading: leading.side, justify: false, first-line-indent: 0pt)
  body
}, dy: dy)

/// A numbered sidenote: a superscript marker in the text, the note in the margin.
#let sidenote(body) = {
  sidenote-counter.step()
  context {
    let n = sidenote-counter.display()
    super(text(size: 7pt, fill: ink.secondary, n))
    margin-block({
      super(text(size: 7pt, fill: ink.secondary, n))
      h(1.5pt)
      body
    })
  }
}

/// Unnumbered margin commentary, tied to nothing in particular.
#let marginnote(body) = margin-block(body)

// --- Blocks ----------------------------------------------------------------

/// The opening paragraph of a chapter or section: set slightly larger, unindented.
#let lead(body) = block(width: 100%, below: spacing.block, {
  set text(size: type-scale.lead, fill: ink.primary)
  set par(first-line-indent: 0pt, leading: 0.75em)
  body
})

/// A boxed statement the reader should carry forward.
#let keyidea(body, title: "Key idea") = block(
  width: 100%,
  above: spacing.block,
  below: spacing.block,
  breakable: false,
  stroke: (left: rules.thick + ink.primary),
  inset: (left: 9pt, right: 0pt, y: 2pt),
  {
    block(below: 0.45em, {
      set text(size: type-scale.side, fill: ink.muted, tracking: 0.1em)
      smallcaps(title)
    })
    set par(first-line-indent: 0pt, leading: 0.68em)
    body
  },
)

/// A digression that can be skipped without losing the thread.
#let aside(body, title: none) = block(
  width: 100%,
  above: spacing.block,
  below: spacing.block,
  fill: ink.panel,
  stroke: rules.hair + ink.panel-edge,
  radius: 2pt,
  inset: (x: 10pt, y: 9pt),
  breakable: true,
  {
    if title != none {
      block(below: 0.5em, {
        set text(size: type-scale.side, fill: ink.muted, tracking: 0.08em)
        smallcaps(title)
      })
    }
    set text(size: type-scale.small)
    set par(first-line-indent: 0pt, leading: 0.66em)
    body
  },
)

/// A formal definition. The term is set in the margin, the definition in the text.
#let defn(term, body) = block(width: 100%, above: spacing.block, below: spacing.block, {
  marginnote({
    set text(fill: ink.primary)
    strong(term)
  })
  set par(first-line-indent: 0pt)
  body
})

/// A warning about something that will bite the reader in real code.
#let trap(body, title: "Trap") = block(
  width: 100%,
  above: spacing.block,
  below: spacing.block,
  stroke: (left: rules.thick + ink.secondary),
  inset: (left: 9pt, y: 2pt),
  breakable: true,
  {
    block(below: 0.45em, {
      set text(size: type-scale.side, fill: ink.secondary, tracking: 0.1em)
      smallcaps(title)
    })
    set text(size: type-scale.small)
    set par(first-line-indent: 0pt, leading: 0.66em)
    body
  },
)

// --- Code ------------------------------------------------------------------

#let listing-counter = counter("listing")

/// A numbered, captioned code listing.
#let listing(body, caption: none, lang: none) = {
  listing-counter.step()
  block(width: 100%, above: spacing.block, below: spacing.block, breakable: true, {
    body
    if caption != none {
      context block(above: 0.5em, {
        set text(size: type-scale.caption, fill: ink.secondary)
        set par(leading: leading.tight, justify: false, first-line-indent: 0pt)
        [#strong[Listing #context listing-counter.display()] #h(0.4em) #caption]
      })
    }
  })
}

// --- Exercises -------------------------------------------------------------

#let exercise-counter = counter("exercise")

/// What an exercise asks of the reader.
#let exercise-kinds = (
  code: "code",
  proof: "derive",
  think: "think",
)

/// A problem for the reader. These collect at the end of each chapter.
#let exercise(body, hint: none, kind: none) = {
  exercise-counter.step()
  block(width: 100%, above: 0.9em, below: 0.9em, breakable: true, {
    set par(first-line-indent: 0pt, leading: 0.68em)
    grid(
      columns: (2.4em, 1fr),
      align: (right + top, left),
      column-gutter: 0.6em,
      {
        set text(fill: ink.muted, size: type-scale.small)
        context exercise-counter.display()
      },
      {
        body
        if kind != none {
          h(0.5em)
          box(baseline: 0.1em, text(
            size: type-scale.side,
            fill: ink.faint,
            tracking: 0.06em,
            smallcaps(exercise-kinds.at(kind, default: kind)),
          ))
        }
        if hint != none {
          v(0.3em)
          set text(size: type-scale.side, fill: ink.muted)
          [Hint: #hint]
        }
      },
    )
  })
}

#let exercises(body) = {
  block(above: spacing.section, below: 0.8em, {
    set text(size: type-scale.side, fill: ink.muted, tracking: 0.1em)
    smallcaps("Exercises")
    v(-0.5em)
    line(length: 100%, stroke: rules.hair + ink.hairline)
  })
  body
}

// --- Inline pieces ---------------------------------------------------------

/// An inline colour chip, for naming a colour in running text.
#let swatch(fill-color, width: 1.5em) = box(
  baseline: 0.16em,
  height: 0.72em,
  width: width,
  radius: 1pt,
  stroke: 0.3pt + ink.rule,
  fill: fill-color,
)

/// A colour named by its hex code, shown beside a chip of itself.
#let hexswatch(code) = {
  swatch(rgb(code), width: 1.1em)
  h(0.28em)
  raw(code)
}

/// A wavelength, set with a thin space before the unit.
#let nm(value) = [#value#h(0.12em)nm]

/// A quantity with its unit, kept from breaking across a line.
#let qty(value, unit) = box[#value#h(0.12em)#unit]

/// Mark something as deliberately unfinished. `cli check` counts these.
#let todo(body) = {
  box(
    fill: rgb("#ffe9c7"),
    stroke: 0.4pt + rgb("#c99a3e"),
    inset: (x: 3pt, y: 1pt),
    outset: (y: 2.5pt),
    radius: 1.5pt,
    text(size: 8pt, fill: rgb("#6b4a10"), font: fonts.mono, [TODO #body]),
  )
}

/// A note on exercises not yet written, in the same register as `stub`.
#let exercise-plan(body) = block(
  width: 100%,
  above: 0.6em,
  inset: (left: 2.4em),
  {
    set text(size: type-scale.side, fill: ink.muted, style: "italic")
    set par(first-line-indent: 0pt, leading: leading.side, justify: false)
    body
  },
)

/// A small inline marker matching the `stub` panel, for referring to it in prose.
#let stub-chip() = box(
  width: 1.6em,
  height: 0.62em,
  radius: 1pt,
  fill: rgb("#fbf7ef"),
  stroke: (dash: "dashed", paint: rgb("#d9c9a6"), thickness: 0.4pt),
)

/// A planned-but-unwritten section: what it will argue, and what it needs.
#let stub(summary, figures: (), sources: (), words: none) = block(
  width: 100%,
  above: spacing.block,
  below: spacing.block,
  fill: rgb("#fbf7ef"),
  stroke: (dash: "dashed", paint: rgb("#d9c9a6"), thickness: 0.5pt),
  radius: 2pt,
  inset: (x: 10pt, y: 9pt),
  {
    block(below: 0.5em, {
      set text(size: type-scale.side, fill: rgb("#8a6d2f"), tracking: 0.1em)
      smallcaps("Planned")
      if words != none {
        h(0.6em)
        text(fill: ink.faint)[#words words]
      }
    })
    set text(size: type-scale.small, fill: ink.secondary)
    set par(first-line-indent: 0pt, leading: 0.66em)
    summary
    if figures.len() > 0 {
      v(0.5em)
      set text(size: type-scale.side, fill: ink.muted)
      [*Figures:* #figures.join(", ")]
    }
    if sources.len() > 0 {
      v(0.35em)
      set text(size: type-scale.side, fill: ink.muted)
      [*Sources:* #sources.map(s => raw(s)).join(", ")]
    }
  },
)
