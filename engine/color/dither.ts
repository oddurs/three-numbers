/**
 * Dithering and quantisation.
 *
 * Where colour theory meets signal processing: you have fewer levels than you
 * need, so you trade spatial resolution for amplitude resolution and push the
 * error somewhere the eye integrates it away. The eye is a low-pass filter, and
 * every algorithm here is a different opinion about how to exploit that.
 */

import type { Vec3 } from "./math.ts";
import { clamp } from "./math.ts";
import { srgbToOklab } from "./spaces.ts";
import { deltaEOk } from "./difference.ts";

/**
 * Recursive Bayer (ordered) threshold matrix of size 2^n.
 * The classic van-der-Corput-like construction: each level quadruples the
 * matrix using the offsets (0, 2, 3, 1).
 */
export function bayerMatrix(order: number): number[][] {
  let m: number[][] = [[0]];
  for (let k = 0; k < order; k++) {
    const n = m.length;
    const next: number[][] = Array.from({ length: n * 2 }, () => new Array<number>(n * 2).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = 4 * m[y]![x]!;
        next[y]![x] = v;
        next[y]![x + n] = v + 2;
        next[y + n]![x] = v + 3;
        next[y + n]![x + n] = v + 1;
      }
    }
    m = next;
  }
  return m;
}

/** Bayer matrix normalised to (0,1), the form you actually use as a threshold. */
export function bayerThresholds(order: number): number[][] {
  const m = bayerMatrix(order);
  const n = m.length * m.length;
  return m.map((row) => row.map((v) => (v + 0.5) / n));
}

/** Error-diffusion kernels: offsets (dx, dy) and weights summing to 1. */
export interface DiffusionKernel {
  readonly id: string;
  readonly name: string;
  readonly taps: ReadonlyArray<{ dx: number; dy: number; w: number }>;
  readonly note: string;
}

const kernel = (id: string, name: string, note: string, raw: Array<[number, number, number]>): DiffusionKernel => {
  const total = raw.reduce((s, [, , w]) => s + w, 0);
  return { id, name, note, taps: raw.map(([dx, dy, w]) => ({ dx, dy, w: w / total })) };
};

export const floydSteinberg = kernel(
  "floyd-steinberg", "Floyd–Steinberg (1976)",
  "Four taps, weights 7/5/3/1 over 16. Still the default forty years on.",
  [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]],
);

export const jarvisJudiceNinke = kernel(
  "jjn", "Jarvis, Judice & Ninke (1976)",
  "Twelve taps over two rows; smoother, slower, and blurrier.",
  [[1, 0, 7], [2, 0, 5], [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3],
   [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1]],
);

export const atkinson = kernel(
  "atkinson", "Atkinson (1980s)",
  "Diffuses only 6/8 of the error — loses contrast, gains crispness. The Mac look.",
  [[1, 0, 1], [2, 0, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [0, 2, 1]],
);

export const sierraLite = kernel(
  "sierra-lite", "Sierra Lite",
  "Three taps over 4. Cheapest error diffusion worth using.",
  [[1, 0, 2], [-1, 1, 1], [0, 1, 1]],
);

export const diffusionKernels = [floydSteinberg, jarvisJudiceNinke, atkinson, sierraLite];

/** Uniform quantiser: round each channel to `levels` evenly spaced values. */
export const quantizeUniform = (v: number, levels: number): number =>
  Math.round(clamp(v) * (levels - 1)) / (levels - 1);

export interface Image {
  readonly width: number;
  readonly height: number;
  /** Row-major RGB triples in [0,1]. */
  readonly data: Float64Array;
}

export const makeImage = (width: number, height: number): Image => ({
  width, height, data: new Float64Array(width * height * 3),
});

export const getPixel = (img: Image, x: number, y: number): Vec3 => {
  const i = (y * img.width + x) * 3;
  return [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!];
};

export const setPixel = (img: Image, x: number, y: number, c: Vec3): void => {
  const i = (y * img.width + x) * 3;
  img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2];
};

export const generateImage = (width: number, height: number, f: (x: number, y: number) => Vec3): Image => {
  const img = makeImage(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) setPixel(img, x, y, f(x, y));
  return img;
};

/** Quantise with no dithering at all — the banding baseline. */
export const quantizeImage = (img: Image, levels: number): Image =>
  generateImage(img.width, img.height, (x, y) =>
    getPixel(img, x, y).map((v) => quantizeUniform(v, levels)) as unknown as Vec3);

/** Ordered dithering with a Bayer matrix. Deterministic, tileable, visibly regular. */
export function orderedDither(img: Image, levels: number, order = 3): Image {
  const t = bayerThresholds(order);
  const n = t.length;
  const spread = 1 / (levels - 1);
  return generateImage(img.width, img.height, (x, y) => {
    const bias = (t[y % n]![x % n]! - 0.5) * spread;
    return getPixel(img, x, y).map((v) => quantizeUniform(v + bias, levels)) as unknown as Vec3;
  });
}

/**
 * Error diffusion. `linearError` controls the point Chapter 13 is really about:
 * diffusing the error in gamma-encoded values is wrong, and diffusing it in
 * linear light is right, and the difference is visible in the midtones.
 */
