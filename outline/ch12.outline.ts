import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch12",
  number: 12,
  part: "IV",
  title: "Quantisation and Banding",
  status: "outline",
  epigraph: {
    text: `
      Eight bits is not enough, and has never been enough; the transfer function has
      been hiding it for you.
    `,
  },
  lead: `
    Banding is a quantisation artefact, and like all quantisation artefacts it is
    best understood as a signal-processing problem: a smooth signal, a coarse
    quantiser, and a viewer whose visual system happens to amplify exactly the kind
    of error a naive quantiser produces.
  `,
  sections: [
    {
      title: "Where the levels go",
      argument: `
        Count them. How many distinguishable steps does 8-bit sRGB actually provide,
        where are they too coarse, and how does the transfer function redistribute
        them. The answer to 'why do gradients band in the shadows' is arithmetic,
        not mysticism.
      `,
      words: 1400,
      sources: ["poynton-video"],
    },
    {
      title: "Mach bands and why the eye finds edges",
      argument: `
        Lateral inhibition means the visual system differentiates. A quantiser
        produces step discontinuities. Those two facts multiply, which is why
        banding is far more visible than its amplitude suggests.
      `,
      words: 1200,
    },
    {
      title: "Bit depth, and where to spend it",
      argument: `
        10-bit, 12-bit, half-float. What HDR requires, and the specific argument for
        why PQ at 10 bits beats sRGB at 10 bits over the same range.
      `,
      words: 1100,
      sources: ["itu-bt2100"],
    },
    {
      title: "Dither as noise shaping",
      argument: `
        Reframe: dithering adds noise before quantising in order to decorrelate the
        error from the signal. This is the same trick as in audio, and stating it
        that way makes every later algorithm a question about the *spectrum* of the
        added noise.
      `,
      words: 1400,
      figures: ["dither-methods"],
      sources: ["ulichney-1993-void"],
    },
  ],
});
