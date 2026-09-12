/**
 * A research source, and the distilled claims taken from it.
 *
 * The store is one Markdown file per source under `research/sources/`. Each one
 * carries the bibliographic record in frontmatter and, in the body, the *only*
 * part of the source the book is allowed to rely on: an explicit list of
 * claims, each with a locator (page, section, table) and a confidence. If a
 * statement in the book is not traceable to a claim here, it is either common
 * knowledge or it is unsupported, and `cli check` will say which.
 */

import { asList, asNumber, asString, splitFrontmatter, type Frontmatter } from "./frontmatter.ts";

export type SourceType =
  | "book" | "article" | "standard" | "web" | "dataset" | "thesis" | "software" | "talk" | "report";

/** How close the source is to the thing it describes. */
export type Tier = "primary" | "secondary" | "tertiary";

export type Confidence = "high" | "medium" | "low" | "disputed";

export interface Claim {
  /** Stable id, explicit via `{#id}` or derived from the text. */
  readonly id: string;
  /** Page, section or table reference inside the source. */
  readonly locator: string;
  readonly confidence: Confidence;
  readonly text: string;
  /** Optional free tags, written as `#tag` at the end of the line. */
  readonly tags: readonly string[];
}

export interface Source {
  readonly key: string;
  readonly type: SourceType;
  readonly title: string;
  readonly authors: readonly string[];
  readonly year?: number;
  readonly publisher?: string;
  readonly journal?: string;
  readonly volume?: string;
  readonly issue?: string;
  readonly pages?: string;
  readonly edition?: string;
  readonly number?: string;
  readonly doi?: string;
  readonly isbn?: string;
  readonly url?: string;
  /** ISO date the URL was last checked. Required for `web` sources. */
  readonly accessed?: string;
  readonly tier: Tier;
  /** Free-text note on why this source is in the bibliography at all. */
  readonly rationale: string;
  readonly claims: readonly Claim[];
  readonly file: string;
}

const SOURCE_TYPES = new Set<string>([
  "book", "article", "standard", "web", "dataset", "thesis", "software", "talk", "report",
]);
const TIERS = new Set<string>(["primary", "secondary", "tertiary"]);
const CONFIDENCES = new Set<string>(["high", "medium", "low", "disputed"]);

export class SourceError extends Error {
  readonly file: string;
  constructor(message: string, file: string) {
    super(`${file}: ${message}`);
    this.name = "SourceError";
    this.file = file;
  }
}

const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 6).join("-");

/**
 * Parse the `## Claims` section.
 *
 * Each line reads `- [confidence | locator] {#optional-id} text #tag #tag`.
 * The brackets are mandatory: a claim with no locator is an assertion, not a
 * citation, and the parser refuses it.
 */
export function parseClaims(body: string, file: string): Claim[] {
  const section = /^##\s+Claims\s*$/im.exec(body);
  if (!section) return [];
  const start = section.index + section[0].length;
  const rest = body.slice(start);
  const nextHeading = /^##\s+/m.exec(rest);
  const block = nextHeading ? rest.slice(0, nextHeading.index) : rest;

  const claims: Claim[] = [];
  for (const raw of block.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith("- ")) continue;
    const m = /^-\s*\[([^\]|]+)\|([^\]]+)\]\s*(.*)$/.exec(line);
    if (!m) {
      throw new SourceError(
        `claim must read "- [confidence | locator] text", got: ${line.slice(0, 72)}`, file,
      );
    }
    const confidence = m[1]!.trim().toLowerCase();
    if (!CONFIDENCES.has(confidence)) {
      throw new SourceError(`unknown confidence "${confidence}" (use high/medium/low/disputed)`, file);
    }
    let text = m[3]!.trim();
    let id: string | undefined;
    const idMatch = /^\{#([a-z0-9-]+)\}\s*/.exec(text);
    if (idMatch) { id = idMatch[1]!; text = text.slice(idMatch[0].length).trim(); }

    const tags: string[] = [];
    text = text.replace(/\s+#([a-z0-9-]+)(?=\s|$)/g, (_, t: string) => { tags.push(t); return ""; }).trim();
    if (!text) throw new SourceError("claim has no text", file);

    claims.push({ id: id ?? slug(text), locator: m[2]!.trim(), confidence: confidence as Confidence, text, tags });
  }
  return claims;
}

