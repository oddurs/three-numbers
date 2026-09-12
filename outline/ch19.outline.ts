import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch19",
  number: 19,
  part: "V",
  title: "What Three Numbers Cannot Hold",
  status: "outline",
  epigraph: {
    text: `
      In visual perception a color is almost never seen as it really is \\u2014 as
      it physically is.
    `,
    source: "Josef Albers, Interaction of Color, 1963",
    unverified: true,
  },
  lead: `
    The model this book has built is powerful and finite, and the honest close is to
    say where it stops. Not as an apology --- the model earns its keep on every page
    before this one --- but because a reader who knows its boundary can tell the
    difference between a question it answers badly and a question it does not answer
    at all.
  `,
  sections: [
    {
      title: "Colour is contextual, and the model is not",
      argument: `
        Simultaneous contrast, the Cornsweet illusion, White's illusion, and the
        checker-shadow. A tristimulus value is a property of a stimulus; a percept
        is a property of a scene. Everything in Parts I to IV computes the first and
        is routinely read as the second.
      `,
      words: 1600,
      sources: ["fairchild-appearance", "lafer-sousa-2015"],
    },
    {
      title: "Naming, and whether it changes seeing",
      argument: `
        Berlin and Kay's sequence, the Himba and Russian blues experiments, and a
        careful account of what the linguistic-relativity evidence actually supports
        --- which is a reliable but small effect on discrimination speed, not a
        different visual world.
      `,
      words: 1700,
    },
    {
      title: "Colour as meaning",
      argument: `
        Warning red, mourning white, the fact that 'blue' is a young word in many
        languages and that Homer's sea was wine-dark. None of this is in the three
        numbers, and all of it governs what a colour does when you ship it.
      `,
      words: 1400,
    },
    {
      title: "What a better model would need",
      argument: `
        An honest wish list: spatial context, temporal adaptation, material
        appearance beyond colour (gloss, translucency, texture), and individual
        variation. Point at where each is being worked on, and at how far away it
        is.
      `,
      words: 1300,
      sources: ["fairchild-appearance"],
    },
    {
      title: "The case for the model anyway",
      argument: `
        Close by earning the whole book back. Three numbers built every display,
        every camera, every print process and every image format you have ever used.
        A lossy model that is this useful is not a failure of ambition; it is what a
        successful abstraction looks like.
      `,
      words: 1200,
    },
  ],
});
