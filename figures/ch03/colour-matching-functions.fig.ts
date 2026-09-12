import { defineFigure } from "../../engine/figures/define.ts";
import { Plot } from "../../engine/draw/plot.ts";
import { cmfColors, theme } from "../../engine/draw/theme.ts";
import { cie1931, cie1964 } from "../../engine/color/observer.ts";
import { samples } from "../../engine/color/spectrum.ts";

const band = (s: ReturnType<typeof samples>) =>
  s.filter(([l]) => l >= 380 && l <= 730).map(([l, v]) => [l, v] as const);

export default defineFigure({
  id: "colour-matching-functions",
  chapter: "ch03",
  title: "The CIE 1931 colour-matching functions",
  caption: `The three curves that define human colour vision for standards purposes. They are not
    cone sensitivities: they are a deliberately chosen linear recombination of the cone responses,
    contrived so that all three are non-negative and so that $macron(y)(lambda)$ is exactly the
    luminous efficiency function $V(lambda)$. The price of non-negativity is the second, smaller
    lobe of $macron(x)$ in the blue --- the red primary's negative excursion, folded back in.
    The dashed curves are the 1964 10° observer, which differs most where the macular pigment does.`,
  claim: "The CMFs are a chosen basis, not a measurement of the cones.",
  sources: ["cie-15-colorimetry"],
  placement: "wide",
  render() {
    const o31 = cie1931();
    const o64 = cie1964();
    const p = new Plot({
      width: theme.widths.wide,
      height: 210,
      x: { domain: [380, 730], label: "wavelength λ", unit: "nm", ticks: [400, 450, 500, 550, 600, 650, 700] },
      y: { domain: [0, 2.0], label: "tristimulus value", ticks: [0, 0.5, 1.0, 1.5, 2.0] },
      pad: { top: 12, right: 56, bottom: 32, left: 38 },
      grid: "none",
    });

    for (const [obs, dash, width] of [[o64, "1.6 1.6", theme.stroke.thin] as const, [o31, undefined, theme.stroke.bold] as const]) {
      p.line(band(samples(obs.zbar)), { stroke: cmfColors.z, width, dash, smooth: true });
      p.line(band(samples(obs.ybar)), { stroke: cmfColors.y, width, dash, smooth: true });
      p.line(band(samples(obs.xbar)), { stroke: cmfColors.x, width, dash, smooth: true });
    }

    // Each curve labelled at its own peak, in its own colour. Labelling at the
    // right-hand edge is tempting and useless here: all three functions decay
    // to zero, so the labels pile up exactly where the curves are least
    // distinguishable.
    p.seriesLabel(445, 1.784, "z̄(λ)", { color: cmfColors.z, dx: 0, dy: -11, anchor: "middle" });
    p.seriesLabel(600, 1.062, "x̄(λ)", { color: cmfColors.x, dx: 9, dy: -6 });
    p.seriesLabel(520, 0.71, "ȳ(λ) = V(λ)", { color: cmfColors.y, dx: -8, dy: -4, anchor: "end" });
    p.seriesLabel(690, 1.9, "dashed: 1964 10° observer", {
      color: theme.ink.muted, size: theme.font.size.tiny, anchor: "end",
    });

    p.annotate(442, 0.348, "the second lobe of x̄", { dx: -10, dy: -40, anchor: "end" });
    p.vrule(555, { dash: "1.5 1.5", stroke: theme.ink.rule, to: 1.0 });
    p.annotate(555, 1.0, "ȳ peaks at 555 nm", { dx: 26, dy: -34 });

    return p.document();
  },
});
