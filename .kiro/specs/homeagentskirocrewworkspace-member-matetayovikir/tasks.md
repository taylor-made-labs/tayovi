# Tasks: A2UI Personalization Contract and Invariant Validation

Order matters. Each task ends with checks that must pass before the next starts. All work stays in the Tayovi template repository. No task touches an example application.

- [x] 1. Project setup
  - [x] 1.1 Create the TypeScript project (Node 22+, Vitest, Ajv) with strict compiler settings and `build`, `test`, `lint` scripts. (Design U2)
  - [x] 1.2 Create the folders from the design: `src/contract`, `src/validation/stages`, `fixtures/contract`, `test/unit`, `test/contract`, `test/compat`.
  - [x] 1.3 Re-check the npm registry for `@a2ui/web_core`. Pin the exact version (`0.15.0` unless the check shows a change; record the date). No version ranges. (Req 10.3)
  - [x] 1.4 Add a dependency check script that fails on any import or package link to an example-application repository. (Req 13.3)
  - Check: `build`, `test`, `lint` run clean on the empty project.

- [x] 2. A2UI v1.0 compatibility proof (settles U1, U3, U4)
  - [x] 2.1 Write a small proof test importing only from `@a2ui/web_core/v1_0`. Load a catalog, validate one good and one bad message set.
  - [x] 2.2 Record the exact public calls needed in `src/validation/stages/a2ui.ts` as a single adapter. Note any gaps in a short `docs/a2ui-compat.md`.
  - [x] 2.3 Prove whether `metadata.extensions` with a `tayovi.dev/personalization` key survives parsing and re-serialization (U4). If it does not, record that readers use the raw tree.
  - [x] 2.4 Prove where a component carries `@metadata.extensions` for role marking (U3).
  - [x] 2.5 Prove stage 1 results are identical with and without Tayovi extensions. (Req 2.4)
  - Check: the proof tests pass and open choices U1, U3, U4 are written down as settled.

- [x] 3. Contract schema and parsing
  - [x] 3.1 Write the contract JSON Schema and TypeScript types in `src/contract/schema.ts`, using the shape in the design. Fix exact key spelling here. (Req 1)
  - [x] 3.2 Implement `parse.ts`: parse and schema-check; return `contract`-stage findings for malformed, unversioned, or unsupported-version contracts. (Req 1.8, 10.1, 10.2)
  - [x] 3.3 Resolve catalog and surface references against the supplied base and registry. Unknown references give an exact finding. (Req 1.2, 1.8)
  - [x] 3.4 Implement semantic-version support check with a listed set of supported ranges. `TAYOVI_CONTRACT_VERSION_UNSUPPORTED` for others. (Req 10.2)
  - [x] 3.5 Make `artifacts` a versioned reference list; v1.0 accepts only JSON-safe kinds and rejects unknown critical kinds. (Req 11.1, 11.2, 11.3)
  - [x] 3.6 Unit tests for each parse failure and for a valid contract.
  - Check: tests for Req 1 and 10 pass.

- [x] 4. Extension reading and metadata preservation
  - [x] 4.1 Implement `extensions.ts`: the namespace key, readers for catalog, surface, component, component-definition, and action scopes, and the `critical` flag. Reject any key beginning with `a2ui_`. (Req 2.1, 2.2, 2.3)
  - [x] 4.2 Implement `readBundle` / `writeBundle` that keep the raw tree, including unknown keys. (Req 7)
  - [x] 4.3 Round-trip tests: Tayovi extensions, unknown non-Tayovi extensions, and unknown future Tayovi metadata compare equal as parsed JSON after write. (Req 7.1, 7.2)
  - Check: round-trip tests pass.

- [x] 5. Validation core
  - [x] 5.1 Implement `types.ts` from the design: `ValidationInput` (with separate policy and grant snapshots), `Finding`, `StageResult`, `ValidationResult`, `ValidationStage`.
  - [x] 5.2 Implement `pipeline.ts`: run the four stages in order from a stage list; mark later stages `not-run` after an error; sort findings by stage, location, code, message; a stage fails only on an `error` finding. (Req 3.1, 3.3, 3.4, 4.3, 4.4)
  - [x] 5.3 Add `future-seams.ts` with empty interfaces for build, test, preview, and activation. Nothing calls them. (Req 3.5)
  - [x] 5.4 Unit tests: stage order; `not-run` reporting; stub stage replacement leaves other stages unchanged; repeat runs give equal output; deep-frozen inputs are never modified. (Req 3.3, 4.1, 4.5, 4.6)
  - Check: pipeline tests pass.

- [x] 6. Stage 1: A2UI adapter
  - [x] 6.1 Implement `stages/a2ui.ts` over the official v1.0 validation only. Map each error to a `Finding`, keep the original text in `details.original`. No Tayovi rules here. (Req 3.2, 5.2)
  - [x] 6.2 Contract tests: a valid personal passes with no changes to the JSON; a component absent from its catalog, a broken reference, a placement violation, and a function-rule violation each fail with the expected code. (Req 5.1, 5.2, 5.3)
  - Check: stage 1 contract tests pass.

- [x] 7. Stage 2: invariants
  - [x] 7.1 Resolve the invariant namespace and sources from the contract; read rules only from the base A2UI extensions. (Req 2.5)
  - [x] 7.2 Base identity check: `TAYOVI_BASE_MISSING`, `TAYOVI_BASE_MISMATCH`. (Req 1.6, 10.4)
  - [x] 7.3 Invariant check for required role, protected binding, protected action, and non-removable capability: `TAYOVI_INVARIANT_REMOVED` naming the invariant id. (Req 6.1)
  - [x] 7.4 Marker comparison between base and personal: `TAYOVI_MARKER_ALTERED`. (Req 6.2)
  - [x] 7.5 Base-versus-personal diff against `allowedChanges`: `TAYOVI_POLICY_DISALLOWED` naming the rule. (Req 6.3)
  - [x] 7.6 Unknown Tayovi metadata: critical gives `TAYOVI_CRITICAL_UNSUPPORTED`; otherwise `TAYOVI_UNKNOWN_METADATA` as `info`. (Req 7.3)
  - [x] 7.7 Contract tests for each finding code, plus a test that a rejected disallowed change leaves every input unchanged and no active state is reachable. (Req 6.4, 4.5)
  - Check: stage 2 tests pass.

