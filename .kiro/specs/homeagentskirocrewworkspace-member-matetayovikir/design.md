# Design: A2UI Personalization Contract and Invariant Validation

## Overview

This feature adds a thin Tayovi layer on top of A2UI v1.0. It has two deliverables inside the Tayovi template repository:

1. A **Tayovi contract**: one JSON document a host publishes. It points at A2UI catalogs and surfaces and adds invariants, personalization policy, base identity, and fork rules.
2. A **validator**: a pure function that checks a proposed personal A2UI version against the contract in ordered stages.

Stage 1 is the official A2UI v1.0 validation, called unchanged. Tayovi code only adds stages 2 to 4. Nothing here designs, builds, integrates, or tests any example application (Requirement 13).

The validator receives a fully materialized candidate personal version. Applying a stored delta to its pinned base happens before validation and belongs to later lifecycle work. This feature neither stores nor applies deltas.

## Verified inputs (checked 2026-11-13)

| Item | Value |
|------|-------|
| A2UI protocol | v1.0 |
| `@a2ui/web_core` | `0.15.0` (npm latest); has an explicit `./v1_0` export |
| `@a2ui/agent` | `0.1.0` (not needed for this feature) |
| Node used for check | 24.x |

Package versions and protocol versions are kept apart. Pin `@a2ui/web_core` to exactly `0.15.0` (no range). Re-check the registry before the spec is locked (Requirement 10.3). Import only from `@a2ui/web_core/v1_0`.

## Unresolved technical choices

These are marked open. None changes product behavior, scope, policy, or risk.

| ID | Choice | Recommended default | Settled by |
|----|--------|---------------------|------------|
| U1 | Exact public API of the `v1_0` export for catalog load and message validation | Wrap it in one adapter file; confirm names in task 2 | Task 2 compatibility proof |
| U2 | Language and tooling | TypeScript, Node 22+, Vitest, Ajv for the contract's own JSON Schema | Task 1 |
| U3 | Where the base A2UI marks a required role on a component | `@metadata.extensions` on the component, per A2UI v1.0 | Task 2 proof |
| U4 | Whether A2UI v1.0 keeps unknown extension keys through its parser | Assume yes; prove with a round-trip test | Task 2 proof |

If U4 fails (the parser drops unknown keys), the validator keeps its own copy of the raw input and compares against it. The design supports this without change (see Preservation).

## Architecture

```
ValidationInput
  contract, base, materializedPersonal, registrySnapshot,
  policySnapshot, grantSnapshot
        |
        v
  [Stage 1] A2UI adapter  --> official @a2ui/web_core/v1_0 validation
        |  (stop on failure; later stages "not-run")
        v
  [Stage 2] Invariants    --> reads Tayovi extensions, diffs base vs personal
        v
  [Stage 3] Host compat   --> components, data paths, actions vs registry snapshot
        v
  [Stage 4] Capability    --> requests vs policy + grant snapshot
        v
  ValidationResult { accepted, stages[], findings[] }
```

Rules:

- Pure function. No file, network, clock, or random access. Same input gives the same output (Requirement 4.1, 4.6).
- Input objects are deep-frozen in tests to prove no mutation (Requirement 4.5).
- Each stage implements one interface and is passed in as a list, so a stage can be replaced alone (Requirement 3.3).

## Package layout (template repository)

```
src/
  contract/
    schema.ts            JSON Schema + types for the Tayovi contract
    parse.ts             parse + schema-check the contract
    extensions.ts        Tayovi extension keys and readers
  validation/
    types.ts             Stage, Finding, ValidationInput, ValidationResult
    pipeline.ts          runs stages in order
    stages/
      a2ui.ts            adapter around @a2ui/web_core/v1_0
      invariants.ts
      host-compat.ts
      capability-policy.ts
    future-seams.ts      empty interfaces: build, test, preview, activate
  index.ts               public exports
fixtures/
  contract/              generic contract, personal versions, expected findings
test/
  unit/  contract/  compat/
```

