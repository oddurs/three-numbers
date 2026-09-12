import { test } from "node:test";
import assert from "node:assert/strict";
import { loadOutline, loadChapters } from "../outline/registry.ts";
import { validateOutline, countOutlineIssues, type ValidateContext } from "../outline/validate.ts";
import { escapeTypst, deReassure, markupIsBalanced, renderChapter } from "../outline/emit.ts";
import { chapterWords, chapterFigures, chapterSources, defineChapter, isGenerated } from "../outline/define.ts";
import { loadFigures } from "../figures/registry.ts";
import { loadSources } from "../research/store.ts";

// --- The real outline -------------------------------------------------------

test("the outline loads, and its chapters are numbered 1..n without gaps", async () => {
  const { chapters, parts } = await loadOutline();
  assert.ok(chapters.length > 0, "there should be chapters");
  assert.ok(parts.length > 0, "there should be parts");
  chapters.forEach((c, i) => assert.equal(c.chapter.number, i + 1, `chapter at position ${i + 1}`));
});

test("every chapter belongs to a declared part, and parts are contiguous", async () => {
  const { chapters, parts, byPart } = await loadOutline();
  const declared = new Set(parts.map((p) => p.number));
  for (const { chapter, file } of chapters) {
    assert.ok(declared.has(chapter.part), `${file}: part ${chapter.part} is not declared`);
  }
  // Walking in printed order, a part must not be interrupted and resumed.
  const order: string[] = [];
  for (const { chapter } of chapters) {
    if (order.at(-1) !== chapter.part) order.push(chapter.part);
  }
  assert.equal(new Set(order).size, order.length, "a part is interrupted and resumed");
  assert.equal([...byPart.values()].reduce((n, c) => n + c.length, 0), chapters.length);
});

test("the real outline validates against the real figures and sources", async () => {
  const outline = await loadOutline();
  const ctx: ValidateContext = {
    figureIds: new Set((await loadFigures()).map((f) => f.def.id)),
    sourceKeys: new Set(loadSources().byKey.keys()),
  };
  const issues = validateOutline(outline, ctx);
  const errors = issues.filter((i) => i.severity === "error");
  assert.deepEqual(errors, [], `outline errors: ${errors.map((e) => `${e.where} ${e.code}`).join(", ")}`);
});

test("every section states an argument, not a topic", async () => {
  for (const { chapter, file } of await loadChapters()) {
    for (const s of chapter.sections) {
      assert.ok(
        s.argument.trim().length >= 80,
        `${file} · ${s.title}: the argument is too thin to be an argument`,
      );
      assert.ok(s.words > 0, `${file} · ${s.title}: needs a word budget`);
    }
  }
});

test("an unverified epigraph must name what it is quoting", async () => {
  for (const { chapter, file } of await loadChapters()) {
    if (chapter.epigraph?.unverified) {
      assert.ok(chapter.epigraph.source, `${file}: unverified quote with no attribution`);
    }
  }
});

test("derived helpers agree with the declarations", async () => {
  const { chapters } = await loadOutline();
  for (const { chapter } of chapters) {
    const manual = chapter.sections.reduce((n, s) => n + s.words, 0);
    assert.equal(chapterWords(chapter), manual);
    const figs = chapterFigures(chapter);
    assert.equal(new Set(figs).size, figs.length, "figures are de-duplicated");
    const srcs = chapterSources(chapter);
    assert.deepEqual([...srcs].sort(), srcs, "sources come back sorted, for stable output");
  }
});

// --- Validation catches what it is for ---------------------------------------

const base = () =>
  defineChapter({
    id: "ch01",
    number: 1,
    part: "I",
    title: "A Chapter",
    status: "outline",
    lead: "A lead paragraph long enough to say what this chapter is actually for, at length.",
    sections: [
      {
        title: "A section",
        argument: "An argument long enough to count as an argument rather than a bare topic label.",
        words: 1200,
      },
    ],
  });

const fakeOutline = (chapters: ReturnType<typeof base>[]) => ({
  parts: [{ number: "I", title: "One", blurb: "A part." }],
  chapters: chapters.map((chapter) => ({ chapter, file: `outline/${chapter.id}.outline.ts` })),
  byPart: new Map([["I", chapters.map((chapter) => ({ chapter, file: `outline/${chapter.id}.outline.ts` }))]]),
});

const emptyCtx: ValidateContext = { figureIds: new Set(), sourceKeys: new Set() };
const codes = (chapters: ReturnType<typeof base>[], ctx = emptyCtx) =>
  validateOutline(fakeOutline(chapters) as never, ctx).map((i) => i.code);

test("a section citing a source that does not exist is an error", () => {
  const c = { ...base(), sections: [{ ...base().sections[0]!, sources: ["no-such-source"] }] };
  assert.ok(codes([c]).includes("unknown-source"));
  assert.ok(!codes([c], { figureIds: new Set(), sourceKeys: new Set(["no-such-source"]) })
    .includes("unknown-source"));
});

