/**
 * Small, dependency-free linear algebra for colorimetry.
 *
 * Everything downstream (RGB matrices, chromatic adaptation, cone models) is
 * derived rather than hard-coded, so the book can show the derivation and the
 * figures can never drift from the text.
 */

export type Vec3 = readonly [number, number, number];
/** Row-major 3x3 matrix: `m[row][col]`. */
export type Mat3 = readonly [Vec3, Vec3, Vec3];

export const vec3 = (x: number, y: number, z: number): Vec3 => [x, y, z];

export function mul(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

export function matmul(a: Mat3, b: Mat3): Mat3 {
  const out: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) out[i]![j]! += a[i]![k]! * b[k]![j]!;
  return out.map((r) => r as unknown as Vec3) as unknown as Mat3;
}

export function transpose(m: Mat3): Mat3 {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ];
}

export function det(m: Mat3): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

export function inverse(m: Mat3): Mat3 {
  const d = det(m);
  if (Math.abs(d) < 1e-15) throw new Error("inverse: singular matrix");
  const c = (r0: number, c0: number, r1: number, c1: number) =>
    m[r0]![c0]! * m[r1]![c1]! - m[r0]![c1]! * m[r1]![c0]!;
  const inv: Mat3 = [
    [c(1, 1, 2, 2) / d, -c(0, 1, 2, 2) / d, c(0, 1, 1, 2) / d],
    [-c(1, 0, 2, 2) / d, c(0, 0, 2, 2) / d, -c(0, 0, 1, 2) / d],
    [c(1, 0, 2, 1) / d, -c(0, 0, 2, 1) / d, c(0, 0, 1, 1) / d],
  ];
  return inv;
}

/** Diagonal matrix from a vector — the whole of a von Kries adaptation. */
export function diag(v: Vec3): Mat3 {
  return [
    [v[0], 0, 0],
    [0, v[1], 0],
    [0, 0, v[2]],
  ];
}

export const clamp = (x: number, lo = 0, hi = 1): number =>
  x < lo ? lo : x > hi ? hi : x;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Signed power: preserves sign across a fractional exponent. */
export const spow = (x: number, p: number): number =>
  Math.sign(x) * Math.pow(Math.abs(x), p);

export const deg = (rad: number): number => (rad * 180) / Math.PI;
export const rad = (d: number): number => (d * Math.PI) / 180;

/** Wrap an angle into [0, 360). */
export const wrapDeg = (d: number): number => ((d % 360) + 360) % 360;
