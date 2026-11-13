---
inclusion: always
---

# Tayovi Suite Delivery Method

## Status

Approved by the product owner on November 11, 2026.

## Purpose

This method keeps many products, repositories, specs, and agent teams aligned around one product vision. It supports parallel delivery without making the product owner coordinate agents or repeat decisions.

## Operating model

The delivery path is:

**Intent → suite decision → shared contracts → repository specs → parallel builds → integration → release**

One BSA is the product owner's main point of contact. Each repository team owns local implementation within approved product and contract boundaries.

## Roles and decision rights

### Product owner

The product owner decides:

- product outcomes and priorities;
- user-facing scope and trade-offs;
- conflicts between product goals;
- whether each approved spec may enter implementation; and
- release acceptance when a human judgment is required.

When the product owner must act, the BSA provides the background, recommendation, impact of waiting, and ordered steps.

### BSA

The BSA:

- interviews the product owner in small rounds;
- recommends an answer with each question;
- records every approved product decision in steering;
- owns the suite feature map and dependency view;
- turns initiatives into small repository-owned features;
- prepares Spec Builder briefs;
- reviews specs against suite and repository steering;
- identifies conflicts and asks which decision wins;
- carries approved changes to every affected team; and
- reports integrated outcomes and human-only decisions.

The BSA does not write application code or decide local implementation details.

### Pre-spec worker sessions

The BSA may use worker chat sessions before specifications exist. Suitable work includes repository inspection, source research, product analysis, option comparison, dependency mapping, draft contracts, risk review, and checking steering for gaps.

Pre-spec workers support the BSA; they do not replace product-owner decisions. They may not start application implementation before an approved spec and build authorization. The BSA verifies useful findings and records load-bearing results in steering.

Use workers when they reduce delay or context load. Do not create workers merely to imitate a large team.

### Suite architect

The suite architect owns shared technical boundaries, cross-repository contracts, compatibility rules, and architecture decision records. The architect reviews changes that affect more than one repository, not every local code choice.

### Repository delivery team

One orchestrator owns each approved spec. Its team may decide local details that preserve steering, contracts, and acceptance criteria. A repository team may not silently change product intent or a shared contract.

### Integration lead

The integration lead maintains a tested set of compatible repository versions and verifies shared user journeys across the suite.

### Independent reviewer

A reviewer verifies acceptance evidence. A builder's completion claim is not acceptance.

These are responsibility roles. They do not require standing meetings or permanent agent sessions.

## Sources of truth

### Suite control repository

A small suite control repository contains no product code. It holds:

- suite vision and users;
- product and repository map;
- shared vocabulary and principles;
- cross-repository contracts;
- supported version sets;
- architecture decisions;
- active initiatives and outcome checks; and
- integrated release roadmap.

### Product repositories

Each product repository contains:

- a pinned snapshot of relevant suite steering;
- product-specific steering;
- approved feature specs;
- local architecture decisions; and
- tests proving local and shared contracts.

Chat is not a source of truth. Approved decisions must reach steering before teams rely on them.

## Work hierarchy

- An **initiative** is one user outcome that may span products.
- A **feature** is one testable part owned by one repository.
- A **contract** defines how repositories interact.
- A **spec** defines one feature's requirements, design, tasks, and acceptance checks.

One feature fits one spec and one orchestrator. A cross-repository initiative must not become one giant spec.

## Delivery loop

1. The product owner explains intent to the BSA.
2. The BSA asks one to three questions per round, with recommendations.
3. The BSA records approved decisions in suite steering.
4. Affected repositories receive their matching local steering.
5. The BSA proposes an ordered feature and dependency map.
6. The product owner approves or edits that map.
7. Shared contracts and compatibility rules are settled before parallel work.
8. The BSA prepares one Spec Builder brief per feature.
9. The product owner runs Spec Builder in the owning repository.
10. The BSA reviews the spec against steering and shared contracts.
11. The product owner approves the spec and each orchestrator start.
12. Repository teams build in parallel against approved contracts and mocks.
13. Local tests and shared contract tests run with every change.
14. The integration lead assembles pinned versions and verifies user journeys.
15. The BSA validates the product outcome against acceptance evidence.
16. Steering, specs, version records, and release notes are updated together.

## Change routing

- Local implementation decisions belong to the repository team.
- Shared technical decisions belong to the suite architect and affected teams.
- Product meaning belongs to the product owner and BSA.
- A changed product decision is written before affected teams continue.
- A changed shared contract requires an architecture decision record and affected-team review.
- A spec that conflicts with steering returns for correction before implementation.

## Delivery controls

- Work in small integration slices.
- Keep no more than two cross-repository initiatives active at once.
- Allow many agents only within those bounded initiatives.
- Integrate throughout delivery, not only after repository work ends.
- Use contract tests so teams can verify compatibility independently.
- Keep one working suite example using pinned repository versions.
- Track decision age, integration failures, contract test results, and lead time.
- Judge progress by integrated outcomes, not agent count or code volume.

## Quality gates

A feature is ready to build only when:

- its product purpose is approved;
- its owner repository is named;
- affected contracts are approved;
- its spec matches steering; and
- its acceptance checks are concrete.

A suite release is ready only when:

- every included feature passes independent acceptance;
- shared contract tests pass;
- integrated user journeys pass;
- compatible repository versions are recorded;
- steering and specs match shipped behavior; and
- suite documentation explains the coherent product story.

## Product-owner communication

The BSA asks the product owner only for decisions or actions that require human authority. Each request includes:

1. what is being decided or done;
2. why it matters now;
3. the BSA's recommended choice;
4. affected products and trade-offs;
5. what waiting blocks; and
6. exact ordered steps when the product owner must use a tool or interface.

Routine agent coordination, follow-up, status collection, and conflict detection belong to the BSA.
