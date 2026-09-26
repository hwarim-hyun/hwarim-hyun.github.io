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
  - { value: "2.2×", label: "risk categories evaluated" }
links:
  - { label: "AI Safety Progress Report 2026 (Korean)", href: "https://www.navercorp.com/media/aiInNaver/buildingAiDetail?seq=10034660", icon: paper }
  - { label: "Press (Asia Today)", href: "https://en.asiatoday.co.kr/view.php?key=20260916000947283", icon: web }
  - { label: "Press (Maeil Business)", href: "https://www.mk.co.kr/en/it/12154170", icon: web }
thumbnail: "/images/projects/thumbs/safety-evaluation-platform.jpg"
thumbnailTall: "/images/projects/thumbs/safety-evaluation-platform-tall.jpg"
featured: true
order: 1
---

## Summary

**Problem**
- **Background.** NAVER ships a growing number of AI agents, from conversational search to task agents. The AI Safety Center is the team responsible for evaluating all of them.
- **Motivation.** Model-level alignment does not always determine safety for users. The same model in a different agent, in front of different users, carries a different set of risks. So safety has to be measured where the agent meets its users.
- **Problem definition.** Evaluate NAVER's diverse AI agents against one universal standard, so results are comparable across agents: the same risk taxonomy and measurements both before and after launch as the agents change.
- **Challenges.** Each NAVER product team used to evaluate agent safety their own way, so results were not comparable. Manual review does not scale to tens of thousands of adversarial queries a round. A naive harm-only metric rewards the product that refuses everything.

**Actions**
- Built N-ASET (NAVER AI Safety Evaluation Toolkit), the automated internal toolkit that:
  - generates 200–300 adversarial queries per risk category
  - batches adversarial query execution when evaluating agents
  - grades responses with a judge LLM, with a rationale per verdict
  - reports risks ranked by the simulated effect of fixing each one
- Built the query-hardening step: each round's new queries expand the attack patterns that succeeded last time and open angles not yet covered, so attack strength keeps pace with the agent.
- Operate it as two tracks: a pre-launch evaluation wired into the internal launch review, and a periodic evaluation that tracks safety drift as the agent changes.
- Set evaluation metrics on two axes measured together, **harmfulness and helpfulness**, so that over-refusal counts as a defect rather than as safety.

**Results**
- The first N-ASET automated evaluation ran in April 2026. Tens of thousands of adversarial queries were evaluated across all of NAVER's AI agents.
- Against the manual process used through 2025, evaluation turnaround fell 80% while queries per round rose 5× and the number of risk categories covered grew 2.2×.
- The framework is described in NAVER's first AI Safety Progress Report (Sep 2026). NAVER is currently pursuing ISO/IEC 42001 certification for this AI management system.

## Engineering Details

### 1. Two axes, one verdict

Harmfulness asks whether a response contains something that can hurt the user. Helpfulness asks whether it answered the question in the right form, with the safety elements the question called for: a disclaimer, a pointer to a professional, or crisis resources. Measuring only the first makes refusal the winning strategy, so the two are always read together, and a refusal is graded on whether it gave a reason and offered the resources the user needed.

| Axis | Question asked of each response | Failure it catches |
| --- | --- | --- |
| Harmfulness | Does it contain content that can harm the user? | unsafe answers |
| Helpfulness | Does it answer appropriately, with the required safety elements? | over-refusal, missing or unnecessary disclaimers |

### 2. Risk taxonomy as evaluation scope

Before each evaluation, the agent's specification is mapped against N-ARTI (NAVER AI Risk Taxonomy & Identification), the company-wide risk taxonomy of 110 items: who the users are, which model and data it uses, what tools it can call, whether minors can reach it, whether it touches health, finance, or law. That mapping sets the risk categories and their priority. Each item has its own evaluation criterion, and N-ASET evaluates them. Setting the scope this way first makes the result a measurement against an agreed standard rather than an opinion.

### 3. Pipeline

| Stage | What N-ASET does |
| --- | --- |
| Generate | Adversarial queries per risk category, shaped to the agent's context; tens of thousands per round |
| Execute | Run them against the agent in batches |
| Grade | A judge LLM per criterion returns harmful / grey / safe on the harmfulness axis and a helpfulness verdict, each with a rationale; only judges that passed [accuracy verification against labeled data](/projects/evaluator-verification) are deployed |
| Report | Distribution of harm and helpfulness findings by risk category, drill-down to every query, verdict, and rationale, and a priority list: for each risk the likely cause is identified and the effect of fixing it is simulated, and risks are ranked by that simulated improvement |

### 4. Two tracks

| | Pre-launch | Periodic |
| --- | --- | --- |
| Purpose | confirm the agreed guardrail spec works as intended on real responses | watch safety drift as the model, data, or user behavior changes |
| Trigger | the internal launch review | a cycle set per agent |
| Queries | new, from the agent spec | part reused from the previous round for comparison; the rest new and hardened as described above |

### 5. Closing the loop

Results go back to the product team as a report and as per-query drill-down. Findings are triaged with the team, disagreements come through a formal feedback channel, and that feedback becomes labeled data for the next judge revision. The gap between the company-wide standard and each product team's own criteria is expected; the channel exists to turn it into improvements to the framework.
