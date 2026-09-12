import sys, os, textwrap, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from outline_a import OUTLINE, EXERCISES, DIFFICULTY_NOTE
from outline_b import OUTLINE_B

ROOT = "/Users/oddurs/Code/code-as-color"
ALL = OUTLINE + OUTLINE_B

def wrap(text, indent="  ", width=86):
    return "\n".join(textwrap.wrap(text, width=width, initial_indent=indent, subsequent_indent=indent))

def tup(items):
    if not items: return "()"
    if len(items) == 1: return f'("{items[0]}",)'
    return "(" + ", ".join(f'"{i}"' for i in items) + ")"

REASSURANCE = [
    (r"\bbe honest(ly)? about\b", "state"),
    (r"\bbe explicit that\b", "say that"),
    (r"\band be honest that\b", "and say that"),
    (r"\bbe honest that\b", "say plainly that"),
    (r"\bgenuinely unsolved\b", "unsolved"),
    (r"\bgenuinely (?=\w)", ""),
    (r"\ba genuine\b", "a real"),
    (r"\bactually (?=\w)", ""),
    (r"\bprecisely (?=the|what|how|which|where)", ""),
    (r"\bin fact\b,? ", ""),
    (r"\bhonestly\b,? ", ""),
]

def de_reassure(s):
    """Strip the adverbs that assert rigour instead of demonstrating it."""
    for pat, rep in REASSURANCE:
        s = re.sub(pat, rep, s)
    return re.sub(r"  +", " ", s)

def esc(s):
    # Typst markup. `@` starts a citation and `#` starts code, so both are escaped
    # when literal. Star notation (L*, a*, b*) must become math or Typst reads it
    # as an emphasis delimiter and swallows the rest of the paragraph; deliberate
    # *emphasis* in the outline text is left alone.
    s = de_reassure(s)
    s = s.replace("@", "\\@").replace("#", "\\#")
    s = re.sub(r"\b([LabCh])\*", r"$\1^*$", s)
    s = s.replace("u'v'", "$u' v'$")
    return s

def check_markup(name, text):
    """Emphasis delimiters must pair up, or the rest of the file goes italic."""
    # Import lines and comments are code, not markup: `#import ...: *` is not
    # an emphasis delimiter, and counting it produces a phantom imbalance.
    prose = "\n".join(
        l for l in text.split("\n")
        if not l.lstrip().startswith("#import") and not l.lstrip().startswith("//")
    )
    stripped = re.sub(r"\$[^$]*\$", "", re.sub(r"`[^`]*`", "", prose))
    for ch in ("*", "_"):
        if stripped.count(ch) % 2 != 0:
            raise SystemExit(f"{name}: unbalanced {ch!r} in generated markup")

# Figures that already exist are placed for real; the rest are listed as planned.
import json
try:
    EXISTING = {f["id"] for f in json.load(open(os.path.join(ROOT, "build/figures/manifest.json")))}
except Exception:
    EXISTING = set()

# Figures already placed in the front matter. Chapters cross-reference them.
PLACED_IN_FRONT = {"cie-1931-chromaticity": "preface"}

