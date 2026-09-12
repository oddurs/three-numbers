import { test } from "node:test";
import assert from "node:assert/strict";
import { ArgError, intOption, nearest, pageRangeOption, parseArgs } from "../args.ts";

const SPEC = { options: ["pages", "ppi", "key"], flags: ["verbose", "all"] } as const;
const parse = (line: string) => parseArgs(line.split(" ").filter(Boolean), SPEC);

test("splits command, positionals, flags and options", () => {
  const a = parse("figures one two --verbose --ppi 150");
  assert.equal(a.command, "figures");
  assert.deepEqual([...a.positionals], ["one", "two"]);
  assert.ok(a.flags.has("verbose"));
  assert.equal(a.options.get("ppi"), "150");
});

test("a positional that happens to equal an option value is still a positional", () => {
  // The bug this parser replaced: identifying values by searching the argument
  // list meant `foo` here was classified as the value of --pages and dropped.
  const a = parse("figures foo --pages foo");
  assert.deepEqual([...a.positionals], ["foo"]);
  assert.equal(a.options.get("pages"), "foo");
});

test("an option cannot swallow the next flag", () => {
  assert.throws(() => parse("proof --pages --verbose"), (e: Error) => e instanceof ArgError && /needs a value/.test(e.message));
  assert.throws(() => parse("proof --ppi"), (e: Error) => e instanceof ArgError);
});

test("--name=value is accepted", () => {
  const a = parse("proof --ppi=300 --pages=1-4");
  assert.equal(a.options.get("ppi"), "300");
  assert.equal(a.options.get("pages"), "1-4");
});

test("a flag rejects an inline value", () => {
  assert.throws(() => parse("check --all=yes"), (e: Error) => /takes no value/.test(e.message));
});

test("unknown flags are an error, with a suggestion", () => {
  try {
    parse("figures --verbos");
    assert.fail("should have thrown");
  } catch (err) {
    assert.ok(err instanceof ArgError);
    assert.match(err.message, /unknown flag --verbos/);
    assert.equal(err.suggestion, "verbose");
  }
});

test("-- ends option parsing", () => {
  const a = parse("figures -- --verbose");
  assert.deepEqual([...a.positionals], ["--verbose"]);
  assert.equal(a.flags.size, 0);
});

test("repeated options take the last value", () => {
  assert.equal(parse("proof --ppi 100 --ppi 200").options.get("ppi"), "200");
});

test("no arguments defaults to help", () => {
  assert.equal(parseArgs([], SPEC).command, "help");
});

test("intOption validates", () => {
  assert.equal(intOption(parse("proof --ppi 300"), "ppi", 150), 300);
  assert.equal(intOption(parse("proof"), "ppi", 150), 150);
  for (const bad of ["0", "-3", "1.5", "abc"]) {
    assert.throws(() => intOption(parse(`proof --ppi ${bad}`), "ppi", 150), ArgError, `should reject ${bad}`);
  }
});

test("pageRangeOption validates Typst page syntax", () => {
  assert.equal(pageRangeOption(parse("proof --pages 1-6")), "1-6");
  assert.equal(pageRangeOption(parse("proof --pages 3,7-9")), "3,7-9");
  assert.equal(pageRangeOption(parse("proof")), undefined);
  for (const bad of ["banana", "1-", "-4", "1..6"]) {
    assert.throws(() => pageRangeOption(parse(`proof --pages ${bad}`)), ArgError, `should reject ${bad}`);
  }
});

test("nearest finds a close word and gives up on a distant one", () => {
  assert.equal(nearest("figuers", ["figures", "check", "build"]), "figures");
  assert.equal(nearest("zzzzzzzz", ["figures", "check", "build"]), undefined);
});
