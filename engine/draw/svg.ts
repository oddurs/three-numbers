/**
 * A tiny SVG document builder.
 *
 * Deliberately not a DOM: figures are pure functions from data to a tree of
 * nodes, which makes them testable and makes builds byte-reproducible.
 */

export type Attrs = Record<string, string | number | undefined | null | false>;

export interface Node {
  readonly tag: string;
  readonly attrs: Attrs;
  readonly children: Array<Node | string>;
}

export const el = (tag: string, attrs: Attrs = {}, children: Array<Node | string> = []): Node =>
  ({ tag, attrs, children });

/** A group, optionally translated — the only transform most figures need. */
export const g = (attrs: Attrs = {}, children: Array<Node | string> = []): Node =>
  el("g", attrs, children);

export const translate = (x: number, y: number, children: Array<Node | string>): Node =>
  el("g", { transform: `translate(${n(x)},${n(y)})` }, children);

/** Round to a fixed precision: smaller files, and stable diffs between builds. */
export const n = (v: number, digits = 3): string => {
  if (!Number.isFinite(v)) return "0";
  const s = v.toFixed(digits);
  return s.replace(/\.?0+$/, "") || "0";
};

const escapeText = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeAttr = (s: string): string => escapeText(s).replace(/"/g, "&quot;");

function serializeNode(node: Node | string, indent: number): string {
  if (typeof node === "string") return escapeText(node);
  const pad = "  ".repeat(indent);
  const attrs = Object.entries(node.attrs)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => ` ${k}="${escapeAttr(typeof v === "number" ? n(v) : String(v))}"`)
    .join("");
  if (node.children.length === 0) return `${pad}<${node.tag}${attrs}/>`;
  const inlineOnly = node.children.every((c) => typeof c === "string");
  if (inlineOnly) {
    return `${pad}<${node.tag}${attrs}>${node.children.map((c) => escapeText(c as string)).join("")}</${node.tag}>`;
  }
  const inner = node.children.map((c) => serializeNode(c, indent + 1)).join("\n");
  return `${pad}<${node.tag}${attrs}>\n${inner}\n${pad}</${node.tag}>`;
}

export interface SvgDocument {
  readonly width: number;
  readonly height: number;
  readonly children: Array<Node | string>;
  readonly defs?: Array<Node>;
  readonly background?: string;
}

export function serialize(doc: SvgDocument): string {
  const kids: Array<Node | string> = [];
  if (doc.defs?.length) kids.push(el("defs", {}, doc.defs));
  if (doc.background) {
    kids.push(el("rect", { width: doc.width, height: doc.height, fill: doc.background }));
  }
  kids.push(...doc.children);
  const root = el("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    "xmlns:xlink": "http://www.w3.org/1999/xlink",
    width: doc.width,
    height: doc.height,
    viewBox: `0 0 ${n(doc.width)} ${n(doc.height)}`,
  }, kids);
  return `${serializeNode(root, 0)}\n`;
}

// --- Path building ----------------------------------------------------------

/** A fluent path builder that emits compact, rounded path data. */
export class Path {
  #parts: string[] = [];

  moveTo(x: number, y: number): this { this.#parts.push(`M${n(x)} ${n(y)}`); return this; }
  lineTo(x: number, y: number): this { this.#parts.push(`L${n(x)} ${n(y)}`); return this; }
  curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): this {
    this.#parts.push(`C${n(x1)} ${n(y1)} ${n(x2)} ${n(y2)} ${n(x)} ${n(y)}`);
    return this;
  }
  arcTo(rx: number, ry: number, large: boolean, sweep: boolean, x: number, y: number): this {
    this.#parts.push(`A${n(rx)} ${n(ry)} 0 ${large ? 1 : 0} ${sweep ? 1 : 0} ${n(x)} ${n(y)}`);
    return this;
  }
  close(): this { this.#parts.push("Z"); return this; }

  polyline(points: Array<readonly [number, number]>): this {
    points.forEach(([x, y], i) => (i === 0 ? this.moveTo(x, y) : this.lineTo(x, y)));
    return this;
  }

  get d(): string { return this.#parts.join(" "); }
  get empty(): boolean { return this.#parts.length === 0; }
}

export const path = (): Path => new Path();

export const polylinePath = (points: Array<readonly [number, number]>): string =>
  path().polyline(points).d;

/** A Catmull-Rom spline converted to cubic Béziers — for smooth spectral curves. */
export function smoothPath(points: Array<readonly [number, number]>, tension = 0.5): string {
  if (points.length < 3) return polylinePath(points);
  const p = path();
  p.moveTo(points[0]![0], points[0]![1]);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    const t = tension / 3;
    p.curveTo(
      p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t,
      p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t,
      p2[0], p2[1],
    );
  }
  return p.d;
}
