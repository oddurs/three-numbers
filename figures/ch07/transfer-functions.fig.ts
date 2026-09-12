import { defineFigure } from "../../engine/figures/define.ts";
import { compose, Plot } from "../../engine/draw/plot.ts";
import { theme, seriesColor } from "../../engine/draw/theme.ts";
import { pureGamma, rec709Transfer, srgbTransfer, linearTransfer } from "../../engine/color/transfer.ts";

const curve = (f: (v: number) => number, n = 240): Array<readonly [number, number]> =>
  Array.from({ length: n + 1 }, (_, i) => [i / n, f(i / n)] as const);

export default defineFigure({
  id: "transfer-functions",
  chapter: "ch07",
  title: "Transfer functions, and the gap between sRGB and gamma 2.2",
  caption: `Left: encoded value against linear light, for four curves that are routinely treated as
    interchangeable. At this scale they are indistinguishable, which is exactly why the confusion
    survives. Right: the error you make by decoding sRGB as a pure 2.2 power law, as a percentage
    of the true linear value. Through the midtones it is a harmless over-estimate peaking at 2.0%
    near V = 0.60. Below V = 0.39 it turns negative and then collapses: at V = 0.04 the power law
    returns barely a quarter of the light that is actually there. The approximation is excellent
    everywhere you are likely to test it and catastrophic in the shadows, where banding lives.`,
  claim: "sRGB is not gamma 2.2; the error is ~2% in midtones and unbounded in the toe.",
  sources: ["css-color-4"],
  placement: "wide",
  render() {
    const width = theme.widths.wide;
    const gap = 30;
    const panelWidth = (width - gap) / 2;
    const height = 205;

    const left = new Plot({
      width: panelWidth,
      height,
      x: { domain: [0, 1], label: "linear light L", ticks: [0, 0.25, 0.5, 0.75, 1] },
      y: { domain: [0, 1], label: "encoded value V", ticks: [0, 0.25, 0.5, 0.75, 1] },
      pad: { top: 10, right: 12, bottom: 30, left: 36 },
      grid: "none",
    });

    const curves = [
      { tf: linearTransfer, label: "linear (V = L)", color: theme.ink.muted, dash: "2 2" },
      { tf: srgbTransfer, label: "sRGB", color: seriesColor(2) },
      { tf: pureGamma(2.2), label: "pure gamma 2.2", color: seriesColor(3), dash: "3 2" },
      { tf: rec709Transfer, label: "Rec.709 OETF", color: seriesColor(5), dash: "1.4 1.4" },
    ];
    for (const c of curves) {
      left.line(curve((v) => c.tf.encode(v)), {
        stroke: c.color,
        width: theme.stroke.bold,
        dash: c.dash,
      });
    }
    left.legend(
      curves.map((c) => ({ label: c.label, color: c.color, dash: c.dash })),
      { x: left.left + 92, y: left.bottom - 56 },
    );

    // The error panel. A log x-axis is the only way to show both regimes at
    // once: the interesting behaviour is squeezed into the bottom 4% of V.
    const g22 = pureGamma(2.2);
    const right = new Plot({
      width: panelWidth,
      height,
      x: {
        domain: [0.002, 1],
        label: "encoded value V",
        scale: "log",
        format: (v) => (v >= 1 ? "1" : v.toString().replace(/0+$/, "")),
      },
      y: {
        domain: [-100, 20],
        label: "error in linear light",
        unit: "%",
        ticks: [-100, -75, -50, -25, 0, 20],
      },
      pad: { top: 10, right: 12, bottom: 30, left: 40 },
      grid: "none",
    });

    right.hrule(0, { stroke: theme.ink.gridStrong });
    const err: Array<readonly [number, number]> = [];
    for (let i = 0; i <= 600; i++) {
      const v = 0.002 * Math.pow(1 / 0.002, i / 600);
      const truth = srgbTransfer.decode(v);
      const approx = g22.decode(v);
      err.push([v, ((approx - truth) / truth) * 100] as const);
    }
    right.line(err, { stroke: seriesColor(3), width: theme.stroke.bold });
    right.vrule(0.389, { dash: "1.5 1.5", stroke: theme.ink.rule });
    right.annotate(0.389, -40, "sign change at V = 0.39", { dx: -12, dy: -4, anchor: "end" });
    right.annotate(0.6, 2.04, "peak +2.0%", { dx: -16, dy: -20, anchor: "end" });
    right.annotate(0.04, -72.9, "−73% at V = 0.04", { dx: 12, dy: 14 });

    return compose(width, height, [
      { x: 0, y: 0, plot: left },
      { x: panelWidth + gap, y: 0, plot: right },
    ]);
  },
});
