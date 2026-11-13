---
inclusion: always
---

# Tayovi Question Triage

## Purpose

Keep product alignment fast. Ask the product owner only for product decisions. Move implementation questions into Spec Builder briefs or shared contract work.

This file is the canonical queue for questions discovered during vision alignment.

## The question gate

Before asking any question, the BSA must decide who should own it.

Ask the product owner during vision alignment only when the answer changes:

- who the product serves;
- which problem or outcome matters;
- visible product behavior;
- what is included or excluded;
- priority or delivery order;
- a policy, risk, or business trade-off;
- the meaning of success; or
- acceptance that requires human judgment.

Move the question to the deferred group when it asks:

- how code should be organized;
- which framework, package, database, or transport to use;
- the exact schema, file path, identifier, or event shape;
- how an algorithm, merge, retry, cache, or validator works;
- how a port or adapter is implemented;
- which tests prove an already-approved requirement;
- how to deploy or optimize the result; or
- another choice a technical team can make without changing product intent.

When uncertain, the BSA asks: **Would two sound implementations create the same user outcome?** If yes, defer the question.

## Speed rule

- Do not ask curiosity questions.
- Do not ask the product owner to design the implementation.
- Carry a recommended technical default into the Spec Builder brief.
- Use a pre-spec worker when evidence is needed, then make a recommendation.
- Ask only when alternatives change product value, scope, risk, or visible behavior.
- Declare vision alignment sufficient as soon as the feature map can be written safely.
- Do not wait for every technical question before proposing features.

## Ready-for-feature-map gate

A product is ready for its feature map when these are clear:

- target users;
- desired outcome;
- minimum useful experience;
- important product boundaries;
- human-owned policy choices;
- what success looks like;
- owning repository; and
- known cross-repository dependencies.

A feature is ready for a Spec Builder brief when its purpose, owner, scope, dependencies, and completion test are clear. Technical design may remain open.

## Questions still owned by the BSA

The JSON-only tracer map is approved with two separate example integrations.

Before the second example receives a feature brief, the product owner must choose its product purpose and repository. This does not block Tayovi Features 1 through 3 or Mira work.

A future generated-implementation feature requires a new product decision about supported capabilities and required builder or end-user approval.

## Already settled

- Tayovi is an A2UI-based personalization foundation.
- A2UI does the interface heavy lifting; Tayovi adds a thin OpenAPI-inspired personalization contract and lifecycle.
- The Tayovi contract references A2UI definitions and adds invariants, policy, base identity, and personal-fork rules.
- The user's agent forks and iterates on a personal A2UI version.
- `browser-repos` is necessary supporting workspace and version-control tooling.
- Mira is minimal supporting proof and cannot outrank Tayovi work.
- Mira serves one trusted workspace initially.
- People and agents share one canonical work graph.
- A2UI is Mira's human UI engine.
- MCP is Mira's agent interface.
- Mira uses a board and item details, without a list view.
- Mira uses Backlog, In Progress, Review, and Done.
- Mira's starter relations are parent, block, and related edges.
- Mira uses a graph domain behind ports and adapters.
- Mira's starter shares state through Git synchronization.
- Mira's minimum dogfood outcome and four-feature map are approved.
- Tayovi ships as a runnable template application for the hackathon, not only as a library.
- Two separately specified and developed example applications prove the template.
- Mira is the first example; the second example remains to be selected.
- The first Tayovi tracer is JSON-only and uses existing trusted implementations.
- The tracer must preserve future component definition, registry, capability, and activation seams.
- Every feature receives its own spec and authorized orchestrator.

## Deferred to Spec Builder or shared contract work

Do not ask the product owner these questions unless a later finding exposes a real product trade-off.

### Mira domain and storage

- What exact JSON files and directories represent nodes and edges?
- Should activity use one file per event or another format?
- Which identifier and version formats should items use?
- How are duplicate edges, self-edges, completed blockers, and cycles validated?
- How are deletions, tombstones, and restores represented?
- How are concurrent Git changes detected, merged, retried, or rejected?
- Which `browser-repos` APIs and exact package version are used?
- How are snapshots, indexes, or caches rebuilt?
- Which adapter contract tests prove storage neutrality?

### Mira MCP adapter

- Which exact MCP tools and resources are exposed?
- What are their input and output schemas?
- Which MCP SDK and transport are used?
- How do subscriptions or polling expose committed changes?
- How are domain conflicts returned to agents?
- How does the adapter authenticate later, without changing the starter scope?

### Mira A2UI web adapter

- Which web renderer and framework are used?
- What is the exact A2UI catalog and component tree?
- How do committed graph changes become A2UI updates?
- Which board and item-detail components are custom?
- Which accessibility and responsive tests are required?

### Tayovi foundation

- What artifact describes a reusable composition?
- What artifact describes an executable implementation?
- How are catalog identifiers and versions resolved?
- How does the host register implementation artifacts?
- How does activation switch atomically between versions?
- Where does the last-known-good pointer live?
- How are failed loads detected while preserving the active view?
- How are components disabled without deleting history?
- What capability vocabulary does the host expose?
- How are requested and granted capabilities compared?
- What implementation or capability changes force renewed approval?
- How are scoped data and mediated actions passed through the host contract?
- Which isolation model fits each supported web stack?
- How are trusted confirmations bound to real host actions?
- How do schema, parity, behavior, and visual tests compose?
- How does a personal catalog merge with base updates?
- What are the exact Tayovi metadata extension keys?
- Which A2UI SDK packages and exact versions are pinned?

### Shared contracts and delivery

- What package and protocol compatibility ranges are supported?
- What consumer-driven contract fixtures cross repository boundaries?
- How are compatible suite versions recorded?
- What CI jobs run local, contract, and integrated checks?
- How is the judged demo packaged and deployed?

## Maintenance rule

Add each new question to the correct section before asking it. Remove answered product questions after recording their decision in canonical steering. Keep deferred questions until their owning spec or contract resolves them.