- [x] 8. Stage 3: host compatibility
  - [x] 8.1 Component support check against registry and `host.components`, matched by catalog and name: `TAYOVI_COMPONENT_UNSUPPORTED` with component and catalog in details. (Req 5.1)
  - [x] 8.2 Data scope check using decoded JSON Pointer segments and explicit descendant flags (no raw prefix or glob matching): `TAYOVI_DATA_OUT_OF_SCOPE`. (Req 8.2)
  - [x] 8.3 Action approval check against both catalog and host registry: `TAYOVI_ACTION_NOT_APPROVED`. (Req 8.3)
  - [x] 8.4 Sensitive action check: `TAYOVI_CONFIRMATION_NOT_HOST_OWNED`, including payloads that claim consent or override confirmation. (Req 8.5)
  - [x] 8.5 Inline host-data check: `TAYOVI_INLINE_HOST_DATA`; declared interface-state values stay allowed. (Req 8.4)
  - [x] 8.6 Contract tests for each code, including tricky pointer cases (escaped `~0`/`~1`, sibling names that share a prefix).
  - Check: stage 3 tests pass.

- [x] 9. Stage 4: capability policy
  - [x] 9.1 Reject a `grants` field in personal Tayovi metadata: `TAYOVI_GRANT_IN_PERSONAL`. (Req 9.4)
  - [x] 9.2 Accept a request only when both the policy snapshot and the separate grant snapshot satisfy it; otherwise `TAYOVI_CAPABILITY_REFUSED`. (Req 9.5)
  - [x] 9.3 Keep the stage read-only: no code path writes, merges, or derives a grant. Add a test with frozen snapshots. (Req 9.6)
  - Check: stage 4 tests pass.

- [x] 10. Public API
  - [x] 10.1 Export `validate(input)`, the contract parser, types, and the stage interfaces from `src/index.ts`.
  - [x] 10.2 Wire the default stage list in the order of the design.
  - [x] 10.3 Keep `src/` free of host-domain names so it can move into a library later. (Req 13.7)
  - Check: an end-to-end call with the valid fixture returns `accepted: true`.

- [x] 11. Fixtures and contract test
  - [x] 11.1 Create generic fixtures: `contract.valid.json`, `base.valid.json`, `personal.valid.json`, `registry.json`, `policy.json`, `grants.json`. (Req 12.1, 12.3)
  - [x] 11.2 Create one rejected personal file per case, each with an `expected.json` findings list. Cases: unsupported component, broken reference, placement, function rule, removed invariant, altered marker, disallowed change, base missing, base mismatch, out-of-scope data, unapproved action, bad confirmation, inline host data, grant present, refused capability, critical unknown metadata, unsupported contract version.
  - [x] 11.3 Create `contract.future-1.1.json` with a test-only schema extension that adds a registered implementation-reference kind. Prove v1.0 rejects it and the extension parses under the same family. (Req 11.1)
  - [x] 11.4 Write the contract test that runs every fixture through `validate` and compares results to the expected findings. (Req 12.4)
  - Check: all fixture cases pass and repeat runs match exactly.

- [x] 12. Boundary checks
  - [x] 12.1 Add a repo lint test with a narrow deny list of known example-application names across `src/`, `fixtures/`, `test/`, and the spec files. (Req 13.2)
  - [x] 12.2 Run the dependency check from task 1.4 in CI and locally. (Req 13.3)
  - [x] 12.3 Confirm no adapter, integration, configuration, data, or user-journey file exists for an example application. (Req 13.4, 13.5)
  - Check: lint and dependency check pass.

- [x] 13. Final acceptance
  - [x] 13.1 Run `build`, `lint`, and the full test suite.
  - [x] 13.2 Walk the 14 acceptance checks in `requirements.md` and record the test name that proves each.
  - [x] 13.3 Re-verify the registry pin for `@a2ui/web_core` one last time and note the date.
  - [x] 13.4 Hand the fixture set and the finding-code list to the BSA for the shared contract checkpoint (A2UI compatibility, vocabulary shared with Feature 2, host contract boundary).
  - Check: every acceptance check maps to a passing test; independent reviewer signs off.

## Acceptance check map

| # | Acceptance check | Tasks |
|---|------------------|-------|
| 1 | Valid contract accepted | 3, 11 |
| 2 | Valid personal passes A2UI unchanged | 6.2, 11 |
| 3 | Unsupported component fails exactly | 6.2, 8.1 |
| 4 | Broken ref, placement, function fail via A2UI | 6.2 |
| 5 | Removed protected invariant rejected | 7.3, 7.4 |
| 6 | Disallowed change rejected, nothing touched | 7.5, 7.7 |
| 7 | Tayovi extensions round-trip | 4.3 |
| 8 | Unknown non-Tayovi extensions round-trip | 4.3 |
| 9 | Grant rejected, requests separate | 9 |
| 10 | Future implementation refs, same family | 3.5, 11.3 |
| 11 | Generic fixture only | 11, 12 |
| 12 | Repeat runs equal | 5.4, 11.4 |
| 13 | Base identity checked | 7.2 |
| 14 | No example application touched | 1.4, 12 |
