---
title: "N-ASET: Safety Evaluation Platform for NAVER's AI Agents"
summary: "Built the automated evaluation toolkit that measures NAVER's diverse AI agents against one shared risk taxonomy, scoring harm and helpfulness side by side, before launch and on a recurring cycle."
date: 2026-04-01
period: "2026 — Present"
org: "NAVER · AI Safety Center"
role: "AI Safety Evaluation Engineer, built and operates the toolkit"
tags: ["AI Safety", "Evaluation Infrastructure", "Adversarial Testing", "Python", "System Design"]
metrics:
  - { value: "−80%", label: "evaluation turnaround" }
  - { value: "5×", label: "adversarial queries per round" }
  - { value: "24 → 52", label: "risk categories evaluated" }
links:
  - { label: "AI Safety Progress Report 2026 (Korean)", href: "https://www.navercorp.com/media/aiInNaver/buildingAiDetail?seq=10034660", icon: paper }
  - { label: "Press (Asia Today)", href: "https://en.asiatoday.co.kr/view.php?key=20260916000947283", icon: web }
  - { label: "Press (Maeil Business)", href: "https://www.mk.co.kr/en/it/12154170", icon: web }
featured: true
order: 1
---

## Summary

**Problem**
- *Background.* NAVER ships a growing number of AI agents, from conversational search to task agents. The AI Safety Center is the one team responsible for evaluating all of them.
- *Motivation.* Model-level alignment does not settle safety. The same model in a different agent, in front of different users, carries a different set of risks, so safety has to be measured where the model meets the agent.
- *Problem definition.* Evaluate NAVER's diverse AI agents against one shared standard, so results are comparable across agents: the same risk taxonomy, the same measurement, before launch and again as the agent changes.
- *Why it's hard.* Each product team used to check safety its own way, so results were not comparable. Manual review does not scale to ten thousand adversarial queries a round. And a naive harm-only metric rewards the product that refuses everything.

**Action**
- Built N-ASET (NAVER AI Safety Evaluation Toolkit), the automated toolkit: adversarial query generation per risk category, batched execution against the agent, judge-LLM grading with per-verdict rationale, and reports that rank risks by the simulated effect of fixing each one.
- Built the query-hardening step: each round's new queries expand the attack patterns that succeeded last time and open angles not yet covered, so attack strength keeps pace with the agent.
- Operate it as two tracks, a pre-launch evaluation wired into the internal launch review and a periodic evaluation that tracks drift.
- With the team, set the evaluation on two axes measured together, **harmfulness and helpfulness**, so that over-refusal counts as a defect rather than as safety.

**Result**
- Against the manual process used through 2025, evaluation turnaround fell 80% while queries per round rose 5× and risk categories covered grew from 24 to 52.
- Roughly ten thousand adversarial queries per round, across NAVER's AI agents; the first evaluations ran in April 2026.
- The framework is described in NAVER's first AI Safety Progress Report (Sep 2026). NAVER is pursuing ISO/IEC 42001 certification for the AI management system this evaluation process is part of.

## Engineering details

### 1. Two axes, one verdict

Harmfulness asks whether a response contains something that can hurt the user. Helpfulness asks whether it answered the question in the right form, with the safety elements the question called for: a disclaimer, a pointer to a professional, crisis resources. Measuring only the first makes refusal the winning strategy, so the two are always read together, and a refusal is graded on whether it gave a reason and offered the resources the user needed.

| Axis | Question asked of each response | Failure it catches |
| --- | --- | --- |
| Harmfulness | Does it contain content that can harm the user? | unsafe answers |
| Helpfulness | Does it answer appropriately, with the required safety elements? | over-refusal, missing or unnecessary disclaimers |

### 2. Scope from the taxonomy, not from the team

Before each evaluation, the agent's specification is mapped against N-ARTI (NAVER AI Risk Taxonomy & Identification), the company-wide risk taxonomy of 110 items: who the users are, which model and data it uses, what tools an agent can call, whether minors can reach it, whether it touches health, finance, or law. That mapping fixes the risk categories and their priority. Each item has its own evaluation criterion, and N-ASET evaluates 52 of the 110 today: some items are not yet defined tightly enough to be measured automatically, others need infrastructure the toolkit does not have yet, and coverage is being widened round by round. Some items apply to every agent, such as unqualified expert advice, facilitation of illegal acts, discrimination, and age-inappropriate content; others come from the agent's own function. Writing this down first makes the result a measurement against an agreed standard rather than an opinion.

### 3. Pipeline

| Stage | What N-ASET does |
| --- | --- |
| Generate | Adversarial queries per risk category, shaped to the agent's context; about ten thousand per round |
| Execute | Run them against the agent in batches |
| Grade | A judge LLM per criterion returns harmful / grey / safe with a rationale; only judges that passed [accuracy verification against labeled data](/projects/evaluator-verification) are deployed |
| Report | Distribution of harm and helpfulness findings by risk category, drill-down to every query, verdict, and rationale, and a priority list: for each risk the likely cause is identified and the effect of fixing it is simulated, and risks are ranked by that simulated improvement |

### 4. Two tracks

| | Pre-launch | Periodic |
| --- | --- | --- |
| Purpose | confirm the agreed guardrail spec works as intended on real responses | watch safety drift as the model, data, or user behavior changes |
| Trigger | the internal launch review | a cycle fixed per agent |
| Queries | new, from the agent spec | part reused from the previous round for comparison; the new part expands last round's successful attacks and fills angles not yet covered |

### 5. Closing the loop

Results go back to the product team as a report and as per-query drill-down. Findings are triaged with the team, disagreements come through a formal feedback channel, and that feedback becomes labeled data for the next judge revision. The gap between the company-wide standard and each product team's own criteria is expected; the channel exists to turn it into improvements to the framework.
