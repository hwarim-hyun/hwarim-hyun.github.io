---
title: "Dynamic Task Resizing for Apache Nemo"
summary: "Let a distributed data-processing engine pick task parallelism while a job runs, from sampled task durations instead of a fixed setting, and rewrite its execution DAG accordingly."
date: 2020-11-24
period: "2020"
org: "Apache Software Foundation"
orgs: ["Google Summer of Code"]
role: "Contributor, later committer"
tags: ["Distributed Systems", "Runtime Optimization", "Java", "Open Source"]
metrics:
  - { value: "≈ −25%", label: "job completion time, WordCount 247 GB" }
  - { value: "GSoC 2021", label: "selected for Google Summer of Code" }
links:
  - { label: "Apache Nemo", href: "https://nemo.apache.org/", icon: web }
  - { label: "PR #289: task metrics for sampling", href: "https://github.com/apache/incubator-nemo/pull/289", icon: code }
  - { label: "PR #292: DAG structure for dynamic sampling", href: "https://github.com/apache/incubator-nemo/pull/292", icon: code }
  - { label: "PR #293: runtime re-configuration from sampled metrics", href: "https://github.com/apache/incubator-nemo/pull/293", icon: code }
thumbnail: "/images/projects/thumbs/apache-nemo.png"
thumbnailTall: "/images/projects/thumbs/apache-nemo-tall.png"
featured: false
---

## Summary

**Problem**
- **Background.** Apache Nemo is a distributed data-processing runtime. It takes a workload from a framework such as Apache Beam, represents it as a DAG of computations and data dependencies, and separates the processing logic from how it is executed, so execution can be optimized at runtime.
- **Motivation.** Task parallelism, how many pieces a stage is cut into, was fixed before a job ran. With too few tasks, each task became too large and memory-heavy. With too many tasks, scheduling overhead dominated. The best value depends on the data, and the runtime already had that data.
- **Problem definition.** Choose a stage's parallelism at runtime based on the workload itself, and rewrite the DAG accordingly.
- **Challenges.** Measuring the workload means running part of it first, which costs time. Nemo's existing sampling vertex ran a sample and then the whole stage again, so the sampled data was executed twice. The choice also has to account for scheduling overhead, not just task duration.

**Actions**
- Extended task metrics and their collection so sampled tasks report durations back to the driver (PR #289).
- Introduced a *Splitter* vertex, a new DAG structure that runs the sample and the rest of the stage as one computation, so sampled data is not executed twice and the original dependencies are preserved (PR #292).
- Built a *Simulation Scheduler* that estimates a stage's completion time by simulating scheduling and dispatch with the sampled durations.
- Built a *Parallelism Prophet* that picks the parallelism from those estimates and rewrites the DAG through a runtime pass (PR #293).

**Results**
- On WordCount over a 247 GB input, job completion time fell by about a quarter against the previous fixed rule of 4096 partitions. On inputs of 9–87 GB it was slightly slower, because sampling costs more than it saves there.
- All three pull requests were merged upstream. This work earned a Google Summer of Code 2021 slot on Nemo, and the combined contributions led to committer status on the project.

## Engineering Details

### Why parallelism has a sweet spot

Job completion time against parallelism is U-shaped. On the left, few large tasks put pressure on memory; on the right, thousands of small tasks spend more time being scheduled than computing. The minimum sits somewhere in the middle and moves with the input size and the operation. Nemo had used a fixed rule: any job over 1 GB was cut into 4096 partitions.

### Sampling without running twice

The existing approach was to add a sampling vertex that executed roughly 10% of a stage, analyzed it, then ran the whole stage again. Simple, but the sampled data was processed twice, and the DAG could not tell which partitions had already been used.

The Splitter vertex wraps the stage as a loop-like structure and unrolls it into two branches from the same edge: an *analyze* branch over the sample and an *optimize* branch over the rest, split by partition key range. The remainder waits for the analysis, then runs with the chosen parallelism. Four sample tasks per candidate parallelism are averaged to reduce variance.

| | Previous sampling vertex | Splitter vertex |
| --- | --- | --- |
| Sampled data | executed twice | executed once |
| Dependencies | side path off the DAG | preserved inside the original DAG |
| Extension | single sample | multiple layers of sampling possible |
| Cost | simple | rolling and unrolling logic |

### Estimating completion time without executing

The first estimator multiplied a sampled task duration by the parallelism, which ignores scheduling overhead entirely. The Simulation Scheduler replaces it: it takes the physical plan and the sampled task metrics, runs the same scheduling and dispatch logic as the real schedulers, but instead of executing a task it advances a clock by the sampled duration. The output is a simulated stage duration per candidate parallelism. The Parallelism Prophet compares those and hands the winner to the plan rewriter.

Separately, the fixed 4096-partition rule was replaced by size-based steps of 1024, 2048 or 4096 partitions.

### Measured

WordCount, the previous fixed 4096-partition rule vs. dynamic task resizing, job completion time:

| Input | Change |
| --- | --- |
| 9–87 GB | slightly slower (sampling overhead) |
| 247 GB | about a quarter faster |

The benefit appears only when the job is large enough for the saved scheduling overhead to outweigh the cost of sampling. The obvious next step, which I did not get to, was to state that break-even point explicitly and to validate the simulator by comparing predicted and actual stage times.

### What I would do differently

Several thresholds, such as the partition-size steps and the job-size cutoffs, were hard-coded and should adapt to the cluster. The feedback loop was validated end to end on WordCount but the simulator was never checked in isolation against measured stage durations, which is the check that would show whether the Prophet's choice was right for the right reason.
