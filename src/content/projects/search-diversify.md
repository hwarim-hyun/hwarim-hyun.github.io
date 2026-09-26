---
title: "Faster Search Ranking with O(K) Grouped Deduplication"
summary: "Rewrote the search engine's result-diversification algorithm so memory scales with the number of groups instead of the number of results, with a measurable throughput gain in production."
date: 2024-06-01
period: "2023 — 2024"
org: "NAVER · Search Engine Team"
role: "Software Engineer, sole implementer"
tags: ["Search Engine", "Algorithms", "C++", "Performance"]
metrics:
  - { value: "O(N) → O(K)", label: "space complexity" }
  - { value: "+4.2%", label: "throughput (QPS) at CPU saturation" }
thumbnail: "/images/projects/thumbs/search-diversify.svg"
thumbnailTall: "/images/projects/thumbs/search-diversify-tall.svg"
featured: true
---

## Summary

**Problem**
- **Background.** Nexus++ is NAVER's in-house search engine, serving 10M+ searches a day over billion-scale documents.
- **Motivation.** Imagine you are searching for running shoes to buy. If the results consist only of products from the same brand, that would not accurately show all available search results or options.
- **Problem definition.** Add a *diversify* constraint (grouped deduplication) to ranking: of the N results returned, at most M per group (such as brand). Apply this diversity constraint during ranking so the engine still returns N results.
- **Challenges.** Memory is far smaller than the index, and any change that lowers throughput cannot ship. The existing implementation kept every top-N candidate in memory, so memory grew with N.

**Actions**
- Redesigned the algorithm to keep only each group's current minimum instead of the full top-N list, so memory grows with the number of groups K instead of the number of results N.
- Reworked the index scan so only the ranking columns are copied for every candidate; the remaining columns are copied only for the final winners.

**Results**
- Throughput improved by 4.2% at CPU saturation, on an engine with 20+ years of optimization behind it, where a 1% gain is considered difficult.
- Large drop in memory use, improving server stability under average load.
- Deployed to production in Q2 2024.

## Engineering Details

### Logical algorithm

A query looks roughly like this (illustrative syntax):

```sql
SELECT id, col_1, …, col_30 ORDER BY col_1 DESC DIVERSIFY BY col_2 M LIMIT N
```

Return N rows ordered by `col_1`, with at most M rows sharing the same `col_2` value (the group, e.g. brand).

![Before and after: the old design kept per-group heaps plus a full top-N list; the new design keeps per-group heaps plus a small heap of group minimums](/images/projects/diversify-algorithm.svg)

- **As-is:** a heap per group plus a full top-N list of every candidate. Space is O(N).
- **To-be:** a heap per group plus one small heap holding each group's current minimum. The per-group heaps are unchanged; the full top-N list is replaced by this heap of K entries, where K is the number of groups, so the extra structure shrinks from O(N) to O(K). Because a group's minimum changes as candidates arrive, this heap has to support key updates.

The rule for each incoming candidate: once N results are held, a candidate is admitted only if it beats the global minimum, which is the smallest of the group minimums. If the candidate's group already holds M entries, it must instead beat that group's minimum, which it then evicts. Otherwise the global-minimum entry is evicted from its group, and the small heap is updated with that group's new minimum.

### Physical implementation

Two constraints shape the implementation. First, memory is far smaller than the data: a single node holds millions of documents, so the engine ranks in buffered passes rather than sorting everything in memory. Second, copying data from disk to memory is the dominant cost, so each index page is scanned exactly once and everything ranking needs from a page must be captured on that pass. The implementation therefore copies as little as possible per page:

1. For every element on a page, copy only `id`, the `ORDER BY` column, and the `DIVERSIFY BY` column, and apply the rule above.
2. When the page ends, copy the remaining return columns (`col_3 … col_30`) only for elements that newly entered the result set on that page.
3. Move to the next page. Elements that entered and were evicted within the same page never have their wide columns copied.

### Benchmark

Measured on an internal benchmarking system that replicates the production environment (throughput in QPS, relative to the previous implementation):

| limit | throughput change |
| --- | --- |
| 12 | +1.7% |
| 100 | +4.2% |

The gain grows with N: the old top-N list's per-candidate cost grew with N, and that cost is gone.
