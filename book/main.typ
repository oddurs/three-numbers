#import "lib/book.typ": *

// Generated structure: see engine/cli.ts `new chapter` to add one.

#show: book.with(
  title: "Three Numbers",
  subtitle: "Colour theory for people who would rather see the derivation",
  author: "TODO",
)

#include "front/title.typ"
#pagebreak(to: "odd", weak: true)
#include "front/contents.typ"
#pagebreak(to: "odd", weak: true)
#include "front/preface.typ"

#begin-body()

#part-page("I", blurb: [
  Before colour is a data type it is a physical signal and a biological measurement.
  This part builds the model from the bottom: a spectrum is a function, the eye is a
  three-channel projection of that function, and everything that follows in the book
  is a consequence of the fact that the projection throws almost all of it away.
])[Light]

#include "parts/ch01.typ"
#include "parts/ch02.typ"
#include "parts/ch03.typ"

#part-page("II", blurb: [
  Given three numbers, choose coordinates. This part is a tour of the coordinate
  systems the industry uses, each presented as what it is: a set of choices, made for
  reasons, with consequences. By the end the reader should be able to derive any RGB
  matrix from first principles and to say what is wrong with HSL.
])[Spaces]

#include "parts/ch04.typ"
#include "parts/ch05.typ"
#include "parts/ch06.typ"
#include "parts/ch07.typ"

#part-page("III", blurb: [
  Coordinates are for computing with. This part is about the four things programs do
  to colours --- mix them, measure the distance between them, squeeze them into a
  device's range, and re-anchor them to a different white --- and about the fact that
  each of these is wrong by default.
])[Operations]

#include "parts/ch08.typ"
#include "parts/ch09.typ"
#include "parts/ch10.typ"
#include "parts/ch11.typ"

#part-page("IV", blurb: [
  Displays have finite levels, images have finite storage, and renderers have finite
  time. This part is about what happens when the continuous model of Parts I to III
  meets a discrete machine --- which is where colour theory turns into signal
  processing and stays there.
])[Pixels]

#include "parts/ch12.typ"
#include "parts/ch13.typ"
#include "parts/ch14.typ"
#include "parts/ch15.typ"
#include "parts/ch16.typ"

#part-page("V", blurb: [
  The model in Parts I to IV describes a standard observer who does not exist. This
  part is about the actual distribution of human vision, about what the model owes to
  readers it was not built for, and about the limits of the whole enterprise.
])[People]

#include "parts/ch17.typ"
#include "parts/ch18.typ"
#include "parts/ch19.typ"

#include "back/appendix-a.typ"
#include "back/appendix-b.typ"
#include "back/appendix-c.typ"
#include "back/appendix-d.typ"
#include "back/bibliography.typ"
#include "back/colophon.typ"
