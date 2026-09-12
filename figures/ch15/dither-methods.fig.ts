import { defineFigure } from "../../engine/figures/define.ts";
import { Canvas } from "../../engine/draw/plot.ts";
import { theme } from "../../engine/draw/theme.ts";
import { Raster } from "../../engine/draw/raster.ts";
import { el } from "../../engine/draw/svg.ts";
import {
  atkinson, blueNoiseMask, errorDiffuse, floydSteinberg, generateImage, getPixel,
  jarvisJudiceNinke, maskDither, orderedDither, perceivedDitherError, quantizeImage,
  type Image,
} from "../../engine/color/dither.ts";
import type { Vec3 } from "../../engine/color/math.ts";

const W = 300;
const H = 96;
const LEVELS = 3;

/** A ramp with a faint sinusoidal ripple, so banding has something to catch on. */
const source = (): Image =>
  generateImage(W, H, (x, y) => {
    const t = x / (W - 1);
    const ripple = 0.045 * Math.sin((y / H) * Math.PI * 1.2);
    const v = Math.min(1, Math.max(0, t * 0.92 + 0.04 + ripple));
    return [v, v, v] as Vec3;
  });

export default defineFigure({
  id: "dither-methods",
  chapter: "ch15",
  title: "Five ways to lose 5.4 bits",
  caption: `The same greyscale ramp reduced from continuous tone to *three* levels --- black, mid,
    white --- by five different methods. Naive rounding gives the banding you expect. Ordered
    dithering trades it for a visible crosshatch, because a Bayer matrix has strong energy at low
    frequencies. Floyd--Steinberg pushes the error forward and gets a much better result at the
    cost of directional worms. Atkinson diffuses only three quarters of the error, losing contrast
    but gaining crispness. A blue-noise mask has almost no low-frequency energy at all, which is
    why its grain reads as texture rather than as pattern. The number under each is RMS error in
    Oklab *after a Gaussian blur* --- the only measurement that matches what the eye does.`,
  claim: "Dithering raises per-pixel error and lowers perceived error; the two must be measured differently.",
  sources: ["ulichney-1993-void", "floyd-steinberg-1976"],
  placement: "wide",
  render() {
    const img = source();
    const mask = blueNoiseMask(32, 11);

    const variants: Array<{ label: string; image: Image }> = [
      { label: "no dither", image: quantizeImage(img, LEVELS) },
      { label: "ordered (Bayer 8×8)", image: orderedDither(img, LEVELS, 3) },
      { label: "Floyd–Steinberg", image: errorDiffuse(img, LEVELS, floydSteinberg) },
      { label: "Atkinson", image: errorDiffuse(img, LEVELS, atkinson) },
      { label: "blue noise (void-and-cluster)", image: maskDither(img, LEVELS, mask) },
    ];

    const width = theme.widths.wide;
    const cols = 1;
    const tileH = 42;
    const gapY = 26;
    const top = 24;
    const canvas = new Canvas(width, top + variants.length * (tileH + gapY) + 4);

    // The original, for reference.
    const orig = new Raster(W, H);
    orig.fill((_u, _v, x, y) => getPixel(img, x, y));
    canvas.text(0, 12, "continuous-tone original", {
      size: theme.font.size.annotation, fill: theme.ink.primary,
    });
    canvas.raster(orig, 0, top - 22, width, 14, true);

    variants.forEach((v, i) => {
      const y = top + i * (tileH + gapY) + 4;
      const r = new Raster(W, H);
      r.fill((_u, _v, x, yy) => getPixel(v.image, x, yy));
      canvas.text(0, y - 5, v.label, {
        size: theme.font.size.annotation, fill: theme.ink.primary,
      });
      const err = perceivedDitherError(img, v.image, 2);
      canvas.text(width, y - 5, `perceived RMS ΔE_ok ${err.toFixed(4)}`, {
        size: theme.font.size.tiny, fill: theme.ink.muted, anchor: "end",
      });
      // `pixelated` matters: the whole point is the pixel pattern.
      canvas.raster(r, 0, y, width, tileH, false);
      canvas.add(el("rect", {
        x: 0, y, width, height: tileH, fill: "none",
        stroke: theme.ink.hairline, "stroke-width": theme.stroke.hairline,
      }));
    });

    return canvas.document();
  },
});
