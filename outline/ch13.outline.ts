import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch13",
  number: 13,
  part: "IV",
  title: "Dithering",
  status: "outline",
  epigraph: {
    text: `
      You are trading spatial resolution for amplitude resolution. The only question
      is which frequencies you pay in.
    `,
  },
  lead: `
    Four families of algorithm, one criterion. Because the eye is a low-pass filter,
    error at high spatial frequency is nearly free and error at low frequency is
    expensive. Every dithering method is a different attempt to push the error
    upward in frequency.
  `,
  sections: [
    {
      title: "Ordered dithering",
      argument: `
        The recursive Bayer construction, why it tiles, and its defect: a Bayer
        matrix has strong low-frequency content, which is exactly the energy the eye
        is most sensitive to. Derive the matrix rather than tabulating it.
      `,
      words: 1300,
      figures: ["dither-methods"],
    },
    {
      title: "Error diffusion",
      argument: `
        Floyd-Steinberg, Jarvis-Judice-Ninke, Atkinson, Sierra. Serpentine scanning,
        the worm artefact, and Atkinson's deliberate choice to discard a quarter of
        the error.
      `,
      words: 1500,
      figures: ["dither-methods"],
      sources: ["floyd-steinberg-1976"],
    },
    {
      title: "Blue noise",
      argument: `
        Void-and-cluster, what 'blue' means spectrally, and why a precomputed mask
        beats error diffusion for anything that has to be evaluated per-pixel in
        parallel. The GPU argument.
      `,
      words: 1500,
      figures: ["dither-methods"],
      sources: ["ulichney-1993-void"],
    },
    {
      title: "Measuring it properly",
      argument: `
        The measurement trap: per-pixel error *rises* when you dither. Only after a
        low-pass filter --- the eye's, approximated by a Gaussian --- does the
        ordering invert. Give the numbers, and note that a paper reporting raw RMSE
        for a dithering method is reporting the wrong thing.
      `,
      words: 1200,
      figures: ["dither-methods"],
    },
    {
      title: "Doing it in the right space",
      argument: `
        Diffusing error in gamma-encoded values distributes it unevenly in light.
        Show the difference, which is visible in the midtones and is one of the more
        satisfying one-line fixes in this book.
      `,
      words: 1000,
    },
  ],
});
