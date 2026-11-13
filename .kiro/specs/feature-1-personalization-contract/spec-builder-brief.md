# Spec Builder Brief: A2UI Personalization Contract and Invariant Validation

## Status

Ready for the product owner to run through Spec Builder. This brief is not an approved feature spec and does not authorize implementation.

## Feature

**Feature 1: A2UI personalization contract and invariant validation**

**Owner repository:** `tayovi`

## Product outcome

An application builder can publish one machine-readable Tayovi contract for an A2UI application. The contract references the host's A2UI catalogs and surfaces while adding app-defined invariants, personalization policy, base-version identity, and personal-fork rules.

A proposed personal A2UI version receives deterministic, useful validation results. Tayovi must not replace A2UI's schemas, catalog model, validation, bindings, actions, functions, streaming, or rendering.

## Why this feature comes first

This contract defines the boundary used by the Tayovi template application, personal workspace, lifecycle, and personalization flow. Example applications may consume this boundary only through their own later specs. Feature 2 may be specified in parallel, but their shared version and evidence terms must agree before implementation.

## Required steering

Spec Builder must read and preserve:

- `../../steering/product-vision.md`
- `../../steering/a2ui-foundation.md`
- `../../steering/component-model.md`
- `../../steering/tracer-feature-map.md`
- `../../steering/question-triage.md`
- `../../steering/suite-delivery-method.md`

## In scope

The spec must define requirements, design, tasks, and acceptance checks for:

- a thin Tayovi contract that references A2UI v1.0 catalogs and surfaces;
- Tayovi metadata for app invariants, personalization policy, base identity, and personal-fork rules;
- use of A2UI v1.0 namespaced `metadata.extensions` where A2UI supports it;
- ordered validation stages that preserve standard A2UI validation;
- deterministic validation results with exact, actionable failures;
- preservation of unknown non-Tayovi and future metadata;
- host references for scoped data, mediated actions, and supported components;
- separation of capability requests from grants;
- contract versioning and compatibility rules needed by the tracer; and
- a runnable, reusable Tayovi template contract and validator;
- a generic Tayovi contract fixture with no example-domain content.

## JSON-only tracer boundary

The first tracer may personalize A2UI JSON using existing trusted renderer implementations. It may select and compose supported components, bind scoped data, and invoke host-approved actions.

The first tracer does not generate, build, install, or load executable renderer implementations. The contract must still preserve future seams for component definitions, functions, implementation artifacts, host registration, capability policy, and activation.

## Outside this feature

- Personal workspace storage and Git history.
- Preview, activation, disable, and rollback mechanics.
- The end-to-end personalization workflow.
- Any requirement, design, task, code, fixture, test, adapter, integration, configuration, data, or user journey for Mira or another example application.
- Any file change inside an example-application repository.
- Any acceptance check that runs or inspects an example application.
- Library extraction or a library-only hackathon package.
- A new UI, catalog, binding, action, function, or renderer protocol.
- A general validator that duplicates A2UI.
- Generated renderer implementation code.
- Implementation build or dynamic loading.
- A fixed iframe or full generated-code isolation model.
- Component sharing, publication, or marketplaces.

## Required validation order

The design must keep these stages distinct and replaceable:

1. A2UI protocol and catalog validation.
2. Tayovi invariant validation.
3. Host compatibility and registration checks.
4. Capability-policy evaluation where applicable.

Later stages may be represented by interfaces without implementing future executable-code behavior.

## Acceptance bar

The completed spec must make these outcomes testable:

1. A valid host contract references an A2UI v1.0 catalog and surface.
2. A valid personal A2UI version passes standard A2UI checks unchanged.
3. Missing or unsupported components fail with exact errors.
4. Broken references, placement rules, and function rules still fail through A2UI.
5. A protected Tayovi invariant cannot silently disappear.
6. A disallowed personal change fails without altering an active version.
7. Tayovi extensions survive parsing, validation, and serialization.
8. Unknown non-Tayovi extensions survive read and write operations.
9. Capability requests remain separate from grants.
10. The design can later reference registered implementation artifacts through a compatible contract version without creating a second contract family.
11. A stable generic fixture tests only the Tayovi template contract.
12. The entire spec remains free of example-application work.

## Spec Builder decisions

Spec Builder should resolve these technical questions without asking the product owner unless they expose a product trade-off:

- exact contract schema and extension keys;
- package layout and public interfaces;
- catalog and surface reference shape;
- identity and version formats;
- validation stage interfaces and error shape;
- compatibility and unknown-metadata handling;
- fixture layout;
- A2UI SDK package selection and exact pins; and
- unit, schema, contract, and compatibility tests.

## Shared contract checkpoint

Before implementation, the BSA and suite architect must review:

- A2UI v1.0 compatibility;
- terms shared with Feature 2;
- the host contract boundary;
- version and evidence vocabulary; and
- the generic Tayovi fixture used only by this feature.

## Spec Builder launch prompt

Use this brief to create one feature spec for **A2UI personalization contract and invariant validation**. Read every required steering file first. Produce requirements, design, tasks, and concrete acceptance checks only for the Tayovi template contract and validator. Keep A2UI v1.0 as the UI protocol and engine. Keep the Tayovi layer thin. Treat Tayovi as the runnable hackathon template application, not only a library. Do not specify, design, build, modify, integrate, configure, test, or provide fixtures for Mira or any other example application. Do not create or modify files in any example-application repository. Example applications belong only to their own later specs and development work. Do not implement code. Mark unresolved technical choices in the spec, but ask the product owner only when a choice changes product behavior, scope, policy, or risk.
