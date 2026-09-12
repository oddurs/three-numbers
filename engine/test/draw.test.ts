import { test } from "node:test";
import assert from "node:assert/strict";
import { crc32, inflateSync } from "node:zlib";
import { Raster, encodePng } from "../draw/raster.ts";
import { Plot, Canvas, compose } from "../draw/plot.ts";
import { el, serialize, smoothPath, polylinePath, n } from "../draw/svg.ts";
import { linearScale, logScale, niceTicks, niceDomain, formatTick } from "../draw/scale.ts";
import { familyFor, theme, seriesColors } from "../draw/theme.ts";
import { uncoveredCharacters } from "../draw/fonts.ts";
import { hexToSrgb, srgbToHex, srgb255 } from "../draw/format.ts";
import type { Vec3 } from "../color/math.ts";

// --- Raster and PNG ---------------------------------------------------------

test("a raster refuses degenerate dimensions instead of silently resizing", () => {
  assert.throws(() => new Raster(0, 10), RangeError);
  assert.throws(() => new Raster(10, 0), RangeError);
  assert.throws(() => new Raster(-4, 4), RangeError);
  assert.throws(() => new Raster(80_000, 80_000), RangeError, "megapixel guard");
  assert.equal(new Raster(3, 2).data.length, 3 * 2 * 4);
});

test("fill and fillAlpha write the pixels they are given", () => {
  const r = new Raster(2, 2);
  r.fill((_u, _v, x, y) => (x === y ? [1, 0, 0] : null));
  assert.deepEqual(Array.from(r.data.slice(0, 4)), [255, 0, 0, 255]);
  assert.deepEqual(Array.from(r.data.slice(4, 8)), [0, 0, 0, 0], "null leaves the pixel transparent");

  const a = new Raster(1, 1).fillAlpha(() => ({ color: [0, 1, 0], alpha: 0.5 }));
  assert.deepEqual(Array.from(a.data), [0, 255, 0, 128]);
});

test("fillAA averages subsamples and rejects a bad factor", () => {
  const r = new Raster(1, 1);
  // Half the samples transparent: the coverage should land at about 0.5 alpha.
  r.fillAA((u) => (u < 0.5 ? [1, 1, 1] : null), 2);
  assert.equal(r.data[3], 128);
  assert.throws(() => new Raster(1, 1).fillAA(() => null, 0), RangeError);
});

/** Minimal PNG reader: enough to prove the encoder writes a valid file. */
function readPng(buf: Buffer): { width: number; height: number; pixels: Uint8Array } {
  assert.deepEqual(Array.from(buf.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10], "signature");
  let off = 8;
  let width = 0, height = 0;
  let idat = Buffer.alloc(0);
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, "bit depth");
      assert.equal(data[9], 6, "RGBA colour type");
    }
    if (type === "IDAT") idat = Buffer.concat([idat, data]);
    off += 12 + len;
  }
  const raw = inflateSync(idat);
  const stride = width * 4;
  const pixels = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    assert.equal(raw[y * (stride + 1)], 0, "filter type none");
    pixels.set(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride), y * stride);
  }
  return { width, height, pixels };
}

test("the PNG encoder produces a file that decodes back to the same pixels", () => {
  const r = new Raster(5, 3);
  r.fill((_u, _v, x, y) => [x / 4, y / 2, 0.5]);
  const decoded = readPng(r.toPng());
  assert.equal(decoded.width, 5);
  assert.equal(decoded.height, 3);
  assert.deepEqual(Array.from(decoded.pixels), Array.from(r.data));
});

test("the PNG CRC is correct, so a reader will not reject the file", () => {
  // zlib's crc32 is an independent implementation of the same polynomial.
  const buf = encodePng(2, 2, new Uint8ClampedArray(16).fill(200));
  let off = 8;
  let checked = 0;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const body = buf.subarray(off + 4, off + 8 + len);
    const stored = buf.readUInt32BE(off + 8 + len);
    assert.equal(crc32(body) >>> 0, stored, "chunk CRC");
    checked++;
    off += 12 + len;
  }
  assert.equal(checked, 3, "IHDR, IDAT, IEND");
});

