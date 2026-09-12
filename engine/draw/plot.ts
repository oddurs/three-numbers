/**
 * The figure frame: axes, grid, marks and legends.
 *
 * Figures are written against this rather than against raw SVG, so that every
 * diagram in the book shares one set of decisions about tick length, label
 * placement and stroke weight. Data coordinates go in; points come out.
 */

import { el, g, n, polylinePath, smoothPath, translate, type Attrs, type Node, type SvgDocument } from "./svg.ts";
import { formatTick, linearScale, logScale, niceDomain, type Scale } from "./scale.ts";
import { familyFor, theme } from "./theme.ts";
import type { Raster } from "./raster.ts";

export type Point = readonly [number, number];

export interface AxisOptions {
  domain: readonly [number, number];
  label?: string;
  /** Explicit tick values; otherwise generated. */
  ticks?: number[] | number;
  format?: (v: number) => string;
  scale?: "linear" | "log";
  /** Round the domain outward to tick boundaries. */
  nice?: boolean;
  /** Draw the axis line itself. */
  line?: boolean;
  /** Suppress tick labels but keep the ticks. */
  labelTicks?: boolean;
  /** Units appended to the axis label, set in the same style. */
  unit?: string;
  /**
   * Extent the axis line should span, in data coordinates.
   *
   * Defaults to the first and last tick, which makes it a *range frame* in
   * Tufte's sense: the axis stops where the data stops, so the line itself
   * reports the extent instead of merely boxing the plot. Pass a pair to span
   * the true data range, or `false` for a full-width rule.
   */
  span?: readonly [number, number] | false;
  /** Marginal rug marks showing where the data actually falls. */
  rug?: number[];
}

/**
 * Padding around the plot area, in points. Spelled out rather than derived from
 * `theme.pad`, whose `as const` would otherwise narrow every field to the
 * literal default and reject any other number.
 */
export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PlotOptions {
  width: number;
  height: number;
  x: AxisOptions;
  y: AxisOptions;
  pad?: Partial<Padding>;
  grid?: "none" | "x" | "y" | "both";
  frame?: boolean;
  background?: string;
  /** Draw the plot area's fill before anything else. */
  panel?: string;
}

const textNode = (
  x: number, y: number, content: string,
  opts: {
    size?: number; fill?: string; anchor?: "start" | "middle" | "end";
    baseline?: "auto" | "middle" | "hanging"; family?: string; style?: string;
    weight?: string | number; rotate?: number; opacity?: number;
  } = {},
): Node => {
  const attrs: Attrs = {
    x, y,
    "font-family": opts.family ?? familyFor(content),
    "font-size": opts.size ?? theme.font.size.label,
    fill: opts.fill ?? theme.ink.primary,
    "text-anchor": opts.anchor ?? "start",
    "dominant-baseline": opts.baseline,
    "font-style": opts.style,
    "font-weight": opts.weight,
    opacity: opts.opacity,
  };
  if (opts.rotate) attrs["transform"] = `rotate(${n(opts.rotate)} ${n(x)} ${n(y)})`;
  return el("text", attrs, [content]);
};

export { textNode as text };

export class Plot {
  readonly width: number;
  readonly height: number;
  readonly pad: Padding;
  readonly x: Scale;
  readonly y: Scale;
  readonly #opts: PlotOptions;
  readonly #layers: { under: Node[]; main: Node[]; over: Node[] } = { under: [], main: [], over: [] };
  readonly #defs: Node[] = [];

  constructor(opts: PlotOptions) {
    this.#opts = opts;
    this.width = opts.width;
    this.height = opts.height;
    this.pad = { ...theme.pad, ...opts.pad };

    const xDomain = opts.x.nice ? niceDomain(opts.x.domain[0], opts.x.domain[1]) : opts.x.domain;
    const yDomain = opts.y.nice ? niceDomain(opts.y.domain[0], opts.y.domain[1]) : opts.y.domain;
    const mk = (a: AxisOptions, d: readonly [number, number], r: readonly [number, number]) =>
      a.scale === "log" ? logScale(d, r) : linearScale(d, r);

    this.x = mk(opts.x, xDomain, [this.pad.left, this.width - this.pad.right]);
    this.y = mk(opts.y, yDomain, [this.height - this.pad.bottom, this.pad.top]);
  }

