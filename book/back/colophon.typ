#import "../lib/book.typ": *
#import "/build/version.typ": build-info

#chapter(none)[Colophon]

#lead[
  Set in Libertinus Serif, a revival of Linux Libertine, with mathematics in New
  Computer Modern Math and code in JetBrains Mono. Typeset with Typst on a
  178 × 235 mm page, an 110 mm measure, and a 48 mm outer margin that carries
  the sidenotes and the smaller diagrams.
]

#block(width: measure-width, above: 1.4em)[
  #set text(size: type-scale.small, fill: ink.secondary)
  #set par(first-line-indent: 0pt, justify: false, leading: leading.side)
  This copy was built on #build-info.date from
  #if build-info.commit == none [an untracked working tree] else [
    commit #raw(build-info.commit)#if build-info.dirty [ with uncommitted changes]
  ].
  #if build-info.released [
    It is release #raw(build-info.tag).
  ] else [
    It is a draft, not a release: figure numbers, section numbering and page
    references may all move before the next tagged version.
  ]
]

#stub(words: 400)[
  The colophon proper: the type, the page geometry and why it is asymmetric,
  the figure engine, and an acknowledgement that the neutral greys of every
  axis and rule in this book were chosen so that the only colour on a page is
  the colour under discussion.
]

#chapter-end()
