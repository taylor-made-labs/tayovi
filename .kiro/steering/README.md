# Tayovi Steering Map

Read these files before planning features or writing specs.

1. [`00-bsa-context-rules.md`](00-bsa-context-rules.md) defines how agents preserve decisions, research, and shared context.
2. [`product-vision.md`](product-vision.md) records the approved product vision, users, boundaries, and open product questions.
3. [`a2ui-foundation.md`](a2ui-foundation.md) records verified A2UI capabilities, versions, project decisions, missing pieces, and build boundaries.
4. [`component-model.md`](component-model.md) defines Tayovi's one A2UI artifact model, capability policy, host contract, trust stages, activation, and rollback.
5. [`example-app.md`](example-app.md) defines the two-example hackathon rule, Mira's role, and the separate second example.
6. [`suite-delivery-method.md`](suite-delivery-method.md) defines roles, decision rights, shared contracts, spec flow, parallel delivery, and integration gates.
7. [`question-triage.md`](question-triage.md) separates product-owner questions from Spec Builder and contract questions.
8. [`tracer-feature-map.md`](tracer-feature-map.md) records the approved JSON-only tracer features, two example integrations, contracts, guardrails, and exclusions.

## Companion visual

[`../../docs/tayovi-system-map.html`](../../docs/tayovi-system-map.html) explains the suite, delivery flow, runtime boundaries, and Mira dogfooding as an interactive system map.

## Authority

- The product owner's latest approved decision wins.
- A more specific product or contract rule wins over general guidance.
- When files conflict, stop and ask which rule should remain.
- Update the affected files together after that decision.

## Before Spec Builder

Confirm that:

- the product question is settled;
- the feature has one owner repository;
- affected shared contracts are approved;
- the A2UI boundary has been checked;
- the feature's completion test is concrete; and
- the Spec Builder brief names every relevant steering file.
