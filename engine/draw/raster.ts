/**
 * Raster layers and a minimal PNG encoder.
 *
 * Vector marks cannot draw a chromaticity diagram's interior or a gradient
 * field — those are per-pixel computations. So figures mix the two: an RGBA
 * buffer, encoded to PNG and embedded in the SVG as a data URI, with vector
 * axes and type drawn on top. Typst rasterises the result at print resolution.
 */

import { deflateSync } from "node:zlib";
import type { Vec3 } from "../color/math.ts";
import { el, n, type Node } from "./svg.ts";

export class Raster {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;

  constructor(width: number, height: number) {
    const w = Math.round(width);
    const h = Math.round(height);
    // Silently clamping a zero to one produced a 1x1 image that looked like it
    // had worked. A figure asking for a zero-size raster has a bug in it.
    if (!(w > 0 && h > 0)) {
      throw new RangeError(`raster dimensions must be positive, got ${width}x${height}`);
    }
    if (w * h > 40_000_000) {
      throw new RangeError(`raster of ${w}x${h} is over the 40 megapixel guard`);
    }
    this.width = w;
    this.height = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  set(x: number, y: number, rgb: Vec3, alpha = 1): void {
    const i = (y * this.width + x) * 4;
    this.data[i] = rgb[0] * 255;
    this.data[i + 1] = rgb[1] * 255;
    this.data[i + 2] = rgb[2] * 255;
    this.data[i + 3] = alpha * 255;
  }

  /**
   * Fill by evaluating `f` per pixel. `f` receives normalised coordinates in
   * [0,1] as well as pixel indices, and returns `null` for a transparent pixel.
   *
   * Opaque only. `Vec3` is itself a three-element array, so a union of
   * "colour or colour-with-alpha" has to be told apart at runtime by inspecting
   * array lengths — which is the kind of cleverness that works until someone
   * passes a two-element tuple by mistake. `fillAlpha` is the separate door.
   */
  fill(f: (u: number, v: number, x: number, y: number) => Vec3 | null): this {
    for (let y = 0; y < this.height; y++) {
      const v = this.height === 1 ? 0 : y / (this.height - 1);
      for (let x = 0; x < this.width; x++) {
        const u = this.width === 1 ? 0 : x / (this.width - 1);
        const r = f(u, v, x, y);
        if (r !== null) this.set(x, y, r, 1);
      }
    }
    return this;
  }

  /** As `fill`, but `f` also returns an alpha in [0,1]. */
  fillAlpha(
    f: (u: number, v: number, x: number, y: number) => { color: Vec3; alpha: number } | null,
  ): this {
    for (let y = 0; y < this.height; y++) {
      const v = this.height === 1 ? 0 : y / (this.height - 1);
      for (let x = 0; x < this.width; x++) {
        const u = this.width === 1 ? 0 : x / (this.width - 1);
        const r = f(u, v, x, y);
        if (r !== null) this.set(x, y, r.color, r.alpha);
      }
    }
    return this;
  }

  /**
   * Supersampled fill: evaluate an `s`x`s` grid per pixel and average. Chromaticity
   * boundaries and gamut hulls alias badly without it.
   */
  fillAA(f: (u: number, v: number) => Vec3 | null, s = 3): this {
    if (!Number.isInteger(s) || s < 1) {
      throw new RangeError(`supersampling factor must be a positive integer, got ${s}`);
    }
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let r = 0, g2 = 0, b = 0, a = 0;
        for (let j = 0; j < s; j++) {
          for (let i = 0; i < s; i++) {
            const u = (x + (i + 0.5) / s) / this.width;
            const v = (y + (j + 0.5) / s) / this.height;
            const c = f(u, v);
            if (!c) continue;
            r += c[0]; g2 += c[1]; b += c[2]; a += 1;
          }
        }
        if (a === 0) continue;
        this.set(x, y, [r / a, g2 / a, b / a], a / (s * s));
      }
    }
    return this;
  }

  toPng(): Buffer { return encodePng(this.width, this.height, this.data); }

  toDataUri(): string { return `data:image/png;base64,${this.toPng().toString("base64")}`; }

  /** An `<image>` node placing this raster at the given box. */
  toImage(x: number, y: number, w: number, h: number, smooth = true): Node {
    return el("image", {
      x, y, width: w, height: h,
      preserveAspectRatio: "none",
      "image-rendering": smooth ? undefined : "pixelated",
      "xlink:href": this.toDataUri(),
    });
  }
}

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

const crc32 = (buf: Uint8Array): number => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type: string, data: Uint8Array): Buffer => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "latin1"), Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
};

/**
 * 8-bit RGBA PNG, filter type 0 (None) on every scanline.
 *
 * Choosing no filter costs some bytes and buys exact reproducibility and about
 * forty lines of code we do not have to own.
 */
export function encodePng(width: number, height: number, rgba: Uint8ClampedArray): Buffer {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride)
      .copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", new Uint8Array(0)),
  ]);
}

export { n };
