/**
 * Command-line parsing.
 *
 * Written out rather than improvised because the improvised version was subtly
 * wrong: it identified option *values* by searching the argument list for a
 * matching string, so `figures foo --pages foo` would classify the positional
 * `foo` as a value and drop it, and `--pages --ppi 150` would happily return
 * `--ppi` as the page range. Parsing in one left-to-right pass removes both.
 */

export interface CommandSpec {
  /** Flags that take a following value. */
  readonly options?: readonly string[];
  /** Boolean flags. */
  readonly flags?: readonly string[];
}

export interface ParsedArgs {
  readonly command: string;
  readonly positionals: readonly string[];
  readonly flags: ReadonlySet<string>;
  readonly options: ReadonlyMap<string, string>;
}

export class ArgError extends Error {
  readonly suggestion: string | undefined;
  constructor(message: string, suggestion?: string) {
    super(message);
    this.name = "ArgError";
    this.suggestion = suggestion;
  }
}

/** Levenshtein distance, for "did you mean" on a mistyped flag. */
function distance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j]! + 1,
        curr[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev.splice(0, prev.length, ...curr);
  }
  return prev[b.length]!;
}

export function nearest(word: string, candidates: readonly string[], maxDistance = 3): string | undefined {
  let best: string | undefined;
  let bestD = maxDistance + 1;
  for (const c of candidates) {
    const d = distance(word, c);
    if (d < bestD) { bestD = d; best = c; }
  }
  return bestD <= maxDistance ? best : undefined;
}

/**
 * Parse `argv` (already stripped of node and script) against a spec.
 *
 * Everything after a bare `--` is a positional, so a filename that starts with
 * a dash is still reachable.
 */
export function parseArgs(argv: readonly string[], spec: CommandSpec = {}): ParsedArgs {
  const options = new Set(spec.options ?? []);
  const flags = new Set(spec.flags ?? []);
  const known = [...options, ...flags];

  const command = argv[0] ?? "help";
  const rest = argv.slice(1);

  const positionals: string[] = [];
  const seenFlags = new Set<string>();
  const seenOptions = new Map<string, string>();
  let literal = false;

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!;
    if (literal || !arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    if (arg === "--") { literal = true; continue; }

    // `--name=value` is accepted as well as `--name value`.
    const eq = arg.indexOf("=");
    const name = (eq >= 0 ? arg.slice(2, eq) : arg.slice(2));
    const inlineValue = eq >= 0 ? arg.slice(eq + 1) : undefined;

    if (options.has(name)) {
      const value = inlineValue ?? rest[i + 1];
      if (value === undefined || (inlineValue === undefined && value.startsWith("--"))) {
        throw new ArgError(`--${name} needs a value`);
      }
      if (inlineValue === undefined) i++;
      seenOptions.set(name, value);
      continue;
    }
    if (flags.has(name)) {
      if (inlineValue !== undefined) throw new ArgError(`--${name} is a flag and takes no value`);
      seenFlags.add(name);
      continue;
    }
    throw new ArgError(`unknown flag --${name}`, nearest(name, known));
  }

  return { command, positionals, flags: seenFlags, options: seenOptions };
}

/** Parse an option that must be a positive integer. */
export function intOption(args: ParsedArgs, name: string, fallback: number): number {
  const raw = args.options.get(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ArgError(`--${name} must be a positive integer, got "${raw}"`);
  }
  return n;
}

/** Parse a Typst page range such as "1-6" or "12". */
export function pageRangeOption(args: ParsedArgs, name = "pages"): string | undefined {
  const raw = args.options.get(name);
  if (raw === undefined) return undefined;
  if (!/^\d+(-\d+)?(,\d+(-\d+)?)*$/.test(raw)) {
    throw new ArgError(`--${name} must be a page range like "1-6" or "3,7-9", got "${raw}"`);
  }
  return raw;
}
