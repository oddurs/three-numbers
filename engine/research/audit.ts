/**
 * The audit that keeps the bibliography honest.
 *
 * It answers four questions the author cannot reliably answer by eye:
 * which citations point at nothing, which sources are carried but never used,
 * which figures assert something with no evidence behind them, and which
 * distilled claims have gone stale.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { paths } from "../paths.ts";
import type { SourceStore } from "./store.ts";
import type { FigureDefinition } from "../figures/define.ts";

export type Severity = "error" | "warning" | "info";

export interface Finding {
  readonly severity: Severity;
  readonly code: string;
  readonly message: string;
  readonly where?: string;
}

/**
 * Directories under `book/` that are not prose: `dev` holds scratch documents
 * for probing the template, and `lib` is the template itself — whose doc
 * comments naturally contain example `#fig("id")` calls that are not placements.
 */
const IGNORED_DIRS = new Set(["dev", "lib"]);

const typFiles = (dir: string): string[] => {
  const out: string[] = [];
  const walk = (d: string) => {
    let entries: string[];
    try { entries = readdirSync(d); } catch { return; }
    for (const name of entries.sort()) {
      if (IGNORED_DIRS.has(name)) continue;
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".typ")) out.push(full);
    }
  };
  walk(dir);
  return out;
};

/** Strip Typst comments and raw blocks so `@key` inside code samples is not counted. */
const stripNonProse = (src: string): string =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]*`/g, " ");

export interface CitationUse {
  readonly key: string;
  readonly file: string;
  readonly line: number;
}

/** Every `@key` citation in the book's Typst prose. */
export function findCitations(dir = paths.book): CitationUse[] {
  const uses: CitationUse[] = [];
  for (const file of typFiles(dir)) {
    const rel = relative(paths.root, file);
    const lines = stripNonProse(readFileSync(file, "utf8")).split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/(?<![\w.])@([a-z][a-z0-9-]*)(?![\w-])/g)) {
        uses.push({ key: m[1]!, file: rel, line: i + 1 });
      }
    });
  }
  return uses;
}

export interface FigureUse {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  /** `place` prints the figure; `ref` only points at it. */
  readonly kind: "place" | "ref";
}

/** Every `#fig("id")` placement and `#figref("id")` reference in the book. */
export function findFigureUses(dir = paths.book): FigureUse[] {
  const uses: FigureUse[] = [];
  for (const file of typFiles(dir)) {
    const rel = relative(paths.root, file);
    stripNonProse(readFileSync(file, "utf8")).split(/\r?\n/).forEach((line, i) => {
      for (const m of line.matchAll(/#(fig|figref)\(\s*"([a-z0-9-]+)"/g)) {
        uses.push({
          id: m[2]!, file: rel, line: i + 1,
          kind: m[1] === "fig" ? "place" : "ref",
        });
      }
    });
  }
  return uses;
}

/**
 * A figure must be printed exactly once and referred to thereafter. Placing it
 * twice prints it twice under two different numbers — a defect that is easy to
 * introduce when several sections all want the same diagram, and invisible in
 * any single-page proof.
 */
export function findDuplicatePlacements(uses: FigureUse[]): Array<{ id: string; at: FigureUse[] }> {
  const byId = new Map<string, FigureUse[]>();
  for (const u of uses) {
    if (u.kind !== "place") continue;
    (byId.get(u.id) ?? byId.set(u.id, []).get(u.id)!).push(u);
  }
  return [...byId].filter(([, at]) => at.length > 1).map(([id, at]) => ({ id, at }));
}

export interface AuditOptions {
  /** Web sources checked longer ago than this many days are flagged. */
  staleAfterDays?: number;
  /** Today, injectable so tests are not time-dependent. */
  now?: Date;
}

export function audit(
  store: SourceStore,
  figures: FigureDefinition[],
  opts: AuditOptions = {},
): Finding[] {
  const { staleAfterDays = 365, now = new Date() } = opts;
  const findings: Finding[] = [];
  const add = (severity: Severity, code: string, message: string, where?: string) =>
    findings.push({ severity, code, message, where });

  const citations = findCitations();
  const citedKeys = new Set(citations.map((c) => c.key));
  const figureKeys = new Set(figures.flatMap((f) => f.sources ?? []));

  // 1. Citations that point at nothing.
  for (const c of citations) {
    if (!store.byKey.has(c.key)) {
      add("error", "unknown-citation", `@${c.key} has no record in research/sources/`, `${c.file}:${c.line}`);
    }
  }

  // 2. Figures whose evidence does not exist.
  for (const f of figures) {
    for (const key of f.sources ?? []) {
      if (!store.byKey.has(key)) {
        add("error", "unknown-figure-source", `figure "${f.id}" cites unknown source "${key}"`, f.id);
      }
    }
    if (f.claim && (f.sources?.length ?? 0) === 0) {
      add("warning", "unsourced-claim", `figure "${f.id}" makes a claim with no sources attached`, f.id);
    }
  }

  // 3. Sources carried but never used.
  for (const s of store.sources) {
    if (!citedKeys.has(s.key) && !figureKeys.has(s.key)) {
      add("info", "unused-source", `"${s.key}" is in the store but nothing cites it`, s.file);
    }
  }

  // 4. Records that are thin or going stale.
  const msPerDay = 86_400_000;
  for (const s of store.sources) {
    if (s.claims.length === 0) {
      add("warning", "no-claims", `"${s.key}" has no distilled claims — it has been collected, not read`, s.file);
    }
    for (const c of s.claims) {
      if (c.confidence === "disputed") {
        add("warning", "disputed-claim", `"${s.key}/${c.id}" is marked disputed and is still in the store`, s.file);
      }
    }
    if (s.accessed) {
      const age = (now.getTime() - new Date(s.accessed).getTime()) / msPerDay;
      if (age > staleAfterDays) {
        add("warning", "stale-access", `"${s.key}" was last checked ${Math.round(age)} days ago`, s.file);
      }
    }
    if (s.type === "web" && s.tier === "primary") {
      add("info", "web-primary", `"${s.key}" is a web page marked primary — is there a standard or paper behind it?`, s.file);
    }
    if (!s.doi && !s.isbn && !s.url && !s.number) {
      add("warning", "unidentifiable", `"${s.key}" has no DOI, ISBN, URL or standard number`, s.file);
    }
  }

  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity] || a.code.localeCompare(b.code));
}

export const countBySeverity = (findings: Finding[]): Record<Severity, number> => ({
  error: findings.filter((f) => f.severity === "error").length,
  warning: findings.filter((f) => f.severity === "warning").length,
  info: findings.filter((f) => f.severity === "info").length,
});
