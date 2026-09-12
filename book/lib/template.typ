// The page master: paper, running heads, headings, front and body matter.

#import "theme.typ": *

// Chapter and part openers drop a labelled marker into the flow. The running
// heads then *query* for those markers rather than reading mutable state:
// state updates resolve in flow order, which is not the order a header needs,
// and the difference shows up as a stale head on exactly the pages you care
// about. A query asks the finished document where things actually are.
#let chapter-marker = <cac-chapter>
#let part-marker = <cac-part>
#let body-marker = <cac-body-start>
#let end-marker = <cac-end>

/// The number of the chapter currently being typeset, or `none` in front and
/// back matter. Figure numbering is qualified by it, so "Figure 5.2" is
/// unambiguous across the book.
#let chapter-number = state("cac-chapter-number", none)

/// Emitted at the end of each chapter file, so the template can tell a blank
/// filler page (inserted to start the next chapter on a recto) from a page that
/// merely continues a chapter. Without it, every blank verso in the book would
/// carry a folio.
#let chapter-end() = [#metadata((kind: "end"))#end-marker]

/// The most recent marker of `label` at or before page `page-no`.
#let last-marker-before(label, page-no) = {
  let hits = query(label).filter(m => m.location().page() <= page-no)
  if hits.len() == 0 { none } else { hits.last().value.title }
}

/// Is there a chapter or part opener on this page? If so, it carries no head.
#let opens-on(page-no) = {
  query(chapter-marker).any(m => m.location().page() == page-no) or query(
    part-marker,
  ).any(m => m.location().page() == page-no)
}

/// True on a page inserted purely to push the next opener onto a recto.
///
/// The test: no opener starts here, and the most recent marker of any kind at
/// or before this page is an *end* marker sitting on an earlier page. A page
/// that merely continues a chapter fails the second condition, because the most
/// recent marker before it is that chapter's own start.
#let is-blank(page-no) = {
  if opens-on(page-no) { return false }
  let markers = (
    query(chapter-marker) + query(part-marker) + query(end-marker)
  ).filter(m => m.location().page() <= page-no)
  if markers.len() == 0 { return false }
  let latest = markers.sorted(key: m => (m.location().page(), m.location().position().y)).last()
  latest.value.kind == "end" and latest.location().page() < page-no
}

#let front-matter-ends-at() = {
  let hits = query(body-marker)
  if hits.len() == 0 { none } else { hits.first().location().page() }
}

#let in-front-matter(page-no) = {
  let start = front-matter-ends-at()
  start == none or page-no < start
}

// --- Running heads ---------------------------------------------------------
//
// Verso carries the part, recto carries the chapter. Openers carry nothing.

#let running-header = context {
  let page-no = here().page()
  if in-front-matter(page-no) { return }
  if opens-on(page-no) { return }
  if is-blank(page-no) { return }

  let recto = calc.odd(page-no)
  let label = if recto {
    last-marker-before(chapter-marker, page-no)
  } else {
    last-marker-before(part-marker, page-no)
  }
  if label == none { return }

  set text(size: type-scale.running, fill: ink.muted, tracking: 0.05em)
  block(width: 100%, {
    if recto { h(1fr); smallcaps(label) } else { smallcaps(label); h(1fr) }
    v(-0.5em)
    line(length: 100%, stroke: rules.hair + ink.hairline)
  })
}

#let running-footer = context {
  let page-no = here().page()
  if is-blank(page-no) { return }
  if opens-on(page-no) and not in-front-matter(page-no) {
    // A chapter opener keeps its folio, centred, with no rule above it.
    return align(center, text(
      size: type-scale.folio,
      fill: ink.faint,
      counter(page).display("1"),
    ))
  }
  let recto = calc.odd(page-no)
  set text(size: type-scale.folio, fill: ink.secondary)
  block(width: 100%, {
    if recto { h(1fr) }
    counter(page).display(if in-front-matter(page-no) { "i" } else { "1" })
    if not recto { h(1fr) }
  })
}

// --- Openers ---------------------------------------------------------------

