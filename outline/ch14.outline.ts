import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch14",
  number: 14,
  part: "IV",
  title: "Palettes",
  status: "outline",
  epigraph: {
    text: `
      Choosing k colours is a clustering problem. Choosing k *distinguishable*
      colours is a packing problem. They are not the same problem and they do not
      have the same answer.
    `,
  },
  lead: `
    Two questions that look alike. Reducing an image to k colours is clustering, and
    the answer depends entirely on the metric. Designing k colours that a reader can
    tell apart is sphere packing under a perceptual metric with constraints, and the
    constraints are where the interesting work is.
  `,
  sections: [
    {
      title: "Median cut and octrees",
      argument: `
        Heckbert's algorithm, its speed, and its characteristic bias. Octree
        quantisation as the streaming alternative. Both operate on RGB, which is the
        problem.
      `,
      words: 1300,
      sources: ["heckbert-1982-color"],
    },
    {
      title: "k-means in a perceptual space",
      argument: `
        The same clustering with a metric that means something, and a demonstration
        of how much the choice of space changes the result. k-means++ seeding, and
        determinism as a requirement for reproducible builds.
      `,
      words: 1200,
      sources: ["ottosson-oklab"],
    },
    {
      title: "Sequential and diverging ramps",
      argument: `
        What a colourmap for continuous data owes the reader: monotone lightness
        above all, so that it survives greyscale printing and so that the data's
        ordering is visible to a dichromat. Why the rainbow map fails all of this
        and why it persists.
      `,
      words: 1500,
      sources: ["moreland-diverging"],
    },
    {
      title: "Categorical palettes",
      argument: `
        Farthest-point sampling under a perceptual metric, and the key move: measure
        separation as the *worst case* across normal vision and each deficiency, so
        that a pair which only survives trichromacy is rejected during generation
        rather than caught in review.
      `,
      words: 1600,
      figures: ["cvd-simulation"],
      sources: ["brettel-1997-computerized"],
    },
    {
      title: "The constraint nobody mentions",
      argument: `
        Beyond about four entries, hue alone cannot separate a palette for a
        dichromat, because dichromacy collapses the hue circle to roughly one
        dimension. Lightness must do the work. Derive the number, and note that the
        book's own figure palette was generated under exactly this constraint.
      `,
      words: 1200,
      figures: ["cvd-simulation"],
      sources: ["brettel-1997-computerized"],
    },
  ],
});