Everything under `src/` stays free of host-domain names so a later library extraction is a move, not a rewrite (Requirement 13.7).

## Contract document

One JSON file with a family tag and its own version. Names below are the recommended shape; exact key spelling is fixed in the JSON Schema during task 3.

```json
{
  "tayovi": "contract",
  "contractVersion": "1.0.0",
  "a2uiProtocol": "v1.0",
  "app": { "id": "template-host", "name": "Template Host" },
  "base": {
    "id": "base-2026-11-13",
    "catalogs": [{ "id": "https://example.invalid/catalogs/basic/v1", "version": "1" }],
    "surfaces": [{ "id": "home", "source": "surfaces/home.json" }]
  },
  "fork": {
    "mustPin": ["base.id", "base.catalogs", "base.surfaces", "contractVersion"],
    "baseRef": "/metadata/extensions/tayovi.dev~1personalization/baseId"
  },
  "policy": {
    "allowedChanges": [
      {
        "id": "arrange",
        "kind": "layout",
        "components": [
          { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "Row" },
          { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "Column" },
          { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "Card" },
          { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "List" }
        ]
      },
      { "id": "present", "kind": "binding-presentation", "properties": ["text", "label"] }
    ]
  },
  "host": {
    "components": [
      { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "Row" },
      { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "Column" },
      { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "Card" },
      { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "List" },
      { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "Text" },
      { "catalog": "https://example.invalid/catalogs/basic/v1", "name": "Button" }
    ],
    "data": [{ "pointer": "/view", "includeDescendants": true, "scope": "interface-state" }],
    "actions": [
      { "catalog": "https://example.invalid/catalogs/basic/v1", "ref": "host.refresh", "sensitive": false },
      { "catalog": "https://example.invalid/catalogs/basic/v1", "ref": "host.submit", "sensitive": true, "confirmation": "host-owned" }
    ]
  },
  "capabilities": { "available": ["read.view"], "policyRef": "policy-snapshot" },
  "invariants": {
    "namespace": "tayovi.dev/personalization",
    "sources": [
      { "catalog": "https://example.invalid/catalogs/basic/v1" },
      { "surface": "home" }
    ]
  },
  "artifacts": []
}
```

Design points:

- `catalogs` and `surfaces` are references. Component schemas, bindings, actions, and functions stay in the A2UI catalog (Requirement 1.7). Every component reference resolves with its catalog identity and version, so mixed catalogs cannot collide.
- `invariants` identifies the A2UI extension namespace and source artifacts. The actual invariant rules live only in the referenced A2UI `metadata.extensions`; the contract does not copy or redefine them (Requirement 2).
- `artifacts` is one versioned reference list. Contract version 1.0 permits only JSON-safe artifact kinds used by this tracer. A later compatible contract version may add a registered implementation-reference kind without creating another artifact family (Requirement 11.1, 11.2). Version 1.0 rejects unknown critical artifact kinds and never loads code (Requirement 11.3).
- `contractVersion` uses semantic versions. The validator lists supported ranges and rejects others with `TAYOVI_CONTRACT_VERSION_UNSUPPORTED`.
- No credential fields or inline host-business-data fields exist in the schema. Host data entries are references. Declared interface-state fields may carry values. The validator enforces these shapes and does not claim to detect secrets from names or values (Requirement 8.4).

## Extension keys

Tayovi data lives under A2UI v1.0 `metadata.extensions`, in one namespace key: `tayovi.dev/personalization` (recommended; any key not starting with `a2ui_`, Requirement 2.2). Scopes:

| A2UI scope | Tayovi use |
|-----------|-----------|
| catalog | catalog-wide invariants, base identity |
| surface | surface invariants, required roles, `baseId` for fork |
| component | `role`, `protectedBindings`, `protectedActions`, `nonRemovableCapabilities` |
| component-definition | per-definition limits |
| action | Not carried by an action definition: A2UI closes that object (proved in `test/compat/a2ui-extension-scopes.test.ts`). Action metadata exists only on the dispatched action message at run time. Sensitivity and confirmation come from `host.actions` in the contract, plus a `confirmation` marker on the component. |

