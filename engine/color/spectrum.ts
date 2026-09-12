/**
 * Uniformly-sampled spectral distributions.
 *
 * A `Spectrum` is the book's atom of physical colour: a function of wavelength
 * sampled on a regular grid. Reflectances, illuminant SPDs, colour-matching
 * functions and cone fundamentals are all the same shape, which is exactly the
 * point Chapter 2 wants to make.
 */

export interface Spectrum {
  /** Wavelength of the first sample, in nanometres. */
  readonly start: number;
  /** Sample spacing, in nanometres. */
  readonly step: number;
  readonly values: readonly number[];
  readonly label?: string;
}

export const end = (s: Spectrum): number =>
  s.start + s.step * (s.values.length - 1);

export const wavelengths = (s: Spectrum): number[] =>
  s.values.map((_, i) => s.start + i * s.step);

/** Zip a spectrum into (wavelength, value) pairs. */
export const samples = (s: Spectrum): Array<[number, number]> =>
  s.values.map((v, i) => [s.start + i * s.step, v]);

/**
 * Sample at an arbitrary wavelength by linear interpolation.
 * Outside the measured range the result is 0 — the honest answer for a
 * detector that was never characterised there.
 */
export function at(s: Spectrum, lambda: number): number {
  const x = (lambda - s.start) / s.step;
  if (x < 0 || x > s.values.length - 1) return 0;
  const i = Math.floor(x);
  const f = x - i;
  const a = s.values[i] ?? 0;
  if (f === 0) return a;
  const b = s.values[i + 1] ?? 0;
  return a + (b - a) * f;
}

export function fromFunction(
  f: (lambda: number) => number,
  start = 360,
  stop = 830,
  step = 1,
  label?: string,
): Spectrum {
  if (!(step > 0)) throw new RangeError(`spectrum step must be positive, got ${step}`);
  if (stop < start) throw new RangeError(`spectrum range is inverted: ${start} to ${stop} nm`);
  const n = Math.round((stop - start) / step) + 1;
  const values = Array.from({ length: n }, (_, i) => f(start + i * step));
  return label === undefined ? { start, step, values } : { start, step, values, label };
}

/** Resample onto a new grid (linear interpolation, zero outside). */
export function resample(s: Spectrum, start: number, stop: number, step: number): Spectrum {
  if (!(step > 0)) throw new RangeError(`resample step must be positive, got ${step}`);
  if (stop < start) throw new RangeError(`resample range is inverted: ${start} to ${stop} nm`);
  const n = Math.round((stop - start) / step) + 1;
  return {
    start,
    step,
    values: Array.from({ length: n }, (_, i) => at(s, start + i * step)),
    ...(s.label === undefined ? {} : { label: s.label }),
  };
}

/** Align `b` to `a`'s grid, then combine sample-wise. */
export function zipWith(
  a: Spectrum,
  b: Spectrum,
  f: (x: number, y: number) => number,
): Spectrum {
  return {
    start: a.start,
    step: a.step,
    values: a.values.map((v, i) => f(v, at(b, a.start + i * a.step))),
  };
}

export const multiply = (a: Spectrum, b: Spectrum): Spectrum =>
  zipWith(a, b, (x, y) => x * y);

export const scale = (s: Spectrum, k: number): Spectrum => ({
  ...s,
  values: s.values.map((v) => v * k),
});

export const map = (s: Spectrum, f: (v: number, lambda: number) => number): Spectrum => ({
  ...s,
  values: s.values.map((v, i) => f(v, s.start + i * s.step)),
});

/** Rectangle-rule integral, in units of value x nanometre. */
export const integrate = (s: Spectrum): number =>
  s.values.reduce((acc, v) => acc + v, 0) * s.step;

export const maxValue = (s: Spectrum): number => Math.max(...s.values);

/** Rescale so the value at `lambda` becomes `target` (SPDs are conventionally 100 at 560 nm). */
export function normalizeAt(s: Spectrum, lambda: number, target = 100): Spectrum {
  const v = at(s, lambda);
  return v === 0 ? s : scale(s, target / v);
}

export const normalizePeak = (s: Spectrum, target = 1): Spectrum =>
  scale(s, target / maxValue(s));

// ---------------------------------------------------------------------------
// Physically-generated spectra
// ---------------------------------------------------------------------------

const H = 6.62607015e-34; // Planck constant, J.s        (SI, exact)
const C = 2.99792458e8; // speed of light, m/s           (SI, exact)
const KB = 1.380649e-23; // Boltzmann constant, J/K      (SI, exact)

/**
 * Planck's law: spectral radiant exitance of a black body at temperature `T`
 * kelvin, per unit wavelength. Returned in W.m^-2.nm^-1 (the 1e-9 folds the
 * nanometre into the metre-based constants).
 */
export function planckAt(lambdaNm: number, T: number): number {
  if (!(T > 0)) throw new RangeError(`black-body temperature must be positive, got ${T} K`);
  const l = lambdaNm * 1e-9;
  const a = (2 * Math.PI * H * C * C) / Math.pow(l, 5);
  const b = Math.exp((H * C) / (l * KB * T)) - 1;
  return (a / b) * 1e-9;
}

export const blackbody = (T: number, start = 360, stop = 830, step = 1): Spectrum =>
  fromFunction((l) => planckAt(l, T), start, stop, step, `${T} K black body`);

/** Wien's displacement law: peak wavelength in nm. */
export const wienPeakNm = (T: number): number => {
  if (!(T > 0)) throw new RangeError(`black-body temperature must be positive, got ${T} K`);
  return 2.897771955e6 / T;
};

/** A Gaussian emission line — the shape of a laser or a phosphor peak. */
export const gaussianLine = (
  centerNm: number,
  fwhmNm: number,
  amplitude = 1,
  start = 360,
  stop = 830,
  step = 1,
): Spectrum => {
  const sigma = fwhmNm / (2 * Math.sqrt(2 * Math.LN2));
  return fromFunction(
    (l) => amplitude * Math.exp(-((l - centerNm) ** 2) / (2 * sigma * sigma)),
    start, stop, step,
  );
};

/** An idealised monochromatic stimulus, one grid cell wide. */
export function monochromatic(lambdaNm: number, start = 360, stop = 830, step = 1): Spectrum {
  const s = fromFunction(() => 0, start, stop, step);
  const idx = Math.round((lambdaNm - start) / step);
  const values = [...s.values];
  if (idx >= 0 && idx < values.length) values[idx] = 1 / step;
  return { ...s, values };
}

export const flat = (level = 1, start = 360, stop = 830, step = 1): Spectrum =>
  fromFunction(() => level, start, stop, step, "equal energy");
