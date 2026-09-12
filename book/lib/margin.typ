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

// Where the previous margin item ended, so the next one can be pushed clear.
//
// Notes anchor to the line that references them, and two references a few lines
// apart put two notes in the same place — which does not look like an error, it
// looks like one paragraph of nonsense. Typst has no automatic avoidance here,
// so the column keeps a cursor: the bottom of the last item on this page.
#let margin-cursor = state("cac-margin-cursor", (page: 0, bottom: 0pt))

/// Vertical gap between two items sharing the margin column.
#let margin-gap = 6pt

/// Put `body` in the outer margin, anchored to the current line, and pushed
/// down if the previous item is still occupying that space.
#let in-margin(body, dy: -0.35em, width: side-width) = context {
  let pos = here().position()
  let target = if calc.odd(pos.page) {
    margins.inside + measure-width + side-gutter
  } else {
    margins.outside - side-gutter - side-width
  }

  let content = box(width: width, body)
  // `dy` carries an em term, and a length with an em in it cannot be compared
  // with another until the em is resolved against the current font size.
  let natural = pos.y + dy.to-absolute()
  let cursor = margin-cursor.get()
  let placed-y = if cursor.page == pos.page and natural < cursor.bottom {
    cursor.bottom
  } else {
    natural
  }

  let height = measure(content).height
  margin-cursor.update((page: pos.page, bottom: placed-y + height + margin-gap))

  box(width: 0pt, height: 0pt, place(
    top + left,
    dx: target - pos.x,
    dy: placed-y - pos.y,
    float: false,
    content,
  ))
}
