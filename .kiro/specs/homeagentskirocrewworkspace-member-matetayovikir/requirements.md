# Requirements: A2UI Personalization Contract and Invariant Validation

## Introduction

Feature 1 of the JSON-only tracer. Owner repository: `tayovi`.

An application builder publishes one machine-readable Tayovi contract for an A2UI v1.0 application. The contract references the host's A2UI catalogs and surfaces. It adds only what A2UI does not express: application invariants, personalization policy, base-version identity, and personal-fork rules.

A proposed personal A2UI version receives a deterministic validation result with exact, actionable failures. A2UI stays the UI protocol, catalog model, validator, binding model, action model, and renderer. Tayovi stays a thin layer around it.

For the hackathon, Tayovi is a runnable template application. This feature covers only the reusable Tayovi template contract and validator.

Mira and every other example application are separate products with separate specs and development work. This feature SHALL NOT specify, design, build, modify, integrate, configure, test, or provide fixtures for any example application.

This feature does not implement storage, preview, activation, rollback, or the end-to-end workflow. It does not generate, build, or load executable renderer code. A future library package may reuse this feature, but library extraction is not this feature's deliverable.

## Glossary

- **Contract**: the single Tayovi document a host publishes for one application.
- **Base version**: the host-released A2UI catalogs and surfaces a personal version derives from.
- **Personal version**: the fully materialized candidate A2UI JSON presented for validation, derived from one base version. Stored delta creation and application belong to later features.
- **Invariant**: an application rule a personal version must preserve (required role, protected binding or action, non-removable capability).
- **Validation stage**: one ordered, replaceable check step.
- **Finding**: one validation failure or warning with an exact location and reason.
- **Capability request / grant**: separate records; a request never grants access.

## Requirements

### Requirement 1: Publish one Tayovi contract

**User story:** As an application builder, I want to publish one machine-readable contract, so that personalization boundaries are explicit and checkable.

#### Acceptance Criteria

1. THE contract SHALL be one JSON document with a declared contract version.
2. THE contract SHALL reference at least one A2UI v1.0 catalog by identifier and at least one surface.
3. THE contract SHALL declare base-version identity for the referenced catalogs and surfaces.
4. THE contract SHALL declare which supported components, properties, layouts, bindings, compositions, and host actions a personal version may change.
5. THE contract SHALL declare personal-fork rules: what a personal version must pin and how it names its base.
6. WHEN a personal version omits or mismatches its declared base identity, THE validator SHALL reject it with an exact finding.
7. THE contract SHALL NOT redefine component schemas, bindings, actions, functions, or validation rules that A2UI already defines.
8. WHEN a contract is malformed, unversioned, or references an unknown catalog or surface, THE validator SHALL reject it with an exact finding.

### Requirement 2: Express invariants through A2UI metadata extensions

**User story:** As an application builder, I want invariants stored where A2UI allows extensions, so that standard tools keep working.

#### Acceptance Criteria

1. THE Tayovi invariants SHALL use A2UI v1.0 namespaced `metadata.extensions` at every scope the official A2UI v1.0 package supports for a rule: catalog, surface, component, and component-definition. The official package closes the action definition inside a component, so it carries no action-scope extension. Action-scope metadata exists only on the action message dispatched at run time, which is outside a personal version. Action rules therefore sit on the component and on the host contract's action list.
2. THE Tayovi extension names SHALL use a distinct Tayovi prefix and SHALL NOT use keys beginning with `a2ui_`.
3. THE invariants SHALL be able to mark required roles, protected bindings, protected actions, and non-removable capabilities.
4. A standard A2UI validator or renderer SHALL be able to ignore the Tayovi extensions without error.
5. THE Tayovi validator SHALL interpret the Tayovi namespace before any personal version is accepted.

### Requirement 3: Ordered, replaceable validation stages

**User story:** As an application builder, I want validation to run in a fixed order, so that failures are predictable and A2UI checks are never skipped.

#### Acceptance Criteria

1. THE validation SHALL run these stages in order: (1) A2UI protocol and catalog validation, (2) Tayovi invariant validation, (3) host compatibility and registration checks, (4) capability-policy evaluation.
2. Stage 1 SHALL be delegated unchanged to the official A2UI v1.0 validation; Tayovi SHALL NOT reimplement it.
3. EACH stage SHALL be replaceable behind a stable interface without changing the others.
4. WHEN a stage fails, THE result SHALL say which stage failed, and later stages SHALL be reported as not run.
5. THE stages for later future work (build, test, preview, activation) SHALL exist only as interface seams, with no executable-code behavior.
6. BEFORE Stage 1, THE validator SHALL parse the contract and resolve its version and references. WHEN this preflight fails, all four stages SHALL be reported as not run.

