<!-- cairn:begin -->
## Roadmap and issues

This project tracks its roadmap and issues with `cairn`. Every item is a Markdown file under `cairn/items`, described by the schema in `cairn.toml`.

**Do not create ad-hoc TODO, PLAN or NOTES files.** Create a cairn item instead, so the work appears on the board and in the generated roadmap.

### The loop

1. `cairn next` — what is ready to start. It excludes anything blocked by unfinished dependencies and puts work already in progress first.
2. `cairn claim <ID>` — take it before you start, so no one duplicates the work. `cairn claim --next` picks and claims the top-ranked unclaimed item in one step, and prints its body so you can begin immediately.
3. Do the work. Record what you learn: `cairn set <ID> <field>=<value>` for fields, `cairn note <ID> "<TEXT>"` for anything that needs a sentence — why you chose something, what you tried, what to watch for.
4. `cairn close <ID>` when it is done, or `cairn release <ID>` to hand it back.
5. `cairn check` before you report finished. It must pass.

### Commands

```sh
cairn next --json                 # ready work, ranked
cairn claim --next                # take the next ready item
cairn search <TEXT> --json        # titles, bodies and labels
cairn list --json                 # all open items
cairn list --filter 'blocked=false,priority=p0'
cairn show <ID> --json            # one item, including its body
cairn new "<TITLE>" --type <TYPE> --milestone <MILESTONE>
cairn set <ID> status=<STATUS>    # also labels+=x, or any field below
cairn note <ID> "<TEXT>"          # append reasoning; never replaces
cairn close <ID>
cairn check                       # validate; run before finishing
cairn render                      # regenerate ROADMAP.md
```

### Schema

- **Types**: `chapter`, `figure`, `research`, `pass`, `engine`, `docs`, `milestone`
- **Statuses**: `backlog` (open), `planned` (open), `researching` (active), `drafting` (active), `revising` (active), `review` (active), `blocked` (active), `done` (done), `dropped` (dropped)
- **`due`**: date, YYYY-MM-DD — when a milestone is meant to land
- **`part_of`**: names any items, by id, several allowed — a larger piece of work this belongs to
- **`priority`**: one of p0, p1, p2, p3 — p0 blocks the release
- **`effort`**: one of s, m, l, xl — rough size, not an estimate
- **`part`**: one of I, II, III, IV, V, front, back, whole — which part of the book this belongs to
- **`chapter`**: free text — the outline id, e.g. ch07
- **`words`**: number — planned length, from the outline declaration
- **`area`**: free text — subsystem, for engine work
- **Milestones**: `v0.2` (due 2026-10-15), `v0.3` (due 2026-12-15), `v0.4` (due 2027-03-15), `v0.5` (due 2027-06-01), `v0.6` (due 2027-09-01), `v0.7` (due 2027-11-01), `v0.8` (due 2027-12-15), `v0.9` (due 2028-03-01), `v1.0` (due 2028-04-01)
- **Saved views** (`cairn list --view NAME`): `now`, `next`, `chapters`, `figures`, `blockers`, `triage`

### Rules

1. Before starting work, find or create the item and set it to an active status.
2. Use the fields above rather than inventing new ones; add new fields to `cairn.toml` first.
3. Never hand-edit the generated roadmap file — change items and run `cairn render`.
4. `cairn check` must pass before the work is considered done.

<!-- cairn:end -->
