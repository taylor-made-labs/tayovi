---
inclusion: always
---

# Tayovi Component Model and Trust Lifecycle

## Status

The product principles in this file were approved on November 12, 2026. Exact artifact schemas, host APIs, build tools, isolation methods, and capability names remain for Spec Builder and shared contract design.

## Product position

Tayovi uses one A2UI component and catalog model for both personalization and extensibility.

An end-user request may produce:

- a new arrangement of existing component instances;
- a reusable composition built from existing component implementations;
- a new component definition;
- a new or changed catalog function; or
- when host policy permits it, a new renderer implementation.

These are different artifact types within one component model. Tayovi must not create a separate plugin concept for executable extensions.

## What Paseo teaches

[Paseo's plugin system](https://paseo.sh/docs/plugins) shows a concrete lifecycle for asking an agent to extend a running application:

1. create a typed artifact;
2. build and test it;
3. integrate it through defined host registration points;
4. load or reload it;
5. expose its status, logs, enable switch, and removal controls; and
6. keep the artifact available across later runs.

Paseo plugins can add client and server contributions through a host SDK. They are trusted, unsandboxed code. A failed reload remains failed instead of restoring the previous working version automatically.

Tayovi should learn from Paseo's artifact, host API, build, load, status, and reload experience. Tayovi must not assume Paseo's trust model fits every host application. Tayovi must improve activation safety by preserving the current and last-known-good versions.

## One A2UI artifact family

Tayovi recognizes these related artifacts:

### Component definition

The A2UI catalog schema for a component. It defines its name, properties, children, actions, checks, placement rules, metadata, and protocol version.

A valid definition does not create a renderer implementation. It also does not prove implementation code is safe.

### Component composition

A reusable A2UI structure assembled from component definitions whose implementations the host already provides.

A composition may change layout, hierarchy, bindings, presentation, and reuse without adding executable renderer code.

### Catalog function

A typed A2UI function definition plus its host-supported implementation. Tayovi reuses A2UI caller and user-activation rules.

### Renderer implementation

Executable code that renders or adds behavior for a component definition. The host must support, register, and load it through a defined integration point.

A component schema and implementation must resolve under compatible catalog identity and version rules. Registration proves that the host can locate an implementation. Registration does not prove the implementation is safe.

### Evidence

Tests, build results, preview results, validation findings, requested capabilities, granted capabilities, and activation records belong to the same component version's lifecycle.

## Base catalog and personal catalog

The application builder publishes:

- the base A2UI catalog or supported catalog set;
- trusted renderer implementations;
- host data and action contracts;
- Tayovi invariants;
- capability policy;
- component creation and approval policy; and
- host registration and activation hooks.

The end user's agent creates a personal version derived from that base. The personal version may contain definitions, compositions, functions, implementation artifacts when permitted, tests, metadata, requested capabilities, granted capabilities, and version pointers.

Tayovi stores the delta from the application release rather than silently replacing the base. A base update remains pinned until the personal version is reconciled, previewed, and activated.

A2UI v1.0 may mix several catalogs on one surface. Tayovi should use that support where it avoids copying an entire base catalog.

## Capability model

A component version may declare capabilities it needs. A request never grants access.

- The application builder defines available capabilities and policy.
- The host decides whether a capability may be granted.
- The end user acts only within existing rights.
- The agent may request capabilities but cannot grant or redefine them.
- Requested capabilities and granted capabilities remain separate records.
- A changed implementation or capability request triggers a fresh policy check.
- The host may require builder review, end-user approval, both, or refusal.

The first generated-implementation release needs a deliberately small capability set. That set and its review policy remain a future product decision.

## Data and action boundary

Components receive scoped data and mediated actions through the host integration contract.

They do not receive raw credentials merely because they run locally. They do not gain unrestricted backend access through an A2UI schema or catalog registration.

The authoritative application service independently checks user, tenant, resource, and action permissions. UI checks improve experience but never replace service enforcement.

When an action requires confirmation, the host owns the confirmation surface and the resulting authority. Generated content cannot establish consent by stating that the user clicked or agreed.

## Validation and trust

Validation has ordered, replaceable stages:

1. A2UI protocol and catalog validation;
2. Tayovi invariant validation;
3. host compatibility and registration checks;
4. capability-policy evaluation;
5. implementation build and tests when code exists;
6. preview and behavior checks; and
7. trusted activation.

Passing an earlier stage does not imply passing a later stage. A valid A2UI payload does not establish that arbitrary renderer code is safe.

An isolated component runtime with a narrow message bridge is one web option to investigate. It is not a settled iframe requirement. An iframe and CSP alone must not be claimed to contain all arbitrary code and sensitive data safely.

The chosen trust and isolation model may differ by host application and capability risk.

## Activation lifecycle

Component versions move through explicit states:

**draft → validated → tested → previewed → active → disabled or superseded**

Activation uses a version pointer or equivalent atomic switch. It must not overwrite the active artifact in place.

- The current active version stays available until the replacement activates successfully.
- The last-known-good version is preserved.
- Failed build, load, registration, or activation leaves the current view intact.
- A component can be disabled without deleting its history.
- Rollback restores a known component and UI version.
- Permission checks run again when an implementation or requested capabilities change.
- Unknown future metadata survives read, delta, merge, and write operations.

## Interface rollback and business actions

Restoring a component, catalog, or UI version changes future interface behavior. It does not undo business actions already accepted by the authoritative application service.

If a business action itself is reversible, that reversal belongs to the application's own domain contract and confirmation flow.

Tayovi must label these two operations clearly and never imply that UI rollback reverses business data.

## Initial tracer boundary

The first Tayovi tracer is JSON-only. It uses existing trusted A2UI component implementations.

It proves:

1. receive a base A2UI definition and Tayovi contract;
2. request a personal change;
3. create a personal A2UI delta;
4. validate A2UI and Tayovi rules;
5. preview the proposed version;
6. activate it without replacing the prior version;
7. preserve it across visits;
8. inspect its history; and
9. roll back to the last-known-good UI version.

The tracer does not generate or load executable component implementations. Its artifact model, version pointers, host registry interface, validation stages, and metadata handling must leave a clear path for that later capability.

Mira demonstrates this tracer with existing trusted implementations. Mira must not build the full generated-code runtime or trust system.

## Host integration contract

A Tayovi-enabled web application must provide explicit integration for:

- supported A2UI catalogs and renderer implementations;
- base surfaces or surface sources;
- scoped data made available to components;
- mediated host actions;
- application invariants;
- capability definitions and policy;
- trusted confirmation flows;
- component registry and version lookup;
- validation, build, test, preview, activation, disable, and rollback hooks as applicable; and
- authoritative service enforcement.

Tayovi cannot assume arbitrary web applications already expose these seams. The contract must make adoption tractable while keeping host authority explicit.

## `browser-repos` role

`browser-repos` stores the user's component work and lifecycle evidence. Its scope may include:

- personal catalog and surface deltas;
- component definitions;
- reusable compositions;
- renderer implementation source or artifacts when permitted;
- tests and build evidence;
- requested and granted capability records;
- active and last-known-good version pointers;
- preview and activation records; and
- history and synchronization metadata.

The exact files, branches, commits, and merge rules belong to Spec Builder and contract design.

## Deferred product decision

Before generated renderer implementations become a release feature, the product owner must approve:

- which implementation capabilities are supported first;
- which risks require builder review;
- which risks permit end-user approval;
- which risks are always refused; and
- which host trust or isolation models Tayovi supports.

## Deferred to Spec Builder and shared contracts

- Artifact schemas for definitions, compositions, functions, implementations, and evidence.
- Catalog identity, version, compatibility, and base-update rules.
- Host registry and implementation loading interface.
- Atomic activation and last-known-good storage.
- Build, test, preview, disable, and rollback mechanics.
- Capability vocabulary, request and grant records, and renewed approval triggers.
- Scoped data and mediated action bridge.
- Trusted confirmation binding.
- Isolation options by supported web stack.
- Schema, parity, behavior, visual, and integration tests.
- Personal repository layout and merge behavior.

## Sources

- [Paseo plugin guide](https://paseo.sh/docs/plugins)
- [A2UI catalog guide](https://a2ui.org/guides/defining-a-catalog/)
- [A2UI v1.0 specification](https://a2ui.org/specification/v1.0-a2ui/)

Content was rephrased for compliance with licensing restrictions.