  get left(): number { return this.pad.left; }
  get right(): number { return this.width - this.pad.right; }
  get top(): number { return this.pad.top; }
  get bottom(): number { return this.height - this.pad.bottom; }
  get innerWidth(): number { return this.right - this.left; }
  get innerHeight(): number { return this.bottom - this.top; }

  /** Map a data point to device coordinates. */
  p(px: number, py: number): Point { return [this.x(px), this.y(py)] as const; }

  add(node: Node, layer: "under" | "main" | "over" = "main"): this {
    this.#layers[layer].push(node);
    return this;
  }

  def(node: Node): this { this.#defs.push(node); return this; }

  // --- Marks ----------------------------------------------------------------

  line(points: Point[], opts: { stroke?: string; width?: number; dash?: string; smooth?: boolean; opacity?: number; cap?: string } = {}): this {
    const mapped = points.map(([a, b]) => [this.x(a), this.y(b)] as const);
    return this.add(el("path", {
      d: opts.smooth ? smoothPath(mapped) : polylinePath(mapped),
      fill: "none",
      stroke: opts.stroke ?? theme.ink.primary,
      "stroke-width": opts.width ?? theme.stroke.regular,
      "stroke-dasharray": opts.dash,
      "stroke-linejoin": "round",
      "stroke-linecap": opts.cap ?? "round",
      opacity: opts.opacity,
    }));
  }

  area(points: Point[], baseline: number, opts: { fill?: string; opacity?: number; smooth?: boolean } = {}): this {
    if (points.length === 0) return this;
    const mapped = points.map(([a, b]) => [this.x(a), this.y(b)] as const);
    const y0 = this.y(baseline);
    const top = opts.smooth ? smoothPath(mapped) : polylinePath(mapped);
    const d = `${top} L${n(mapped.at(-1)![0])} ${n(y0)} L${n(mapped[0]![0])} ${n(y0)} Z`;
    return this.add(el("path", { d, fill: opts.fill ?? theme.ink.grid, opacity: opts.opacity, stroke: "none" }));
  }

  scatter(points: Point[], opts: { r?: number; fill?: string; stroke?: string; width?: number; opacity?: number } = {}): this {
    return this.add(g({}, points.map(([a, b]) => el("circle", {
      cx: this.x(a), cy: this.y(b), r: opts.r ?? 1.6,
      fill: opts.fill ?? theme.ink.primary,
      stroke: opts.stroke, "stroke-width": opts.width, opacity: opts.opacity,
    }))));
  }

  /** A rectangle in data coordinates. */
  rect(x0: number, y0: number, x1: number, y1: number, opts: { fill?: string; stroke?: string; width?: number; opacity?: number; rx?: number } = {}): this {
    const [ax, ay] = this.p(x0, y0);
    const [bx, by] = this.p(x1, y1);
    return this.add(el("rect", {
      x: Math.min(ax, bx), y: Math.min(ay, by),
      width: Math.abs(bx - ax), height: Math.abs(by - ay),
      fill: opts.fill ?? "none", stroke: opts.stroke,
      "stroke-width": opts.width ?? theme.stroke.thin,
      opacity: opts.opacity, rx: opts.rx,
    }));
  }

  vrule(at: number, opts: { stroke?: string; width?: number; dash?: string; from?: number; to?: number } = {}): this {
    const x = this.x(at);
    return this.add(el("line", {
      x1: x, x2: x,
      y1: opts.from === undefined ? this.bottom : this.y(opts.from),
      y2: opts.to === undefined ? this.top : this.y(opts.to),
      stroke: opts.stroke ?? theme.ink.rule,
      "stroke-width": opts.width ?? theme.stroke.thin,
      "stroke-dasharray": opts.dash,
    }));
  }

  hrule(at: number, opts: { stroke?: string; width?: number; dash?: string } = {}): this {
    const y = this.y(at);
    return this.add(el("line", {
      x1: this.left, x2: this.right, y1: y, y2: y,
      stroke: opts.stroke ?? theme.ink.rule,
      "stroke-width": opts.width ?? theme.stroke.thin,
      "stroke-dasharray": opts.dash,
    }));
  }

  /** Place a raster layer over the plot area. */
  raster(r: Raster, opts: { smooth?: boolean; layer?: "under" | "main" | "over"; opacity?: number } = {}): this {
    const img = r.toImage(this.left, this.top, this.innerWidth, this.innerHeight, opts.smooth ?? true);
    if (opts.opacity !== undefined) (img.attrs as Record<string, unknown>)["opacity"] = opts.opacity;
    return this.add(img, opts.layer ?? "under");
  }

  /** Text positioned in data coordinates. */
  label(px: number, py: number, content: string, opts: Parameters<typeof textNode>[3] & { dx?: number; dy?: number } = {}): this {
    const [x, y] = this.p(px, py);
    return this.add(textNode(x + (opts.dx ?? 0), y + (opts.dy ?? 0), content, opts), "over");
  }

  /** An annotation with a leader line from the label to the point. */
  annotate(px: number, py: number, content: string, opts: { dx: number; dy: number; anchor?: "start" | "middle" | "end"; color?: string; size?: number } ): this {
    const [x, y] = this.p(px, py);
    const tx = x + opts.dx, ty = y + opts.dy;
    const color = opts.color ?? theme.ink.secondary;
    this.add(el("path", {
      d: `M${n(tx)} ${n(ty)} L${n(x)} ${n(y)}`,
      stroke: color, "stroke-width": theme.stroke.hairline, fill: "none",
    }), "over");
    this.add(el("circle", { cx: x, cy: y, r: 1.1, fill: color }), "over");
    return this.add(textNode(tx, ty, content, {
      size: opts.size ?? theme.font.size.annotation,
      fill: color,
      anchor: opts.anchor ?? (opts.dx < 0 ? "end" : "start"),
      baseline: "middle",
    }), "over");
  }

  /**
   * Label a series where it lives, in its own colour.
   *
   * A legend asks the reader to hold a colour in memory, look away, find it in
   * a key, and look back. Putting the name at the end of the line removes the
   * round trip — and removes the legend's box, rules and swatches from the
   * page. Prefer this to `legend` wherever the lines are far enough apart.
   */
  seriesLabel(
    px: number, py: number, content: string,
    opts: { color?: string; dx?: number; dy?: number; anchor?: "start" | "middle" | "end"; size?: number; style?: string } = {},
  ): this {
    const [x, y] = this.p(px, py);
    return this.add(textNode(x + (opts.dx ?? 4), y + (opts.dy ?? 0), content, {
      size: opts.size ?? theme.font.size.annotation,
      fill: opts.color ?? theme.ink.primary,
      anchor: opts.anchor ?? "start",
      baseline: "middle",
      style: opts.style,
    }), "over");
  }

  legend(
    entries: Array<{ label: string; color: string; dash?: string; swatch?: "line" | "box" }>,
    opts: { x?: number; y?: number; gap?: number; size?: number; columns?: number } = {},
  ): this {
    const size = opts.size ?? theme.font.size.annotation;
    const gap = opts.gap ?? size * 1.45;
    const x0 = opts.x ?? this.left + 6;
    const y0 = opts.y ?? this.top + 6;
    const cols = opts.columns ?? 1;
    const perCol = Math.ceil(entries.length / cols);
    const colWidth = 84;

    const items = entries.map((e, i) => {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const x = x0 + col * colWidth;
      const y = y0 + row * gap;
      const mark = e.swatch === "box"
        ? el("rect", { x, y: y - 3.2, width: 8, height: 6.4, fill: e.color, rx: 0.8 })
        : el("line", {
            x1: x, x2: x + 9, y1: y, y2: y,
            stroke: e.color, "stroke-width": theme.stroke.bold,
            "stroke-dasharray": e.dash, "stroke-linecap": "round",
          });
      return g({}, [mark, textNode(x + 12.5, y, e.label, { size, baseline: "middle", fill: theme.ink.secondary })]);
    });
    return this.add(g({}, items), "over");
  }

  // --- Furniture ------------------------------------------------------------

  #tickValues(a: AxisOptions, s: Scale): number[] {
    if (Array.isArray(a.ticks)) return a.ticks;
    return s.ticks(typeof a.ticks === "number" ? a.ticks : 6);
  }

