import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch16",
  number: 16,
  part: "IV",
  title: "Colour in the Rendering Pipeline",
  status: "outline",
  epigraph: {
    text: `
      A renderer is a machine for adding up light. Feed it code values and it adds
      up the wrong thing, very fast, in parallel.
    `,
  },
  lead: `
    Real-time and offline rendering are where every idea in this book has to be made
    cheap. The pipeline has a specific shape --- decode, work in scene-linear, tone-
    map, encode --- and almost every rendering artefact with a colour flavour comes
    from doing one of those steps in the wrong place.
  `,
  sections: [
    {
      title: "Texture encoding and hardware sRGB",
      argument: `
        Why sRGB texture formats exist, what the hardware actually does, and the
        specific bug of filtering an sRGB texture without the sRGB flag: the GPU
        interpolates code values and the result is dark.
      `,
      words: 1000,
      sources: ["poynton-video"],
    },
    {
      title: "Scene-linear working spaces",
      argument: `
        Why ACEScg rather than linear sRGB: negative values, wide-gamut light
        sources, and the fact that a renderer's intermediate values are radiance,
        not colour.
      `,
      words: 850,
      sources: ["aces-system"],
    },
    {
      title: "Tone mapping",
      argument: `
        The problem statement: map an unbounded radiance range onto a bounded
        display. Reinhard, filmic curves, and the ACES output transform as three
        points on a spectrum from arbitrary to principled. What each does to hue.
      `,
      words: 1200,
      sources: ["aces-system"],
    },
    {
      title: "Colour in shaders",
      argument: `
        Practical rules: what to store, when to decode, why to do lighting in linear
        and grading in a perceptual space, and the cost of an Oklab conversion in a
        fragment shader --- with the actual instruction count.
      `,
      words: 900,
    },
    {
      title: "The output chain",
      argument: `
        Swapchain formats, display profiles, HDR metadata, and the depressing gap
        between what an application asks for and what the compositor does.
      `,
      words: 750,
      sources: ["itu-bt2100"],
    },
  ],
});
