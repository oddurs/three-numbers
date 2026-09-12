#!/usr/bin/env node
/**
 * The book's command line.
 *
 *   build      render figures, sync the bibliography, compile the PDF
 *   figures    render figures only
 *   watch      rebuild figures on change and keep Typst watching
 *   proof      render selected pages to PNG for quick visual checks
 *   check      typecheck, run tests, and audit citations and figures
 *   cite       manage the research store
 *   research   evidence sheets and the claim index
 *   stats      word counts, figure counts, source counts
 *   new        scaffold a chapter, a figure or a source record
 *   clean      remove build output
 *
 * Everything runs on Node 24's native TypeScript: there is no transpile step
 * and no bundler, and the only runtime dependency is Typst itself.
 */

import { mkdirSync, rmSync, readFileSync, readdirSync, statSync, writeFileSync, watch as fsWatch } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { paths } from "./paths.ts";
import { log, style, duration, plural } from "./log.ts";
import { renderFigures, writeIfChanged } from "./build/figures.ts";
import { writeTables } from "./build/tables.ts";
import { describe, versionInfo, writeVersion } from "./build/version.ts";
import {
  changelogSection, commitAndTag, currentVersion, nextVersion, preflight,
  promoteUnreleased, ReleaseError, setPackageVersion, type Bump,
} from "./build/release.ts";
import { compile, typstAvailable, typstVersion, watch as typstWatch } from "./build/typst.ts";
import { loadSources } from "./research/store.ts";
import { toHayagriva } from "./research/hayagriva.ts";
import {
  audit, countBySeverity, findDuplicatePlacements, findFigureUses, type Finding,
} from "./research/audit.ts";
import { renderClaimIndex, renderEvidence } from "./research/evidence.ts";
import { lookup, searchCrossref, suggestKey } from "./research/fetch.ts";
import { serializeSource } from "./research/source.ts";
import { loadFigures } from "./figures/registry.ts";
import { lintFigures } from "./figures/lint.ts";
import { verifyFigures } from "./figures/verify.ts";
import { loadOutline } from "./outline/registry.ts";
import { syncOutline, renderOutlineDoc } from "./outline/emit.ts";
import { validateOutline, countOutlineIssues } from "./outline/validate.ts";
import { chapterWords, chapterSources, chapterFigures } from "./outline/define.ts";
import { ArgError, intOption, nearest, pageRangeOption, parseArgs } from "./args.ts";

/** Every flag the CLI understands, so a typo is an error rather than a shrug. */
const SPEC = {
  options: ["pages", "ppi", "key", "tier", "why", "chapter", "entry", "output"],
  flags: ["verbose", "all", "trace", "figures"],
} as const;

// Parsing happens before the command runs, so its errors need their own
// handler — the one around `run()` below is not reached yet.
function parseOrExit(): ReturnType<typeof parseArgs> {
  try {
    return parseArgs(process.argv.slice(2), SPEC);
  } catch (err) {
    if (err instanceof ReleaseError) {
      log.error(err.message);
      if (err.remedy) log.detail(err.remedy);
    } else if (err instanceof ArgError) {
      log.error(err.message);
      if (err.suggestion) log.detail(`did you mean --${err.suggestion}?`);
      log.detail(`options: ${SPEC.options.map((o) => "--" + o).join(", ")}`);
      log.detail(`flags:   ${SPEC.flags.map((f) => "--" + f).join(", ")}`);
      process.exit(1);
    }
    throw err;
  }
}

const args = parseOrExit();
const command = args.command;
const rest = args.positionals;
const flag = (name: string): boolean => args.flags.has(name);
const option = (name: string): string | undefined => args.options.get(name);
const positionals = (): readonly string[] => args.positionals;

const today = (): string => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Bibliography sync
// ---------------------------------------------------------------------------