Each extension value has a `critical` flag. An unknown extension with `critical: true` is rejected; unknown without it is kept and reported as `info` (Requirement 7.3).

A standard A2UI validator or renderer ignores this namespace (Requirement 2.4); this is checked by running stage 1 on fixtures with and without Tayovi extensions and expecting identical stage 1 results.

## Validation types

```ts
type StageId = "a2ui" | "invariants" | "host-compat" | "capability-policy";

interface ValidationInput {
  contract: unknown;                     // parsed again inside the pipeline
  base: A2uiBundle;                      // pinned catalogs + base surface messages
  personal: A2uiBundle;                  // fully materialized candidate, not a delta
  registry: RegistrySnapshot;            // components and actions the host supports
  policy: CapabilityPolicySnapshot;      // host-owned available capabilities and rules
  grants: CapabilityGrantSnapshot;       // separate host-owned current grants
}

interface Finding {
  stage: StageId | "contract";
  code: string;                 // stable, e.g. TAYOVI_INVARIANT_REMOVED
  severity: "error" | "info";
  location: string;             // JSON Pointer or component id
  message: string;              // human-readable, names the thing
  details?: Record<string, string>; // e.g. component, catalog, invariantId
}

interface StageResult { stage: StageId; status: "passed" | "failed" | "not-run"; }

interface ValidationResult {
  accepted: boolean;
  stages: StageResult[];        // always four entries, in order
  findings: Finding[];          // sorted: stage order, then location, then code
}

interface ValidationStage {
  id: StageId;
  run(input: ParsedInput): Finding[];
}
```

Determinism: findings are sorted by `(stageIndex, location, code, message)`. No object-key order or timestamps affect output. Stages are not given a clock. A stage fails only when it returns an `error` finding. Informational findings do not reject a candidate.

## Stage behaviour

### Contract check (before stage 1)

Parse and schema-check the contract first. Then resolve its catalog and surface references against the supplied base and registry snapshots. Failures return `stage: "contract"` findings and all four stages `not-run`. This covers malformed or unversioned contracts, unsupported contract versions, and unknown catalog or surface references (Requirement 1.8, 10.2).

### Stage 1: A2UI

The adapter loads the referenced catalogs and runs the official v1.0 validation on the personal bundle. It maps each official error into a `Finding` with `stage: "a2ui"` and the official message kept in `details.original`. Tayovi adds no rules here. Covers broken references, placement, and function rules (Requirement 5.2). On any error, stages 2 to 4 are `not-run`.

### Stage 2: Invariants

1. Resolve the contract's invariant namespace and source references.
2. Read actual Tayovi invariant rules from the base A2UI `metadata.extensions`. The contract contains no copied invariant definitions.
3. Check base identity: personal `baseId` must be present and equal to `contract.base.id` (`TAYOVI_BASE_MISSING`, `TAYOVI_BASE_MISMATCH`) (Requirement 1.6, 10.4).
4. Check each protected base invariant still holds in the fully materialized personal version: required role present, protected binding and action still on the same component, non-removable capability still declared. Missing gives `TAYOVI_INVARIANT_REMOVED` naming the invariant id (Requirement 6.1).
5. Compare protected markers between base and personal. Deleted or altered gives `TAYOVI_MARKER_ALTERED` (Requirement 6.2).
6. Diff base vs personal. Every change must match an `allowedChanges` rule; otherwise `TAYOVI_POLICY_DISALLOWED` names the rule (Requirement 6.3).
7. Unknown Tayovi metadata: critical gives `TAYOVI_CRITICAL_UNSUPPORTED` (error); otherwise `TAYOVI_UNKNOWN_METADATA` (info).

### Stage 3: Host compatibility

Against the registry snapshot and contract `host` lists:

