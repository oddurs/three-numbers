import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch18",
  number: 18,
  part: "V",
  title: "Contrast, Legibility and the Standards",
  status: "outline",
  epigraph: {
    text: `
      WCAG 2's contrast ratio is a formula from 1988 wearing the clothes of a legal
      requirement.
    `,
  },
  lead: `
    Text has to be readable. The web has a mandated formula for deciding whether it
    is, the formula is known to be wrong in specific and predictable ways, and it is
    nonetheless load-bearing in law and procurement. Treat this carefully and
    fairly.
  `,
  sections: [
    {
      title: "The WCAG 2 formula",
      argument: `
        Where the (L1+0.05)/(L2+0.05) ratio comes from, what the 0.05 is doing, and
        what the 4.5:1 threshold was calibrated against.
      `,
      words: 750,
      sources: ["wcag-2"],
    },
    {
      title: "Where it fails",
      argument: `
        Two documented failure modes: it is roughly symmetric under polarity
        inversion when perception is not, so dark-mode pairs are systematically mis-
        scored; and it ignores font size and weight beyond a single coarse
        threshold. Show pairs that pass and are unreadable, and pairs that fail and
        are fine.
      `,
      words: 1050,
      sources: ["apca", "wcag-2"],
    },
    {
      title: "APCA and the successor problem",
      argument: `
        What a perceptually-grounded replacement looks like, why it is polarity-
        aware, and the standards-politics reality that a better formula must also be
        adoptable.
      `,
      words: 900,
      sources: ["apca"],
    },
    {
      title: "Contrast beyond text",
      argument: `
        Non-text contrast, focus indicators, charts, and the fact that most contrast
        guidance assumes a large uniform patch on a uniform ground, which describes
        almost nothing in a real interface.
      `,
      words: 700,
      sources: ["wcag-2"],
    },
    {
      title: "Dark mode as a colour problem",
      argument: `
        Why a naive inversion fails: pure black backgrounds, halation with saturated
        text, and the fact that the eye's adaptation state differs between the two
        modes so the same ratio does not mean the same thing.
      `,
      words: 850,
    },
  ],
});
