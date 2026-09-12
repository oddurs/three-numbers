import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch15",
  number: 15,
  part: "IV",
  title: "Ink",
  status: "outline",
  epigraph: {
    text: `
      Every model so far has assumed the colour arrives as light. Half the colour in
      the world arrives as the light that was left over.
    `,
  },
  lead: `
    Additive mixing is the easy case: two lights add, and the arithmetic is linear.
    A surface does not add anything. It removes, multiplicatively, and then the ink
    sits in a layer with thickness and scatter and a substrate underneath. This
    chapter is the one place the book leaves the comfort of a three-by-three matrix,
    and it is the reason CMYK is not a colour space.
  `,
  sections: [
    {
      title: "Subtractive mixing is multiplication",
      argument: `
        Reflectance multiplies where radiance adds. Derive why that makes the
        arithmetic non-linear in any tristimulus coordinate, and why two inks that
        each look fine can overprint to mud.
      `,
      words: 1400,
      sources: ["wyszecki-stiles"],
    },
    {
      title: "Why CMYK is not a colour space",
      argument: `
        CMYK is a set of *instructions to a device*, not a coordinate system: the
        same four numbers mean different colours on different presses, papers and
        screening. There is no CMYK-to-RGB matrix and there never can be, which is
        why the conversion needs a measured profile.
      `,
      words: 1500,
      sources: ["icc-v4"],
    },
    {
      title: "Black, and why there are four inks",
      argument: `
        Grey component replacement and under-colour removal. Three inks can in
        principle make black; the reasons they do not are register, ink load, drying
        and cost --- and the resulting choice of how much K to substitute is a
        genuinely free parameter with visible consequences.
      `,
      words: 1300,
      sources: ["icc-v4"],
    },
    {
      title: "Halftones and dot gain",
      argument: `
        The screening problem is Chapter 13's dithering problem with physics
        attached: ink spreads. Amplitude-modulated versus frequency-modulated
        screening, and why FM screening is blue noise under another name.
      `,
      words: 1400,
      sources: ["ulichney-1993-void"],
    },
    {
      title: "Spot colours and the limits of process",
      argument: `
        Why Pantone exists, what a spot colour buys that four-colour process cannot,
        and what happens to brand colours that live outside CMYK.
      `,
      words: 1000,
    },
    {
      title: "Profiling a press",
      argument: `
        Measurement, the characterisation target, and the fact that a print pipeline
        is the one place in this book where the only honest answer is to go and
        measure the device.
      `,
      words: 1200,
      sources: ["cie-15-colorimetry", "icc-v4"],
    },
  ],
});