export function errorDiffuse(
  img: Image,
  levels: number,
  k: DiffusionKernel = floydSteinberg,
  serpentine = true,
): Image {
  const out = makeImage(img.width, img.height);
  const buf = Float64Array.from(img.data);
  const idx = (x: number, y: number) => (y * img.width + x) * 3;

  for (let y = 0; y < img.height; y++) {
    const reverse = serpentine && y % 2 === 1;
    for (let i = 0; i < img.width; i++) {
      const x = reverse ? img.width - 1 - i : i;
      const p = idx(x, y);
      const old: Vec3 = [buf[p]!, buf[p + 1]!, buf[p + 2]!];
      const neu = old.map((v) => quantizeUniform(v, levels)) as unknown as Vec3;
      setPixel(out, x, y, neu);
      for (let c = 0; c < 3; c++) {
        const err = old[c]! - neu[c]!;
        for (const tap of k.taps) {
          const nx = x + (reverse ? -tap.dx : tap.dx);
          const ny = y + tap.dy;
          if (nx < 0 || nx >= img.width || ny < 0 || ny >= img.height) continue;
          buf[idx(nx, ny) + c]! += err * tap.w;
        }
      }
    }
  }
  return out;
}

/** Root-mean-square perceptual error of a dithered result, in Oklab. */
export function ditherError(original: Image, dithered: Image): number {
  let sum = 0;
  const n = original.width * original.height;
  for (let y = 0; y < original.height; y++)
    for (let x = 0; x < original.width; x++)
      sum += deltaEOk(srgbToOklab(getPixel(original, x, y)), srgbToOklab(getPixel(dithered, x, y))) ** 2;
  return Math.sqrt(sum / n);
}

/**
 * Void-and-cluster blue-noise mask (Ulichney, 1993), in its simplest form.
 * Produces a threshold matrix whose spectrum has no low-frequency energy, which
 * is why blue-noise dithering looks like grain instead of like a pattern.
 */
export function blueNoiseMask(size = 32, seed = 7): number[][] {
  const n = size * size;
  const binary = new Uint8Array(n);
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < Math.floor(n / 10); i++) binary[Math.floor(rnd() * n)] = 1;

  const sigma = 1.5;
  const energy = new Float64Array(n);
  const recompute = () => {
    energy.fill(0);
    for (let i = 0; i < n; i++) {
      if (!binary[i]) continue;
      const ix = i % size, iy = (i / size) | 0;
      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          const jx = (ix + dx + size) % size, jy = (iy + dy + size) % size;
          energy[jy * size + jx]! += Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        }
      }
    }
  };

  const extreme = (want: 0 | 1, pick: "max" | "min"): number => {
    let best = -1, bestE = pick === "max" ? -Infinity : Infinity;
    for (let i = 0; i < n; i++) {
      if (binary[i] !== want) continue;
      const e = energy[i]!;
      if (pick === "max" ? e > bestE : e < bestE) { bestE = e; best = i; }
    }
    return best;
  };

  // Phase 1: break up clusters and voids until the pattern is stable.
  for (let iter = 0; iter < 4 * n; iter++) {
    recompute();
    const tight = extreme(1, "max");
    binary[tight] = 0;
    recompute();
    const loose = extreme(0, "min");
    if (loose === tight) { binary[tight] = 1; break; }
    binary[loose] = 1;
  }

  const rank = new Int32Array(n).fill(-1);
  const initial = Uint8Array.from(binary);
  let ones = initial.reduce((a, b) => a + b, 0);

  // Phase 2: rank the initial minority pixels downwards.
  for (let r = ones - 1; r >= 0; r--) {
    recompute();
    const i = extreme(1, "max");
    binary[i] = 0;
    rank[i] = r;
  }
  // Phase 3: rank the remainder upwards.
  binary.set(initial);
  for (let r = ones; r < n; r++) {
    recompute();
    const i = extreme(0, "min");
    binary[i] = 1;
    rank[i] = r;
  }

  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => (rank[y * size + x]! + 0.5) / n));
}

/** Dither against an arbitrary threshold mask (Bayer, blue noise, white noise...). */
export function maskDither(img: Image, levels: number, mask: number[][]): Image {
  const n = mask.length;
  const spread = 1 / (levels - 1);
  return generateImage(img.width, img.height, (x, y) => {
    const bias = (mask[y % n]![x % n]! - 0.5) * spread;
    return getPixel(img, x, y).map((v) => quantizeUniform(v + bias, levels)) as unknown as Vec3;
  });
}

/**
 * Separable Gaussian blur — a stand-in for the eye's spatial low-pass.
 * Edges are clamped, which is the right choice for a figure swatch.
 */
export function blur(img: Image, sigma: number): Image {
  if (sigma <= 0) return img;
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const kern = Array.from({ length: radius * 2 + 1 }, (_, i) =>
    Math.exp(-((i - radius) ** 2) / (2 * sigma * sigma)));
  const norm = kern.reduce((a, b) => a + b, 0);
  const k = kern.map((v) => v / norm);

  const pass = (src: Image, horizontal: boolean): Image =>
    generateImage(src.width, src.height, (x, y) => {
      const acc: [number, number, number] = [0, 0, 0];
      for (let i = -radius; i <= radius; i++) {
        const sx = horizontal ? Math.min(src.width - 1, Math.max(0, x + i)) : x;
        const sy = horizontal ? y : Math.min(src.height - 1, Math.max(0, y + i));
        const p = getPixel(src, sx, sy);
        const w = k[i + radius]!;
        acc[0] += p[0] * w; acc[1] += p[1] * w; acc[2] += p[2] * w;
      }
      return acc;
    });

  return pass(pass(img, true), false);
}

/**
 * The measurement that actually matters.
 *
 * Per-pixel error (`ditherError`) *rises* when you dither — that is the whole
 * trade. Blur both images first, as the eye does at normal viewing distance,
 * and the ordering inverts: dithering wins, and by how much depends on where
 * each algorithm puts its noise in the frequency domain.
 */
export const perceivedDitherError = (original: Image, dithered: Image, sigma = 1.5): number =>
  ditherError(blur(original, sigma), blur(dithered, sigma));
