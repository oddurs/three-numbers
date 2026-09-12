import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch03",
  number: 3,
  part: "I",
  title: "The Standard Observer",
  status: "outline",
  epigraph: {
    text: `
      the science of colour must be regarded as essentially a mental science.
    `,
    source: "James Clerk Maxwell, 1872",
    unverified: true,
  },
  lead: `
    The CIE 1931 observer is the most consequential set of three curves in
    engineering, and it is usually presented as a measurement. It is not: it is a
    measurement followed by a change of basis chosen for convenience, and both
    halves matter.
  `,
  sections: [
    {
      title: "The colour matching experiment",
      argument: `
        Wright and Guild's apparatus, the bipartite field, and the moment where the
        experiment fails: some test wavelengths cannot be matched, and the subject
        must add primary light to the *test* side. That is where the negative lobes
        come from, and it is a fact about the primaries, not about the eye.
      `,
      words: 1050,
      sources: ["wyszecki-stiles"],
    },
    {
      title: "From RGB to XYZ: choosing a basis",
      argument: `
        The 1931 transformation as a deliberate design: make all three functions
        non-negative, make one of them exactly V(lambda), put the white point
        somewhere convenient. Show the matrix, and stress that a different committee
        could have chosen differently and nothing physical would change.
      `,
      words: 1200,
      figures: ["colour-matching-functions"],
      sources: ["cie-15-colorimetry"],
    },
    {
      title: "Imaginary primaries",
      argument: `
        The price of non-negativity is that X, Y and Z are not lights. No lamp emits
        the X primary. Readers who find this uncomfortable should be reassured that
        it is the same discomfort as a basis vector outside a convex cone, and no
        more.
      `,
      words: 650,
    },
    {
      title: "Integrating a spectrum into tristimulus values",
      argument: `
        The practical recipe, the k normalisation for reflecting surfaces, and the
        numerical care that sampling at 5 nm versus 1 nm actually requires for spiky
        sources.
      `,
      words: 850,
      sources: ["cie-15-colorimetry"],
    },
    {
      title: "Which observer?",
      argument: `
        1931 2 degrees, 1964 10 degrees, Judd-Vos, CIE 2006. What differs, by how
        much, and when it matters. The uncomfortable fact that the standard
        everything is built on is known to be wrong in the blue and is kept anyway,
        because compatibility beats accuracy.
      `,
      words: 1000,
      figures: ["colour-matching-functions"],
      sources: ["cie-15-colorimetry", "cvrl-database"],
    },
  ],
  exercises: [
    {
      prompt: `
        Derive the 1931 XYZ primaries from the Wright–Guild RGB matching data. Which
        constraints determine the transform uniquely, and which are free?
      `,
      kind: "proof",
    },
    {
      prompt: `
        Show that ȳ(λ) = V(λ) is a normalisation choice rather than a discovery, by
        constructing an equally valid XYZ-like basis in which it is not true.
      `,
      kind: "proof",
    },
    {
      prompt: `
        Integrate a narrow-band LED spectrum at 1 nm and at 5 nm sampling. How large
        is the disagreement, and how does it scale with the source's bandwidth?
      `,
      kind: "code",
      hint: "Spiky sources are where abridged tables fail.",
    },
  ],
});
