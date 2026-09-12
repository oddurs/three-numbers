/**
 * Figure discovery.
 *
 * Every `*.fig.ts` under `figures/` is loaded and registered by its id. There
 * is no central list to keep in sync: adding a file adds a figure.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import type { FigureDefinition } from "./define.ts";
import { projectRoot } from "../paths.ts";

const FIGURE_SUFFIX = ".fig.ts";

export function figureSources(dir = join(projectRoot, "figures")): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    let entries: string[];
    try { entries = readdirSync(d); } catch { return; }
    for (const name of entries.sort()) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(FIGURE_SUFFIX)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

export interface LoadedFigure {
  readonly def: FigureDefinition;
  readonly file: string;
}

export async function loadFigures(dir?: string): Promise<LoadedFigure[]> {
  const files = figureSources(dir);
  const loaded: LoadedFigure[] = [];
  const seen = new Map<string, string>();

  for (const file of files) {
    const mod = (await import(pathToFileURL(file).href)) as { default?: FigureDefinition };
    const def = mod.default;
    if (!def || typeof def.render !== "function") {
      throw new Error(`${relative(projectRoot, file)}: must default-export a defineFigure(...) result`);
    }
    const prior = seen.get(def.id);
    if (prior) {
      throw new Error(`duplicate figure id "${def.id}" in ${relative(projectRoot, file)} and ${relative(projectRoot, prior)}`);
    }
    seen.set(def.id, file);
    loaded.push({ def, file });
  }
  return loaded;
}
