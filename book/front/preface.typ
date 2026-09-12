#import "../lib/book.typ": *

= Preface

#lead[
  This is a book about colour for people who write code, prove things, or
  measure things — and who have noticed that most writing about colour is either
  a physics chapter that stops before it becomes useful or a design chapter that
  starts after the interesting part is over.
]

The gap between those two literatures is where most colour bugs live. A graphics
programmer who has read the physics knows that light is a spectrum and that the
eye has three cone types, and still writes `(a + b) / 2` to blend two pixels. A
designer who has read the design books knows that yellow looks lighter than
blue, and still reaches for a tool whose "lightness" slider says they are the
same. Both are reasoning correctly from an incomplete model.

== Five bugs

#stub(words: 1600)[
  Open with five failures the reader has probably shipped: a gradient that goes
  grey in the middle, a thumbnail darker than its source, a chart palette that
  collapses for a twelfth of male readers, a photograph that changes colour when
  the tab loses focus, and a "lighten by 10%" that does nothing to yellow.
  Promise that all five have one root cause, and that the book names it by
  Chapter 8.
]

== Three numbers, one function

#stub(words: 1200)[
  The thesis, stated once and plainly. Light arriving at the eye is a function
  of wavelength — a point in an infinite-dimensional space. The eye reports
  three numbers. Any such map has an enormous null space, and the practical
  consequences of that null space are what this subject is.
]

== Four things that get confused

#stub(sources: ("fairchild-appearance",), words: 1100)[
  A colour *space* is a coordinate system; a colour *model* is the geometry; a
  colour *appearance model* is a prediction about a viewer; a colour *profile*
  is a claim about a device. Most confusion in practice is a category error
  between these four, and naming them here saves a chapter later.
]

== What this book assumes

#stub(words: 500)[
  Matrices, dot products and change of basis; integrals as inner products; and
  enough programming to read TypeScript, which is used because it reads like
  pseudocode and runs without ceremony. No prior colour science.
]

== How to read it

#stub(words: 700)[
  Parts I and II are load-bearing and should be read in order. Parts III to V
  are largely independent and can be raided. Every chapter ends with exercises,
  marked by what they ask for: #smallcaps[code], #smallcaps[derive] or
  #smallcaps[think]. The repository has the scaffolding for the first kind.
]

== A note on the figures

This book desaturates the parts of a diagram its own page cannot print, rather
than inventing a colour for them. It computes its figures from published
colorimetric data rather than redrawing them from other books — which matters
more than it sounds, because several famous figures in this subject have been
reproduced so widely that their errors have become canonical. A figure here is a
measurement, and the reader is invited to disagree with one by editing it.

#fig("cie-1931-chromaticity")

#stub(words: 500)[
  Close the preface on the repository: what is in it, how to rebuild a figure,
  and the standing invitation to send a correction as a patch.
]

#chapter-end()
