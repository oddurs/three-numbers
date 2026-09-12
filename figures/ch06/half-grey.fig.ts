import { defineFigure } from "../../engine/figures/define.ts";
import { Canvas } from "../../engine/draw/plot.ts";
import { theme, familyFor } from "../../engine/draw/theme.ts";
import { Raster } from "../../engine/draw/raster.ts";
import { el } from "../../engine/draw/svg.ts";
import { srgbTransfer } from "../../engine/color/transfer.ts";
import { srgbToHex } from "../../engine/draw/format.ts";
import type { Vec3 } from "../../engine/color/math.ts";

/** Device pixels per point. High enough that a check survives to the printer. */
const SCALE = 4;
/** Check size in points: visible as a pattern up close, blending at arm's length. */
const CHECK_PT = 2;

const grey = (code: number): Vec3 => {
  const v = code / 255;
  return [v, v, v];
};

/** The code that is half the *light*: encode(0.5), not 255/2. */
const HALF_LIGHT_CODE = Math.round(srgbTransfer.encode(0.5) * 255);
const NAIVE_CODE = 128;

export default defineFigure({
  id: "half-grey",
  chapter: "ch06",
  title: "What half actually looks like",
  claim: "Averaging sRGB code values produces a result 2.3x too dark; the eye, which averages light, disagrees with the arithmetic.",
  caption: `Hold the page at arm's length, or squint. The checkerboard is equal parts black and
    white, so it emits exactly half the light of the white — and it matches the patch on the
    *right*, not the one in the middle. The middle patch is code 128, which is what you get by
    averaging the code values 0 and 255. The right-hand patch is code 188, which is what you get by
    averaging the light. The gap between them is the single most expensive misunderstanding in
    graphics: it is 2.3× in luminance, and it is wrong in the same direction every time.
    There is a further joke here. If the software showing you this figure resamples it — a browser
    zooming, a thumbnailer, a projector scaling to fit — it will very likely average the code
    values, and the checkerboard will turn into the middle patch in front of you.`,
  sources: ["poynton-video", "iec-61966-2-1"],
  placement: "wide",
  render() {
    const width = theme.widths.wide;
    const height = 132;
    const canvas = new Canvas(width, height);

    const bandY = 16;
    const bandH = 78;
    const third = width / 3;

    // The checkerboard, at a check size that survives print and still blends
    // optically at reading distance.
    const board = new Raster(Math.round(third * SCALE), Math.round(bandH * SCALE));
    const check = CHECK_PT * SCALE;
    board.fill((_u, _v, x, y) =>
      (Math.floor(x / check) + Math.floor(y / check)) % 2 === 0 ? [1, 1, 1] : [0, 0, 0],
    );
    // `pixelated` matters: any smoothing here would average the checks in the
    // wrong space and quietly destroy the demonstration.
    canvas.raster(board, 0, bandY, third, bandH, false);

    canvas.swatch(third, bandY, third, bandH, srgbToHex(grey(NAIVE_CODE)));
    canvas.swatch(third * 2, bandY, third, bandH, srgbToHex(grey(HALF_LIGHT_CODE)));

    canvas.add(el("rect", {
      x: 0, y: bandY, width, height: bandH,
      fill: "none", stroke: theme.ink.hairline, "stroke-width": theme.stroke.hairline,
    }));
    for (const x of [third, third * 2]) {
      canvas.add(el("line", {
        x1: x, x2: x, y1: bandY, y2: bandY + bandH,
        stroke: theme.ink.paper, "stroke-width": 0.6,
      }));
    }

    const heads: Array<[number, string]> = [
      [third * 0.5, "half the light"],
      [third * 1.5, "average the code values"],
      [third * 2.5, "average the light"],
    ];
    for (const [x, label] of heads) {
      canvas.text(x, bandY - 5, label, {
        size: theme.font.size.annotation, anchor: "middle", fill: theme.ink.primary,
      });
    }

    const feet: Array<[number, string, string]> = [
      [third * 0.5, "equal black and white", "luminance 0.500"],
      [third * 1.5, `code ${NAIVE_CODE}  ·  ${srgbToHex(grey(NAIVE_CODE))}`, "luminance 0.214"],
      [third * 2.5, `code ${HALF_LIGHT_CODE}  ·  ${srgbToHex(grey(HALF_LIGHT_CODE))}`, "luminance 0.500"],
    ];
    feet.forEach(([x, line1, line2]) => {
      canvas.text(x, bandY + bandH + 12, line1, {
        size: theme.font.size.tiny, anchor: "middle", fill: theme.ink.secondary,
        family: familyFor(line1),
      });
      canvas.text(x, bandY + bandH + 22, line2, {
        size: theme.font.size.tiny, anchor: "middle", fill: theme.ink.muted,
        family: familyFor(line2),
      });
    });

    return canvas.document();
  },
});
