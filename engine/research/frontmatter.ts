/**
 * A deliberately small YAML-subset parser for source frontmatter.
 *
 * Supports exactly what a bibliography record needs — scalars, quoted strings,
 * inline lists, and block lists — and rejects anything else loudly rather than
 * guessing. A citation store that silently mis-parses is worse than none.
 */

export type Scalar = string | number | boolean;
export type FrontmatterValue = Scalar | Scalar[];
export type Frontmatter = Record<string, FrontmatterValue>;

export class FrontmatterError extends Error {
  readonly file: string;
  readonly line: number;
  constructor(message: string, file: string, line: number) {
    super(`${file}:${line}: ${message}`);
    this.name = "FrontmatterError";
    this.file = file;
    this.line = line;
  }
}

const unquote = (raw: string): string => {
  const s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\"/g, '"');
  }
  return s;
};

const coerce = (raw: string): Scalar => {
  const s = raw.trim();
  if (s !== unquote(s)) return unquote(s);
  if (s === "true") return true;
  if (s === "false") return false;
  if (s !== "" && !Number.isNaN(Number(s)) && /^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
};

/** Split a document into its frontmatter block and the body after it. */
export function splitFrontmatter(text: string, file: string): { frontmatter: Frontmatter; body: string } {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    throw new FrontmatterError("file must begin with a '---' frontmatter fence", file, 1);
  }
  const close = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (close < 0) throw new FrontmatterError("unterminated frontmatter block", file, 1);

  const fm: Frontmatter = {};
  let currentKey: string | null = null;
  let blockList: Scalar[] | null = null;

  const flush = () => {
    if (currentKey && blockList) fm[currentKey] = blockList;
    currentKey = null;
    blockList = null;
  };

  for (let i = 1; i < close; i++) {
    const raw = lines[i]!;
    const line = raw.trimEnd();
    if (!line.trim() || line.trim().startsWith("#")) continue;

    if (/^\s*-\s+/.test(line)) {
      if (!currentKey) throw new FrontmatterError("list item outside of a key", file, i + 1);
      (blockList ??= []).push(coerce(line.replace(/^\s*-\s+/, "")));
      continue;
    }

    flush();
    const m = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!m) throw new FrontmatterError(`cannot parse "${line.trim()}"`, file, i + 1);
    const [, key, rest] = m as unknown as [string, string, string];
    if (rest === "") { currentKey = key; continue; }
    if (rest.startsWith("[") && rest.endsWith("]")) {
      const inner = rest.slice(1, -1).trim();
      fm[key] = inner === "" ? [] : inner.split(",").map((p) => coerce(p));
      continue;
    }
    fm[key] = coerce(rest);
  }
  flush();

  return { frontmatter: fm, body: lines.slice(close + 1).join("\n").trim() };
}

export const asString = (v: FrontmatterValue | undefined): string | undefined =>
  v === undefined ? undefined : Array.isArray(v) ? v.map(String).join(", ") : String(v);

export const asList = (v: FrontmatterValue | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v.map(String) : [String(v)];

export const asNumber = (v: FrontmatterValue | undefined): number | undefined => {
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