  #renderAxes(): Node[] {
    const out: Node[] = [];
    const { x: ax, y: ay } = this.#opts;
    const xt = this.#tickValues(ax, this.x);
    const yt = this.#tickValues(ay, this.y);
    const grid = this.#opts.grid ?? "none";
    const fmtX = ax.format ?? ((v: number) => formatTick(v, xt.length > 1 ? xt[1]! - xt[0]! : undefined));
    const fmtY = ay.format ?? ((v: number) => formatTick(v, yt.length > 1 ? yt[1]! - yt[0]! : undefined));

    if (grid === "x" || grid === "both") {
      out.push(g({ stroke: theme.ink.grid, "stroke-width": theme.stroke.hairline },
        xt.map((v) => el("line", { x1: this.x(v), x2: this.x(v), y1: this.top, y2: this.bottom }))));
    }
    if (grid === "y" || grid === "both") {
      out.push(g({ stroke: theme.ink.grid, "stroke-width": theme.stroke.hairline },
        yt.map((v) => el("line", { x1: this.left, x2: this.right, y1: this.y(v), y2: this.y(v) }))));
    }

    if (this.#opts.frame) {
      out.push(el("rect", {
        x: this.left, y: this.top, width: this.innerWidth, height: this.innerHeight,
        fill: "none", stroke: theme.ink.rule, "stroke-width": theme.stroke.thin,
      }));
    } else {
      // Range frames: each axis line spans only where the data is, so the rule
      // carries information instead of drawing a box round the plot.
      const spanOf = (a: AxisOptions, ticks: number[]): [number, number] | null => {
        if (a.span === false) return null;
        if (a.span) return [a.span[0], a.span[1]];
        return ticks.length > 1 ? [ticks[0]!, ticks.at(-1)!] : null;
      };

      if (ax.line !== false) {
        const sp = spanOf(ax, xt);
        out.push(el("line", {
          x1: sp ? this.x(sp[0]) : this.left,
          x2: sp ? this.x(sp[1]) : this.right,
          y1: this.bottom, y2: this.bottom,
          stroke: theme.ink.rule, "stroke-width": theme.stroke.thin,
        }));
      }
      if (ay.line !== false) {
        const sp = spanOf(ay, yt);
        out.push(el("line", {
          x1: this.left, x2: this.left,
          y1: sp ? this.y(sp[0]) : this.bottom,
          y2: sp ? this.y(sp[1]) : this.top,
          stroke: theme.ink.rule, "stroke-width": theme.stroke.thin,
        }));
      }
    }

