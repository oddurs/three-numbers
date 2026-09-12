import { defineFigure } from "../../engine/figures/define.ts";
import { Canvas } from "../../engine/draw/plot.ts";
import { theme } from "../../engine/draw/theme.ts";
import { Raster } from "../../engine/draw/raster.ts";
import { el } from "../../engine/draw/svg.ts";
import { xyzOfWavelength } from "../../engine/color/observer.ts";
import { toGamut } from "../../engine/color/gamut.ts";
import { sRGB } from "../../engine/color/rgbspace.ts";
import type { Vec3 } from "../../engine/color/math.ts";

const LO = 380;
const HI = 720;

export default defineFigure({
  id: "visible-spectrum",
  chapter: "ch01",
  title: "The visible spectrum, and what a screen can do with it",
  caption: `Every wavelength from 380 nm to 720 nm, rendered twice. The upper band gamut-maps each
    pure wavelength into sRGB and shows it at full brightness; the lower band shows how far outside
    the display's gamut that wavelength actually is --- black means reachable, and the height of
    the grey is the chroma the display had to throw away. A monochromatic 500 nm light is not a
    colour your screen has ever shown you.`,
  claim: "No display can reproduce a single wavelength; the spectrum as printed is an approximation.",
  sources: ["cie-15-colorimetry"],
  placement: "wide",
  render() {
    const width = theme.widths.wide;
    const bandHeight = 44;
    const errorHeight = 16;
    const left = 6;
    const right = 6;
    const inner = width - left - right;
    const canvas = new Canvas(width, bandHeight + errorHeight + 30);

    const brightest = (lambda: number): { color: Vec3; excess: number } => {
      const xyz = xyzOfWavelength(lambda);
      const sum = xyz[0] + xyz[1] + xyz[2];
      if (sum <= 0) return { color: [0, 0, 0], excess: 0 };
      const chroma: Vec3 = [xyz[0] / sum, xyz[1] / sum, xyz[2] / sum];
      // Normalise to unit luminance, then let the gamut mapper do the rest.
      const norm: Vec3 = [chroma[0] / chroma[1], 1, chroma[2] / chroma[1]];
      const mapped = toGamut([norm[0] * 0.9, 0.9, norm[2] * 0.9], sRGB);
      const peak = Math.max(...mapped);
      const scaled = mapped.map((c) => Math.min(1, c / (peak || 1))) as unknown as Vec3;
      return { color: scaled, excess: 1 - Math.min(1, peak) };
    };

    const cache = new Map<number, { color: Vec3; excess: number }>();
    const at = (lambda: number) => {
      const k = Math.round(lambda * 2);
      let v = cache.get(k);
      if (!v) { v = brightest(k / 2); cache.set(k, v); }
      return v;
    };

    const strip = new Raster(1200, 1);
    strip.fill((u) => at(LO + u * (HI - LO)).color);
    canvas.raster(strip, left, 0, inner, bandHeight, true);

    const err = new Raster(1200, 1);
    err.fill((u) => {
      const e = at(LO + u * (HI - LO)).excess;
      const g = 1 - e;
      return [g * 0.82 + 0.06, g * 0.82 + 0.06, g * 0.82 + 0.06];
    });
    canvas.raster(err, left, bandHeight + 3, inner, errorHeight, true);

    canvas.add(el("rect", {
      x: left, y: 0, width: inner, height: bandHeight,
      fill: "none", stroke: theme.ink.hairline, "stroke-width": theme.stroke.hairline,
    }));
    canvas.add(el("rect", {
      x: left, y: bandHeight + 3, width: inner, height: errorHeight,
      fill: "none", stroke: theme.ink.hairline, "stroke-width": theme.stroke.hairline,
    }));

    canvas.text(left + inner + 2, bandHeight + 3 + errorHeight / 2, "", { size: 6 });

    const axisY = bandHeight + errorHeight + 8;
    for (const lambda of [400, 450, 500, 550, 600, 650, 700]) {
      const x = left + ((lambda - LO) / (HI - LO)) * inner;
      canvas.add(el("line", {
        x1: x, x2: x, y1: axisY - 3, y2: axisY,
        stroke: theme.ink.rule, "stroke-width": theme.stroke.hairline,
      }));
      canvas.text(x, axisY + 8, String(lambda), {
        size: theme.font.size.tick, anchor: "middle", fill: theme.ink.secondary,
      });
    }
    canvas.text(left + inner / 2, axisY + 20, "wavelength λ (nm)", {
      size: theme.font.size.title, anchor: "middle", fill: theme.ink.primary,
    });
    canvas.text(left, bandHeight + 3 + errorHeight + 8, "", { size: 6 });

    return canvas.document();
  },
});
