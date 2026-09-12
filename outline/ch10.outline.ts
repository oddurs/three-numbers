import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch10",
  number: 10,
  part: "III",
  title: "Gamuts, Clipping and Mapping",
  status: "outline",
  epigraph: {
    text: `
      A gamut is a solid. The triangle is its shadow, and the shadow is missing the
      dimension where the problem lives.
    `,
  },
  lead: `
    Every display can produce a bounded set of colours, and every real pipeline
    eventually asks for one outside it. What happens next is a design decision that
    most software makes by accident, in the form of a clamp.
  `,
  sections: [
    {
      title: "The gamut as a solid",
      argument: `
        Take the RGB cube through the transfer function and the matrix and look at
        the shape it makes in a perceptual space. Constant-hue slices, the cusp, and
        how violently the cusp's position varies with hue.
      `,
      words: 1050,
      figures: ["oklch-gamut-slice"],
      sources: ["css-color-4"],
    },
    {
      title: "Clipping, and what it costs",
      argument: `
        Per-channel clamping is the default everywhere. Show what it does to hue ---
        it rotates it, visibly, and worst exactly where the colour was most
        saturated.
      `,
      words: 750,
    },
    {
      title: "The CSS Color 4 algorithm",
      argument: `
        Hold lightness and hue, binary-search chroma, accept when the clipped
        version is within a delta-E of the target. Explain why holding lightness
        rather than chroma is the right default, and implement it in twenty lines.
      `,
      words: 1000,
      figures: ["oklch-gamut-slice"],
      sources: ["css-color-4"],
    },
    {
      title: "Rendering intents",
      argument: `
        Perceptual, relative colorimetric, saturation, absolute. What ICC actually
        specifies versus what vendors do, and why 'perceptual' is a vendor's opinion
        rather than a defined transform.
      `,
      words: 900,
      sources: ["icc-v4"],
    },
    {
      title: "Wider gamuts in practice",
      argument: `
        Shipping P3 on the web, the fallback problem, and how to author once for two
        gamuts without either flattening the wide one or lying about the narrow one.
      `,
      words: 750,
      sources: ["css-color-4"],
    },
  ],
});
