---
id: 48
title: Figure inventory for Part I
type: pass
status: backlog
milestone: v0.3
created: 2026-09-11
updated: 2026-09-11
priority: p1
part: I
effort: m
---

## Scope

<!-- Which chapters, and what exactly is being checked. -->

## Method

<!-- How it is done, so it can be repeated identically next time. -->

## Findings

## 2026-09-11

**Scope.** Every section of Part I.

**Method.** Read each section's argument and ask what a reader could not be convinced of by prose alone. Each answer becomes a figure item with the claim it must make written down first. A figure that makes no claim is decoration and does not get an item.

Then add the figure ids to the `figures:` field of the relevant sections in `outline/chNN.outline.ts`, so `outline check` starts tracking them.