    // Dot-dash marginal rugs: the distribution of the data, for free, on the
    // axis that would otherwise be an empty line.
    if (ax.rug?.length) {
      out.push(g({ stroke: theme.ink.secondary, "stroke-width": theme.stroke.hairline },
        ax.rug.map((v) => el("line", {
          x1: this.x(v), x2: this.x(v),
          y1: this.bottom + 1, y2: this.bottom + 4,
        }))));
    }
    if (ay.rug?.length) {
      out.push(g({ stroke: theme.ink.secondary, "stroke-width": theme.stroke.hairline },
        ay.rug.map((v) => el("line", {
          x1: this.left - 4, x2: this.left - 1,
          y1: this.y(v), y2: this.y(v),
        }))));
    }

    out.push(g({}, xt.flatMap((v) => {
      const px = this.x(v);
      const nodes: Node[] = [el("line", {
        x1: px, x2: px, y1: this.bottom, y2: this.bottom + theme.tick.length,
        stroke: theme.ink.rule, "stroke-width": theme.stroke.hairline,
      })];
      if (ax.labelTicks !== false) {
        nodes.push(textNode(px, this.bottom + theme.tick.length + theme.tick.gap + theme.font.size.tick * 0.8,
          fmtX(v), { size: theme.font.size.tick, anchor: "middle", fill: theme.ink.secondary }));
      }
      return nodes;
    })));

