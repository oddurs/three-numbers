import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch08",
  number: 8,
  part: "III",
  title: "Mixing Light",
  status: "outline",
  epigraph: {
    text: `
      Two colours have no midpoint. They have a midpoint in a space, and you have to
      say which one.
    `,
  },
  lead: `
    Interpolation is the operation programs perform most often on colour and get
    wrong most often. The fix is not a better formula; it is noticing that \`lerp\`
    needs a space argument and that the default choice is the worst available one.
  `,
  sections: [
    {
      title: "What a gradient is",
      argument: `
        Framing: a gradient is a curve through a colour space, and its appearance
        depends entirely on which space it is a curve through. Show the same two
        endpoints interpolated five ways.
      `,
      words: 900,
      figures: ["interpolation-spaces"],
      sources: ["css-color-4"],
    },
    {
      title: "Interpolating code values, and why it is wrong",
      argument: `
        Work through blue-to-yellow in sRGB byte values and show exactly where the
        light goes. Then show the same failure in its other costumes: image
        resizing, box blur, mipmaps, and font antialiasing.
      `,
      words: 1100,
      figures: ["interpolation-spaces"],
      sources: ["poynton-video"],
    },
    {
      title: "Linear light, and its own failure mode",
      argument: `
        Physically correct interpolation is not perceptually even --- it spends most
        of the ramp near the bright end. Explain why, and why 'just work in linear'
        is necessary but not sufficient.
      `,
      words: 750,
    },
    {
      title: "Hue paths",
      argument: `
        In a cylindrical space, two colours are joined by two arcs. Shorter, longer,
        increasing, decreasing --- the CSS Color 4 vocabulary --- and the specific
        artefact of accidentally taking the long way round through a hue nobody
        asked for.
      `,
      words: 700,
      figures: ["interpolation-spaces"],
      sources: ["css-color-4"],
    },
    {
      title: "Compositing and alpha",
      argument: `
        Porter-Duff, in linear light, with premultiplied alpha, and the three
        distinct bugs that come from getting any one of those three wrong. The dark-
        fringe artefact as a diagnostic.
      `,
      words: 1050,
      sources: ["porter-duff-1984"],
    },
    {
      title: "Blend modes",
      argument: `
        Multiply, screen, overlay and the rest as pointwise functions, why they are
        defined on linear light, and what the separable/non-separable distinction
        actually means.
      `,
      words: 650,
    },
  ],
});
