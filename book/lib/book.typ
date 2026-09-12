// The single import every chapter needs.
//
//   #import "../lib/book.typ": *
//
// Keeping one surface means a chapter file never has to know how the library is
// organised, and the library can be reorganised without touching the prose.

#import "theme.typ": *
#import "template.typ": book, begin-body, chapter-opener, part-page, contents, chapter-end, chapter-number
#import "components.typ": *
#import "figures.typ": fig, figref, list-of-figures, figure-counter

/// Open a chapter: resets figure, listing, equation and exercise numbering.
#let chapter(number, title, epigraph: none, epigraph-source: none) = {
  counter("book-figure").update(0)
  counter("listing").update(0)
  counter("exercise").update(0)
  counter("sidenote").update(0)
  counter(math.equation).update(0)
  chapter-opener(number, title, epigraph: epigraph, epigraph-source: epigraph-source)
}