### Requirement 4: Deterministic, actionable results

**User story:** As an end user's agent, I want exact errors, so that I can fix a proposal and try again.

#### Acceptance Criteria

1. THE same complete validation input SHALL always produce the same result in the same order.
2. THE complete input SHALL include the contract, base version, fully materialized personal version, supported registry snapshot, capability-policy snapshot, and separate grant snapshot.
3. EACH finding SHALL include the stage, a stable code, a location (JSON Pointer or component id), and a human-readable reason.
4. THE result SHALL report overall accepted or rejected.
5. WHEN a personal version is rejected, THE validator SHALL NOT modify the personal version, any active version, or any stored data.
6. THE validator SHALL be a pure check: it reads inputs and returns a result.

### Requirement 5: Standard A2UI failures still fail

**User story:** As an application builder, I want A2UI rules to keep applying, so that Tayovi never weakens them.

#### Acceptance Criteria

1. WHEN a personal version uses a component not in the referenced catalogs or not supported by the host, THE validator SHALL reject it naming the component and the catalog.
2. WHEN a personal version has a broken component reference, a placement violation, or a function-rule violation, THE validator SHALL reject it through A2UI validation.
3. WHEN a personal version is valid A2UI and honors the contract, THE validator SHALL accept it with no Tayovi-added changes to the A2UI JSON.

### Requirement 6: Protected invariants cannot silently disappear

**User story:** As an application builder, I want protected behavior preserved, so that personalization cannot break trusted behavior.

#### Acceptance Criteria

1. WHEN a personal version removes a required role, protected binding, protected action, or non-removable capability, THE validator SHALL reject it naming the invariant.
2. WHEN a personal version deletes or alters a protected Tayovi invariant marker, THE validator SHALL reject it.
3. WHEN a personal version makes a change the personalization policy disallows, THE validator SHALL reject it naming the policy rule.
4. THE rejection of a disallowed change SHALL leave any active version untouched.

### Requirement 7: Preserve metadata

**User story:** As a future maintainer, I want unknown metadata kept, so that later features and other tools do not lose data.

#### Acceptance Criteria

1. THE Tayovi extensions SHALL survive parsing, validation, and serialization unchanged.
2. UNKNOWN non-Tayovi extensions SHALL survive read and write unchanged.
3. UNKNOWN future Tayovi metadata SHALL be preserved and SHALL NOT be silently treated as a known invariant. Unsupported critical Tayovi metadata SHALL cause rejection; other unknown Tayovi metadata SHALL produce an informational finding.

### Requirement 8: Host references

**User story:** As an application builder, I want to name what the host provides, so that personal versions use only approved data, actions, and components.

#### Acceptance Criteria

1. THE contract SHALL list supported components, scoped data paths, and host-mediated actions by reference.
2. WHEN a personal version binds data outside the scoped data, THE validator SHALL reject it naming the path.
3. WHEN a personal version invokes an action not listed as host-approved, THE validator SHALL reject it naming the action.
4. THE contract and personal version SHALL NOT contain credentials or copies of authoritative application business data. They MAY contain references to scoped host data and non-authoritative interface state.
5. SENSITIVE actions SHALL be marked as requiring host-owned confirmation; generated content SHALL NOT be able to supply consent.

### Requirement 9: Capabilities: requests separate from grants

**User story:** As an application builder, I want requests kept apart from grants, so that an agent can never grant itself access.

#### Acceptance Criteria

1. THE contract SHALL reference the host's available capability names and policy.
2. A personal version MAY carry capability requests; it SHALL NOT carry grants.
3. Authoritative grants SHALL remain in host-owned records supplied as validation input.
4. WHEN a personal version contains a grant, THE validator SHALL reject it.
5. FOR the JSON-only tracer, THE policy stage SHALL accept a request only when the supplied host policy and grant snapshot already satisfy it.
6. THE policy stage SHALL NOT create, widen, or imply a grant.

### Requirement 10: Versioning and compatibility

