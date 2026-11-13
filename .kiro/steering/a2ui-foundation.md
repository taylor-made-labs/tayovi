---
inclusion: always
---

# A2UI Foundation for Tayovi

## Purpose

This file records what A2UI already provides, what Tayovi should reuse, and what Tayovi still needs to build. It prevents repeated research and keeps specs from recreating A2UI features.

**Verified:** November 11, 2026

## Executive guidance

Tayovi should remain a thin A2UI personalization contract and lifecycle, not a competing UI protocol or renderer.

A2UI must do the heavy lifting. Reuse its messages, catalogs, schemas, bindings, actions, functions, standard validation, accessibility, capability exchange, rendering, and metadata extensions before adding Tayovi behavior.

Tayovi's contract plays an OpenAPI-like role for personalization. It references the application's A2UI definition and adds only application invariants, personalization policy, base-version identity, and personal-fork rules that A2UI does not provide itself. This analogy does not mean using OpenAPI syntax.

The user's agent forks and iterates on a personal A2UI version. `browser-repos` supplies the workspace and version-control tools that make this practical.

Add only the persistence, user-owned catalog workflow, invariant meaning, review history, and update lifecycle required for lasting end-user personalization.

Keep protocol versions and package versions distinct. A package numbered `0.x` may still implement protocol v1.0.

## Verified A2UI status

