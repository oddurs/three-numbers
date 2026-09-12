import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch11",
  number: 11,
  part: "III",
  title: "Adaptation and White",
  status: "outline",
  epigraph: {
    text: `
      You have never seen the colour of anything. You have seen its colour relative
      to what your visual system has decided is white.
    `,
  },
  lead: `
    The eye re-normalises. A sheet of paper reads as white under tungsten and under
    noon daylight, though the light reaching the eye differs by a factor of three in
    the blue. Modelling that re-normalisation is chromatic adaptation, and it is the
    one piece of genuine perceptual modelling that ordinary pipelines cannot avoid.
  `,
  sections: [
    {
      title: "Von Kries and independent gain control",
      argument: `
        The hypothesis: each cone class scales independently to normalise the white.
        Three numbers, three gains. Show that this crude model explains most of what
        happens.
      `,
      words: 1200,
      sources: ["fairchild-appearance"],
    },
    {
      title: "Sharpened bases",
      argument: `
        Bradford, CAT02 and CAT16 are all the same three-step construction with a
        different middle basis, and the bases are sharpened *beyond* physiology
        because doing so predicts the data better. That fact deserves a paragraph of
        discomfort.
      `,
      words: 1300,
      sources: ["fairchild-appearance"],
    },
    {
      title: "Doing it in code",
      argument: `
        The adaptation matrix as a product of three matrices, the D50/D65 transform
        that every ICC profile contains, and where in a pipeline adaptation belongs.
      `,
      words: 1000,
      sources: ["icc-v4"],
    },
    {
      title: "White balance",
      argument: `
        Camera white balance as adaptation applied before capture is encoded,
        illuminant estimation as an ill-posed inverse problem, and grey-world and
        its descendants.
      `,
      words: 1200,
    },
    {
      title: "The dress",
      argument: `
        A serious treatment of the 2015 photograph, because it is the best available
        demonstration that colour is an inference. The ambiguity is real, the two
        answers correspond to two different assumptions about the illuminant, and
        the image genuinely underdetermines the question.
      `,
      words: 1400,
      sources: ["lafer-sousa-2015"],
    },
  ],
});
