# Contributing

Corrections are the most valuable thing you can send. This is a book about
getting colour right; if it gets something wrong, that is a bug with a
reproduction.

## Quick start

```sh
npm install            # optional: only for typechecking
node engine/cli.ts build
node engine/cli.ts check
```

Needs **Node 24+** (it runs the TypeScript directly) and **Typst 0.13+**.
Fonts are vendored, so nothing else to install.

## The one rule

**Nothing in the book is transcribed.** Every figure, matrix and number is
computed from published data in this repository. If you add a number, add the
code that produces it and the source that backs it. `check` enforces the parts
of this it can:

```
node engine/cli.ts check
```

- typechecks and runs the tests
- renders every figure and verifies each is the width it is placed at
- refuses a figure placed twice, or a cross-reference to one never placed
- lints captions for Typst/TypeScript markup collisions
- validates the outline: numbering, part balance, unknown sources, thin arguments
- audits citations: dangling keys, unused sources, unsupported claims

## Kinds of change

### A correction to the text

Open an issue with the chapter and section, quote what it says, and say what is
wrong. If you have a source, name it — a DOI is ideal.

### A correction to a figure

Figures are code. Edit `figures/<chapter>/<id>.fig.ts`, run
`node engine/cli.ts proof --figures`, and attach the before and after.

### A new source

Never type bibliographic data from memory:

```sh
node engine/cli.ts cite add 10.1364/JOSAA.14.002647 --tier primary
```

That fetches verified metadata from Crossref, arXiv or the page itself. Then
fill in **Why it matters** and distil at least one claim, each with a locator
and a confidence. A source with no claims has been collected, not read, and
`check` will say so.

### A chapter outline

Chapters live as typed declarations in `outline/chNN.outline.ts`. Edit one and
run:

```sh
node engine/cli.ts outline check   # validate
node engine/cli.ts outline sync    # regenerate book/parts
```

Every section must state the *argument* it will make, not just a heading, and
every figure and source it names must exist. See
[`docs/authoring.md`](docs/authoring.md).

### Engine work

Add a test. The suite is mostly conformance checks against published values —
that is the standard to match, not coverage for its own sake.

## Commits

Conventional commits, with a scope naming the part of the project:

```
book(ch07): merge the cylindrical spaces into the perceptual chapter
figure(delta-e): correct the contour magnification and its caption
engine(gamut): replace the per-pixel bisection with a boundary table
research(brettel): distil the half-plane anchors
docs: record why watch mode forks a child process
```

Types: `book`, `figure`, `engine`, `research`, `docs`, `build`, `fix`, `chore`.

Write the body to explain *why*, especially where the obvious approach was
wrong. Several comments in this codebase exist because the first attempt
shipped a bug; keep that habit.

## Branches and review

- `main` is always buildable. CI runs `check` on every push and pull request.
- Branch as `<type>/<short-description>`: `figure/spectral-locus-labels`.
- Pull requests need a green `check` and a rendered before/after for any change
  to a figure or to the page master.

## Style

See [`docs/voice.md`](docs/voice.md). The short version: British spelling in
prose, American in code and quoted standards; numbers over adjectives; and no
telling the reader you are being rigorous.