const sectionText = (body: string, heading: string): string => {
  const re = new RegExp(`^##\\s+${heading}\\s*$`, "im");
  const m = re.exec(body);
  if (!m) return "";
  const rest = body.slice(m.index + m[0].length);
  const next = /^##\s+/m.exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
};

export function parseSource(text: string, file: string): Source {
  const { frontmatter: fm, body } = splitFrontmatter(text, file);
  const req = (k: string): string => {
    const v = asString(fm[k]);
    if (!v) throw new SourceError(`missing required field "${k}"`, file);
    return v;
  };

  const type = req("type");
  if (!SOURCE_TYPES.has(type)) {
    throw new SourceError(`unknown type "${type}" (expected one of ${[...SOURCE_TYPES].join(", ")})`, file);
  }
  const tier = asString(fm["tier"]) ?? "secondary";
  if (!TIERS.has(tier)) throw new SourceError(`unknown tier "${tier}"`, file);

  const key = req("key");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(key)) {
    throw new SourceError(`key "${key}" must be lowercase kebab-case`, file);
  }

  const url = asString(fm["url"]);
  const accessed = asString(fm["accessed"]);
  if (type === "web" && !accessed) {
    throw new SourceError("web sources must record an `accessed:` date", file);
  }
  if (accessed && !/^\d{4}-\d{2}-\d{2}$/.test(accessed)) {
    throw new SourceError(`accessed must be an ISO date, got "${accessed}"`, file);
  }

  const rationale = sectionText(body, "Why it matters");
  if (!rationale) {
    throw new SourceError('every source needs a "## Why it matters" section', file);
  }

  return {
    key, type: type as SourceType, title: req("title"),
    authors: asList(fm["author"] ?? fm["authors"]),
    year: asNumber(fm["year"]),
    publisher: asString(fm["publisher"]),
    journal: asString(fm["journal"]),
    volume: asString(fm["volume"]),
    issue: asString(fm["issue"]),
    pages: asString(fm["pages"]),
    edition: asString(fm["edition"]),
    number: asString(fm["number"]),
    doi: asString(fm["doi"]),
    isbn: asString(fm["isbn"]),
    url, accessed,
    tier: tier as Tier,
    rationale,
    claims: parseClaims(body, file),
    file,
  };
}

/** Render a source back to its on-disk form — used by `cite add`. */
export function serializeSource(
  s: Omit<Source, "file" | "claims" | "rationale"> & { rationale?: string; claims?: Claim[] },
): string {
  const fm: Array<[string, string | number | undefined]> = [
    ["key", s.key], ["type", s.type], ["title", JSON.stringify(s.title)],
    ["year", s.year], ["journal", s.journal], ["publisher", s.publisher],
    ["volume", s.volume], ["issue", s.issue], ["pages", s.pages],
    ["edition", s.edition], ["number", s.number], ["doi", s.doi], ["isbn", s.isbn],
    ["url", s.url], ["accessed", s.accessed], ["tier", s.tier],
  ];
  const lines = ["---"];
  for (const [k, v] of fm) if (v !== undefined && v !== "") lines.push(`${k}: ${v}`);
  if (s.authors.length) {
    lines.push("author:");
    for (const a of s.authors) lines.push(`  - ${JSON.stringify(a)}`);
  }
  lines.push("---", "");
  lines.push("## Why it matters", "");
  lines.push(s.rationale?.trim() || "TODO: one paragraph on why this source is in the bibliography.");
  lines.push("", "## Claims", "");
  if (s.claims?.length) {
    for (const c of s.claims) {
      const tags = c.tags.length ? ` ${c.tags.map((t) => `#${t}`).join(" ")}` : "";
      lines.push(`- [${c.confidence} | ${c.locator}] {#${c.id}} ${c.text}${tags}`);
    }
  } else {
    lines.push("<!-- - [high | §1.2] {#some-id} The distilled claim, in your own words. -->");
  }
  lines.push("");
  return lines.join("\n");
}
