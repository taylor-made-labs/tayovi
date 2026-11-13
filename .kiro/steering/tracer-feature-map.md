---
inclusion: always
---

# Tayovi JSON-Only Tracer Feature Map

## Status

**Approved by the product owner on November 12, 2026, and amended the same day to require a template application with two separate examples.** No implementation begins from this map. Each approved feature receives its own Spec Builder brief, reviewed spec, and authorized orchestrator.

## Approved tracer outcome

An application builder can expose an A2UI interface through a thin Tayovi personalization contract. An end user's agent can derive a personal JSON-only A2UI version, validate it, preview it, activate it, keep it across visits, inspect its history, and roll back safely. The tracer uses existing trusted renderer implementations.

## Hackathon package

Tayovi ships as a runnable template application for the hackathon. It is not delivered only as an importable library.

Two separately specified and developed example applications must prove the template. Mira is the first example. The second example will be selected and scoped separately. Both use the same Tayovi host contract and lifecycle seams, while keeping their domain behavior outside Tayovi's core features.

A later release may extract or package the shared core as a library. That option must not replace the template application or either hackathon example.

## What JSON-only means

JSON-only limits the first tracer's personal artifacts, not Tayovi's long-term component model. The user's agent may create or change A2UI JSON that selects existing trusted components and describes their layout, nesting, supported properties, data bindings, and host-approved actions.

The tracer proves this path:

**User intent → personal A2UI JSON → validation → preview → activation**

The host's existing trusted A2UI renderer implementations render the accepted JSON. The personal version may use only components, data, and actions exposed through the host contract.

This scope keeps A2UI as the UI engine, proves Tayovi's contract and lifecycle first, and avoids introducing a second component system. It also keeps the tracer small by deferring the security, build, and runtime questions created by new executable code.

For this tracer, JSON-only excludes:

- generating new React, Lit, Angular, JavaScript, or TypeScript renderer implementations;
- installing packages or running component build and bundle steps;
- dynamically loading newly generated executable code;
- defining the trust, isolation, and runtime-permission model for generated code; and
- publishing or sharing personal components.

JSON-only does not remove normal A2UI behavior. Personal versions may still compose components, bind scoped data, and invoke mediated host actions allowed by the contract. A later Tayovi feature may add executable component implementations without replacing this artifact and lifecycle model.

## Delivery order

**Features 1 and 2 may begin together → Feature 3 → Features 4 and 5 may begin separately**

### Feature 1: A2UI personalization contract and invariant validation

Tayovi defines the thin, OpenAPI-inspired contract that references host A2UI catalogs and surfaces while adding app-defined invariants, personalization policy, base-version identity, and personal-fork rules.

**Done looks like:** A host can publish one machine-readable Tayovi contract, and deterministic validation clearly accepts or rejects a proposed A2UI personal version without replacing A2UI's own schemas or validator.

**Owner repository:** `tayovi`

**Depends on:** A2UI v1.0 catalog, metadata extension, validation, and version contracts.

### Feature 2: Personal component workspace and version lifecycle

Tayovi uses `browser-repos` to create and reopen one user-and-application workspace for personal component artifacts and lifecycle evidence.

**Done looks like:** Draft, active, and last-known-good JSON-only A2UI versions remain distinct; history survives reopening; failed activation preserves the active version; and disable or rollback never deletes prior evidence.

**Owner repository:** `tayovi`

**Depends on:** A reviewed `browser-repos` compatibility contract.

### Feature 3: JSON-only personalization workflow

Tayovi connects user intent, the host contract, standard A2UI generation, ordered validation, preview, activation, history, and UI rollback into one tracer flow.

**Done looks like:** A user request produces a personal A2UI change using existing trusted component implementations, shows validation failures without changing the current view, previews the accepted version, activates it atomically, and restores the last-known-good UI on rollback.

**Owner repository:** `tayovi`

**Depends on:** Features 1 and 2.

### Feature 4: Mira tracer integration

Mira acts as the smallest real host for Tayovi. It exposes its existing trusted A2UI components, host actions, data scopes, invariants, and version-activation seam through the Tayovi contract.

**Done looks like:** A user personalizes one Mira surface through the full Tayovi tracer, keeps the change across reloads, reviews and rolls it back, while Mira's trusted work behavior remains intact and its host seam can later register new component implementations.

**Owner repository:** `mira`

**Depends on:** Feature 3 and one reviewed Tayovi-to-Mira host contract.

### Feature 5: Second example tracer integration

A second, distinct example application proves that Tayovi's template and host contract are reusable beyond Mira. The example's product purpose, repository, scope, and feature map will be approved separately before its Spec Builder brief.

**Done looks like:** A user personalizes one surface in the second example through the same Tayovi tracer contract and lifecycle, while that application's trusted domain behavior stays separate from Tayovi.

**Owner repository:** To be selected before the feature brief.

**Depends on:** Feature 3, selection of the second example, and one reviewed Tayovi-to-example host contract.

This feature owns only Tayovi integration for the second example. The example application's own domain features require separate specs and development work.

## Required shared contracts

Before parallel implementation, settle only the boundaries each team needs:

- A2UI v1.0 catalog and metadata-extension compatibility.
- Tayovi host contract for base catalogs, surfaces, scoped data, mediated actions, invariants, and version activation.
- `browser-repos` workspace, history, and synchronization compatibility.
- Tayovi-to-example tracer fixtures and acceptance journeys for both examples.

Exact schemas, interfaces, packages, paths, algorithms, and tests belong to Spec Builder and contract design.

## Tracer architecture guardrails

The tracer must:

- keep A2UI as the component, catalog, validation, binding, action, streaming, and rendering engine;
- use one artifact model for compositions and later implementations;
- preserve unknown future artifact metadata during read and write operations;
- keep component registration behind a host interface;
- keep validation as ordered, replaceable stages;
- store drafts separately from active versions;
- activate through an atomic version pointer or equivalent seam;
- preserve the current and last-known-good versions;
- leave the current view intact after failed validation or activation;
- keep capability requests separate from grants;
- route actions through host-owned contracts;
- use host-owned confirmation for sensitive actions; and
- distinguish UI rollback from reversal of completed business actions.

## Explicitly outside the tracer

- Generated renderer implementation code.
- Implementation build or dynamic loading.
- A full component trust or isolation runtime.
- A fixed iframe requirement.
- New backend business behavior.
- Raw credentials or unrestricted backend access for components.
- Component publication, sharing, marketplace, or moderation.
- Native cross-platform implementation generation.
- Example-application domain features or polish beyond their separate approved specs.
- Replacing the required template application with a library-only package.
- A new UI, action, binding, catalog, or validation protocol beside A2UI.

## Future capability preserved, not implemented

A later Tayovi feature may allow new component definitions and renderer implementations through the same component model. That future feature must decide supported capabilities, policy, review, isolation, build, load, registration, disable, and rollback.

The tracer is acceptable only if it does not force all future artifacts to be JSON-only or prevent a host from registering implementation artifacts later.
