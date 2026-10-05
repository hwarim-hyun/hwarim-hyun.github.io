---
title: "Taming SPANN (SSD-Based Vector Index): Shard Balance and Build Cost"
summary: "Made a disk-resident vector index production-ready for NAVER's image and video search: defined a quality signal for its clustering, cut shard skew to bring tail latency down, and cut index build time by 80%."
date: 2023-06-01
period: "2022 — 2023"
org: "NAVER · ANN Platform"
role: "Software Engineer"
tags: ["Vector Search", "SPANN", "Indexing", "Spark", "Performance"]
metrics:
  - { value: "−38%", label: "shard size skew" }
  - { value: "−80%", label: "centroid training time" }
  - { value: "−57%", label: "full index rebuild cycle" }
links:
  - { label: "SPANN (Chen et al., NeurIPS 2021)", href: "https://arxiv.org/abs/2111.08566", icon: paper }
  - { label: "SPTAG paper (Wang & Li, ACM MM 2012)", href: "https://doi.org/10.1145/2393347.2393378", icon: paper }
  - { label: "SPTAG on GitHub", href: "https://github.com/microsoft/SPTAG", icon: code }
thumbnail: "/images/projects/thumbs/spann-index.svg"
thumbnailTall: "/images/projects/thumbs/spann-index-tall.svg"
featured: false
---

## Summary