function syncBibliography(quiet = false): number {
  const store = loadSources();
  mkdirSync(paths.buildResearch, { recursive: true });
  const file = join(paths.buildResearch, "bibliography.yml");
  const changed = writeIfChanged(file, toHayagriva(store));
  if (!quiet) {
    log.ok(`bibliography: ${plural(store.sources.length, "source")}, ${plural(store.claims.size, "claim")}${changed ? "" : style.grey(" (unchanged)")}`);
  }
  return store.sources.length;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdFigures(): Promise<void> {
  const started = performance.now();
  const { rendered } = await renderFigures(positionals());
  const changed = rendered.filter((r) => r.changed);
  const bytes = rendered.reduce((s, r) => s + r.bytes, 0);

  if (flag("verbose")) {
    for (const r of rendered.sort((a, b) => b.ms - a.ms)) {
      const mark = r.changed ? style.green("updated") : style.grey("cached ");
      log.detail(`${mark} ${r.id.padEnd(34)} ${String(Math.round(r.widthPt)).padStart(4)}x${String(Math.round(r.heightPt)).padEnd(4)} pt  ${(r.bytes / 1024).toFixed(0).padStart(4)} kB  ${duration(r.ms)}`);
    }
  }
  log.ok(
    `figures: ${plural(rendered.length, "figure")} rendered, ${changed.length} changed, ` +
    `${(bytes / 1024).toFixed(0)} kB total in ${duration(performance.now() - started)}`,
  );
}

async function cmdBuild(): Promise<void> {
  const started = performance.now();
  if (!typstAvailable()) {
    log.error("typst is not on PATH. Install it with `brew install typst`.");
    process.exitCode = 1;
    return;
  }

  await cmdFigures();
  writeTables();
  log.ok("reference tables regenerated");
  const v = writeVersion();
  log.ok(`stamped ${describe(v)}`);
  syncBibliography();

  log.step("compiling");
  const res = compile({ pages: pageRangeOption(args) });
  if (res.output) console.log(res.output);
  if (!res.ok) {
    log.error(`typst failed after ${duration(res.ms)}`);
    process.exitCode = 1;
    return;
  }
  const size = statSync(res.pdf).size;
  log.ok(`${relative(paths.root, res.pdf)} — ${(size / 1024 / 1024).toFixed(2)} MB in ${duration(res.ms)}`);
  log.detail(`total ${duration(performance.now() - started)}`);
}

async function cmdProof(): Promise<void> {
  const { figures } = await renderFigures();
  writeTables();
  syncBibliography(true);

  // `--figures` proofs the figures alone, one per page, which is the right view
  // when you are working on a diagram rather than on the page it sits in.
  let entry: string | undefined;
  if (flag("figures")) {
    mkdirSync(join(paths.book, "dev"), { recursive: true });
    const sheet = [
      '#import "/book/lib/book.typ": *',
      "// Generated by `node engine/cli.ts proof --figures`.",
      '#show: book.with(title: "Figure proof", author: "proof")',
      "#chapter(none)[Figure proof sheet]",
      "",
      ...[...figures]
        .sort((a, b) => a.chapter.localeCompare(b.chapter) || a.id.localeCompare(b.id))
        .flatMap((f) => [`== ${f.chapter} · ${f.id}`, `#fig("${f.id}")`, "#pagebreak(weak: true)", ""]),
    ].join("\n");
    entry = join(paths.book, "dev", "proof.typ");
    writeIfChanged(entry, sheet);
  }

  const res = compile({
    ...(entry ? { entry } : {}),
    png: true,
    pages: pageRangeOption(args) ?? (flag("figures") ? undefined : "1-6"),
    ppi: intOption(args, "ppi", 150),
  });
  if (res.output) console.log(res.output);
  if (!res.ok) { process.exitCode = 1; return; }
  log.ok(`proof pages written to ${relative(paths.root, paths.build)}/proof-*.png`);
}

async function cmdWatch(): Promise<void> {
  if (!typstAvailable()) {
    log.error("typst is not on PATH.");
    process.exitCode = 1;
    return;
  }
  await renderFigures();
  writeTables();
  writeVersion();
  syncBibliography();

  log.step(`watching ${style.bold("figures/")}, ${style.bold("engine/")} and ${style.bold("research/")}`);

  // Re-rendering happens in a child process, not in this one.
  //
  // ES module imports are cached for the life of a process and there is no way
  // to evict them. Re-running `renderFigures()` in-process would therefore keep
  // serving the figure modules as they were at startup — and worse, editing a
  // shared module like the theme would not reload either, since the figure's
  // transitive imports are cached too. A fresh process gets a fresh module
  // graph, which costs about a tenth of a second and is always right.
  let running = false;
  let queued = false;
  let pending: NodeJS.Timeout | undefined;

  const rerender = () => {
    if (running) { queued = true; return; }
    running = true;
    const started = performance.now();
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "figures"], {
      cwd: paths.root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    child.stdout?.on("data", (d: Buffer) => { out += d.toString(); });
    child.stderr?.on("data", (d: Buffer) => { out += d.toString(); });
    child.on("close", (code) => {
      running = false;
      if (code === 0) {
        const summary = /figures: ([^\n]+)/.exec(out)?.[1];
        log.ok(`${summary ?? "figures rebuilt"} ${style.grey(`(${duration(performance.now() - started)})`)}`);
        try {
          writeTables();
          syncBibliography(true);
        } catch (err) {
          log.error(String((err as Error).message ?? err));
        }
      } else {
        log.error("figure rebuild failed");
        console.log(out.trim());
      }
      if (queued) { queued = false; rerender(); }
    });
  };

  const schedule = () => {
    clearTimeout(pending);
    pending = setTimeout(rerender, 80);
  };

  for (const dir of [paths.figures, join(paths.root, "engine"), paths.research]) {
    try {
      fsWatch(dir, { recursive: true }, (_event, name) => {
        // Editors write temporary files constantly; only react to sources.
        if (name && !/\.(ts|md|csv|txt)$/.test(name)) return;
        schedule();
      });
    } catch {
      log.warn(`cannot watch ${relative(paths.root, dir)}`);
    }
  }

  const child = typstWatch();
  const stop = () => { child.kill(); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

function reportFindings(findings: Finding[]): boolean {
  const counts = countBySeverity(findings);
  const mark = { error: style.red("error"), warning: style.yellow("warn "), info: style.grey("info ") };
  const show = flag("all") ? findings : findings.filter((f) => f.severity !== "info");
  for (const f of show) {
    console.log(`  ${mark[f.severity]} ${style.grey(f.code.padEnd(22))} ${f.message}`);
    if (f.where) log.detail(`      ${f.where}`);
  }
  if (counts.info && !flag("all")) log.detail(`${plural(counts.info, "note")} hidden; pass --all to see them`);
  return counts.error === 0;
}

async function cmdCheck(): Promise<void> {
  let ok = true;

  log.step("typecheck");
  const tsc = spawnSync("npx", ["--no-install", "tsc", "--noEmit"], { cwd: paths.root, encoding: "utf8" });
  if (tsc.status === 0) {
    log.ok("types clean");
  } else if (tsc.error || /not found|could not determine/i.test(`${tsc.stderr}`)) {
    log.warn("typescript is not installed; run `npm install` to enable typechecking");
  } else {
    console.log(`${tsc.stdout ?? ""}${tsc.stderr ?? ""}`.trim());
    log.error("typecheck failed");
    ok = false;
  }

  log.step("tests");
  const test = spawnSync("node", ["--test", "engine/test/*.test.ts"], { cwd: paths.root, encoding: "utf8" });
  const out = `${test.stdout ?? ""}${test.stderr ?? ""}`;
  const passed = /^.?\s*(?:#|ℹ)\s*pass (\d+)/m.exec(out)?.[1] ?? "?";
  const failed = /^.?\s*(?:#|ℹ)\s*fail (\d+)/m.exec(out)?.[1] ?? "?";
  if (test.status === 0) {
    log.ok(`${passed} tests passed`);
  } else {
    console.log(out);
    log.error(`${failed} tests failed`);
    ok = false;
  }

  log.step("figures");
  const loaded = await loadFigures();
  const figures = loaded.map((f) => f.def);
  const figureIds = new Set(figures.map((f) => f.id));

  // Renders every figure, which checks both that it *can* render and that it
  // renders at the width it is placed at.
  for (const issue of verifyFigures(loaded.map((l) => ({ def: l.def, file: l.file })))) {
    const line = `figure "${issue.figure}" [${issue.code}] ${issue.message}`;
    if (issue.severity === "error") { log.error(line); ok = false; } else { log.warn(line); }
  }
  const uses = findFigureUses();
  for (const u of uses) {
    if (!figureIds.has(u.id)) {
      log.error(`${u.file}:${u.line} references unknown figure "${u.id}"`);
      ok = false;
    }
  }
  const captionIssues = lintFigures(figures);
  for (const issue of captionIssues) {
    log.error(`figure "${issue.figure}" [${issue.code}] ${issue.message}`);
    ok = false;
  }

  for (const dup of findDuplicatePlacements(uses)) {
    log.error(
      `figure "${dup.id}" is placed ${dup.at.length} times — it should be placed once ` +
      `and referred to with #figref() elsewhere`,
    );
    for (const at of dup.at) log.detail(`${at.file}:${at.line}`);
    ok = false;
  }

  const placements = uses.filter((u) => u.kind === "place");
  const refs = uses.filter((u) => u.kind === "ref");
  const placed = new Set(placements.map((u) => u.id));
  for (const r of refs) {
    if (!placed.has(r.id)) {
      log.error(`${r.file}:${r.line} refers to figure "${r.id}", which is never placed`);
      ok = false;
    }
  }

  const orphans = figures.filter((f) => !placed.has(f.id));
  log.ok(
    `${plural(figures.length, "figure")} defined, ${plural(placements.length, "placement")}, ` +
    `${plural(refs.length, "cross-reference")}${orphans.length ? style.grey(`, ${orphans.length} not yet placed`) : ""}`,
  );
  if (orphans.length && flag("all")) for (const o of orphans) log.detail(`unplaced: ${o.id}`);

  log.step("outline");
  try {
    const outline = await loadOutline();
    let sourceKeys = new Set<string>();
    try { sourceKeys = new Set(loadSources().byKey.keys()); } catch { /* reported below */ }
    const issues = validateOutline(outline, { figureIds, sourceKeys });
    const counts = countOutlineIssues(issues);
    for (const i of issues.filter((x) => x.severity === "error")) {
      log.error(`${i.where} [${i.code}] ${i.message}`);
      ok = false;
    }
    for (const i of issues.filter((x) => x.severity === "warning")) {
      log.warn(`${i.where} [${i.code}] ${i.message}`);
    }
    const words = outline.chapters.reduce((n, c) => n + chapterWords(c.chapter), 0);
    log.ok(
      `${plural(outline.chapters.length, "chapter")} in ${plural(outline.parts.length, "part")}, ` +
      `${plural(outline.chapters.reduce((n, c) => n + c.chapter.sections.length, 0), "section")}, ` +
      `${words.toLocaleString()} planned words — ${counts.error} errors, ${counts.warning} warnings`,
    );
  } catch (err) {
    log.error(String((err as Error).message ?? err));
    ok = false;
  }

  log.step("citations");
  try {
    const store = loadSources();
    const findings = audit(store, figures);
    if (!reportFindings(findings)) ok = false;
    const counts = countBySeverity(findings);
    log.ok(`${plural(store.sources.length, "source")}, ${plural(store.claims.size, "distilled claim")} — ${counts.error} errors, ${counts.warning} warnings`);
  } catch (err) {
    log.error(String((err as Error).message ?? err));
    ok = false;
  }

  log.blank();
  if (ok) log.ok(style.bold("all checks passed"));
  else { log.error(style.bold("checks failed")); process.exitCode = 1; }
}

// --- cite ------------------------------------------------------------------

async function cmdCite(): Promise<void> {
  const sub = rest[0] ?? "list";
  const subArgs = rest.slice(1);

  switch (sub) {
    case "sync":
      syncBibliography();
      return;

    case "list": {
      const store = loadSources();
      const rows = [...store.sources].sort((a, b) => a.key.localeCompare(b.key));
      for (const s of rows) {
        const tier = s.tier === "primary" ? style.green("primary  ") : s.tier === "secondary" ? style.grey("secondary") : style.grey("tertiary ");
        console.log(
          `  ${style.bold(s.key.padEnd(30))} ${tier} ${String(s.claims.length).padStart(2)} claims  ${s.title.slice(0, 54)}`,
        );
      }
      log.blank();
      log.ok(`${plural(rows.length, "source")}, ${plural(store.claims.size, "claim")}`);
      return;
    }

    case "show": {
      const key = subArgs[0];
      if (!key) { log.error("usage: cite show <key>"); process.exitCode = 1; return; }
      const store = loadSources();
      const s = store.byKey.get(key);
      if (!s) { log.error(`no source "${key}"`); process.exitCode = 1; return; }
      console.log(readFileSync(join(paths.root, s.file), "utf8"));
      return;
    }

    case "search": {
      const query = subArgs.join(" ");
      if (!query) { log.error("usage: cite search <words>"); process.exitCode = 1; return; }
      const hits = await searchCrossref(query);
      for (const h of hits) {
        console.log(`  ${style.bold(h.doi)}`);
        log.detail(`${h.authors || "?"} (${h.year ?? "?"}) ${h.title}`);
      }
      return;
    }

    case "add": {
      const id = subArgs[0];
      if (!id) { log.error("usage: cite add <doi|arxiv-id|url> [--key my-key] [--tier primary]"); process.exitCode = 1; return; }
      log.step(`looking up ${id}`);
      const meta = await lookup(id);
      const key = option("key") ?? suggestKey(meta);
      const file = join(paths.research, "sources", `${key}.md`);
      mkdirSync(join(paths.research, "sources"), { recursive: true });
      try {
        statSync(file);
        log.error(`${relative(paths.root, file)} already exists`);
        process.exitCode = 1;
        return;
      } catch { /* good, it is new */ }

      const record = serializeSource({
        key,
        type: meta.type,
        title: meta.title,
        authors: meta.authors,
        year: meta.year,
        journal: meta.journal,
        publisher: meta.publisher,
        volume: meta.volume,
        issue: meta.issue,
        pages: meta.pages,
        doi: meta.doi,
        isbn: meta.isbn,
        url: meta.url,
        accessed: meta.type === "web" ? today() : undefined,
        tier: (option("tier") as "primary" | "secondary" | "tertiary") ?? "secondary",
        rationale: option("why"),
      });
      writeFileSync(file, record);
      log.ok(`wrote ${relative(paths.root, file)}`);
      log.detail(`retrieved from ${meta.retrievedFrom}`);
      log.detail("now fill in 'Why it matters' and distil at least one claim");
      return;
    }

    case "check": {
      const store = loadSources();
      const figures = (await loadFigures()).map((f) => f.def);
      const findings = audit(store, figures);
      const ok = reportFindings(findings);
      const counts = countBySeverity(findings);
      log.blank();
      if (ok) log.ok(`${counts.warning} warnings, no errors`);
      else { log.error(`${counts.error} errors`); process.exitCode = 1; }
      return;
    }

    default:
      log.error(`unknown cite subcommand "${sub}" (sync, list, show, search, add, check)`);
      process.exitCode = 1;
  }
}

async function cmdResearch(): Promise<void> {
  const sub = rest[0] ?? "evidence";
  const store = loadSources();
  const figures = (await loadFigures()).map((f) => f.def);
  mkdirSync(paths.buildResearch, { recursive: true });

  if (sub === "evidence") {
    const file = join(paths.buildResearch, "evidence.md");
    writeFileSync(file, renderEvidence(store, figures));
    log.ok(`wrote ${relative(paths.root, file)}`);
    return;
  }
  if (sub === "claims") {
    const file = join(paths.buildResearch, "claims.md");
    writeFileSync(file, renderClaimIndex(store));
    log.ok(`wrote ${relative(paths.root, file)}`);
    return;
  }
  log.error(`unknown research subcommand "${sub}" (evidence, claims)`);
  process.exitCode = 1;
}

// --- scaffolding -----------------------------------------------------------

function cmdNew(): void {
  const kind = rest[0];
  const name = rest[1];
  if (!kind || !name) {
    log.error("usage: new <chapter|figure|source> <name>");
    process.exitCode = 1;
    return;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  if (kind === "figure") {
    const chapter = option("chapter") ?? "ch01";
    const file = join(paths.figures, chapter, `${slug}.fig.ts`);
    mkdirSync(join(paths.figures, chapter), { recursive: true });
    writeFileSync(file, figureTemplate(slug, chapter));
    log.ok(`wrote ${relative(paths.root, file)}`);
    return;
  }

  if (kind === "source") {
    const file = join(paths.research, "sources", `${slug}.md`);
    mkdirSync(join(paths.research, "sources"), { recursive: true });
    writeFileSync(file, serializeSource({
      key: slug, type: "book", title: "TODO", authors: [], tier: "secondary",
    }));
    log.ok(`wrote ${relative(paths.root, file)} — prefer \`cite add <doi>\` when there is an identifier`);
    return;
  }

  if (kind === "chapter") {
    const file = join(paths.book, "parts", `${slug}.typ`);
    writeFileSync(file, `#import "../lib/book.typ": *\n\n= TODO title\n\n#lead[One-paragraph opening.]\n\n== First section\n\nTODO\n`);
    log.ok(`wrote ${relative(paths.root, file)} — add it to book/main.typ`);
    return;
  }

  log.error(`unknown kind "${kind}"`);
  process.exitCode = 1;
}

const figureTemplate = (id: string, chapter: string): string => `import { defineFigure } from "../../engine/figures/define.ts";
import { Plot } from "../../engine/draw/plot.ts";
import { theme } from "../../engine/draw/theme.ts";

export default defineFigure({
  id: "${id}",
  chapter: "${chapter}",
  title: "TODO short title",
  caption: "TODO caption. Typst markup is allowed here.",
  claim: "TODO: the one thing this figure demonstrates.",
  sources: [],
  placement: "column",
  render() {
    const p = new Plot({
      width: theme.widths.column,
      height: 170,
      x: { domain: [0, 1], label: "x" },
      y: { domain: [0, 1], label: "y" },
      grid: "y",
    });
    p.line([[0, 0], [1, 1]]);
    return p.document();
  },
});
`;

// --- stats -----------------------------------------------------------------

async function cmdStats(): Promise<void> {
  const countWords = (file: string): number => {
    const src = readFileSync(file, "utf8")
      .replace(/^#import[^\n]*$/gm, " ")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/#[a-zA-Z][\w-]*(\([^)]*\))?/g, " ");
    return (src.match(/[A-Za-z][A-Za-z'-]+/g) ?? []).length;
  };

  const chapters: Array<{ name: string; words: number }> = [];
  const walk = (dir: string) => {
    let entries: string[];
    try { entries = readdirSync(dir); } catch { return; }
    for (const name of entries.sort()) {
      if (name === "dev") continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".typ")) chapters.push({ name: relative(paths.book, full), words: countWords(full) });
    }
  };
  walk(paths.book);

  const total = chapters.reduce((s, c) => s + c.words, 0);
  const figures = (await loadFigures()).map((f) => f.def);
  const byChapter = new Map<string, number>();
  for (const f of figures) byChapter.set(f.chapter, (byChapter.get(f.chapter) ?? 0) + 1);

  log.info(style.bold("words"));
  for (const c of chapters.filter((c) => c.words > 0).sort((a, b) => b.words - a.words)) {
    console.log(`  ${String(c.words).padStart(6)}  ${c.name}`);
  }
  log.blank();
  log.info(style.bold("figures"));
  for (const [ch, n] of [...byChapter].sort()) console.log(`  ${String(n).padStart(6)}  ${ch}`);

  let sources = 0, claims = 0;
  try { const s = loadSources(); sources = s.sources.length; claims = s.claims.size; } catch { /* reported by check */ }

  log.blank();
  log.ok(
    `${total.toLocaleString()} words, ${plural(figures.length, "figure")}, ` +
    `${plural(sources, "source")}, ${plural(claims, "distilled claim")}`,
  );
  log.detail(`roughly ${Math.round(total / 400)} typeset pages of prose at 400 words a page`);
}

/** Print one version's changelog section. Used by the release workflow. */
function cmdChangelog(): void {
  const version = rest[0];
  if (!version) { log.error("usage: changelog <version|tag>"); process.exitCode = 1; return; }
  console.log(changelogSection(version));
}

/**
 * Cut a release: verify, promote the changelog, bump, commit, tag.
 * Deliberately does not push — the tag is the trigger, and pushing it should be
 * a separate, conscious act.
 */
async function cmdRelease(): Promise<void> {
  const bump = (rest[0] ?? "patch") as Bump;
  if (!["major", "minor", "patch"].includes(bump)) {
    log.error(`usage: release <major|minor|patch>  (got "${bump}")`);
    process.exitCode = 1;
    return;
  }

  log.step("preflight");
  preflight();
  log.ok("clean tree on main");

  await cmdCheck();
  if (process.exitCode) {
    log.error("checks failed; nothing was tagged");
    return;
  }

  const from = currentVersion();
  const to = nextVersion(from, bump);
  log.step(`${from} -> ${to}`);

  const notes = promoteUnreleased(to);
  setPackageVersion(to);
  const tag = commitAndTag(to, notes);

  log.blank();
  log.ok(`tagged ${style.bold(tag)}`);
  log.detail("release notes:");
  for (const line of notes.split("\n")) log.detail(`  ${line}`);
  log.blank();
  log.info(`Push it when you are ready:  ${style.bold(`git push origin main ${tag}`)}`);
  log.detail("CI will build the PDF and publish the GitHub release.");
}

/**
 * The outline: per-chapter declarations under `outline/`.
 *
 *   outline            a table of the whole book
 *   outline show <id>  one chapter in full
 *   outline sync       regenerate book/parts and book/main.typ
 *   outline check      validate without writing anything
 */
async function cmdOutline(): Promise<void> {
  const sub = rest[0] ?? "list";
  const outline = await loadOutline();

  if (sub === "list") {
    let part = "";
    let total = 0;
    for (const { chapter } of outline.chapters) {
      if (chapter.part !== part) {
        part = chapter.part;
        const p = outline.parts.find((x) => x.number === part)!;
        log.blank();
        console.log(`  ${style.grey(`Part ${p.number}`)} ${style.bold(p.title)}`);
      }
      const words = chapterWords(chapter);
      total += words;
      const mark = chapter.status === "outline"
        ? style.grey("outline ")
        : chapter.status === "drafting" ? style.yellow("drafting") : style.green("written ");
      console.log(
        `    ${String(chapter.number).padStart(2)}  ${mark} ${chapter.title.slice(0, 46).padEnd(47)}` +
        `${String(chapter.sections.length).padStart(2)} §  ${words.toLocaleString().padStart(7)} w`,
      );
    }
    log.blank();
    log.ok(
      `${plural(outline.chapters.length, "chapter")} in ${plural(outline.parts.length, "part")}, ` +
      `${plural(outline.chapters.reduce((n, c) => n + c.chapter.sections.length, 0), "section")}, ` +
      `${total.toLocaleString()} planned words`,
    );
    return;
  }

  if (sub === "show") {
    const id = rest[1];
    const found = outline.chapters.find((c) => c.chapter.id === id || String(c.chapter.number) === id);
    if (!found) { log.error(`no chapter "${id}"`); process.exitCode = 1; return; }
    const c = found.chapter;
    log.blank();
    console.log(`  ${style.bold(`${c.number}. ${c.title}`)}  ${style.grey(`part ${c.part} · ${c.status}`)}`);
    if (c.epigraph) {
      log.blank();
      log.detail(`"${c.epigraph.text.trim().replace(/\s+/g, " ")}"`);
      if (c.epigraph.source) log.detail(`   — ${c.epigraph.source}${c.epigraph.unverified ? " (UNVERIFIED)" : ""}`);
    }
    log.blank();
    log.detail(c.lead.trim().replace(/\s+/g, " "));
    log.blank();
    for (const s of c.sections) {
      console.log(`    ${String(s.words).padStart(5)} w  ${style.bold(s.title)}`);
      log.detail(`           ${s.argument.trim().replace(/\s+/g, " ")}`);
      if (s.figures?.length) log.detail(`           figures: ${s.figures.join(", ")}`);
      if (s.sources?.length) log.detail(`           sources: ${s.sources.join(", ")}`);
    }
    log.blank();
    log.ok(`${chapterWords(c).toLocaleString()} words · ${chapterFigures(c).length} figures · ${chapterSources(c).length} sources`);
    return;
  }

  if (sub === "docs") {
    const file = join(paths.root, "docs", "outline.md");
    writeIfChanged(file, renderOutlineDoc(outline));
    log.ok(`wrote ${relative(paths.root, file)}`);
    return;
  }

  if (sub === "sync" || sub === "check") {
    const figures = (await loadFigures()).map((f) => f.def);
    const figureIds = new Set(figures.map((f) => f.id));
    let sourceKeys = new Set<string>();
    try { sourceKeys = new Set(loadSources().byKey.keys()); } catch { /* reported by cite check */ }

    const issues = validateOutline(outline, { figureIds, sourceKeys });
    const counts = countOutlineIssues(issues);
    const mark = { error: style.red("error"), warning: style.yellow("warn "), info: style.grey("info ") };
    for (const i of flag("all") ? issues : issues.filter((x) => x.severity !== "info")) {
      console.log(`  ${mark[i.severity]} ${style.grey(i.code.padEnd(22))} ${i.message}`);
      log.detail(`      ${i.where}`);
    }
    if (counts.info && !flag("all")) log.detail(`${plural(counts.info, "note")} hidden; pass --all`);

    if (counts.error > 0) {
      log.error(`${plural(counts.error, "error")} — nothing written`);
      process.exitCode = 1;
      return;
    }

    if (sub === "check") {
      log.ok(`outline valid — ${counts.warning} warnings`);
      return;
    }

    const result = syncOutline(outline, figureIds);
    for (const s of result.skipped) log.detail(`left alone: ${s.id} (${s.status})`);
    log.ok(
      `outline synced — ${plural(result.written.length, "file")} written, ` +
      `${result.unchanged.length} unchanged, ${result.skipped.length} hand-written`,
    );
    return;
  }

  log.error(`unknown outline subcommand "${sub}" (list, show, sync, check, docs)`);
  process.exitCode = 1;
}

function cmdClean(): void {
  rmSync(paths.build, { recursive: true, force: true });
  log.ok("removed build/");
}

function cmdHelp(): void {
  const lines = [
    style.bold("code-as-color") + style.grey("  — the book's build system"),
    "",
    `  ${style.bold("build")}                 figures + bibliography + PDF`,
    `  ${style.bold("figures")} [id...]       render figures  ${style.grey("--verbose")}`,
    `  ${style.bold("watch")}                 rebuild on change, keep Typst watching`,
    `  ${style.bold("proof")}                 render pages to PNG  ${style.grey("--pages 1-6 --ppi 150 --figures")}`,
    `  ${style.bold("check")}                 types, tests, figures and citations  ${style.grey("--all")}`,
    "",
    `  ${style.bold("cite add")} <doi|url>    look up metadata and write a source record`,
    `  ${style.bold("cite search")} <words>   search Crossref by title`,
    `  ${style.bold("cite list")}             what is in the store`,
    `  ${style.bold("cite show")} <key>       print one record`,
    `  ${style.bold("cite check")}            audit citations, claims and staleness`,
    `  ${style.bold("cite sync")}             regenerate the Typst bibliography`,
    "",
    `  ${style.bold("research evidence")}     per-chapter evidence sheets`,
    `  ${style.bold("research claims")}       the full claim index`,
    "",
    `  ${style.bold("new")} chapter|figure|source <name>`,
    `  ${style.bold("tables")}                regenerate the derived-matrix appendix`,
    `  ${style.bold("outline")}               list · show <id> · sync · check · docs`,
    `  ${style.bold("stats")}                 words, figures, sources`,
    `  ${style.bold("version")}               print and stamp the build identity`,
    `  ${style.bold("release")} <major|minor|patch>   verify, bump, changelog, tag`,
    `  ${style.bold("changelog")} <version>   print one section of CHANGELOG.md`,
    `  ${style.bold("clean")}                 remove build/`,
    "",
    style.grey(`  node ${typstAvailable() ? typstVersion() : "typst not found"}`),
  ];
  console.log(lines.join("\n"));
}

// ---------------------------------------------------------------------------

const commands: Record<string, () => void | Promise<void>> = {
  build: cmdBuild,
  figures: cmdFigures,
  watch: cmdWatch,
  proof: cmdProof,
  check: cmdCheck,
  cite: cmdCite,
  research: cmdResearch,
  new: cmdNew,
  stats: cmdStats,
  tables: () => { writeTables(); log.ok("wrote build/tables/matrices.typ"); },
  version: () => { const v = writeVersion(); log.ok(describe(v)); log.detail(JSON.stringify(v, null, 2)); },
  outline: cmdOutline,
  changelog: cmdChangelog,
  release: cmdRelease,
  clean: cmdClean,
  help: cmdHelp,
};

const run = commands[command];
if (!run) {
  const guess = nearest(command, Object.keys(commands));
  log.error(`unknown command "${command}"${guess ? ` — did you mean "${guess}"?` : ""}`);
  cmdHelp();
  process.exitCode = 1;
} else {
  try {
    await run();
  } catch (err) {
    if (err instanceof ReleaseError) {
      log.error(err.message);
      if (err.remedy) log.detail(err.remedy);
    } else if (err instanceof ArgError) {
      log.error(err.message);
      if (err.suggestion) log.detail(`did you mean --${err.suggestion}?`);
    } else {
      log.error(String((err as Error)?.message ?? err));
    }
    if (flag("trace")) console.error(err);
    process.exitCode = 1;
  }
}
