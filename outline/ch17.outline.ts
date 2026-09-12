import { defineChapter } from "../engine/outline/define.ts";

export default defineChapter({
  id: "ch17",
  number: 17,
  part: "V",
  title: "Colour Vision Deficiency",
  status: "outline",
  epigraph: {
    text: `
      A dichromat's visual system is not a filtered version of yours. It is a
      projection onto a plane, and the plane is computable.
    `,
  },
  lead: `
    Around eight percent of men have some form of colour vision deficiency.
    Simulating it correctly is not a matter of desaturating the red channel; it is a
    well-defined geometric operation in cone space, and once you have it, designing
    for it becomes an optimisation problem rather than a guess.
  `,
  sections: [
    {
      title: "The genetics and the numbers",
      argument: `
        L, M and S cone opsins, why the L and M genes sit adjacent on the X
        chromosome and recombine, and where the prevalence figures come from.
        Anomalous trichromacy versus dichromacy, and why the former is more common
        and less discussed.
      `,
      words: 900,
      sources: ["stockman-2000-spectral"],
    },
    {
      title: "Confusion lines",
      argument: `
        The geometry: a dichromat's confusions are straight lines in chromaticity
        meeting at a copunctal point --- the missing cone's own chromaticity. Derive
        this, because it makes everything else obvious.
      `,
      words: 1000,
      sources: ["brettel-1997-computerized"],
    },
    {
      title: "The Brettel projection",
      argument: `
        Build the simulation properly: project onto two half-planes hinged on the
        neutral axis, anchored at two specific wavelengths. Derive the half-planes
        from the measured cone fundamentals rather than copying a matrix, and be
        explicit about which LMS basis is being used and why the choice matters.
      `,
      words: 1250,
      figures: ["cvd-simulation"],
      sources: ["brettel-1997-computerized", "stockman-2000-spectral"],
    },
    {
      title: "Anomalous trichromacy",
      argument: `
        Why linear interpolation between normal and dichromatic vision is a
        convenience rather than a model, what Machado's approach does instead, and
        how much confidence any of it deserves.
      `,
      words: 700,
      sources: ["machado-2009-cvd"],
    },
    {
      title: "Designing for it",
      argument: `
        Practical consequences: redundant encoding, the lightness constraint from
        Chapter 14, testing under simulation as part of a build rather than as an
        audit, and the specific failure of red-green status indicators.
      `,
      words: 900,
      figures: ["cvd-simulation"],
    },
  ],
});
