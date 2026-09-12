/**
 * Driving the Typst compiler.
 *
 * Typst is invoked with the project root as its root, so `book/` can reach
 * `build/figures/` and `build/research/` through absolute paths. Nothing in
 * `book/` ever reaches outside the project.
 */

import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { paths } from "../paths.ts";

export interface CompileResult {
  readonly ok: boolean;
  readonly output: string;
  readonly ms: number;
  readonly pdf: string;
}

export const typstAvailable = (): boolean =>
  spawnSync("typst", ["--version"], { encoding: "utf8" }).status === 0;

export const typstVersion = (): string =>
  spawnSync("typst", ["--version"], { encoding: "utf8" }).stdout?.trim() ?? "unknown";

export interface CompileOptions {
  /** Entry point, relative to the project root. */
  readonly entry?: string;
  readonly output?: string;
  /** Compile only these pages, e.g. "1-8". */
  readonly pages?: string;
  /** Emit PNGs instead of a PDF (used by `cli proof`). */
  readonly png?: boolean;
  readonly ppi?: number;
  /** Extra `--input key=value` pairs, readable in Typst via `sys.inputs`. */
  readonly inputs?: Record<string, string>;
}

function buildArgs(cmd: "compile" | "watch", opts: CompileOptions): { args: string[]; output: string } {
  const entry = opts.entry ?? join(paths.book, "main.typ");
  const output =
    opts.output ??
    (opts.png ? join(paths.build, "proof-{p}.png") : join(paths.build, "three-numbers.pdf"));

  // Fonts are vendored so the book typesets identically anywhere.
  const args = [cmd, entry, output, "--root", paths.root, "--font-path", paths.fonts];
  if (opts.pages) args.push("--pages", opts.pages);
  if (opts.png) args.push("--ppi", String(opts.ppi ?? 150));
  for (const [k, v] of Object.entries(opts.inputs ?? {})) args.push("--input", `${k}=${v}`);
  return { args, output };
}

export function compile(opts: CompileOptions = {}): CompileResult {
  const started = performance.now();
  const { args, output } = buildArgs("compile", opts);
  const res = spawnSync("typst", args, { encoding: "utf8", cwd: paths.root });
  return {
    ok: res.status === 0,
    output: `${res.stdout ?? ""}${res.stderr ?? ""}`.trim(),
    ms: performance.now() - started,
    pdf: output,
  };
}

/** Long-running `typst watch`, streamed to the terminal. Returns the child. */
export function watch(opts: CompileOptions = {}): ReturnType<typeof spawn> {
  const { args } = buildArgs("watch", opts);
  return spawn("typst", args, { cwd: paths.root, stdio: "inherit" });
}
