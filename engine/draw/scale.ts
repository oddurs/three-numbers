/** Scales and tick generation. */

export interface Scale {
  (value: number): number;
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
  readonly invert: (pixel: number) => number;
  readonly ticks: (count?: number) => number[];
  readonly clamp: (value: number) => number;
}

const makeScale = (
  domain: readonly [number, number],
  range: readonly [number, number],
  forward: (v: number) => number,
  backward: (p: number) => number,
  ticksFn: (count: number) => number[],
): Scale => {
  const f = forward as Scale & ((v: number) => number);
  return Object.assign(f, {
    domain, range, invert: backward, ticks: (count = 6) => ticksFn(count),
    clamp: (v: number) => Math.min(Math.max(v, Math.min(...domain)), Math.max(...domain)),
  }) as Scale;
};

export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return makeScale(
    domain, range,
    (v) => r0 + ((v - d0) / span) * (r1 - r0),
    (p) => d0 + ((p - r0) / (r1 - r0 || 1)) * span,
    (count) => niceTicks(d0, d1, count),
  );
}

export function logScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): Scale {
  const [d0, d1] = domain;
  if (d0 <= 0 || d1 <= 0) throw new RangeError("log scale needs a positive domain");
  const [r0, r1] = range;
  const l0 = Math.log10(d0), l1 = Math.log10(d1);
  return makeScale(
    domain, range,
    (v) => r0 + ((Math.log10(Math.max(v, Number.MIN_VALUE)) - l0) / (l1 - l0)) * (r1 - r0),
    (p) => 10 ** (l0 + ((p - r0) / (r1 - r0)) * (l1 - l0)),
    () => {
      const out: number[] = [];
      for (let e = Math.floor(l0); e <= Math.ceil(l1); e++) {
        const v = 10 ** e;
        if (v >= d0 * 0.999 && v <= d1 * 1.001) out.push(v);
      }
      return out;
    },
  );
}

/** Extend a domain outward to round numbers, the way a good axis should. */
export function niceDomain(min: number, max: number, count = 6): [number, number] {
  if (min === max) return [min, max];
  const step = tickStep(min, max, count);
  if (min > max) return [Math.ceil(min / step) * step, Math.floor(max / step) * step];
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}

export function tickStep(min: number, max: number, count: number): number {
  const raw = Math.abs(max - min) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = norm >= 7 ? 10 : norm >= 3 ? 5 : norm >= 1.5 ? 2 : 1;
  return step * mag;
}

/** Round tick values inside [min, max], d3-style. */
export function niceTicks(min: number, max: number, count = 6): number[] {
  if (min === max) return [min];
  // A reversed domain is a perfectly good axis — depth, countdowns, error rates
  // plotted downwards — so generate ticks over the span and hand them back in
  // the caller's own direction.
  const reversed = min > max;
  const [lo, hi] = reversed ? [max, min] : [min, max];
  const step = tickStep(lo, hi, count);
  const start = Math.ceil(lo / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 1e-9; v += step) {
    out.push(Math.abs(v) < step * 1e-9 ? 0 : Number(v.toPrecision(12)));
  }
  return reversed ? out.reverse() : out;
}

/**
 * How many decimal places are needed to write `step` exactly.
 *
 * Taking this from the step's *magnitude* is the obvious thing and it is wrong:
 * log10(0.25) is about -0.6, which rounds to one decimal place, and the axis
 * then reads 0, 0.3, 0.5, 0.8. The question is one of representation, not size.
 */
export function decimalsFor(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  for (let d = 0; d <= 10; d++) {
    const scaled = step * 10 ** d;
    if (Math.abs(scaled - Math.round(scaled)) < 1e-9) return d;
  }
  return 10;
}

/** Format a tick value without trailing noise. */
export function formatTick(v: number, step?: number): string {
  if (v === 0) return "0";
  const decimals = step ? decimalsFor(step) : undefined;
  if (Math.abs(v) >= 1e5 || (Math.abs(v) < 1e-3 && v !== 0)) {
    return v.toExponential(1).replace("e+", "e").replace(/\.0e/, "e");
  }
  return decimals === undefined ? String(Number(v.toPrecision(6))) : v.toFixed(decimals);
}

export const extent = (values: number[]): [number, number] => [Math.min(...values), Math.max(...values)];
