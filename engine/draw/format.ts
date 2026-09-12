/** Formatting helpers shared by the drawing engine and figure authors. */

import type { Vec3 } from "../color/math.ts";
import { clamp } from "../color/math.ts";

const hex2 = (v: number): string =>
  Math.round(clamp(v) * 255).toString(16).padStart(2, "0");

/** Display-encoded RGB in [0,1] to a CSS hex string. */
export const srgbToHex = (c: Vec3): string => `#${hex2(c[0])}${hex2(c[1])}${hex2(c[2])}`;

export const hexToSrgb = (hex: string): Vec3 => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
};

/** 8-bit channel triple, the form people actually type into code. */
export const srgb255 = (c: Vec3): [number, number, number] =>
  [Math.round(clamp(c[0]) * 255), Math.round(clamp(c[1]) * 255), Math.round(clamp(c[2]) * 255)];

export const fixed = (v: number, d = 2): string => v.toFixed(d);

/** Wavelength in nm, set the way the text sets it. */
export const nm = (v: number): string => `${Math.round(v)} nm`;