    out.push(g({}, yt.flatMap((v) => {
      const py = this.y(v);
      const nodes: Node[] = [el("line", {
        x1: this.left - theme.tick.length, x2: this.left, y1: py, y2: py,
        stroke: theme.ink.rule, "stroke-width": theme.stroke.hairline,
      })];
      if (ay.labelTicks !== false) {
        nodes.push(textNode(this.left - theme.tick.length - theme.tick.gap, py, fmtY(v),
          { size: theme.font.size.tick, anchor: "end", baseline: "middle", fill: theme.ink.secondary }));
      }
      return nodes;
    })));

    const xLabel = ax.unit ? `${ax.label ?? ""} (${ax.unit})` : ax.label;
    if (xLabel) {
      out.push(textNode((this.left + this.right) / 2, this.height - 2, xLabel,
        { size: theme.font.size.title, anchor: "middle", fill: theme.ink.primary }));
    }
    const yLabel = ay.unit ? `${ay.label ?? ""} (${ay.unit})` : ay.label;
    if (yLabel) {
      out.push(textNode(Math.max(8, this.left - 26), (this.top + this.bottom) / 2, yLabel,
        { size: theme.font.size.title, anchor: "middle", fill: theme.ink.primary, rotate: -90 }));
    }
    return out;
  }

  document(): SvgDocument {
    return {
      width: this.width,
      height: this.height,
      background: this.#opts.background,
      defs: this.#defs,
      children: [
        ...(this.#opts.panel
          ? [el("rect", { x: this.left, y: this.top, width: this.innerWidth, height: this.innerHeight, fill: this.#opts.panel })]
          : []),
        ...this.#layers.under,
        ...this.#renderAxes(),
        ...this.#layers.main,
        ...this.#layers.over,
      ],
    };
  }
}

/** A figure with no axes at all — swatch grids, ramps, specimen sheets. */
export class Canvas {
  readonly width: number;
  readonly height: number;
  readonly #children: Node[] = [];
  readonly #background: string | undefined;

  constructor(width: number, height: number, background?: string) {
    this.width = width;
    this.height = height;
    this.#background = background;
  }

  add(node: Node): this { this.#children.push(node); return this; }

  text(x: number, y: number, content: string, opts?: Parameters<typeof textNode>[3]): this {
    return this.add(textNode(x, y, content, opts));
  }

  swatch(x: number, y: number, w: number, h: number, fill: string, opts: { stroke?: string; rx?: number; width?: number } = {}): this {
    return this.add(el("rect", {
      x, y, width: w, height: h, fill, rx: opts.rx,
      stroke: opts.stroke, "stroke-width": opts.width ?? theme.stroke.hairline,
    }));
  }

  raster(r: Raster, x: number, y: number, w: number, h: number, smooth = true): this {
    return this.add(r.toImage(x, y, w, h, smooth));
  }

  document(): SvgDocument {
    return {
      width: this.width, height: this.height,
      background: this.#background,
      children: this.#children,
    };
  }
}

export { g, el, translate };

/**
 * Compose several panels into one figure.
 *
 * Each panel is an independently-sized `Plot` translated into place, rather
 * than one oversized plot with padding hacked to fake a second axis — which
 * silently collides labels and is how the first draft of this file got it wrong.
 */
export function compose(
  width: number,
  height: number,
  panels: Array<{ x: number; y: number; plot: Plot }>,
  extra: Node[] = [],
): SvgDocument {
  const docs = panels.map((p) => ({ at: p, doc: p.plot.document() }));
  // Defs are document-level: a panel's gradients and clip paths have to be
  // hoisted, or they vanish and whatever referenced them renders as nothing.
  const defs = docs.flatMap((d) => d.doc.defs ?? []);
  return {
    width,
    height,
    ...(defs.length > 0 ? { defs } : {}),
    children: [
      ...docs.map((d) => translate(d.at.x, d.at.y, d.doc.children)),
      ...extra,
    ],
  };
}
