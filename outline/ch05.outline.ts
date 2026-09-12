import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch05",
  number: 5,
  part: "II",
  title: "Building an RGB Space",
  status: "outline",
  epigraph: {
    text: `
      Three primaries, a white point, and a curve. That is the whole contents of an
      RGB colour space, and two of the three are usually mis-stated.
    `,
  },
  lead: `
    Derive the sRGB matrix from scratch in four lines of linear algebra, then show
    that every other RGB space differs only in which numbers you feed the same
    derivation. The matrices everyone copies off web pages are outputs, not inputs.
  `,
  sections: [
    {
      title: "The derivation",
      argument: `
        Each primary fixes a direction in XYZ; the white point fixes the three scale
        factors that put (1,1,1) on white. Solve, and you have the matrix. Derive
        it, print it, compare to the published table.
      `,
      words: 1050,
      sources: ["css-color-4"],
    },
    {
      title: "The two sRGB matrices",
      argument: `
        A short, satisfying detective story. The widely-copied matrix and the CSS
        Color 4 matrix differ in the fourth decimal because one derives D65 from xy
        and the other quotes it rounded to XYZ. Neither is wrong; the disagreement
        is the interesting object, and the engine reproduces both on demand.
      `,
      words: 750,
      sources: ["css-color-4"],
    },
    {
      title: "Luminance weights are not a perceptual constant",
      argument: `
        0.2126, 0.7152, 0.0722 falls out of where Rec.709's primaries happen to sit.
        Change the primaries and the weights change. Every codebase that hard-codes
        these and then switches to P3 has a bug.
      `,
      words: 650,
      sources: ["poynton-video"],
    },
    {
      title: "A tour of the spaces",
      argument: `
        sRGB, Display P3, Rec.2020, Adobe RGB, ProPhoto, ACEScg, ACES2065-1 --- what
        each was built for and what each gave up. ProPhoto's imaginary primaries and
        ACES AP0's deliberate enclosure of the entire locus as two solutions to the
        same problem.
      `,
      words: 1200,
      figures: ["cie-1931-chromaticity"],
      sources: ["css-color-4"],
    },
    {
      title: "Measuring gamut volume",
      argument: `
        Replace the area-on-a-chromaticity-diagram habit with a Monte Carlo volume
        in Oklab, and give the numbers. Note how much smaller the difference between
        sRGB and P3 is than the marketing suggests, and how much of Rec.2020 no
        display can reach.
      `,
      words: 900,
      figures: ["oklch-gamut-slice"],
    },
  ],
  exercises: [
    {
      prompt: `
        Derive the Display P3 matrix from its primaries and white point, and confirm
        it against the published value to seven decimal places.
      `,
      kind: "code",
    },
    {
      prompt: `
        Quote D65 as the rounded triple (0.95047, 1, 1.08883) instead of deriving it
        from xy. Show that this reproduces the other sRGB matrix in circulation, and
        decide which you would ship.
      `,
      kind: "code",
    },
    {
      prompt: `
        A codebase hard-codes the luminance weights (0.2126, 0.7152, 0.0722) and
        then switches to Display P3. Compute the resulting error for a saturated
        green, and say whether anyone would notice.
      `,
      kind: "code",
    },
  ],
});
