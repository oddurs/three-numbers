/**
 * Cutting a release.
 *
 * A release of a book is not a release of a library: the thing being versioned
 * is a document people will quote page numbers from. So the rules are stricter
 * than for code — the tree must be clean, the checks must pass, and the
 * changelog must already say what changed. Nothing here writes prose for you.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { paths } from "../paths.ts";

export type Bump = "major" | "minor" | "patch";

export interface ReleasePlan {
  readonly from: string;
  readonly to: string;
  readonly tag: string;
  readonly notes: string;
}

export class ReleaseError extends Error {
  readonly remedy: string | undefined;
  constructor(message: string, remedy?: string) {
    super(message);
    this.name = "ReleaseError";
    this.remedy = remedy;
  }
}

const run = (...args: string[]): string => {
  const res = spawnSync(args[0]!, args.slice(1), { cwd: paths.root, encoding: "utf8" });
  if (res.status !== 0) {
    throw new ReleaseError(`${args.join(" ")} failed: ${(res.stderr || res.stdout || "").trim()}`);
  }
  return res.stdout.trim();
};

export const currentVersion = (): string =>
  JSON.parse(readFileSync(join(paths.root, "package.json"), "utf8")).version ?? "0.0.0";

export function nextVersion(version: string, bump: Bump): string {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!m) throw new ReleaseError(`cannot parse version "${version}"`);
  const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * The section of the changelog for one version.
 *
 * Used by the release workflow to build the GitHub release body, so release
 * notes are written once, in the changelog, by a human.
 */
export function changelogSection(version: string): string {
  const wanted = version.replace(/^v/, "");
  const text = readFileSync(join(paths.root, "CHANGELOG.md"), "utf8");
  const lines = text.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^##\\s+\\[?${wanted.replace(/\./g, "\\.")}\\]?`).test(l));
  if (start < 0) {
    throw new ReleaseError(
      `CHANGELOG.md has no section for ${wanted}`,
      "add a `## [x.y.z] - YYYY-MM-DD` heading describing what changed",
    );
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s+/.test(l));
  const body = (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
  if (!body) throw new ReleaseError(`the ${wanted} changelog section is empty`);
  return body;
}

/** Everything that must be true before a tag is created. */
export function preflight(): void {
  const dirty = run("git", "status", "--porcelain");
  if (dirty) {
    throw new ReleaseError(
      "the working tree has uncommitted changes",
      "commit or stash them — a release must be reproducible from its tag",
    );
  }
  const branch = run("git", "rev-parse", "--abbrev-ref", "HEAD");
  if (branch !== "main") {
    throw new ReleaseError(`on branch "${branch}", not main`, "release from main");
  }
}

/**
 * Move the `Unreleased` section into a dated version section.
 * Returns the notes that were promoted.
 */
export function promoteUnreleased(version: string, date = new Date().toISOString().slice(0, 10)): string {
  const file = join(paths.root, "CHANGELOG.md");
  const text = readFileSync(file, "utf8");
  const marker = "## [Unreleased]";
  const at = text.indexOf(marker);
  if (at < 0) throw new ReleaseError("CHANGELOG.md has no `## [Unreleased]` section");

  const after = text.slice(at + marker.length);
  const nextHeading = after.search(/\n##\s+/);
  const body = (nextHeading < 0 ? after : after.slice(0, nextHeading)).trim();
  if (!body) {
    throw new ReleaseError(
      "the Unreleased section is empty",
      "write down what changed before tagging it",
    );
  }

  const updated =
    text.slice(0, at) +
    `${marker}\n\n## [${version}] - ${date}\n\n${body}\n` +
    (nextHeading < 0 ? "" : after.slice(nextHeading));
  writeFileSync(file, updated);
  return body;
}

export function setPackageVersion(version: string): void {
  const file = join(paths.root, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
  pkg["version"] = version;
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

export function commitAndTag(version: string, notes: string): string {
  const tag = `v${version}`;
  run("git", "add", "CHANGELOG.md", "package.json");
  run("git", "commit", "-m", `chore(release): ${tag}`);
  run("git", "tag", "-a", tag, "-m", `Three Numbers ${tag}\n\n${notes}`);
  return tag;
}