- component not registered or not in `host.components`: `TAYOVI_COMPONENT_UNSUPPORTED`, with `details.component` and `details.catalog` (Requirement 5.1);
- binding path outside `host.data`: `TAYOVI_DATA_OUT_OF_SCOPE`, naming the path. Scope matching uses decoded JSON Pointer segments and explicit descendant flags, never raw string prefixes or glob guesses (Requirement 8.2);
- an action reference not listed by both the A2UI catalog and host registry: `TAYOVI_ACTION_NOT_APPROVED`, naming the action (Requirement 8.3);
- a sensitive host action whose registry entry lacks host-owned confirmation: `TAYOVI_CONFIRMATION_NOT_HOST_OWNED`; a personal payload that claims consent or overrides confirmation is also rejected (Requirement 8.5);
- inline values for host-owned business-data references: `TAYOVI_INLINE_HOST_DATA`. Declared non-authoritative interface-state values remain allowed (Requirement 8.4).

A component absent from its referenced A2UI catalog fails in stage 1. A catalog-valid component unsupported by the host registry reaches stage 3 and fails there.

### Stage 4: Capability policy

- personal Tayovi metadata carries a `grants` field: `TAYOVI_GRANT_IN_PERSONAL` (Requirement 9.4);
- a requested capability not satisfied by both the supplied policy snapshot and separate grant snapshot: `TAYOVI_CAPABILITY_REFUSED` (Requirement 9.5);
- the stage only reads both snapshots. It has no code path that writes, merges, or derives a grant (Requirement 9.6).

### Future seams

`future-seams.ts` exports empty interfaces for build, test, preview, and activation. They have no implementation and the pipeline never calls them (Requirement 3.5).

## Metadata preservation

- The validator never rewrites input. Its output holds findings, not a modified bundle (Requirement 5.3).
- A `readBundle` / `writeBundle` pair keeps the raw parsed JSON, including unknown keys. Round-trip tests compare parsed JSON values for deep equality after serialization; whitespace and object-key order are not treated as data.
- If the A2UI parser drops unknown keys (U4), `readBundle` keeps the raw tree and the validator reads Tayovi data from the raw tree, not the parsed model.
- Unknown non-Tayovi extensions are never read, only carried.

## Fixture set

`fixtures/contract/` holds generic data only (Requirement 12.3):

- `contract.valid.json`, `base.valid.json`, `personal.valid.json`;
- one rejected personal file per case, each with an `expected.json` list of findings;
- `registry.json`, `policy.json`, and separate `grants.json` snapshots;
- `contract.future-1.1.json`, paired with a test-only future schema extension, proves that the same contract and artifact families can add a registered implementation-reference kind later. The v1.0 validator does not accept that kind, load code, or define executable behavior.

Fixture names, ids, and data avoid any product or example-app wording (Requirement 13.2).

## Correctness properties and tests

| Property | Test type | Requirement |
|----------|-----------|-------------|
| Same input twice gives equal output, including order | unit | 4.1 |
| Deep-frozen inputs never throw and are unchanged | unit | 4.5, 4.6 |
| Valid personal passes stage 1 with no Tayovi changes | contract | 5.3 |
| Unknown component, broken ref, placement, function rule each fail with exact code | contract | 5.1, 5.2 |
| Removing each invariant kind fails | contract | 6.1, 6.2 |
| Disallowed change rejects the candidate; all inputs stay unchanged and no active state is reachable | contract | 6.3, 6.4 |
| Tayovi and unknown extensions round-trip | unit | 7.1, 7.2 |
| Critical unknown metadata fails; non-critical gives info | unit | 7.3 |
| Out-of-scope path and unapproved action fail | contract | 8.2, 8.3 |
| Grant in personal Tayovi metadata fails; request passes only when separate policy and grant snapshots allow | contract | 9 |
| Unsupported contract version rejected | unit | 10.2 |
| Test-only contract 1.1 schema adds implementation references within the same family; v1.0 rejects them | compat | 11.1 |
| Static checks: Feature 1 production code, fixtures, tests, scripts, and configuration have no example-repository dependency or example-domain work | repo lint + dependency check | 13 |
| Stage replaced by a stub does not change other stages | unit | 3.3 |
| Stage 1 results identical with and without Tayovi extensions | compat | 2.4 |