test("a data URI round-trips through base64", () => {
  const r = new Raster(2, 2).fill(() => [1, 0, 0]);
  const uri = r.toDataUri();
  assert.ok(uri.startsWith("data:image/png;base64,"));
  const back = Buffer.from(uri.slice("data:image/png;base64,".length), "base64");
  assert.deepEqual(Array.from(back), Array.from(r.toPng()));
});

// --- Scales -----------------------------------------------------------------

test("linear and log scales invert themselves", () => {
  const lin = linearScale([0, 100], [10, 210]);
  assert.equal(lin(50), 110);
  assert.ok(Math.abs(lin.invert(110) - 50) < 1e-12);

  const log = logScale([1, 1000], [0, 300]);
  assert.ok(Math.abs(log(10) - 100) < 1e-9);
  assert.ok(Math.abs(log.invert(200) - 100) < 1e-9);
  assert.throws(() => logScale([0, 10], [0, 1]), RangeError);
});

test("ticks are round numbers inside the domain", () => {
  const t = niceTicks(0, 100, 5);
  assert.ok(t.every((v) => v >= 0 && v <= 100));
  assert.deepEqual(t, [0, 20, 40, 60, 80, 100]);
  assert.deepEqual(niceTicks(3, 3), [3]);
});

test("a reversed domain still produces ticks, in its own direction", () => {
  const t = niceTicks(100, 0, 5);
  assert.ok(t.length > 1, "a reversed axis is a legitimate axis");
  assert.ok(t[0]! > t.at(-1)!, "ticks descend with the domain");
  assert.deepEqual([...t].reverse(), niceTicks(0, 100, 5));

  const d = niceDomain(100, 0);
  assert.ok(d[0] >= d[1], "a nice reversed domain stays reversed");
});

test("tick formatting stays readable at both extremes", () => {
  assert.equal(formatTick(0), "0");
  assert.equal(formatTick(0.5, 0.25), "0.50", "a step of 0.25 needs two decimals");
  assert.equal(formatTick(0.25, 0.25), "0.25");
  assert.equal(formatTick(40, 20), "40");
  assert.equal(formatTick(1e-5), "1e-5");
  assert.equal(formatTick(250000), "2.5e5");
});

// --- SVG --------------------------------------------------------------------

test("serialisation escapes markup and drops empty attributes", () => {
  const doc = serialize({
    width: 10, height: 10,
    children: [el("text", { x: 1, fill: undefined, stroke: false, title: 'a "b" & <c>' }, ["x < y & z"])],
  });
  assert.match(doc, /a &quot;b&quot; &amp; &lt;c&gt;/);
  assert.match(doc, /x &lt; y &amp; z/);
  assert.doesNotMatch(doc, /fill=/);
  assert.doesNotMatch(doc, /stroke=/);
});

test("numbers are rounded so builds stay byte-identical", () => {
  assert.equal(n(1 / 3), "0.333");
  assert.equal(n(2.0), "2");
  assert.equal(n(-0.0001), "-0");
  assert.equal(n(NaN), "0");
});

test("paths are produced for degenerate point lists without throwing", () => {
  assert.equal(polylinePath([]), "");
  assert.equal(smoothPath([[0, 0], [1, 1]]), polylinePath([[0, 0], [1, 1]]));
  assert.match(smoothPath([[0, 0], [1, 1], [2, 0]]), /^M0 0 C/);
});

// --- Plot -------------------------------------------------------------------

const plot = () => new Plot({
  width: 200, height: 100,
  x: { domain: [0, 10] }, y: { domain: [0, 1] },
  pad: { top: 5, right: 5, bottom: 20, left: 20 },
});

