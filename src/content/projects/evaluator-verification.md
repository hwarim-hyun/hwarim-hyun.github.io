---
title: "Verifying a Safety Judge LLM on a Fixed Labelling Budget"
summary: "Designed the experiment that verified NAVER's new safety judge LLM against the previous moderation prompt, from building the human-labelled ground truth to the paired comparison."
date: 2026-04-20
period: "2026"
org: "NAVER · AI Safety Center"
role: "AI Safety Evaluation Engineer, experiment design and implementation"
tags: ["AI Safety", "LLM-as-a-judge", "Experiment Design", "Statistics", "Evaluation"]
metrics:
  - { value: "+11.5%p", label: "precision on harmful" }
  - { value: "−91%", label: "false positives" }
  - { value: "+13.9%p", label: "agreement with human labels" }
featured: true
order: 2
---

## Summary

**Problem**
- *Background.* As the company's sole AI safety team, we automatically evaluate NAVER's diverse AI agents before launch with a judge LLM, the grader behind our [safety evaluation platform](/projects/safety-evaluation-platform). We had built our own risk taxonomy and, for each risk category, an evaluation criterion that labels a response harmful, grey, or safe.
- *Motivation.* Product teams experience **safety as a usability tax**. Every false positive costs them a manual review, so for safety evaluation to fit their product cycles, **precision on harmful had to be high**.
- *Problem definition.* Before deploying the criteria, determine whether they are precise enough to be useful, and whether the new criteria, run on the same model, beat the single moderation prompt we used before.
- *Why it's hard.* No labelled data existed, and harmful responses are rare in traffic. Human annotation was expensive, so the same limited budget had to serve both refining the criteria and verifying them.

**Action**
- Generated test data with synthetic labels and had humans label it independently.
- Refined the criteria on a dev set and verified precision on a separate hold-out set.
- Compared the new judge with the previous prompt on the same human-labelled records.

**Result**
- Measured on the hold-out, precision on harmful is 11.5 points higher than the previous prompt's.
- False positives fell 91% and agreement with human labels rose 13.9 points, with recall unchanged.

## Engineering details

### 1. Three label layers, one truth

| Layer | What it is | Used for |
| --- | --- | --- |
| L1 · generated intent | harmful / grey / safe-aligned / safe-unaligned | sampling design only |
| L2 · human label | one annotator per risk category | ground truth |
| L3 · judge verdict | harmful / grey / safe from the criterion under test | the thing measured |

Precision and recall are computed between L2 and L3 only. Had L1 been the truth, generator mistakes would have counted as correct verdicts.

### 2. Dev for refinement, hold-out for one measurement

| Set | Labels per category | Role | Opened |
| --- | --- | --- | --- |
| dev | 125 | compare L2 with L3, revise the criterion, repeat | every iteration |
| hold-out | 25 | final precision | once |

Within the budget, the dev set was kept as large as possible so there were enough samples to refine each criterion on. The hold-out's value lies in not being contaminated, which depends on how often it is opened, not on its size, so it was opened once, after the iteration ended.

### 3. Oversample harmful, then check the bias

Harmful is one of the four generated answer types, so at the generation share of 25% a 25-item hold-out holds about six generated-harmful items. Generated-harmful data was therefore oversampled to 50% of the labelled sample. That makes the sampling strata (L1) differ from the metric's denominator (L3). The expected failure mode was false positives hiding in the undersampled generated-non-harmful stratum, inflating precision.

| Stratum (L1) | Share in generated data | Share in labelled sample | Share of false positives |
| --- | --- | --- | --- |
| generated-harmful | 25% | 50% | **92%** |
| generated-non-harmful | 75% | 50% | 8% |

False positives concentrated in the oversampled stratum, not the undersampled one. Re-weighting back to the generation share lowered precision by half a point.

### 4. Against the previous judge

Both judges ran over the same 3,600 human-labelled records and were compared record by record. McNemar's test counts only the records where exactly one judge is right, so shared easy cases do not inflate the result.

| New judge vs. previous prompt | Change |
| --- | --- |
| Precision on harmful | +11.5%p |
| False positives | −91% |
| Missed harmful | −3% |
| Agreement with human labels | +13.9%p |
| Records where only the new judge is right vs. only the old one | 10 : 1, p < 0.0001 |

The gain held across risk categories.
