# Evaluation

> **Status:** TODO — stub. Will be filled in during MVP week 2 onwards, as the eval harness comes online.

The eval harness is what separates BetterLog from "an LLM that occasionally guesses about traces." Without it we can't measure whether diagnosis is improving or regressing, and we can't make a credible accuracy claim to design partners or investors.

## Planned contents

- Methodology for building the historical incident corpus from Wilco: source Slack threads, postmortems, support tickets, manually annotated.
- Schema for an eval case: input (question + workflow snapshot), expected answer (root cause + suggested action), grading rubric.
- Grading approach: hybrid of automated scoring (does the answer mention the correct root cause, the correct service, the correct suggested action) and human spot-checks.
- Regression tracking: how a CI step blocks deploys that drop accuracy below threshold.
- Cost and latency budgets per diagnosis, tracked alongside accuracy.
- Public reporting strategy: do we publish accuracy numbers? On what cadence?
- How the eval suite grows from 20 cases at MVP start to 100+ post-MVP as more incidents accumulate.

## Decisions to record here as they happen

- Whether to use LLM-as-judge for grading, or stick to keyword/structure matching plus human review.
- How to anonymize Wilco data in eval cases so the suite can eventually be shared with other design partners.
- How "good enough" is defined per question category — some questions (Q5 health check) need 95%+ accuracy, others (Q7 deploy correlation) can be less precise.
- Whether eval runs against live data or frozen snapshots (frozen for MVP, live exploration later).
