import { defineFigure } from "../../engine/figures/define.ts";
import { Plot } from "../../engine/draw/plot.ts";
import { theme, seriesColor } from "../../engine/draw/theme.ts";
import { el } from "../../engine/draw/svg.ts";
import {
  fromFunction, gaussianLine, samples, scale, type Spectrum,
} from "../../engine/color/spectrum.ts";
import { cie1931, xyzFromSpd } from "../../engine/color/observer.ts";
import { toGamut } from "../../engine/color/gamut.ts";
import { srgbToHex } from "../../engine/draw/format.ts";
import type { Vec3 } from "../../engine/color/math.ts";

/**
 * Build a three-line emitter whose tristimulus values match a target, by
 * solving the 3x3 system: three primaries, three equations, one answer. This is
 * not a search — metamers are a linear-algebra fact.
 */
function matchWithLines(target: Vec3, centres: [number, number, number]): Spectrum {
  const obs = cie1931();
  const lines = centres.map((c) => gaussianLine(c, 22, 1, 360, 830, 2));
  const cols = lines.map((l) => xyzFromSpd(l, obs));
  // Solve M w = target where M's columns are each line's tristimulus vector.
  const M = [
    [cols[0]![0], cols[1]![0], cols[2]![0]],
    [cols[0]![1], cols[1]![1], cols[2]![1]],
    [cols[0]![2], cols[1]![2], cols[2]![2]],
  ];
  const det =
    M[0]![0]! * (M[1]![1]! * M[2]![2]! - M[1]![2]! * M[2]![1]!) -
    M[0]![1]! * (M[1]![0]! * M[2]![2]! - M[1]![2]! * M[2]![0]!) +
    M[0]![2]! * (M[1]![0]! * M[2]![1]! - M[1]![1]! * M[2]![0]!);
  const cramer = (col: number): number => {
    const A = M.map((row, r) => row.map((v, c) => (c === col ? target[r]! : v)));
    return (
      A[0]![0]! * (A[1]![1]! * A[2]![2]! - A[1]![2]! * A[2]![1]!) -
      A[0]![1]! * (A[1]![0]! * A[2]![2]! - A[1]![2]! * A[2]![0]!) +
      A[0]![2]! * (A[1]![0]! * A[2]![1]! - A[1]![1]! * A[2]![0]!)
    ) / det;
  };
  const w = [cramer(0), cramer(1), cramer(2)];
  const combined = fromFunction(() => 0, 360, 830, 2);
  const values = combined.values.map((_, i) =>
    lines.reduce((acc, l, k) => acc + l.values[i]! * w[k]!, 0));
  return { ...combined, values };
}

export default defineFigure({
  id: "metamer-pair",
  chapter: "ch02",
  title: "Two spectra, one colour",
  caption: `A broad, smooth reflectance and a spike of three narrow emission lines. They have
    nothing in common as functions of wavelength, and they produce *identical* tristimulus values:
    the eye integrates both against the same three curves and gets the same three numbers. The
    swatch is the colour --- singular --- that both of them are. This collapse from a function to
    a 3-vector is the reason colour can be a data type at all, and the reason two paints that match
    under a shop's lighting stop matching outdoors.`,
  claim: "Metamerism is a consequence of dimensionality, not a defect of the eye.",
  sources: ["cie-15-colorimetry"],
  placement: "wide",
  render() {
    const obs = cie1931();
    // A smooth, broad SPD: something like a warm reflective surface.
    const smooth = scale(
      fromFunction(
        (l) => 0.35 + 0.65 * Math.exp(-((l - 595) ** 2) / (2 * 62 ** 2)),
        360, 830, 2,
      ),
      1,
    );
    const target = xyzFromSpd(smooth, obs);
    const spiky = matchWithLines(target, [452, 535, 610]);
    const check = xyzFromSpd(spiky, obs);

    const peak = Math.max(...smooth.values, ...spiky.values);
    const p = new Plot({
      width: theme.widths.wide,
      height: 210,
      x: { domain: [380, 730], label: "wavelength λ", unit: "nm", ticks: [400, 450, 500, 550, 600, 650, 700] },
      y: { domain: [0, peak * 1.05], label: "spectral power", labelTicks: false },
      pad: { top: 10, right: 96, bottom: 30, left: 26 },
      grid: "none",
    });

    const band = (s: Spectrum) =>
      samples(s).filter(([l]) => l >= 380 && l <= 730).map(([l, v]) => [l, Math.max(v, 0)] as const);

    p.area(band(smooth), 0, { fill: seriesColor(3), opacity: 0.18, smooth: true });
    p.line(band(smooth), { stroke: seriesColor(3), width: theme.stroke.bold, smooth: true });
    p.line(band(spiky), { stroke: seriesColor(2), width: theme.stroke.bold });

    const hex = srgbToHex(toGamut([target[0] / target[1] * 0.8, 0.8, target[2] / target[1] * 0.8]));

    p.add(el("rect", {
      x: p.right + 14, y: p.top + 8, width: 62, height: 34, rx: 2,
      fill: hex, stroke: theme.ink.hairline, "stroke-width": theme.stroke.hairline,
    }), "over");
    p.add(el("text", {
      x: p.right + 14, y: p.top + 54,
      "font-family": theme.font.mono, "font-size": theme.font.size.tiny, fill: theme.ink.secondary,
    }, [hex]), "over");

    const rows: Array<[string, string]> = [
      ["X", `${target[0].toFixed(3)} / ${check[0].toFixed(3)}`],
      ["Y", `${target[1].toFixed(3)} / ${check[1].toFixed(3)}`],
      ["Z", `${target[2].toFixed(3)} / ${check[2].toFixed(3)}`],
    ];
    rows.forEach(([k, v], i) => {
      const y = p.top + 76 + i * 11;
      p.add(el("text", {
        x: p.right + 14, y,
        "font-family": theme.font.mono, "font-size": theme.font.size.tiny, fill: theme.ink.muted,
      }, [`${k}  ${v}`]), "over");
    });

    p.legend([
      { label: "smooth reflector", color: seriesColor(3) },
      { label: "three narrow lines", color: seriesColor(2) },
    ], { x: p.right + 14, y: p.top + 124 });

    return p.document();
  },
});
