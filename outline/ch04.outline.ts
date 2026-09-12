import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch04",
  number: 4,
  part: "II",
  title: "Chromaticity and Its Shadows",
  status: "outline",
  epigraph: {
    text: `
      The horseshoe is a shadow. Almost every claim people make by pointing at it is
      a claim about the shadow.
    `,
  },
  lead: `
    Normalise away intensity and two dimensions remain. The resulting diagram is the
    most recognisable image in the field and the most abused: it is a projective
    picture, distances in it mean nothing, and the areas people compare on it are
    not the quantities they think they are comparing.
  `,
  sections: [
    {
      title: "Projecting out intensity",
      argument: `
        x = X/(X+Y+Z). A perspective projection from the origin onto a plane, and
        therefore a projective map: straight lines are preserved, which is why
        additive mixtures lie on chords, and *nothing else is*.
      `,
      words: 1200,
      figures: ["cie-1931-chromaticity"],
      sources: ["cie-15-colorimetry"],
    },
    {
      title: "Reading the diagram correctly",
      argument: `
        What the locus is, what the line of purples is and why it has no wavelength,
        where white sits and why that is a choice, and what the interior colours in
        every printed version of this diagram actually are --- which is: made up,
        because the page cannot show them.
      `,
      words: 1400,
      figures: ["cie-1931-chromaticity"],
    },
    {
      title: "Distances that lie",
      argument: `
        MacAdam's ellipses: the discrimination threshold varies by an order of
        magnitude across the diagram. Therefore any statement of the form 'these two
        colours are close on the chromaticity diagram' is unfounded, and the
        widespread practice of comparing gamut *areas* on it is worse.
      `,
      words: 1600,
      sources: ["macadam-1942-visual"],
    },
    {
      title: "u'v' and the partial repair",
      argument: `
        The 1976 UCS transform as a projective correction. It makes the ellipses
        rounder and is still not uniform. Useful as a lesson in how far a linear-
        fractional fix can take you.
      `,
      words: 1000,
      sources: ["cie-15-colorimetry"],
    },
    {
      title: "Dominant wavelength, purity, and colour temperature",
      argument: `
        The quantities people actually want from this diagram, defined properly,
        plus correlated colour temperature and why a single number for 'how blue is
        this white' requires a metric that the diagram does not have.
      `,
      words: 1300,
      figures: ["blackbody-spectra"],
    },
  ],
});
