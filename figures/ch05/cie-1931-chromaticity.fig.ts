import { defineFigure } from "../../engine/figures/define.ts";
import { Plot } from "../../engine/draw/plot.ts";
import { familyFor, theme } from "../../engine/draw/theme.ts";
import { drawGamutTriangle, drawLocus, horseshoeRaster } from "../../engine/figures/lib/chromaticity.ts";
import { displayP3, rec2020, sRGB } from "../../engine/color/rgbspace.ts";
import { planckianChromaticity, whitePointsXy } from "../../engine/color/illuminant.ts";
import { seriesColor } from "../../engine/draw/theme.ts";

const GAMUT_NOTE = "desaturated = outside sRGB";

export default defineFigure({
  id: "cie-1931-chromaticity",
  chapter: "ch05",
  title: "The CIE 1931 chromaticity diagram",
  caption: `Every colour a human eye can be shown, projected onto two dimensions. The curved
    boundary is the spectrum locus: the chromaticity of each pure wavelength, in nanometres. The
    dashed chord is the line of purples, which no single wavelength produces. Interior colours
    outside the sRGB gamut are shown desaturated, because this page cannot print them --- roughly
    two thirds of the shape is a polite fiction. The triangles are the sRGB, Display P3 and
    Rec.2020 gamuts; the thin curve through the middle is the Planckian locus from 1500 K to
    20 000 K.`,
  claim: "The gamut of any display is a small triangle inside the set of visible chromaticities.",
  sources: ["cie-15-colorimetry"],
  placement: "wide",
  render() {
    const p = new Plot({
      width: theme.widths.wide,
      height: 340,
      x: { domain: [0, 0.8], label: "x", ticks: [0, 0.2, 0.4, 0.6, 0.8] },
      y: { domain: [0, 0.9], label: "y", ticks: [0, 0.2, 0.4, 0.6, 0.8] },
      pad: { top: 12, right: 150, bottom: 28, left: 34 },
      grid: "none",
      frame: false,
    });

    p.raster(horseshoeRaster(p, { markOutOfGamut: true, lightness: "max" }), { smooth: true });
    drawLocus(p);

    const spaces = [
      { space: sRGB, color: theme.ink.primary, dash: undefined, label: "sRGB / Rec.709" },
      { space: displayP3, color: seriesColor(3), dash: "3 1.8", label: "Display P3" },
      { space: rec2020, color: seriesColor(2), dash: "1.4 1.4", label: "Rec.2020" },
    ];
    for (const s of spaces) {
      drawGamutTriangle(p, s.space, { stroke: s.color, dash: s.dash, width: theme.stroke.thin, dots: false });
    }

    // The Planckian locus: where a heated object sits as it glows.
    const planck: Array<readonly [number, number]> = [];
    for (let T = 1500; T <= 20000; T += T < 4000 ? 100 : 500) {
      const c = planckianChromaticity(T);
      planck.push([c.x, c.y]);
    }
    p.line(planck, { stroke: theme.ink.secondary, width: theme.stroke.thin, smooth: true });
    for (const T of [2000, 3000, 6500, 10000]) {
      const c = planckianChromaticity(T);
      p.scatter([[c.x, c.y]], { r: 1.2, fill: theme.ink.primary });
    }

    const d65 = whitePointsXy.D65;
    p.scatter([[d65.x, d65.y]], { r: 2, fill: "none", stroke: theme.ink.primary, width: theme.stroke.regular });
    p.annotate(d65.x, d65.y, "D65", { dx: -26, dy: 16, anchor: "middle" });
    p.annotate(planckianChromaticity(2000).x, planckianChromaticity(2000).y, "2000 K", { dx: 42, dy: 62 });
    p.annotate(planckianChromaticity(10000).x, planckianChromaticity(10000).y, "10 000 K", { dx: -16, dy: -22, anchor: "end" });

    p.legend(
      [
        ...spaces.map((s) => ({ label: s.label, color: s.color, dash: s.dash })),
        { label: "Planckian locus", color: theme.ink.secondary },
      ],
      { x: p.right + 14, y: p.top + 18 },
    );

    p.add({
      tag: "text",
      attrs: {
        x: p.right + 14, y: p.top + 86,
        "font-family": familyFor(GAMUT_NOTE), "font-size": theme.font.size.tiny,
        fill: theme.ink.muted,
      },
      children: [GAMUT_NOTE],
    }, "over");

    return p.document();
  },
});
