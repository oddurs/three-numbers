import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch07",
  number: 7,
  part: "II",
  title: "Perceptual Spaces, and the Cylinders on Top of Them",
  status: "outline",
  epigraph: {
    text: `
      CIELAB was built so that Euclidean distance would mean something. Chapter 9 is
      the story of how badly that went.
    `,
  },
  lead: `
    XYZ is linear and useless for judgement; RGB is device-bound. A perceptual space
    is an attempt to warp tristimulus space so that geometry matches experience.
    This chapter presents those attempts in order, then the cylindrical coordinates
    the industry actually ships on top of them --- because the gap between the two
    is where most interface colour bugs live.
  `,
  sections: [
    {
      title: "What 'uniform' would mean",
      argument: `
        Define the goal precisely --- equal distances should be equally noticeable
        --- and note immediately that this is a strong claim about a metric space
        and that no such space exists exactly.
      `,
      words: 650,
      sources: ["fairchild-appearance"],
    },
    {
      title: "CIELAB",
      argument: `
        The cube root as a compressive nonlinearity, the linear segment near black
        and why it is there, the opponent axes, and the relationship between L* and
        luminance. Derive why L* = 50 is not half the light.
      `,
      words: 1100,
      sources: ["cie-15-colorimetry"],
    },
    {
      title: "CIELUV and the road not taken",
      argument: `
        The alternative that kept a projective chromaticity diagram, why the
        television industry preferred it, and why it lost.
      `,
      words: 500,
      sources: ["cie-15-colorimetry"],
    },
    {
      title: "Oklab",
      argument: `
        A modern fit: same architecture as CIELAB, better cone matrix, better
        exponent, fitted against newer data. Show the matrices, note that it is a
        fit and not a theory, and show where it improves on CIELAB --- particularly
        the blue hue shift that CIELAB gets visibly wrong. Note also that its
        neutral axis misses sRGB's by about two parts in ten thousand, which is what
        being a fit costs.
      `,
      words: 1100,
      sources: ["ottosson-oklab"],
    },
    {
      title: "The cylinders: HSL, HSV and how they are built",
      argument: `
        Derive HSL and HSV from the gamma-encoded RGB cube geometrically, so the
        reader sees exactly what they are: max, min, and a hue angle determined by
        which face you are on. No perceptual data enters anywhere. Then give them a
        fair hearing --- they are cheap, they are in every picker, and for nudging
        one hue they are adequate.
      `,
      words: 900,
    },
    {
      title: "Measuring the damage",
      argument: `
        Sweep the hue circle at fixed HSL lightness and plot what three other models
        say. HSL reports a flat line; CIE L* swings by sixty units. Quantify it, and
        show what it does to a real interface.
      `,
      words: 1050,
      figures: ["lightness-comparison"],
      sources: ["ottosson-oklab"],
    },
    {
      title: "LCh, Oklch and HWB",
      argument: `
        The replacements with the same ergonomics and a real metric underneath, plus
        the Ostwald-flavoured HWB. The one genuine difficulty: a cylindrical
        perceptual space has a gamut boundary that varies with hue, so a chroma
        slider cannot have a fixed range. That is a real cost and the chapter should
        not pretend otherwise.
      `,
      words: 1050,
      figures: ["oklch-gamut-slice"],
      sources: ["css-color-4", "ottosson-oklab"],
    },
    {
      title: "Appearance models, briefly",
      argument: `
        CIECAM02 and CAM16 exist because a colour's appearance depends on the
        surround, the adapting luminance and the background, and none of the spaces
        above know any of that. Sketch the architecture, state what it buys, and be
        clear that most software will never use it.
      `,
      words: 750,
      sources: ["fairchild-appearance"],
    },
  ],
});
