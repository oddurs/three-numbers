#import "../lib/book.typ": *

// Half-title.
#page(header: none, footer: none)[
  #v(30mm)
  #block(width: measure-width)[
    #set text(size: 17pt, fill: ink.secondary, tracking: 0.02em)
    Three Numbers
  ]
]

#pagebreak(weak: true)

// Title page.
#page(header: none, footer: none)[
  #v(38mm)
  #block(width: measure-width + side-gutter + side-width)[
    #set par(justify: false, leading: 0.4em)
    #text(size: 34pt, fill: ink.primary)[Three Numbers]
    #v(5mm)
    #text(size: 13pt, fill: ink.secondary, style: "italic")[
      Colour theory for people who would rather see the derivation
    ]
  ]
  #v(1fr)
  #block(width: measure-width)[
    #set text(size: type-scale.small, fill: ink.muted)
    #line(length: 30mm, stroke: rules.thin + ink.rule)
    #v(3mm)
    Every figure in this book was computed from published colorimetric data by
    the engine in `engine/`. Nothing here is traced from another book.
  ]
  #v(10mm)
]

#pagebreak(weak: true)

// Copyright and colophon stub.
#page(header: none, footer: none)[
  #v(1fr)
  #block(width: measure-width)[
    #set text(size: type-scale.side, fill: ink.muted)
    #set par(leading: leading.side, justify: false, first-line-indent: 0pt)

    Draft manuscript. #todo[set copyright, edition and ISBN before any distribution]

    #v(3mm)
    Set in Libertinus Serif, with mathematics in New Computer Modern Math and
    code in JetBrains Mono. Typeset with Typst; figures generated as SVG by a
    TypeScript engine running on Node.

    #v(3mm)
    Colorimetric data from the Colour & Vision Research Laboratory database
    (CVRL, UCL) and the CIE. CIEDE2000 conformance verified against Sharma,
    Wu & Dalal's published test set. See the appendix on provenance.
  ]
  #v(6mm)
  #chapter-end()
]
