import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch02",
  number: 2,
  part: "I",
  title: "Three Numbers",
  status: "outline",
  epigraph: {
    text: `
      the Rays to speak properly are not coloured. In them there is nothing else
      than a certain Power and Disposition to stir up a Sensation of this or that
      Colour.
    `,
    source: "Isaac Newton, Opticks, 1704",
    unverified: true,
  },
  lead: `
    This is the pivot of Part I. Three cone types, three inner products, one
    3-vector. From that single fact derive Grassmann's laws, the existence of
    metamers, and the reason colour arithmetic is linear at all --- which is the
    property that makes every matrix in the rest of the book legitimate.
  `,
  sections: [
    {
      title: "Cones as inner products",
      argument: `
        The L, M and S fundamentals from Stockman and Sharpe, plotted from the
        measured data. Emphasise the overlap between L and M: they are far more
        similar than intuition suggests, which is why red-green deficiency is common
        and blue-yellow is rare.
      `,
      words: 1000,
      sources: ["cvrl-database", "stockman-2000-spectral"],
    },
    {
      title: "Grassmann's laws and why colour is linear",
      argument: `
        State the laws as the empirical claim that colour matching is a linear map,
        note that this is a *contingent experimental fact* rather than a necessity,
        and note where it breaks down --- very low light, very high saturation, very
        small fields.
      `,
      words: 850,
    },
    {
      title: "Metamerism, constructed",
      argument: `
        Build a metamer explicitly by solving a 3x3 system rather than by searching:
        pick three emission lines, solve for the weights that reproduce a target's
        tristimulus values, and observe that the answer is exact and the spectra
        share nothing. Distinguish illuminant metamerism, observer metamerism, and
        geometric metamerism, and note which one ruins car paint.
      `,
      words: 1250,
      figures: ["metamer-pair"],
      sources: ["cie-15-colorimetry"],
    },
    {
      title: "The null space, and what lives in it",
      argument: `
        Formalise: the set of spectra invisible to the eye is a closed subspace of
        enormous dimension. Fundamental metamers and the black-metamer
        decomposition. This is the cleanest statement of what colour vision
        discards.
      `,
      words: 900,
      sources: ["wyszecki-stiles"],
    },
    {
      title: "Rods, and the part of the model we are ignoring",
      argument: `
        Scotopic vision, the Purkinje shift, and an honest statement that this book
        assumes photopic conditions throughout and that mesopic vision is a
        genuinely unsolved practical problem.
      `,
      words: 550,
    },
  ],
  exercises: [
    {
      prompt: `
        Construct a metamer for a given reflectance using four narrow lines instead
        of three. The system is now underdetermined: describe the solution space,
        and find the member of it with the smallest total power.
      `,
      kind: "code",
    },
    {
      prompt: `
        Prove that the set of spectra invisible to a trichromat is a linear
        subspace, and give its dimension for a spectrum sampled at 5 nm from 380 to
        730 nm.
      `,
      kind: "proof",
    },
    {
      prompt: `
        Two paints match under D65 and diverge under illuminant A. Using only the
        definition of the tristimulus integral, explain why no choice of three-
        number colour space can prevent this.
      `,
      kind: "think",
    },
  ],
});
