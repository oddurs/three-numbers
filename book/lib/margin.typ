// Placing things in the outer margin.
//
// The subtlety: `place` positions relative to its immediate container, and a
// margin note has to hang off an arbitrary point mid-paragraph. Wrapping the
// placement in a zero-size inline box stops it breaking the paragraph, but then
// the anchor is wherever the marker happens to sit in the line. So the offset
// is computed from `here().position()`, which is absolute on the page, and the
// note lands in the same column every time regardless of the marker's position.

#import "theme.typ": *

/// Absolute x of the outer margin column on the current page.
#let margin-column-x() = {
  context {
    if calc.odd(here().page()) {
      margins.inside + measure-width + side-gutter
    } else {
      margins.outside - side-gutter - side-width
    }
  }
}

/// Put `body` in the outer margin, anchored vertically to the current line.
#let in-margin(body, dy: -0.35em, width: side-width) = context {
  let here-x = here().position().x
  let target = if calc.odd(here().page()) {
    margins.inside + measure-width + side-gutter
  } else {
    margins.outside - side-gutter - side-width
  }
  box(width: 0pt, height: 0pt, place(
    top + left,
    dx: target - here-x,
    dy: dy,
    float: false,
    box(width: width, body),
  ))
}