**User story:** As a team using the contract, I want clear version rules, so that parts evolve without surprise breaks.

#### Acceptance Criteria

1. THE contract SHALL carry its own version, separate from the A2UI protocol version (v1.0) and from package versions.
2. THE validator SHALL state which contract versions it supports and SHALL reject others with an exact finding.
3. THE Tayovi implementation project SHALL pin exact A2UI SDK package versions. Package pins SHALL remain separate from contract and protocol versions and SHALL be verified before the spec is locked.
4. A base update SHALL NOT silently change a personal version; a personal version SHALL name the base it was derived from.

### Requirement 11: Future seams without a second system

**User story:** As a product owner, I want the tracer to leave room for executable components, so that no rework is needed later.

#### Acceptance Criteria

1. THE contract family SHALL be able to add references to registered implementation artifacts later through a compatible contract-version change, without creating a second artifact or contract family.
2. THE contract SHALL use one artifact model for compositions and later implementations.
3. THE tracer SHALL NOT generate, build, install, or load executable renderer code.
4. THE contract SHALL NOT introduce a new UI, catalog, binding, action, function, or renderer protocol.

### Requirement 12: Tayovi contract fixture

**User story:** As a Tayovi template builder, I want a stable generic fixture, so that I can test the template contract without an example application.

#### Acceptance Criteria

1. THE feature SHALL ship a generic fixture set: one valid contract, one valid personal version, and rejected cases for each acceptance outcome.
2. THE fixture SHALL model only the Tayovi template contract and SHALL NOT model Mira or any other example application.
3. THE fixture SHALL use only generic, non-business example data.
4. A Tayovi contract test SHALL run the fixture through the validator and compare results to expected findings.
5. Example-application fixtures and tests SHALL be created only within their own later specs.

### Requirement 13: Tayovi-template-only boundary

**User story:** As a Tayovi template builder, I want this feature limited to Tayovi, so that example applications stay in their own specs.

#### Acceptance Criteria

1. THE implementation deliverables for this feature SHALL contain only the reusable Tayovi template contract and validator.
2. THE production code, fixtures, tests, scripts, and configuration produced by this feature SHALL NOT include Mira or any other example application.
3. THE feature SHALL NOT create or modify files in any example-application repository.
4. THE feature SHALL NOT add example-domain rules, adapters, integrations, configuration, data, or user journeys.
5. THE feature's acceptance SHALL NOT depend on running or inspecting an example application.
6. Reuse by two example applications SHALL be proved later through their separate specs, builds, and acceptance evidence.
7. THE design SHALL preserve later library extraction without making a library package the current deliverable.
8. Existing suite steering and visual maps MAY describe example applications as project context. This feature SHALL NOT create, modify, import, test, or depend on those example materials.

## Acceptance Checks

| # | Check | Requirement |
|---|-------|-------------|
| 1 | Valid contract referencing A2UI v1.0 catalog and surface is accepted | 1 |
| 2 | Valid personal version passes standard A2UI checks unchanged | 5.3 |
| 3 | Unknown or unsupported component fails with exact error | 5.1 |
| 4 | Broken reference, placement, and function-rule cases still fail via A2UI | 5.2 |
| 5 | Removing a protected invariant is rejected | 6.1, 6.2 |
| 6 | Disallowed change is rejected and active version is untouched | 6.3, 6.4, 4.5 |
| 7 | Tayovi extensions round-trip unchanged | 7.1 |
| 8 | Unknown non-Tayovi extensions round-trip unchanged | 7.2 |
| 9 | A grant in a personal version is rejected; requests stay separate | 9 |
| 10 | A compatible future version can reference implementation artifacts without a second contract family | 11.1 |
| 11 | Generic fixture tests only the Tayovi template contract | 12 |
| 12 | Same complete input gives the same ordered findings on repeat runs | 4.1 |
| 13 | Missing or mismatched base identity is rejected | 1.6 |
| 14 | No implementation output creates, changes, imports, tests, or depends on an example application | 13 |

## Open Technical Choices (no product-owner input needed)

These go to the design phase with recommended defaults: exact contract schema and extension keys; package layout; identity and version formats; finding shape; A2UI SDK package pins (`@a2ui/web_core` with explicit `v1_0` export is the recommended base); fixture layout.

## Product Decisions

None open for Feature 1. The second example's identity remains a later product decision and does not block this design.
