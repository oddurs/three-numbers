import { defineFigure } from "../../engine/figures/define.ts";
import { Plot } from "../../engine/draw/plot.ts";
import { theme, seriesColor } from "../../engine/draw/theme.ts";
import { hslToRgb, srgbToLab, srgbToOklab } from "../../engine/color/spaces.ts";
import { relativeLuminance } from "../../engine/color/rgbspace.ts";
import { Raster } from "../../engine/draw/raster.ts";
import { el } from "../../engine/draw/svg.ts";
import type { Vec3 } from "../../engine/color/math.ts";

export default defineFigure({
  id: "lightness-comparison",
  chapter: "ch07",
  title: "What three models think lightness is",
  caption: `Sweep the hue circle at constant HSL lightness 0.5 and constant saturation 1, and ask
    three models how light each colour is. HSL says --- by construction --- that they are all
    identical, which is the flat line at 50. Relative luminance $Y$ says the yellow at 60° is
    more than ten times the blue at 240°. CIE $L^*$ and Oklab's $L$ agree with each other and with
    the eye: the swing is about 60 units out of 100. The strip beneath is the actual sweep. Any
    interface that treats HSL's $L$ as lightness has a bug in it.`,
  claim: "HSL lightness is not lightness, and the error is enormous.",
  sources: ["ottosson-oklab"],
  placement: "wide",
  render() {
    const width = theme.widths.wide;
    const p = new Plot({
      width, height: 220,
      x: { domain: [0, 360], label: "HSL hue", unit: "degrees", ticks: [0, 60, 120, 180, 240, 300, 360] },
      y: { domain: [0, 100], label: "reported lightness", ticks: [0, 25, 50, 75, 100] },
      pad: { top: 12, right: 92, bottom: 58, left: 38 },
      grid: "none",
    });

    const hues = Array.from({ length: 361 }, (_, i) => i);
    const rgbAt = (h: number): Vec3 => hslToRgb([h, 1, 0.5]);

    p.line(hues.map((h) => [h, 50] as const), { stroke: seriesColor(0), width: theme.stroke.bold });
    p.line(hues.map((h) => [h, relativeLuminance(rgbAt(h)) * 100] as const), {
      stroke: seriesColor(3), width: theme.stroke.bold,
    });
    p.line(hues.map((h) => [h, srgbToLab(rgbAt(h))[0]!] as const), {
      stroke: seriesColor(2), width: theme.stroke.bold,
    });
    p.line(hues.map((h) => [h, srgbToOklab(rgbAt(h))[0]! * 100] as const), {
      stroke: seriesColor(5), width: theme.stroke.bold, dash: "3 2",
    });

    p.seriesLabel(360, 50, "HSL lightness", { color: seriesColor(0) });
    p.seriesLabel(360, relativeLuminance(rgbAt(360)) * 100, "luminance Y", { color: seriesColor(3), dy: 4 });
    p.seriesLabel(360, srgbToLab(rgbAt(360))[0]!, "CIE L*", { color: seriesColor(2), dy: -5 });
    p.seriesLabel(360, srgbToOklab(rgbAt(360))[0]! * 100, "Oklab L", { color: seriesColor(5), dy: 6 });

    // The sweep itself, under the axis.
    const strip = new Raster(720, 1);
    strip.fill((u) => rgbAt(u * 360));
    const stripY = p.height - 40;
    p.add(strip.toImage(p.left, stripY, p.innerWidth, 15, true), "over");
    p.add(el("rect", {
      x: p.left, y: stripY, width: p.innerWidth, height: 15,
      fill: "none", stroke: theme.ink.hairline, "stroke-width": theme.stroke.hairline,
    }), "over");

    return p.document();
  },
});