test("a plot maps data coordinates onto its inner box", () => {
  const p = plot();
  assert.deepEqual(p.p(0, 0), [20, 80]);
  assert.deepEqual(p.p(10, 1), [195, 5]);
  assert.equal(p.innerWidth, 175);
  assert.equal(p.innerHeight, 75);
});

test("compose hoists each panel's defs instead of dropping them", () => {
  const a = plot();
  a.def(el("linearGradient", { id: "g1" }));
  a.line([[0, 0], [10, 1]]);
  const b = plot();
  b.def(el("linearGradient", { id: "g2" }));

  const doc = compose(420, 100, [{ x: 0, y: 0, plot: a }, { x: 220, y: 0, plot: b }]);
  const ids = (doc.defs ?? []).map((d) => d.attrs["id"]);
  assert.deepEqual(ids, ["g1", "g2"], "a gradient defined in a panel must survive composition");
  assert.equal(doc.children.length, 2);
  assert.match(serialize(doc), /<defs>/);
});

test("compose emits no defs block when there are none", () => {
  const doc = compose(200, 100, [{ x: 0, y: 0, plot: plot() }]);
  assert.equal(doc.defs, undefined);
  assert.doesNotMatch(serialize(doc), /<defs>/);
});

test("a canvas renders swatches and text", () => {
  const c = new Canvas(100, 20, "#ffffff");
  c.swatch(0, 0, 10, 10, "#ff0000");
  c.text(12, 8, "label");
  const out = serialize(c.document());
  assert.match(out, /#ff0000/);
  assert.match(out, /label/);
});

// --- Theme and formatting ---------------------------------------------------

test("the generated series palette is stable and all-hex", () => {
  const a = seriesColors();
  const b = seriesColors();
  assert.deepEqual(a, b, "cached, so figures do not drift between calls");
  assert.equal(a.length, 6);
  for (const c of a) assert.match(c, /^#[0-9a-f]{6}$/);
});

test("figure widths agree with the page master's geometry", () => {
  // Assert the *relationships*, not the millimetres: the numbers live in
  // book/lib/theme.typ and repeating them here just creates a second place to
  // forget to update. A wide figure is the measure plus the gutter plus the
  // margin column, which is what makes it bleed exactly to the note edge.
  const mm = (v: number) => (v * 72) / 25.4;
  assert.ok(Math.abs(theme.widths.wide - (theme.widths.column + mm(6) + theme.widths.margin)) < 1e-9);
  assert.ok(theme.widths.margin < theme.widths.column);
  assert.ok(theme.widths.column < theme.widths.wide);
  assert.ok(theme.widths.wide < theme.widths.full);
  // A margin column narrower than about 50 mm cannot hold a real diagram.
  assert.ok(theme.widths.margin > mm(50), "the margin must be wide enough to be used");
});

test("figure text is set in a family that can actually draw it", () => {
  // ET Book maps 229 codepoints and no Greek. The renderer picks one family per
  // text element, so the choice is made from the string rather than left to it.
  assert.equal(familyFor("wavelength"), theme.font.serif);
  assert.equal(familyFor("x\u0304(\u03bb)"), theme.font.serifFallback, "macron and lambda");
  assert.equal(familyFor("\u0394E = 2"), theme.font.serifFallback, "capital delta");
  assert.equal(uncoveredCharacters("\u0394E").length, 1);
  assert.deepEqual(uncoveredCharacters("plain ascii 0.2126"), []);
});

test("hex conversion round-trips and clamps", () => {
  const c: Vec3 = [0.2, 0.4, 0.6];
  const back = hexToSrgb(srgbToHex(c));
  back.forEach((v, i) => assert.ok(Math.abs(v - c[i]!) < 1 / 255));
  assert.equal(srgbToHex([-1, 2, 0.5]), "#00ff80", "out of range clamps");
  assert.deepEqual(hexToSrgb("#fff"), [1, 1, 1], "short form");
  assert.deepEqual(srgb255([0, 0.5, 1]), [0, 128, 255]);
});
