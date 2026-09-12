import { defineFigure } from "../../engine/figures/define.ts";
import { Canvas } from "../../engine/draw/plot.ts";
import { theme } from "../../engine/draw/theme.ts";
import { labelledRamp, rampAxis } from "../../engine/figures/lib/strips.ts";
import { mix, type MixSpace } from "../../engine/color/blend.ts";
import type { Vec3 } from "../../engine/color/math.ts";

const A: Vec3 = [0, 0, 1];
const B: Vec3 = [1, 1, 0];

const SPACES: Array<{ space: MixSpace; label: string; note: string }> = [
  { space: "srgb", label: "sRGB code values", note: "the default almost everywhere — and wrong" },
  { space: "linear", label: "linear light", note: "physically correct, perceptually top-heavy" },
  { space: "lab", label: "CIELAB", note: "even lightness, a detour through purple" },
  { space: "oklab", label: "Oklab", note: "even lightness, straighter hue" },
  { space: "oklch", label: "Oklch, shorter hue arc", note: "travels round the hue circle" },
];

export default defineFigure({
  id: "interpolation-spaces",
  chapter: "ch08",
  title: "One gradient, five spaces",
  caption: `Pure blue to pure yellow, interpolated five different ways. Only the endpoints agree.
    The sRGB ramp --- what you get from a naive \`lerp\` on byte values, and from most gradient
    tools --- goes dark and muddy in the middle, because averaging code values is not averaging
    light. Linear light fixes the muddiness and overshoots into a too-bright middle. The
    perceptual spaces hold lightness steady across the ramp; they differ in which way round the
    hue circle they travel, which is why the Oklch ramp passes through green and the Oklab ramp
    through grey.`,
  claim: "The interpolation space is a design decision with a visible consequence.",
  sources: ["ottosson-oklab", "css-color-4"],
  placement: "wide",
  render() {
    const width = theme.widths.wide;
    const labelWidth = 0;
    const rowHeight = 26;
    const rowGap = 22;
    const top = 14;
    const canvas = new Canvas(width, top + SPACES.length * (rowHeight + rowGap) + 10);

    SPACES.forEach((s, i) => {
      const y = top + i * (rowHeight + rowGap);
      labelledRamp(canvas, (t) => mix(A, B, t, s.space), {
        x: labelWidth, y, width: width - labelWidth, height: rowHeight,
        label: s.label, note: s.note,
      });
    });

    rampAxis(canvas, {
      x: labelWidth,
      y: top + SPACES.length * (rowHeight + rowGap) - rowGap + rowHeight,
      width: width - labelWidth,
      ticks: [
        { at: 0, label: "t = 0" },
        { at: 0.25, label: "0.25" },
        { at: 0.5, label: "0.5" },
        { at: 0.75, label: "0.75" },
        { at: 1, label: "1" },
      ],
    });

    return canvas.document();
  },
});
