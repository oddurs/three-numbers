---
key: apca
type: software
title: "APCA — Accessible Perceptual Contrast Algorithm"
year: 2024
publisher: Myndex Research
url: https://github.com/Myndex/apca-w3
accessed: 2026-09-11
tier: secondary
author:
  - "Somers, Andrew"
---

## Why it matters

The leading candidate to replace WCAG 2's contrast ratio, and the reference
implementation. Chapter 19 needs it both as a technical proposal and as a case
study in how hard it is to replace a formula that is written into procurement
rules.

## Claims

- [high | README] {#apca-polarity-aware} APCA produces different scores for light-on-dark and dark-on-light pairs, because perceived contrast is genuinely polarity-dependent and WCAG 2's ratio is not. #contrast
- [medium | README] {#apca-font-aware} APCA's thresholds are stated as a lookup against font size and weight rather than as a single ratio, because legibility depends on stroke width. #contrast
- [disputed | README] {#apca-adoption} APCA is not yet a normative part of any published WCAG version; its status in WCAG 3 remains unsettled. #standards

## Notes

The algorithm has been revised several times and scores are not comparable
across versions. Record the version used before quoting any number.
