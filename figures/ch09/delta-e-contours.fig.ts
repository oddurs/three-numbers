import { defineFigure } from "../../engine/figures/define.ts";
import { Plot } from "../../engine/draw/plot.ts";
import { familyFor, theme, seriesColor } from "../../engine/draw/theme.ts";
import { deltaE2000, deltaE76, deltaEOk } from "../../engine/color/difference.ts";
import { labToXyz, xyzToOklab } from "../../engine/color/spaces.ts";
import type { Vec3 } from "../../engine/color/math.ts";

const CENTRES: Vec3[] = [
  [50, 0, 0], [50, 55, 0], [50, 0, -60], [50, -50, 30], [50, 40, 45], [50, -20, -50],
];
const TARGET = 2;
/** Contours are drawn enlarged, as MacAdam's ellipses conventionally are. */
const MAGNIFY = 3;

/**
 * The locus of colours at a fixed distance from a centre, found by bisecting
 * along each radial direction in the a*-b* plane. A non-circular contour means
 * the metric disagrees with Euclidean distance in that direction, and the
 * shape shows exactly how.
 */
function contour(
  centre: Vec3,
  distance: (a: Vec3, b: Vec3) => number,
  target: number,
  steps = 96,
): Array<readonly [number, number]> {
  const out: Array<readonly [number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    const [ca, cb] = [Math.cos(theta), Math.sin(theta)];
    let lo = 0, hi = 200;
    for (let k = 0; k < 36; k++) {
      const mid = (lo + hi) / 2;
      const p: Vec3 = [centre[0], centre[1] + ca * mid, centre[2] + cb * mid];
      if (distance(centre, p) < target) lo = mid; else hi = mid;
    }
    out.push([centre[1] + ca * lo * MAGNIFY, centre[2] + cb * lo * MAGNIFY] as const);
  }
  return out;
}

export default defineFigure({
  id: "delta-e-contours",
  chapter: "ch09",
  title: "Contours of equal colour difference",
  caption: `Each closed curve encloses the colours within ΔE = 2 of the dot at its centre, in the
    $a^*b^*$ plane at $L^* = 50$, drawn three times actual size so that the small ones are visible at all.
    If CIELAB were perceptually uniform every contour would be the same circle under every metric.
    CIE76's are the same circle *by definition* — that is what Euclidean distance means, and it is
    exactly the claim that turned out to be false. Under CIEDE2000 you must travel 16.6 CIELAB
    units from the saturated blue to register the same difference as 2.1 units at the neutral axis:
    a factor of eight, from a metric whose whole purpose was to make one unit mean one thing.
    Oklab, rescaled to agree at the neutral axis, reproduces most of that structure with no
    correction terms at all.`,
  claim: "CIELAB's Euclidean distance is wrong by about a factor of eight depending on where you stand.",
  sources: ["sharma-2004-ciede2000", "macadam-1942-visual", "ottosson-oklab"],
  placement: "wide",
  render() {
    const p = new Plot({
      width: theme.widths.wide,
      height: 272,
      x: { domain: [-115, 115], label: "a*", ticks: [-80, -40, 0, 40, 80] },
      y: { domain: [-115, 115], label: "b*", ticks: [-80, -40, 0, 40, 80] },
      pad: { top: 12, right: 124, bottom: 32, left: 38 },
      grid: "none",
    });

    p.hrule(0, { stroke: theme.ink.gridStrong });
    p.vrule(0, { stroke: theme.ink.gridStrong });

    // Oklab distances live on a scale ~1/100 of CIELAB's. Match the two at the
    // neutral axis so the comparison is about shape, not units.
    const okScale = (() => {
      const c: Vec3 = [50, 0, 0];
      const d: Vec3 = [50, TARGET, 0];
      return TARGET / (deltaEOk(xyzToOklab(labToXyz(c)), xyzToOklab(labToXyz(d))) || 1);
    })();

    const metrics = [
      {
        label: "CIE76 (Euclidean)", color: theme.ink.muted, dash: "2 1.6",
        f: (a: Vec3, b: Vec3) => deltaE76(a, b),
      },
      {
        label: "CIEDE2000", color: seriesColor(2), dash: undefined,
        f: (a: Vec3, b: Vec3) => deltaE2000(a, b),
      },
      {
        label: "Oklab, rescaled", color: seriesColor(3), dash: "3 2",
        f: (a: Vec3, b: Vec3) => deltaEOk(xyzToOklab(labToXyz(a)), xyzToOklab(labToXyz(b))) * okScale,
      },
    ];

    for (const m of metrics) {
      for (const c of CENTRES) {
        p.line(contour(c, m.f, TARGET), { stroke: m.color, width: theme.stroke.thin, dash: m.dash });
      }
    }
    p.scatter(CENTRES.map((c) => [c[1], c[2]] as const), { r: 1.2, fill: theme.ink.primary });

    p.legend(metrics.map((m) => ({ label: m.label, color: m.color, dash: m.dash })), {
      x: p.right + 12, y: p.top + 18,
    });

    const notes = [`L* = 50,  ΔE = ${TARGET}`, `contours drawn ${MAGNIFY}× actual size`];
    notes.forEach((t, i) => {
      p.add({
        tag: "text",
        attrs: {
          x: p.right + 12, y: p.top + 66 + i * 11,
          "font-family": familyFor(t), "font-size": theme.font.size.tiny, fill: theme.ink.muted,
        },
        children: [t],
      }, "over");
    });

    p.annotate(0, -60, "saturated blue", { dx: 44, dy: 26 });

    return p.document();
  },
});
