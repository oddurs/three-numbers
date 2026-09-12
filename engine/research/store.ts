/** Loading and indexing the research source store. */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { paths } from "../paths.ts";
import { parseSource, SourceError, type Claim, type Source } from "./source.ts";

export interface SourceStore {
  readonly sources: readonly Source[];
  readonly byKey: ReadonlyMap<string, Source>;
  /** Every claim in the store, indexed by `key/claim-id`. */
  readonly claims: ReadonlyMap<string, { claim: Claim; source: Source }>;
}

export const sourcesDir = (): string => join(paths.research, "sources");

export function loadSources(dir = sourcesDir()): SourceStore {
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  } catch {
    files = [];
  }

  const sources: Source[] = [];
  const byKey = new Map<string, Source>();
  const claims = new Map<string, { claim: Claim; source: Source }>();

  for (const name of files) {
    const file = join(dir, name);
    const rel = relative(paths.root, file);
    const src = parseSource(readFileSync(file, "utf8"), rel);

    const expected = `${src.key}.md`;
    if (name !== expected) {
      throw new SourceError(`key "${src.key}" should live in ${expected}, not ${name}`, rel);
    }
    if (byKey.has(src.key)) throw new SourceError(`duplicate key "${src.key}"`, rel);
    byKey.set(src.key, src);
    sources.push(src);

    const seen = new Set<string>();
    for (const c of src.claims) {
      if (seen.has(c.id)) throw new SourceError(`duplicate claim id "${c.id}"`, rel);
      seen.add(c.id);
      claims.set(`${src.key}/${c.id}`, { claim: c, source: src });
    }
  }

  return { sources, byKey, claims };
}
