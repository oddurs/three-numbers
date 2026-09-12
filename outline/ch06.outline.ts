import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch06",
  number: 6,
  part: "II",
  title: "The Transfer Function",
  status: "outline",
  epigraph: {
    text: `
      The single most expensive misunderstanding in graphics is that a pixel value
      is an amount of light.
    `,
  },
  lead: `
    Between a stored number and an emitted photon sits a nonlinear curve. It exists
    for two unrelated reasons --- a physical accident of cathode ray tubes and a
    genuine perceptual argument about coding efficiency --- and conflating those two
    reasons is how the folklore got so confused.
  `,
  sections: [
    {
      title: "Why there is a curve at all",
      argument: `
        The CRT's power law, the happy coincidence that its inverse resembles
        perceptual lightness, and the resulting efficient allocation of code values.
        Modern displays have no such physics and emulate the curve anyway, for
        compatibility.
      `,
      words: 1400,
      sources: ["poynton-video"],
    },
    {
      title: "sRGB is not gamma 2.2",
      argument: `
        Show the two curves, show the error, and be precise about where it matters:
        about two percent through the midtones, and catastrophic in the deep shadows
        where the linear toe lives. Name the bug this causes.
      `,
      words: 1500,
      figures: ["transfer-functions"],
      sources: ["css-color-4"],
    },
    {
      title: "The half-grey problem",
      argument: `
        Work the canonical example all the way through. 128 is not half of 255 in
        any sense that matters; the light is about 21.4 percent. Then show the
        consequences: image downscaling, alpha blending, antialiasing and blur all
        performed in the wrong space, with the same characteristic darkening.
      `,
      words: 1700,
      sources: ["poynton-video"],
    },
    {
      title: "Linear workflows",
      argument: `
        What it actually means to 'work in linear': where to decode, where to
        encode, what to store, and why a 16-bit or float buffer is not optional once
        you decode. The precision argument, quantitatively.
      `,
      words: 1300,
    },
    {
      title: "High dynamic range",
      argument: `
        PQ and HLG. PQ as the first transfer function in this book derived from a
        perceptual model rather than from hardware, absolute versus relative
        encoding, and why HDR forces the question 'how bright is white' to have a
        real answer.
      `,
      words: 1600,
      figures: ["transfer-functions"],
      sources: ["itu-bt2100", "smpte-st2084"],
    },
  ],
  exercises: [
    {
      prompt: `
        Find the encoded value V at which decoding sRGB as a pure 2.2 power law is
        exactly correct, and explain why there are two such values rather than one.
      `,
      kind: "proof",
    },
    {
      prompt: `
        Resize an image by half in encoded values and in linear light. Measure the
        mean luminance of each result against the original and explain the sign of
        the error.
      `,
      kind: "code",
    },
    {
      prompt: `
        PQ encodes absolute luminance. Work out what happens when PQ content
        mastered for 1000 cd/m² is shown on a 400 cd/m² display with no tone
        mapping.
      `,
      kind: "think",
    },
  ],
});
