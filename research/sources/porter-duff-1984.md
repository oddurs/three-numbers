---
key: porter-duff-1984
type: article
title: "Compositing digital images"
year: 1984
journal: ACM SIGGRAPH Computer Graphics
volume: 18
issue: 3
pages: 253-259
doi: 10.1145/964965.808606
url: https://doi.org/10.1145/964965.808606
tier: primary
author:
  - "Porter, Thomas"
  - "Duff, Tom"
---

## Why it matters

TODO: one paragraph on why this source is in the bibliography.

## Claims

- [high | §3] {#porter-duff-over} The source-over operator composites premultiplied colours as c_out = c_src + c_dst(1 - alpha_src), with the alpha channel following the same form. #compositing
- [high | §4] {#premultiplied-alpha} Premultiplied alpha makes the compositing algebra associative and avoids the dark-fringe artefact that arises from interpolating unpremultiplied colours. #compositing
