import { defineFigure } from "../../engine/figures/define.ts";
import { Plot } from "../../engine/draw/plot.ts";
import { familyFor, theme, seriesColor } from "../../engine/draw/theme.ts";
import { blackbody, normalizePeak, samples, wienPeakNm } from "../../engine/color/spectrum.ts";
import { planckianChromaticity } from "../../engine/color/illuminant.ts";
import { chromaticityHex } from "../../engine/figures/lib/chromaticity.ts";
import { el } from "../../engine/draw/svg.ts";

const TEMPS = [1500, 2856, 4000, 6504, 10000];
const WIEN_NOTE = "dashed: Wien's law";

export default defineFigure({
  id: "blackbody-spectra",
  chapter: "ch02",
  title: "Planckian radiators from 1500 K to 10 000 K",
  caption: `Planck's law, plotted over the visible band and normalised to a common peak so the
    shapes can be compared. Everything a heated object does to its colour is in this one equation:
    as $T$ rises the peak moves left by Wien's law, $lambda_"max" = 2.898 times 10^6 \\/ T$ nm, and
    the curve flattens across the visible range. The swatch beside each label is the chromaticity
    that curve integrates to. Note that 2856 K is exactly CIE illuminant A --- a standard defined
    by pointing at a physical law rather than at a measurement.`,
  claim: "Colour temperature is a real physical parameterisation, not a metaphor.",
  sources: ["cie-15-colorimetry", "wyszecki-stiles"],
  placement: "wide",
  render() {
    const p = new Plot({
      width: theme.widths.wide,
      height: 200,
      x: { domain: [360, 830], label: "wavelength λ", unit: "nm", ticks: [400, 500, 600, 700, 800] },
      y: { domain: [0, 1.05], label: "relative spectral power", ticks: [0, 0.25, 0.5, 0.75, 1.0] },
      pad: { top: 10, right: 92, bottom: 30, left: 38 },
      grid: "none",
    });

    TEMPS.forEach((T, i) => {
      const spd = normalizePeak(blackbody(T, 360, 830, 2));
      p.line(samples(spd).map(([l, v]) => [l, v] as const), {
        stroke: seriesColor(i), width: theme.stroke.bold, smooth: true,
      });
      const peak = wienPeakNm(T);
      if (peak >= 380 && peak <= 820) {
        p.scatter([[peak, 1]], { r: 1.5, fill: seriesColor(i) });
      }
    });

    // Wien's law, traced across the peaks.
    const wien: Array<readonly [number, number]> = [];
    for (let T = 3400; T <= 8000; T += 100) {
      const peak = wienPeakNm(T);
      if (peak >= 360 && peak <= 830) wien.push([peak, 1]);
    }
    p.line(wien, { stroke: theme.ink.rule, width: theme.stroke.thin, dash: "2 2" });

    // Legend with a chromaticity swatch per temperature.
    TEMPS.forEach((T, i) => {
      const y = p.top + 16 + i * 15;
      const tempLabel = `${T.toLocaleString("en-GB").replace(",", " ")} K`;
      const c = planckianChromaticity(T);
      p.add(el("rect", {
        x: p.right + 12, y: y - 4.4, width: 9, height: 9, rx: 1,
        fill: chromaticityHex(c.x, c.y, 0.78),
        stroke: theme.ink.hairline, "stroke-width": theme.stroke.hairline,
      }), "over");
      p.add(el("line", {
        x1: p.right + 24, x2: p.right + 32, y1: y, y2: y,
        stroke: seriesColor(i), "stroke-width": theme.stroke.bold, "stroke-linecap": "round",
      }), "over");
      p.add(el("text", {
        x: p.right + 36, y,
        "font-family": familyFor(tempLabel), "font-size": theme.font.size.annotation,
        fill: theme.ink.secondary, "dominant-baseline": "middle",
      }, [tempLabel]), "over");
    });

    p.add(el("text", {
      x: p.right + 12, y: p.top + 16 + TEMPS.length * 15 + 8,
      "font-family": familyFor(WIEN_NOTE), "font-size": theme.font.size.tiny, fill: theme.ink.muted,
    }, ["dashed: Wien's law"]), "over");

    return p.document();
  },
});