A dependency check rejects imports or package links to example repositories. A narrow deny list supplements that check across Feature 1 production code, fixtures, tests, scripts, and configuration. Pre-existing suite steering and `docs/tayovi-system-map.html` describe later example work; they are context, not Feature 1 outputs. Feature 1 does not modify, import, test, or depend on them.

## Requirement coverage

| Requirement | Where designed |
|-------------|----------------|
| 1 | Contract document, contract check, stage 2 step 3 |
| 2 | Extension keys |
| 3 | Architecture, future seams |
| 4 | Validation types, determinism |
| 5 | Stage 1, stage 3, preservation |
| 6 | Stage 2 |
| 7 | Extension keys, preservation |
| 8 | Stage 3 |
| 9 | Stage 4 |
| 10 | Verified inputs, contract check |
| 11 | Contract document, fixtures |
| 12 | Fixture set |
| 13 | Package layout, repo lint |

## Boundaries

- No new UI, catalog, binding, action, function, or renderer protocol.
- No storage, Git, preview, activation, or rollback.
- No executable renderer code is generated, built, or loaded.
- No example-application code, fixtures, tests, adapters, integration, configuration, data, or user journeys.
- Pre-existing suite steering and visual maps may describe later examples, but Feature 1 does not modify or depend on them.
- Library extraction is a later move of `src/` into a package.

## Implementation notes (settled while building)

These record what the A2UI compatibility proof and the build settled. Details are in `docs/a2ui-compat.md` and `docs/finding-codes.md`.

- **U1 settled.** All A2UI calls live in `src/validation/a2ui-adapter.ts` (`MessageProcessor` with `STRICT_VALIDATION`, `processMessagesWithErrors`). The wire `version` literal is `"1.0"`.
- **U3 settled.** Component markers live at `component.metadata.extensions.tayovi`; surface markers at `createSurface.metadata.extensions.tayovi`.
- **U4 settled.** A2UI keeps unknown extension keys. Tayovi still reads raw JSON.
- **Namespace key is `tayovi`, not `tayovi.dev/personalization`.** A2UI requires extension keys to be UAX #31 identifiers, so dots and slashes are rejected. A2UI does not reject `a2ui_` keys; Tayovi does (`TAYOVI_RESERVED_KEY`).
- **Function calls** use `@call` in v1.0.
- **Contract shape:** `fork.baseRef` was dropped; the base is always named at `createSurface.metadata.extensions.tayovi.baseId`. `capabilities.policyRef` was dropped; policy and grants arrive as snapshots. `artifacts` is a list of `{kind, id, critical?}`; `implementation-ref` is an executable kind that 1.0 never accepts.
- **Inputs:** `A2uiBundle` is `{ messages, catalogDocuments? }`. Registry, policy, and grants are separate snapshots.
- **Locations** are JSON Pointers into a logical view: `/surfaces/<surfaceId>/components/<id>[/<property>]`, or `/messages/<n>/...` for data writes.
- **Stage 1 codes** are `A2UI_<official code>`.
- **Catalog and component-definition scope** extensions are read from optional `catalogDocuments`. Personal JSON-only versions cannot change catalogs, so base-versus-personal protection applies to surface and component scope. Action scope is not supported by the official package for action definitions (review correction 1); readers do not look for it.
- **Policy diff rules:** adding, removing, retyping, or changing `children`/`child` needs a `layout` or `composition` rule covering the component type. Any other property change needs a rule whose `properties` list includes it.
- **Contract test** uses hand-written expected findings in `fixtures/contract/cases/*.json`; `scripts/generate-case-fixtures.mjs` regenerates those files from the valid fixtures.
