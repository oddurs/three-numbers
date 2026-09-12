import { defineFigure } from "../../engine/figures/define.ts";
import { Plot } from "../../engine/draw/plot.ts";
import { familyFor, theme, seriesColor } from "../../engine/draw/theme.ts";
import { Raster } from "../../engine/draw/raster.ts";
import { el } from "../../engine/draw/svg.ts";
import { hueCusp, hueSliceBoundary, maxChroma } from "../../engine/color/gamut.ts";
import { oklchToSrgb } from "../../engine/color/spaces.ts";
import { displayP3, rec2020, sRGB } from "../../engine/color/rgbspace.ts";
import { inGamut } from "../../engine/color/gamut.ts";
import { mul } from "../../engine/color/math.ts";
import { oklabToXyz, fromPolar } from "../../engine/color/spaces.ts";
import { xyzToRgbMatrix } from "../../engine/color/rgbspace.ts";

const HUES = [29, 142, 264];
const HUE_NAMES = ["red, 29°", "green, 142°", "blue, 264°"];
const C_MAX = 0.34;

export default defineFigure({
  id: "oklch-gamut-slice",
  chapter: "ch05",
  title: "Constant-hue slices through the sRGB gamut",
  caption: `A gamut is a solid, and this is what a vertical slice through it looks like: lightness
    up, chroma across, hue fixed. The pointed corner is the *cusp* --- the most saturated colour of
    that hue the display can make, and the only place on the boundary where clipping has nowhere
    good to go. Note how differently the three hues behave: sRGB's blue cusp sits low and far out,
    its green cusp high and near. This is why "same chroma, different hue" is not a thing you can
    ask a display for, and why a hue-preserving gamut mapper has to give up chroma rather than
    lightness. The outlines show how much further Display P3 and Rec.2020 reach.`,
  claim: "The gamut boundary at fixed hue is a cusp, and its position varies enormously with hue.",
  sources: ["css-color-4", "ottosson-oklab"],
  placement: "wide",
  render() {
    const width = theme.widths.wide;
    const gap = 18;
    const panelWidth = (width - gap * 2) / 3;
    const height = 230;
    const children = [];

    for (let i = 0; i < HUES.length; i++) {
      const hue = HUES[i]!;
      const p = new Plot({
        width, height,
        x: { domain: [0, C_MAX], label: i === 1 ? "chroma C" : undefined, ticks: [0, 0.1, 0.2, 0.3] },
        y: { domain: [0, 1], label: i === 0 ? "lightness L" : undefined, ticks: [0, 0.25, 0.5, 0.75, 1], labelTicks: i === 0 },
        pad: {
          top: 14,
          right: width - (i * (panelWidth + gap) + panelWidth),
          bottom: 32,
          left: i * (panelWidth + gap) + (i === 0 ? 30 : 10),
        },
        grid: "none",
        frame: false,
      });

      const raster = new Raster(Math.round(p.innerWidth * 3), Math.round(p.innerHeight * 3));
      const inv = xyzToRgbMatrix(sRGB);
      raster.fillAA((u, v) => {
        const L = 1 - v;
        const C = u * C_MAX;
        const lin = mul(inv, oklabToXyz(fromPolar([L, C, hue])));
        if (!inGamut(lin, 1e-6)) return null;
        return oklchToSrgb([L, C, hue]);
      }, 2);
      p.raster(raster, { smooth: true });

      for (const [space, color, dash] of [
        [displayP3, seriesColor(3), "3 2"] as const,
        [rec2020, seriesColor(2), "1.4 1.4"] as const,
      ]) {
        const b = hueSliceBoundary(hue, space, 90).map((q) => [Math.min(q.C, C_MAX), q.L] as const);
        p.line(b, { stroke: color, width: theme.stroke.thin, dash });
      }

      const cusp = hueCusp(hue, sRGB, 160);
      p.scatter([[cusp.C, cusp.L]], { r: 1.8, fill: theme.ink.primary });
      p.label(cusp.C, cusp.L, `cusp  L ${cusp.L.toFixed(2)}`, {
        dx: -5, dy: -6, size: theme.font.size.tiny, anchor: "end", fill: theme.ink.primary,
      });

      p.label(0, 1, HUE_NAMES[i]!, {
        dx: 0, dy: -5, size: theme.font.size.annotation, fill: theme.ink.primary,
      });

      children.push(...p.document().children);
    }

    // One shared legend under the middle panel.
    const legendY = height - 8;
    children.push(el("g", {}, [
      el("line", { x1: panelWidth + gap + 4, x2: panelWidth + gap + 14, y1: legendY, y2: legendY, stroke: seriesColor(3), "stroke-width": theme.stroke.bold, "stroke-dasharray": "3 2" }),
      el("text", { x: panelWidth + gap + 18, y: legendY, "font-family": familyFor("Display P3"), "font-size": theme.font.size.tiny, fill: theme.ink.secondary, "dominant-baseline": "middle" }, ["Display P3"]),
      el("line", { x1: panelWidth + gap + 78, x2: panelWidth + gap + 88, y1: legendY, y2: legendY, stroke: seriesColor(2), "stroke-width": theme.stroke.bold, "stroke-dasharray": "1.4 1.4" }),
      el("text", { x: panelWidth + gap + 92, y: legendY, "font-family": familyFor("Rec.2020"), "font-size": theme.font.size.tiny, fill: theme.ink.secondary, "dominant-baseline": "middle" }, ["Rec.2020"]),
    ]));

    return { width, height, children };
  },
});