**Problem**
- **Background.** NAVER's image-to-image and video search run on approximate nearest-neighbor (ANN) indexes over billions of vectors, built and served by the ANN Platform across several data centers.
- **Motivation.** In-memory indexes need a node for every slice of data. SPANN, an SSD-based vector search system from Microsoft, keeps only cluster centroids in memory and reads the vectors near a query from disk, so the same search runs on far less hardware. We partition the data into shards by clustering and build one index per shard with [SPTAG](https://github.com/microsoft/SPTAG), Microsoft's ANN library.
- **Problem definition.** Adopt SPANN in production: make its quality predictable, its tail latency acceptable, and its index builds cheap enough to refresh on a useful cycle.
- **Challenges.** A query is routed to the shards whose centroids are nearest, and a shard's latency grows with its size, so one oversized shard dominates tail latency while the average still looks healthy. Nothing measured clustering quality before a build finished, and centroid training on the full data took days.

**Actions**
- Rebalanced shards by tuning SPANN's two knobs:
  - the closure tolerance ε, which lets a boundary vector sit in more than one shard
  - the balance weight λ, which penalizes oversized shards
- Defined a quality signal for centroid generation where none existed: how much shards inflate when ε is barely above zero. Centroid generation became a generate-then-verify loop.
- Cut build cost by caching RDDs in the Spark training job and removing an unnecessary file merge from the partitioning step.

**Results**
- Shard size skew, the largest shard divided by the smallest, fell by 38%, and the largest shard, which sets tail latency, shrank by 25%.
- Centroid training time fell 80%, and the full index rebuild cycle by 57%.
- With both changes, the balanced-partitioning step ran 60–70% faster on half the memory per node, with CPU utilization 42 percentage points higher.

## Engineering Details

### A quality signal for centroids

Shards are formed with SPANN's own clustering. Its *closure assignment* puts a vector into every shard whose centroid is within (1 + ε) times the nearest centroid distance, so a vector near a boundary is visible from more than one shard and a query near that boundary does not miss it. Raising ε improves recall but inflates shard sizes, and the inflation is uneven: a poor set of centroids blows up a few shards far faster than the rest, and the unevenness already shows at ε ≤ 0.001, where well-formed clusters barely inflate at all. I used that sensitivity as the quality signal. The chart below measures it on one 32-shard build, relative to ε = 0.

<figure class="chart">
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 760 380' role='img' aria-labelledby='qs-title qs-desc' style='width:100%;height:auto;font-family:inherit;font-size:12px'>
<title id='qs-title'>Shard size inflation against the closure tolerance ε</title>
<desc id='qs-desc'>32 shards from one build. Sizes are relative to ε = 0. Below ε = 0.001 shards barely inflate; at ε = 0.05 the largest shard is 15.2 times its base size while the smallest is 1.5 times.</desc>
<rect x='52' y='18' width='206.7' height='302' fill='var(--accent)' fill-opacity='.06'/>
<text x='58' y='300' fill='var(--fg-muted)'>signal read here (ε ≤ 0.001)</text>
<line x1='52' y1='320.0' x2='610' y2='320.0' stroke='var(--line)' stroke-width='1'/>
<text x='44' y='324.0' text-anchor='end' fill='var(--fg-faint)'>1×</text>
<line x1='52' y1='244.5' x2='610' y2='244.5' stroke='var(--line)' stroke-width='1'/>
<text x='44' y='248.5' text-anchor='end' fill='var(--fg-faint)'>2×</text>
<line x1='52' y1='169.0' x2='610' y2='169.0' stroke='var(--line)' stroke-width='1'/>
<text x='44' y='173.0' text-anchor='end' fill='var(--fg-faint)'>4×</text>
<line x1='52' y1='93.5' x2='610' y2='93.5' stroke='var(--line)' stroke-width='1'/>
<text x='44' y='97.5' text-anchor='end' fill='var(--fg-faint)'>8×</text>
<line x1='52' y1='18.0' x2='610' y2='18.0' stroke='var(--line)' stroke-width='1'/>
<text x='44' y='22.0' text-anchor='end' fill='var(--fg-faint)'>16×</text>
<text x='52.0' y='338' text-anchor='middle' fill='var(--fg-faint)'>0.0001</text>
<text x='196.5' y='338' text-anchor='middle' fill='var(--fg-faint)'>0.0005</text>
<text x='258.7' y='338' text-anchor='middle' fill='var(--fg-faint)'>0.001</text>
<text x='403.3' y='338' text-anchor='middle' fill='var(--fg-faint)'>0.005</text>
<text x='465.5' y='338' text-anchor='middle' fill='var(--fg-faint)'>0.01</text>
<text x='610.0' y='338' text-anchor='middle' fill='var(--fg-faint)'>0.05</text>
<text x='331.0' y='356' text-anchor='middle' fill='var(--fg-muted)'>ε (closure tolerance, log scale)</text>
<text x='52' y='12' text-anchor='start' fill='var(--fg-muted)'>shard size, relative to ε = 0 (log scale)</text>
<defs><linearGradient id='qs-band' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='var(--accent)' stop-opacity='.05'/><stop offset='.55' stop-color='var(--accent)' stop-opacity='.12'/><stop offset='1' stop-color='var(--accent)' stop-opacity='.28'/></linearGradient></defs>
<path d='M52.0,319.1 L196.5,316.5 L258.7,313.0 L403.3,286.4 L465.5,253.1 L610.0,23.3 L610.0,275.2 L465.5,315.7 L403.3,317.9 L258.7,319.7 L196.5,319.8 L52.0,320.0 Z' fill='url(#qs-band)' stroke='none'><title>range of all 32 shards</title></path>
<path d='M52.0,319.5 L196.5,317.5 L258.7,315.1 L403.3,296.2 L465.5,273.9 L610.0,109.8 L610.0,179.5 L465.5,294.9 L403.3,307.6 L258.7,317.5 L196.5,318.7 L52.0,319.8 Z' fill='var(--accent)' fill-opacity='.14' stroke='none'><title>middle half of shards (25th–75th percentile)</title></path>
<path d='M52.0,319.1 L196.5,316.5 L258.7,313.0 L403.3,286.4 L465.5,253.1 L610.0,23.3' fill='none' stroke='var(--accent)' stroke-width='2'><title>largest shard: 15.2× at ε = 0.05</title></path>
<path d='M52.0,320.0 L196.5,319.8 L258.7,319.7 L403.3,317.9 L465.5,315.7 L610.0,275.2' fill='none' stroke='var(--accent)' stroke-width='2' stroke-dasharray='5 4'><title>smallest shard: 1.5× at ε = 0.05</title></path>
<path d='M52.0,319.7 L196.5,318.2 L258.7,316.3 L403.3,301.5 L465.5,282.5 L610.0,135.9' fill='none' stroke='var(--fg)' stroke-width='2'><title>median shard: 5.4× at ε = 0.05</title></path>
<circle cx='610.0' cy='23.3' r='4' fill='var(--accent)' stroke='var(--bg)' stroke-width='2'/>
<text x='620.0' y='27.3' fill='var(--fg)'>largest shard, 15.2×</text>
<circle cx='610.0' cy='135.9' r='4' fill='var(--fg)' stroke='var(--bg)' stroke-width='2'/>
<text x='620.0' y='139.9' fill='var(--fg)'>median, 5.4×</text>
<circle cx='610.0' cy='275.2' r='4' fill='var(--accent)' stroke='var(--bg)' stroke-width='2'/>
<text x='620.0' y='279.2' fill='var(--fg)'>smallest shard, 1.5×</text>
</svg>
<figcaption>The shaded band spans all 32 shards, the darker band the middle half; both axes are logarithmic. The quality signal is read in the tinted region at ε ≤ 0.001, where the median shard has grown only 1.03× and the largest 1.07×. Pushed to ε = 0.05, the largest shard grows 15.2×, the smallest 1.5×.</figcaption>
</figure>

The check needs only the centroids, so it runs right after clustering and before the expensive index build. Centroid generation became a loop: generate, measure inflation at small ε, and regenerate when a few shards stand out from the rest.

Two knobs then shape the size distribution, and I tuned both: the closure tolerance ε, where lowering it trims shards at the cost of boundary recall, and the balance weight λ in the partitioning objective, which penalizes oversized shards during clustering and caps the tail of the size distribution.

### Making the build cheap

The build runs two Spark stages: centroid training, which produces the shard centroids, then balanced partitioning, which assigns every vector to shards under the λ penalty and the closure rule. Centroid training took days. The first idea was to train on a sample. To test it I compared the shard sizes predicted from a sample with the sizes the full data actually produced. No matter how the sample was drawn, only 56–63% of shards were predicted to within 10% of their real size, and 9–16% were off by more than 20%.

Training on a sample would have made shard sizes, the thing the whole build is tuned for, unpredictable, so I dropped the idea. What worked was caching Spark's intermediate dataset (the RDD) across the iterative training passes: without the cache Spark recomputed every upstream step on each pass, and removing that recomputation cut training time by 80%. The balanced-partitioning step, SPANN's balanced clustering under the λ size penalty, had been merging its output files into one per shard; the merge was unnecessary, and removing it alone cut the step's run time by nearly half. The full rebuild cycle, from a fresh set of vectors to a serving index, shrank by 57%, so each new embedding model, which requires a full rebuild, reached users 2.3× as fast.
