---
inclusion: always
---

# Tayovi Example Applications

## Status

The product owner approved two separately specified and developed example applications on November 12, 2026. Mira is the first approved example. The second example remains to be selected.

## Hackathon example rule

Tayovi ships as a runnable template application for the hackathon. Two distinct example applications must prove that template.

Each example owns its domain behavior, repository, steering, feature map, specs, development work, and acceptance evidence. Example work must not be folded into Tayovi's core feature specs.

Mira fills the first example slot. The second example will be chosen and specified separately. A later library package may reuse the same core, but it is not a substitute for the template application or either example.

## Identity and repository

- **Public name:** Mira
- **Repository:** [taylor-made-labs/mira](https://github.com/taylor-made-labs/mira)
- **License goal:** Open source and fully free
- **Product description:** A Jira-like work tracker that users can customize

## Product concept

Build Mira as an open-source, Jira-like web application whose users can personalize its look, layout, and information presentation through Tayovi.

The application has two jobs:

1. demonstrate Tayovi in a realistic product; and
2. become the team's own tracker while building the Tayovi suite.

Using the product to build itself is an acceptance strategy, not only a demo story. Real project work should expose weak requirements, broken flows, missing components, poor defaults, and upgrade problems before judging.

## Direct users

The example serves:

- software teams tracking work;
- individual builders managing projects;
- the Tayovi team dogfooding the suite; and
- app developers studying how to adopt Tayovi.

## Required demonstration

The example must show that an end user can:

- ask the in-app agent to change the interface;
- preview the proposed change;
- apply the change;
- keep it across later visits;
- inspect what changed;
- undo it; and
- continue using the tracker's trusted work-item behavior.

The app developer must be able to declare which tracker roles, actions, and data bindings personalization preserves.

## Dogfooding requirement

The team should use the tracker for real Tayovi suite work once its minimum tracking loop is usable.

Dogfooding should cover:

- product initiatives;
- repository-owned features;
- dependencies and shared contracts;
- current status and blockers;
- acceptance checks; and
- links to specs, repositories, changes, and integrated releases.

The tracker does not replace `.kiro/steering/`, specifications, source control, or acceptance evidence. It provides the working view across them.

## Shared human and agent use

Both people and agents must read and update the same canonical tracker state.

- People use human-friendly A2UI surfaces.
- Agents use MCP tools, resources, and committed change events.
- A2UI is the human-facing UI engine; MCP is the agent-facing machine interface.
- Changes appear across relevant surfaces after repository synchronization.
- The starter targets near-real-time refresh, not instant multi-client delivery.
- Each surface may render the same meaning differently for its user and context.
- Human and agent actions follow the same tracker rules and produce the same state changes.
- The tracker owns work-item business data; A2UI describes and updates its interfaces.
- Local Tayovi personalization changes presentation, not the canonical meaning of tracker records.

A purely local, human-only tracker cannot satisfy the dogfooding requirement. MCP is the approved agent interface. `browser-repos` and a shared remote Git branch are the approved starter storage and synchronization path.

Mira treats work items and typed relations as a graph. A hexagonal port-and-adapter design keeps that domain independent from graph, relational, document, file, or other storage providers.

## Scope principle

"Jira-like" describes the work-management problem, not Jira's full feature set. Mira is supporting proof, not the hackathon's core product. The first build must support only the smallest useful loop for tracking this suite and hosting Tayovi's later tracer.

Tayovi work takes priority whenever Mira scope competes with the submission's core contract, A2UI integration, persistent personalization flow, or judged evidence.

After Mira reaches the approved minimum dogfood outcome, do not add polish or features unless they unblock Tayovi, improve the judged end-to-end proof, or fix a failure found through real use.

The starter must not copy Jira's complete administration, reports, workflow builder, marketplace, or enterprise permission systems.

## Approved starter scope

Mira's starter serves one trusted team workspace. It supports human and agent participants without accounts, organizations, or complex permissions.

It uses a common work-item shape for initiatives, features, tasks, bugs, and decisions. Items carry status, priority, ownership, product, repository, hierarchy, typed relations, acceptance checks, artifact links, and activity history.

The workflow is **Backlog → In Progress → Review → Done**. Blocked is never a workflow state or standalone flag. Mira stores `parent-of`/`child-of`, `blocks`/`depends-on`, and symmetric `relates-to` relations. Each relation is stored once and its inverse label is derived.

The starter provides a board and item detail view. The board supports creating, editing, assigning, prioritizing, and moving items. Item details manage hierarchy, relations, artifact links, and acceptance checks. A list view is outside the starter. Roadmap and other views wait for evidence from dogfooding.

## A2UI tracer role

Mira's first Tayovi tracer is explicitly JSON-only. It uses existing trusted A2UI component implementations to prove request, validation, preview, activation, persistence, history, and UI rollback.

Mira does not build or load generated renderer implementations in the tracer. Its A2UI integration must preserve clear host seams for component definitions, implementation registration, version selection, metadata, scoped data, mediated actions, and future capability policy.

A failed tracer validation or activation must leave Mira's current view intact. UI rollback restores a prior interface version and does not reverse work-item actions already accepted by Mira's domain.

## Delivery process

Mira follows the same approved suite process as every product:

1. align its vision and boundaries with the product owner;
2. record approved decisions in Mira's local steering;
3. approve a short, ordered feature list;
4. prepare a BSA brief for each feature;
5. have the product owner run Spec Builder;
6. review each spec against suite and Mira steering;
7. ask the product owner before starting each orchestrator;
8. verify acceptance independently; and
9. integrate and dogfood the approved result.

No starter implementation begins from an informal prompt. The smallest usable tracker is still a specified feature with concrete acceptance checks.

## Bootstrapping constraint

The tracker must become usable early enough to support later suite work. Its delivery order must avoid depending on every final Tayovi capability before dogfooding can begin.

A likely sequence is:

1. establish the minimum trusted tracking behavior;
2. use it for real suite work;
3. add the A2UI base surface;
4. integrate the JSON-only Tayovi tracer using trusted implementations;
5. prove validation, preview, activation, persistence, history, and UI rollback; and
6. preserve host seams for later component implementations without building that runtime.

This sequence is a recommendation, not yet an approved feature list.

## Question queue

Mira's minimum dogfood outcome and four-feature map are approved. Remaining technical questions belong to Spec Builder and shared contract work.
