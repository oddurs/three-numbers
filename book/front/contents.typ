#import "../lib/book.typ": *

= Contents

#contents(depth: 1)

#v(6mm)

#block(width: measure-width)[
  #set text(size: type-scale.side, fill: ink.muted)
  #set par(justify: false, first-line-indent: 0pt, leading: leading.side)
  Sections marked #box(baseline: 0.15em)[#stub-chip()] are planned but unwritten.
  Run `node engine/cli.ts stats` for current word counts.
]

#chapter-end()