#let chapter-opener(number, title, epigraph: none, epigraph-source: none) = {
  pagebreak(to: "odd", weak: true)
  [#metadata((kind: "chapter", number: number, title: title))#chapter-marker]
  chapter-number.update(number)

  block(above: 10mm, below: 0pt, {
    set text(size: type-scale.running, fill: ink.faint, tracking: 0.16em)
    smallcaps(if number == none { "" } else { "Chapter " + str(number) })
  })
  v(2mm)
  block(width: measure-width, {
    set text(size: type-scale.chapter, weight: "regular", fill: ink.primary)
    set par(leading: 0.42em, justify: false)
    title
  })
  v(3.5mm)
  line(length: 30mm, stroke: rules.thick + ink.primary)
  v(7mm)

  if epigraph != none {
    block(width: measure-width - 20mm, {
      set text(size: type-scale.small, fill: ink.secondary, style: "italic")
      set par(leading: leading.tight, justify: false, first-line-indent: 0pt)
      epigraph
      if epigraph-source != none {
        v(1.4mm)
        set text(style: "normal", size: type-scale.side, fill: ink.faint)
        [#h(1fr)— #epigraph-source]
      }
    })
    v(6mm)
  }
}

#let part-page(number, title, blurb: none) = {
  pagebreak(to: "odd", weak: true)
  [#metadata((kind: "part", number: number, title: title))#part-marker]
  v(1fr)
  block(width: measure-width, {
    set text(size: type-scale.running, fill: ink.faint, tracking: 0.2em)
    smallcaps("Part " + number)
    v(5mm)
    set text(size: type-scale.part, fill: ink.primary, weight: "regular")
    set par(leading: 0.4em, justify: false)
    title
  })
  if blurb != none {
    v(7mm)
    block(width: measure-width - 24mm, {
      set text(size: type-scale.body, fill: ink.secondary)
      set par(leading: leading.body, justify: false, first-line-indent: 0pt)
      blurb
    })
  }
  v(2fr)
  pagebreak(weak: true)
}

// --- The document shell ----------------------------------------------------

#let book(title: "", subtitle: none, author: "", body) = {
  set document(title: title, author: author)

  set page(
    width: trim.width,
    height: trim.height,
    margin: margins,
    binding: left,
    header: running-header,
    header-ascent: 32%,
    footer: running-footer,
    footer-descent: 40%,
    fill: ink.paper,
  )

  set text(
    font: fonts.serif,
    size: type-scale.body,
    fill: ink.primary,
    lang: "en",
    region: "gb",
    number-type: "old-style",
  )
  show math.equation: set text(font: fonts.math)
  set par(
    justify: true,
    leading: leading.body,
    spacing: leading.body + spacing.para,
    first-line-indent: (amount: 1.1em, all: false),
  )

  set heading(numbering: none)

  show heading.where(level: 1): it => block(above: 0pt, below: 6mm, {
    set text(size: type-scale.chapter, weight: "regular")
    set par(justify: false)
    it.body
  })

  show heading.where(level: 2): it => block(above: spacing.section, below: 0.7em, {
    set text(size: type-scale.section, weight: "regular", fill: ink.primary)
    set par(leading: 0.5em, justify: false)
    it.body
  })

  show heading.where(level: 3): it => block(above: 1.4em, below: 0.55em, {
    set text(size: type-scale.subsection, weight: "regular", style: "italic", fill: ink.secondary)
    set par(justify: false)
    it.body
  })

  // Inline code and code blocks.
  show raw.where(block: false): it => box(
    fill: ink.panel,
    inset: (x: 2.5pt, y: 0pt),
    outset: (y: 2.6pt),
    radius: 1.5pt,
    text(font: fonts.mono, size: type-scale.code, fill: ink.primary, it),
  )
  show raw.where(block: true): it => block(
    width: 100%,
    fill: ink.panel,
    stroke: (left: rules.thick + ink.rule),
    inset: (x: 8pt, y: 7pt),
    radius: (right: 2pt),
    breakable: true,
    text(font: fonts.mono, size: type-scale.code-block, fill: ink.primary, it),
  )
  // Scoped to block raw only: a `set par` on inline raw would force every
  // piece of inline code into a paragraph of its own.
  show raw.where(block: true): set par(justify: false, leading: leading.code)

  set list(marker: ([•], [–], [·]), indent: 0.6em, spacing: 0.72em)
  set enum(indent: 0.6em, spacing: 0.72em)
  show link: set text(fill: ink.primary)

  set cite(style: "chicago-author-date")
  set math.equation(numbering: "(1)", supplement: [Eq.])

  body
}

/// Switch from roman front-matter folios to arabic body folios.
#let begin-body() = {
  pagebreak(to: "odd", weak: true)
  [#metadata((kind: "body"))#body-marker]
  counter(page).update(1)
}

// --- Contents ---------------------------------------------------------------
//
// Built by querying the finished document rather than by `outline()`, because
// chapter titles here are not headings: they are set by `chapter-opener`, which
// needs control the heading machinery does not give it. Querying the markers
// gets the parts, the chapters and their real page numbers, and the level-2
// headings come from `outline`'s usual source.

#let contents(depth: 2) = context {
  let parts = query(part-marker)
  let chapters = query(chapter-marker)
  let sections = query(heading.where(level: 2))

  let entries = ()
  for m in parts { entries.push((kind: "part", loc: m.location(), value: m.value)) }
  for m in chapters { entries.push((kind: "chapter", loc: m.location(), value: m.value)) }
  if depth >= 2 {
    for h in sections { entries.push((kind: "section", loc: h.location(), value: h.body)) }
  }
  entries = entries.sorted(key: e => (e.loc.page(), e.loc.position().y))

  set par(justify: false, first-line-indent: 0pt, leading: 0.5em)
  for e in entries {
    let page-no = e.loc.page()
    let folio = numbering(if page-no < 1 { "i" } else { "1" }, page-no)
    if e.kind == "part" {
      v(4mm, weak: true)
      block(below: 1.6mm, {
        set text(size: type-scale.side, fill: ink.faint, tracking: 0.14em)
        smallcaps("Part " + e.value.number + " · " + e.value.title)
      })
    } else if e.kind == "chapter" {
      block(above: 2.2mm, below: 0.8mm, {
        set text(size: type-scale.body, fill: ink.primary)
        grid(
          columns: (1.9em, 1fr, auto),
          align: (left, left, right),
          if e.value.number == none { [] } else { text(fill: ink.muted)[#e.value.number] },
          e.value.title,
          text(fill: ink.muted)[#folio],
        )
      })
    } else {
      block(above: 0pt, below: 0pt, {
        set text(size: type-scale.side, fill: ink.secondary)
        grid(
          columns: (1.9em, 1fr, auto),
          align: (left, left, right),
          [],
          e.value,
          text(fill: ink.faint)[#folio],
        )
      })
    }
  }
}
