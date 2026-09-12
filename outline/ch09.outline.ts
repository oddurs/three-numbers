import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch09",
  number: 9,
  part: "III",
  title: "Distance",
  status: "outline",
  epigraph: {
    text: `
      CIEDE2000 has five correction terms. Each one is an apology for a failure of
      the space it corrects.
    `,
  },
  lead: `
    How different are two colours? The question sounds simple and has consumed
    seventy years of committee work. Follow the sequence from Euclidean distance to
    CIEDE2000 as a series of empirical failures and patches, then ask what Oklab's
    claim to need no patches actually amounts to.
  `,
  sections: [
    {
      title: "Just-noticeable differences",
      argument: `
        MacAdam's experiment and its result: discrimination thresholds are ellipses,
        they vary by an order of magnitude, and they are oriented. Any metric that
        ignores this is wrong by a factor of ten somewhere.
      `,
      words: 1000,
      sources: ["macadam-1942-visual"],
    },
    {
      title: "CIE76 and its failure",
      argument: `
        Euclidean distance in CIELAB, the reason it was expected to work, and where
        it does not: saturated blues, near-neutrals, and lightness at the extremes.
      `,
      words: 850,
      figures: ["delta-e-contours"],
      sources: ["cie-15-colorimetry"],
    },
    {
      title: "CIEDE2000, term by term",
      argument: `
        Walk the formula and attribute every term to the failure it repairs: the
        chroma rescaling of a*, the three weighting functions, and the notorious
        rotation term that exists solely to fix the blue region. Verify the
        implementation against Sharma's published conformance set --- all thirty-
        four pairs --- and say so.
      `,
      words: 1400,
      figures: ["delta-e-contours"],
      sources: ["sharma-2004-ciede2000"],
    },
    {
      title: "What a delta-E means",
      argument: `
        A sober section on interpretation. One unit is not one JND except
        approximately, under specific viewing conditions, for large uniform patches.
        Tolerancing in print, textiles and manufacturing, and the CMC formula's
        asymmetry as a cautionary tale.
      `,
      words: 850,
      sources: ["sharma-2004-ciede2000"],
    },
    {
      title: "Oklab, ICtCp, and modern metrics",
      argument: `
        Euclidean distance in Oklab as a claim that the space is uniform enough not
        to need corrections. Delta-E ITP for HDR, where the old metrics have no
        defined behaviour above 100 nits.
      `,
      words: 900,
      figures: ["delta-e-contours"],
      sources: ["itu-bt2100", "ottosson-oklab"],
    },
  ],
});
