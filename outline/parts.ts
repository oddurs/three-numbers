/**
 * The five parts of the book, in order.
 *
 * Chapters declare which part they belong to; this file declares what a part
 * is for. Order here is the order they are printed in.
 */

import { definePart } from "../engine/outline/define.ts";

export const parts = [
  definePart({
    number: "I",
    title: "Light",
    blurb: `
      Before colour is a data type it is a physical signal and a biological
      measurement. This part builds the model from the bottom: a spectrum is a
      function, the eye is a three-channel projection of that function, and
      everything that follows in the book is a consequence of the fact that the
      projection throws almost all of it away.
    `,
  }),
  definePart({
    number: "II",
    title: "Spaces",
    blurb: `
      Given three numbers, choose coordinates. This part is a tour of the coordinate
      systems the industry actually uses, each presented as what it is: a set of
      choices, made for reasons, with consequences. By the end the reader should be
      able to derive any RGB matrix from first principles and to say precisely what
      is wrong with HSL.
    `,
  }),
  definePart({
    number: "III",
    title: "Operations",
    blurb: `
      Coordinates are for computing with. This part is about the four things
      programs actually do to colours --- mix them, measure the distance between
      them, squeeze them into a device's range, and re-anchor them to a different
      white --- and about the fact that each of these is wrong by default.
    `,
  }),
  definePart({
    number: "IV",
    title: "Pixels",
    blurb: `
      Displays have finite levels, images have finite storage, and renderers have
      finite time. This part is about what happens when the continuous model of
      Parts I to III meets a discrete machine --- which is where colour theory turns
      into signal processing and stays there.
    `,
  }),
  definePart({
    number: "V",
    title: "People",
    blurb: `
      The model in Parts I to IV describes a standard observer who does not exist.
      This part is about the actual distribution of human vision, about what the
      model owes to readers it was not built for, and about the limits of the whole
      enterprise.
    `,
  }),
];