test("a section planning an undrawn figure is a warning, not an error", () => {
  const c = { ...base(), sections: [{ ...base().sections[0]!, figures: ["not-drawn-yet"] }] };
  const issues = validateOutline(fakeOutline([c]) as never, emptyCtx);
  const found = issues.find((i) => i.code === "figure-not-drawn");
  assert.ok(found, "should be reported");
  assert.equal(found.severity, "warning", "planning ahead of the drawing is allowed");
});

test("a thin argument, a missing lead and a duplicate section are errors", () => {
  assert.ok(codes([{ ...base(), sections: [{ title: "x", argument: "Too short.", words: 900 }] }])
    .includes("thin-argument"));
  assert.ok(codes([{ ...base(), lead: "Short." }]).includes("thin-lead"));
  assert.ok(codes([{ ...base(), sections: [] }]).includes("no-sections"));
  const dup = base().sections[0]!;
  assert.ok(codes([{ ...base(), sections: [dup, dup] }]).includes("duplicate-section"));
});

test("numbering gaps are caught", () => {
  const two = { ...base(), id: "ch03", number: 3 };
  assert.ok(codes([base(), two]).includes("numbering-gap"));
});

test("a section that is secretly a chapter is flagged", () => {
  assert.ok(codes([{ ...base(), sections: [{ ...base().sections[0]!, words: 4000 }] }])
    .includes("section-too-long"));
  assert.ok(codes([{ ...base(), sections: [{ ...base().sections[0]!, words: 120 }] }])
    .includes("section-too-short"));
});

test("severity counts add up", () => {
  const issues = validateOutline(fakeOutline([base()]) as never, emptyCtx);
  const c = countOutlineIssues(issues);
  assert.equal(c.error + c.warning + c.info, issues.length);
});

// --- Emitting ---------------------------------------------------------------

test("Typst-hostile characters are escaped, and star notation becomes math", () => {
  assert.equal(escapeTypst("see @someone"), "see \\@someone");
  assert.equal(escapeTypst("exceeds #4%"), "exceeds \\#4%");
  assert.equal(escapeTypst("in CIE L* terms"), "in CIE $L^*$ terms");
  assert.equal(escapeTypst("a* and b*"), "$a^*$ and $b^*$");
  assert.match(escapeTypst("the u'v' diagram"), /\$u' v'\$/);
  assert.equal(escapeTypst("keeps *emphasis* intact"), "keeps *emphasis* intact");
});

test("the reassurance adverbs are stripped", () => {
  assert.equal(deReassure("this is genuinely hard"), "this is hard");
  assert.equal(deReassure("it actually works"), "it works");
  assert.equal(deReassure("be honest about the cost"), "state the cost");
  assert.equal(deReassure("a genuine problem"), "a real problem");
  assert.equal(deReassure("plain prose survives"), "plain prose survives");
});

test("unbalanced emphasis in generated markup is detected", () => {
  assert.equal(markupIsBalanced("all *fine* here").ok, true);
  assert.equal(markupIsBalanced('#import "x": *\nall *fine* here').ok, true, "imports are code");
  const bad = markupIsBalanced("an *unclosed marker");
  assert.equal(bad.ok, false);
  assert.equal(bad.ok === false && bad.marker, "*");
  assert.equal(markupIsBalanced("`a * b` in raw is fine").ok, true);
  assert.equal(markupIsBalanced("$a^*$ in math is fine").ok, true);
});

test("a figure is placed once and cross-referenced after", () => {
  const chapter = defineChapter({
    ...base(),
    sections: [
      { ...base().sections[0]!, title: "First", figures: ["a-figure"] },
      { ...base().sections[0]!, title: "Second", figures: ["a-figure"] },
    ],
  });
  const placed = new Map<string, string>();
  const out = renderChapter(chapter, placed, new Set(["a-figure"]));
  assert.equal(out.match(/#fig\("a-figure"\)/g)?.length, 1, "printed exactly once");
  assert.equal(placed.get("a-figure"), "ch01");

  // A later chapter refers to it rather than reprinting it.
  const later = renderChapter({ ...chapter, id: "ch02", number: 2 }, placed, new Set(["a-figure"]));
  assert.doesNotMatch(later, /#fig\("a-figure"\)/);
  assert.match(later, /#figref\("a-figure"\)/);
});

test("only outline-status chapters are generated", () => {
  assert.equal(isGenerated({ ...base(), status: "outline" }), true);
  assert.equal(isGenerated({ ...base(), status: "drafting" }), false);
  assert.equal(isGenerated({ ...base(), status: "written" }), false);
});

test("an unverified epigraph emits a visible marker", () => {
  const chapter = defineChapter({
    ...base(),
    epigraph: { text: "A quote.", source: "Someone, 1900", unverified: true },
  });
  const out = renderChapter(chapter, new Map(), new Set());
  assert.match(out, /#todo\[verify/);
  assert.match(out, /epigraph-source: \[Someone, 1900\]/);
});