[A2UI v1.0](https://a2ui.org/specification/v1.0-a2ui/) is the current protocol. Version v0.9.1 is previous, v0.9 is previous, and v0.8 is deprecated.

A2UI is a declarative JSON protocol. An agent streams surface structure and data changes. A client renderer maps catalog entries to native framework components. The wire format does not carry arbitrary HTML, CSS, or executable scripts.

The official [SDK guide](https://a2ui.org/concepts/sdks/) divides the system into:

- a Core SDK for protocol models, catalog loading, validation, surface state, bindings, expressions, and checks;
- an Agent SDK for catalog negotiation, prompt generation, output compilation, and pre-send validation; and
- Renderer SDKs for native framework components, actions, accessibility, and local functions.

## Verified package versions

These are registry versions checked on November 11, 2026. They are observations, not permanent pins.

### Web and TypeScript

- [`@a2ui/web_core`](https://www.npmjs.com/package/@a2ui/web_core): `0.15.0`; includes an explicit `v1_0` export.
- [`@a2ui/react`](https://www.npmjs.com/package/@a2ui/react): `0.15.0`; depends on `@a2ui/web_core ^0.15.0`.
- [`@a2ui/lit`](https://www.npmjs.com/package/@a2ui/lit): `0.15.0`; depends on `@a2ui/web_core ^0.15.0`.
- [`@a2ui/angular`](https://www.npmjs.com/package/@a2ui/angular): `0.14.0`; depends on `@a2ui/web_core ^0.15.0`.
- [`@a2ui/agent`](https://www.npmjs.com/package/@a2ui/agent): `0.1.0`; depends on `@a2ui/web_core ^0.15.0`.

### Python

- [`a2ui-core`](https://pypi.org/project/a2ui-core/): `0.6.0`.
- [`a2ui-agent-sdk`](https://pypi.org/project/a2ui-agent-sdk/): `0.11.0`.

### Dart and Flutter

- [`a2ui_core`](https://pub.dev/packages/a2ui_core): `0.7.0`.
- [`a2ui_agent`](https://pub.dev/packages/a2ui_agent): `0.3.0`.
- [`a2ui_flutter`](https://pub.dev/packages/a2ui_flutter): `0.3.0`; depends on `a2ui_core ^0.7.0`.

### Other platforms

The official SDK guide says Swift Core and SwiftUI support v1.0. AndroidX Jetpack Compose currently targets v0.9.1. Exact Swift and Android artifact versions were not verified for this project because the first target is browser-based.

### CLI

The latest GitHub release observed was [A2UI CLI v0.3.0](https://github.com/a2ui-project/a2ui/releases/tag/cli-v0.3.0). It includes catalog linting and requires Dart `a2ui_core ^0.7.0`.

## What A2UI already provides

### Streaming surface lifecycle

A2UI v1.0 defines standard messages to:

- create a surface;
- add or replace components;
- add or replace data-model values;
- remove a surface;
- call approved renderer functions;
- call agent functions; and
- return typed function results.

Tayovi should use these messages unchanged.

### Catalog contract

An [A2UI catalog](https://a2ui.org/concepts/catalogs/) is a JSON Schema contract shared by the agent and renderer. It defines:

- component names and properties;
- required and optional values;
- dynamic value types;
- child references and list templates;
- allowed parent and child placements;
- action shapes;
- function names, arguments, return types, and caller rules;
- prompt instructions; and
- extension metadata.

The Agent SDK uses the catalog to teach and constrain the model. The Core SDK validates generated output. The renderer pairs each catalog definition with code that draws the component.

Tayovi must not create another component-schema format.

### Built-in component set

The v1.0 Basic Catalog contains general layout, display, media, and input components. These include rows, columns, lists, cards, tabs, modals, text, images, icons, video, audio, buttons, text fields, checkboxes, choices, sliders, dates, and dividers.

It also contains common formatting, boolean, validation, and URL functions.

Tayovi should compose these before adding new component types.

### Data model and bindings

A2UI gives each surface a JSON data model. Components may read values through JSON Pointer bindings. Inputs may update local surface state through two-way bindings. Lists may repeat templates over data arrays.

Tayovi should use A2UI bindings for display and interface state. Application business data remains owned by the host application.

### Actions and functions

A2UI actions may send an event to the agent or call a registered function. A2UI v1.0 supports renderer-side and agent-side functions, typed arguments, typed results, allowed callers, and user-activation requirements.

Tayovi should expose host behavior through these standard contracts. It should not invent a second event or function protocol.

### Validation and integrity

A2UI already validates:

- message and catalog schemas;
- component property types;
- required properties;
- component identifiers;
- parent and child references;
- placement constraints;
- tree reachability and cycles;
- function arguments and caller rules; and
- component input checks.

The official Core and Agent SDKs can return errors before invalid output reaches the renderer. Tayovi should feed these errors back to the customization agent.

### Accessibility

A2UI v1.0 provides component accessibility metadata for labels, descriptions, live regions, and hidden state. Official renderers map this metadata to host accessibility systems.

Tayovi should preserve and validate these attributes rather than creating parallel accessibility fields.

### Catalog negotiation and mixing

Renderers advertise supported catalog IDs. Agents choose supported catalogs. A2UI v1.0 can mix components from several catalogs on one surface.

This supports an application-builder base catalog and a separate end-user catalog. A literal full copy may not be necessary. Tayovi can store a user-owned delta and register both catalogs locally.

### Metadata extensions

A2UI v1.0 provides namespaced `metadata.extensions` at catalog, surface, component, component-definition, and action scopes.

Tayovi should put its additional invariant markers and personalization metadata inside these extension containers. Third-party extension names must use a distinct prefix. Keys beginning with `a2ui_` are reserved for A2UI itself.

A normal A2UI renderer may ignore an unknown Tayovi extension. A Tayovi-aware validator must interpret and enforce it.

### Custom components and one artifact model

A custom A2UI component definition needs a matching renderer implementation before a host can render that component type. The definition and implementation must resolve under compatible catalog identity and version rules.

A2UI also supports reusable compositions of existing implemented components. Tayovi treats definitions, compositions, functions, and renderer implementations as one A2UI component artifact family with different lifecycle and trust requirements.

A2UI v1.0 can use multiple catalogs on one surface. Catalog identifiers should include a new version when compatibility breaks. A v1.0 catalog is self-contained and cannot reference private definitions from another catalog.

On the web, [Universal Web Components](https://a2ui.org/guides/authoring-universal-components/) can help one implementation work across React, Lit, and Angular.

Catalog validation and registration prove schema and host compatibility. They do not establish that arbitrary implementation code is safe. Tayovi owns artifact activation, capability policy, evidence, last-known-good recovery, disable, and rollback around the A2UI model.

Today, native cross-platform custom components still need native implementations. Declarative cross-platform primitives and a shared-logic sandbox remain on the [A2UI roadmap](https://a2ui.org/roadmap/), not in the current protocol.

### Evaluation and tools

A2UI already offers:

- catalog code generation;
- catalog linting;
- schema and structure validation;
- conformance suites;
- an evaluation framework using deterministic checks and optional model judging; and
- visual tools such as Composer and Inspector.

Tayovi should reuse these tools where they fit.

## What A2UI does not provide for Tayovi

A2UI does not currently provide the full persistent personalization product.

It does not define:

- durable per-user storage across visits;
- one customization workspace per user and application;
- Git branches, commits, diffs, history, or undo;
- a user-owned catalog delta from an application release;
- merging a personal catalog with a newer base catalog;
- product-specific invariants spanning an entire surface;
- a request, preview, review, apply, save, reload, and undo workflow;
- app-builder policy modes for custom component creation;
- generated component code review and testing workflow;
- sharing, trust, moderation, or removal of community components;
- user identity or account synchronization;
- host application authorization and business rules; or
- a promise that generated executable component code is safe;
- artifact activation, disable, last-known-good, or rollback policy;
- requested-versus-granted capability records;
- host component registration and implementation loading;
- trusted confirmation for sensitive host actions; or
- reversal of business actions through UI rollback.

Those are Tayovi's possible responsibilities.

## Approved Tayovi use of A2UI

The following project decisions are approved:

- A2UI remains the interface format.
- Tayovi extends A2UI rather than replacing it.
- The application builder publishes the base catalog and renderer implementations.
- An end user may derive a personal catalog locally.
- The personal repository stores only customization deltas.
- `browser-repos` provides the local multi-repository Git workspace.
- Application business data remains in its normal system.
- Base catalog updates stay pinned until previewed and applied.
- Request-only is the default custom-component policy.
- Builder-review and end-user opt-in policies are also supported.
- Generated local code gets warnings, review, tests, preview, explicit apply, history, and undo.
- Tayovi does not promise perfect safety for user-approved generated code.
- Component sharing is a later, optional layer.
- Additional invariant rules use A2UI metadata extensions.
- A2UI components remain the single model for arrangements, compositions, definitions, functions, and later renderer implementations.
- Requested capabilities never grant access; host policy and authoritative services remain in control.
- The first tracer is JSON-only and uses existing trusted implementations.
- The tracer preserves host registry, version, metadata, and activation seams for later implementations.

## Recommended implementation boundary

The recommended path is:

1. Receive the application builder's base catalog and current A2UI surface.
2. Receive only the data paths and actions the host application exposes.
3. Read Tayovi invariant metadata from A2UI extensions.
4. Let the customization agent propose standard A2UI changes first.
5. Validate the result with the matching A2UI v1.0 schemas and catalog.
6. Validate Tayovi extension rules across the resulting surface.
7. Store the customization delta and evidence in `browser-repos`.
8. Preview the proposed version without replacing the active version.
9. Apply only after the end user approves.
10. Keep the prior commit available for undo.
11. Use generated renderer code only when the active policy permits it.
12. Keep sharing outside the initial implementation.

## Recommended web package boundary

Because the project is browser-first, `@a2ui/web_core` should be the shared A2UI engine. Renderer framework code should remain behind an adapter.

Do not choose React, Lit, or Angular merely because one example exists. Choose the example renderer after the product example and integration needs are approved.

When packages are chosen:

- pin exact versions;
- record the supported protocol as v1.0 separately;
- import explicit v1.0 APIs where the SDK provides them;
- run a small compatibility proof before committing the design; and
- verify registry versions again before the spec and release lock.

## Important boundary tests

Specs should prove that:

- standard A2UI validation still runs unchanged;
- unsupported components are rejected clearly;
- broken component references are rejected;
- built-in placement and function rules still work;
- Tayovi extensions survive A2UI parsing and updates;
- unknown non-Tayovi extensions remain compatible;
- required Tayovi invariants cannot silently disappear;
- personalization storage contains no application business data;
- a saved delta reproduces the approved interface;
- undo restores the previous approved version;
- a base catalog update does not alter a personal catalog silently; and
- package versions used by the example really support protocol v1.0.

## Do not build

Unless later requirements prove otherwise, Tayovi should not build:

- a new UI wire protocol;
- another catalog schema;
- another data-binding language;
- another action or function protocol;
- another general A2UI renderer;
- another basic component library;
- another catalog negotiation protocol;
- another general schema validator;
- native cross-platform component generation; or
- component sharing and marketplace systems.

## Question queue

Questions from this research are classified in [`question-triage.md`](question-triage.md). Technical choices belong in Spec Builder briefs or shared contract work unless they expose a product trade-off.

## Primary sources

- [A2UI v1.0 specification](https://a2ui.org/specification/v1.0-a2ui/)
- [A2UI SDK guide](https://a2ui.org/concepts/sdks/)
- [A2UI catalog concepts](https://a2ui.org/concepts/catalogs/)
- [Defining an A2UI catalog](https://a2ui.org/guides/defining-a-catalog/)
- [A2UI data binding](https://a2ui.org/concepts/data-binding/)
- [A2UI actions and functions](https://a2ui.org/concepts/actions-and-functions/)
- [A2UI roadmap](https://a2ui.org/roadmap/)
- [A2UI GitHub repository](https://github.com/a2ui-project/a2ui)
- [npm registry](https://www.npmjs.com/org/a2ui)
- [PyPI package index](https://pypi.org/search/?q=a2ui)
- [pub.dev A2UI packages](https://pub.dev/publishers/a2ui.org/packages)

Content was rephrased for compliance with licensing restrictions.