manifest = []
# Book-wide: a figure is printed once, in the first chapter that needs it, and
# cross-referenced from every later use. Chapters are walked in reading order.
placed = dict(PLACED_IN_FRONT)   # figure id -> where it is printed
for part in ALL:
    for ch in part["chapters"]:
        lines = ['#import "../lib/book.typ": *', ""]
        epi = ch.get("epigraph")
        if epi:
            lines.append(f'#chapter(')
            lines.append(f'  {ch["n"]},')
            lines.append(f'  epigraph: [{esc(epi)}],')
            if ch.get("source"):
                lines.append(f'  epigraph-source: [{esc(ch["source"])}],')
            lines.append(f')[{esc(ch["title"])}]')
        else:
            lines.append(f'#chapter({ch["n"]})[{esc(ch["title"])}]')
        lines.append("")
        lines.append("#lead[")
        lines.append(wrap(esc(ch["lead"])))
        lines.append("]")
        lines.append("")

        total = 0
        for (title, arg, figs, srcs, words) in ch["sections"]:
            total += words
            lines.append(f'== {esc(title)}')
            lines.append("")
            drawn = [f for f in figs if f in EXISTING and f not in placed]
            # Only note a recall across chapters. Pointing at a figure printed
            # three inches up the same page reads as a stutter.
            recalled = [
                f for f in figs
                if f in EXISTING and placed.get(f) not in (None, ch["id"])
            ]
            planned = [f for f in figs if f not in EXISTING]

            named = []
            if planned: named.append(f'figures: {tup(planned)}')
            if srcs: named.append(f'sources: {tup(srcs)}')
            named.append(f'words: {words}')
            lines.append("#stub(" + ", ".join(named) + ")[")
            lines.append(wrap(esc(arg)))
            lines.append("]")
            lines.append("")
            for fid in drawn:
                lines.append(f'#fig("{fid}")')
                lines.append("")
                placed[fid] = ch["id"]
            if recalled:
                refs = " and ".join(f'#figref("{f}")' for f in recalled)
                lines.append(f'Returns to {refs}.')
                lines.append("")

        exercises = EXERCISES.get(ch["id"])
        lines.append("#exercises[")
        if exercises:
            for (prompt, kind, hint) in exercises:
                lines.append(f'  #exercise(kind: "{kind}"' + (f', hint: [{esc(hint)}]' if hint else '') + ")[")
                lines.append(wrap(esc(prompt), indent="    "))
                lines.append("  ]")
        else:
            lines.append("  #exercise-plan[")
            lines.append("    Three to five problems, each doable against this repository: one")
            lines.append("    derivation, one measurement, and one that asks the reader to decide")
            lines.append("    something rather than compute it. See Chapters 1--3 for the pattern.")
            lines.append("  ]")
        lines.append("]")
        lines.append("")
        lines.append("#chapter-end()")
        lines.append("")
        text = "\n".join(lines)
        check_markup(ch["id"], text)
        path = os.path.join(ROOT, "book", "parts", f'{ch["id"]}.typ')
        with open(path, "w") as f:
            f.write(text)
        manifest.append((part["part"], ch["id"], ch["n"], ch["title"], total, len(ch["sections"])))

# main.typ
main = ['#import "lib/book.typ": *', "",
        "// Generated structure: see engine/cli.ts `new chapter` to add one.",
        "",
        '#show: book.with(',
        '  title: "Three Numbers",',
        '  subtitle: "Colour theory for people who would rather see the derivation",',
        '  author: "TODO",',
        ')',
        "",
        '#include "front/title.typ"',
        '#pagebreak(to: "odd", weak: true)',
        '#include "front/contents.typ"',
        '#pagebreak(to: "odd", weak: true)',
        '#include "front/preface.typ"',
        "",
        "#begin-body()",
        ""]
for part in ALL:
    blurb = wrap(esc(part["blurb"]), indent="  ")
    main.append(f'#part-page("{part["part"]}", blurb: [')
    main.append(blurb)
    main.append(f'])[{esc(part["title"])}]')
    main.append("")
    for ch in part["chapters"]:
        main.append(f'#include "parts/{ch["id"]}.typ"')
    main.append("")
main += ['#include "back/appendix-a.typ"',
         '#include "back/appendix-b.typ"',
         '#include "back/appendix-c.typ"',
         '#include "back/appendix-d.typ"',
         '#include "back/bibliography.typ"',
         '#include "back/colophon.typ"',
         ""]
main_text = "\n".join(main)
check_markup("main.typ", main_text)
with open(os.path.join(ROOT, "book", "main.typ"), "w") as f:
    f.write(main_text)

total_words = sum(m[4] for m in manifest)
print(f"{len(manifest)} chapters, {sum(m[5] for m in manifest)} sections, {total_words:,} planned words")
for p in ALL:
    w = sum(sum(s[4] for s in c["sections"]) for c in p["chapters"])
    print(f"  Part {p['part']:<4} {p['title']:<12} {len(p['chapters'])} chapters  {w:>7,} words")
