/**
 * Outline discovery.
 *
 * Every `*.outline.ts` under `outline/` is loaded and registered, the same way
 * figures are: adding a file adds a chapter, and there is no central list to
 * keep in step with reality.
 */

import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { paths } from "../paths.ts";
import type { ChapterOutline, Part } from "./define.ts";

const SUFFIX = ".outline.ts";

export interface LoadedChapter {
  readonly chapter: ChapterOutline;
  readonly file: string;
}

export const outlineDir = (): string => join(paths.root, "outline");

export function outlineSources(dir = outlineDir()): string[] {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(SUFFIX)).sort()
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

export async function loadParts(dir = outlineDir()): Promise<Part[]> {
  const mod = (await import(pathToFileURL(join(dir, "parts.ts")).href)) as { parts?: Part[] };
  if (!Array.isArray(mod.parts)) throw new Error("outline/parts.ts must export `parts`");
  return mod.parts;
}

export async function loadChapters(dir = outlineDir()): Promise<LoadedChapter[]> {
  const loaded: LoadedChapter[] = [];
  const seenId = new Map<string, string>();
  const seenNumber = new Map<number, string>();

  for (const file of outlineSources(dir)) {
    const rel = relative(paths.root, file);
    const mod = (await import(pathToFileURL(file).href)) as { default?: ChapterOutline };
    const chapter = mod.default;
    if (!chapter || !Array.isArray(chapter.sections)) {
      throw new Error(`${rel}: must default-export a defineChapter(...) result`);
    }
    const priorId = seenId.get(chapter.id);
    if (priorId) throw new Error(`duplicate chapter id "${chapter.id}" in ${rel} and ${priorId}`);
    seenId.set(chapter.id, rel);

    const priorNumber = seenNumber.get(chapter.number);
    if (priorNumber) {
      throw new Error(`two chapters numbered ${chapter.number}: ${rel} and ${priorNumber}`);
    }
    seenNumber.set(chapter.number, rel);

    loaded.push({ chapter, file: rel });
  }

  return loaded.sort((a, b) => a.chapter.number - b.chapter.number);
}

export interface Outline {
  readonly parts: readonly Part[];
  readonly chapters: readonly LoadedChapter[];
  /** Chapters of one part, in printed order. */
  readonly byPart: ReadonlyMap<string, readonly LoadedChapter[]>;
}

export async function loadOutline(dir = outlineDir()): Promise<Outline> {
  const [parts, chapters] = await Promise.all([loadParts(dir), loadChapters(dir)]);
  const byPart = new Map<string, LoadedChapter[]>();
  for (const p of parts) byPart.set(p.number, []);
  for (const c of chapters) {
    const bucket = byPart.get(c.chapter.part);
    if (!bucket) {
      throw new Error(`${c.file}: part "${c.chapter.part}" is not declared in outline/parts.ts`);
    }
    bucket.push(c);
  }
  return { parts, chapters, byPart };
}
