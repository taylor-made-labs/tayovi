# Acceptance evidence: A2UI personalization contract and invariant validation

Run on 2026-11-13 after the BSA review corrections: `npm run lint`, `npm run build`, and `npm test` all pass.

Totals: **14 test files, 158 tests, 0 failures.** Lint includes the TypeScript check of source and tests and `scripts/check-deps.mjs`.

| Test file | Tests |
|-----------|-------|
| `test/compat/a2ui-proof.test.ts` | 10 |
| `test/compat/a2ui-extension-scopes.test.ts` | 10 |
| `test/compat/future-contract.test.ts` | 5 |
| `test/contract/fixtures.test.ts` | 29 |
| `test/contract/preflight.test.ts` | 9 |
| `test/contract/stage-a2ui.test.ts` | 7 |
| `test/contract/stage-capability-policy.test.ts` | 8 |
| `test/contract/stage-host-compat.test.ts` | 21 |
| `test/contract/stage-invariants.test.ts` | 21 |
| `test/unit/api.test.ts` | 2 |
| `test/unit/boundary.test.ts` | 5 |
| `test/unit/contract.test.ts` | 14 |
| `test/unit/extensions.test.ts` | 8 |
| `test/unit/pipeline.test.ts` | 9 |

## Acceptance checks

| # | Acceptance check | Proving tests |
|---|------------------|---------------|
| 1 | Valid contract referencing A2UI v1.0 catalog and surface is accepted | `contract.test.ts` "accepts the valid contract"; `api.test.ts` "accepts the valid fixture end to end" |
| 2 | Valid personal version passes standard A2UI checks unchanged | `stage-a2ui.test.ts` "passes the valid personal version and does not change it (Req 5.3)" |
| 3 | Unknown or unsupported component fails with exact error | `stage-a2ui.test.ts` "rejects a component that is not in the catalog, naming component and catalog (Req 5.1)"; `stage-host-compat.test.ts` "rejects a catalog-valid component the host does not support, naming component and catalog"; cases `a2ui-unknown-component`, `host-unsupported-component` |
| 4 | Broken reference, placement, and function-rule cases fail via A2UI | `stage-a2ui.test.ts` "rejects a broken component reference...", "rejects a placement/property violation...", "rejects a function-rule violation..."; cases `a2ui-broken-reference`, `a2ui-placement-violation`, `a2ui-function-rule` |
| 5 | Removing a protected invariant is rejected | `stage-invariants.test.ts` group "protected invariants (Req 6.1, 6.2)" (8 tests); cases `invariant-role-removed`, `invariant-binding-removed`, `invariant-action-removed`, `invariant-capability-removed`, `invariant-marker-altered` |
| 6 | Disallowed change is rejected and nothing is touched | `stage-invariants.test.ts` group "personalization policy (Req 6.3, 6.4)", including "leaves every input unchanged when it rejects"; case `policy-disallowed-change` |
| 7 | Tayovi extensions round-trip unchanged | `extensions.test.ts` "round-trips Tayovi, unknown non-Tayovi, and unknown future Tayovi metadata", "round-trips the fixture files"; `a2ui-proof.test.ts` group "metadata.extensions (U3, U4)"; `a2ui-extension-scopes.test.ts` catalog and component-definition groups |
| 8 | Unknown non-Tayovi extensions round-trip unchanged | `extensions.test.ts` (`vendor_x`, `a_third`); `a2ui-extension-scopes.test.ts` (`vendor_x` at catalog and definition scope); valid fixture carries `other_tool` and is accepted |
| 9 | A grant in a personal version is rejected; requests stay separate | `stage-capability-policy.test.ts` (8 tests); cases `capability-grant-in-personal`, `capability-request-refused` |
| 10 | A compatible future version can reference implementation artifacts without a second contract family | `future-contract.test.ts` (5 tests) |
| 11 | Generic fixture tests only the Tayovi template contract | `fixtures.test.ts` (29 tests) |
| 12 | Same complete input gives the same ordered findings on repeat runs | `pipeline.test.ts` group "determinism and purity"; every case in `fixtures.test.ts` |
| 13 | Missing or mismatched base identity is rejected | `stage-invariants.test.ts` group "base identity and pins (Req 1.6, 10.4)"; cases `base-missing`, `base-mismatch` |
| 14 | No Feature 1 implementation output creates, changes, imports, tests, or depends on an example application | `boundary.test.ts` (5 tests) and `scripts/check-deps.mjs`. Exact scope below. |

## Contract preflight (Req 3.6)

`preflight.test.ts` proves that parsing and reference resolution run before Stage 1, and that a failed preflight returns only `contract` findings with all four stages `not-run` and no stage called:

- "malformed contract: not an object"
- "malformed contract: fails the schema"
- "unversioned contract"
- "unsupported contract version"
- "unresolved catalog (not in the host registry)"
- "unresolved surface (not in the base version)"
- "executable artifact kind in a 1.0 contract"

It also shows the stages run once the preflight passes, and that informational preflight findings do not stop them. Cases `contract-*` in `fixtures.test.ts` repeat these with the shared fixtures.

## Official A2UI extension-scope proof (BSA review correction 1)

| Scope | Result |
|-------|--------|
| surface, component | Supported and kept. `a2ui-proof.test.ts` |
| catalog, component-definition | Supported and kept (`Catalog.fromJson` to `toJson`). `a2ui-extension-scopes.test.ts` |
| action | **Not supported on an action definition.** A2UI closes the object and rejects metadata there. Dropped from Feature 1's claim. `a2ui-extension-scopes.test.ts` "action scope (official)" |

Details and consequences are in `docs/a2ui-compat.md`. Requirement 2.1, the design, and the readers were revised to match.

## Boundary check: exact scope (Req 13)

Covered by `boundary.test.ts` and `scripts/check-deps.mjs`:

- `src/`, `fixtures/`, `test/`, `scripts/`, `.github/`;
- root config files `package.json`, `tsconfig.json`, `tsconfig.test.json`, `vitest.config.ts`, `.gitignore`.

Not covered, and not claimed free of example names:

- `.kiro/` (suite steering and specs) and `docs/`, including `docs/tayovi-system-map.html`. They predate Feature 1 and may describe later example work. They are not Feature 1 outputs.

## Remaining release gate

- **Independent reviewer sign-off: passed on November 13, 2026.**
- **BSA sign-off and shared-contract checkpoint: passed on November 13, 2026.**
- **Hosted CI: not run.** `.github/workflows/ci.yml` has not executed on a hosting service.
- Reuse by two example applications belongs to their own specs.

## Version pins (re-checked 2026-11-13)

`@a2ui/web_core` `0.15.0` is still npm `latest`. See `docs/version-pins.md`.
