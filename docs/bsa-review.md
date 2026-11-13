# BSA and independent review: Feature 1

## Status

**Accepted by independent review and the BSA on November 13, 2026.** Local build, lint, and all 158 tests pass. Hosted CI and product-owner commit approval remain open.

Independent review ran on November 13, 2026:

- `npm run lint`: passed;
- TypeScript build to a scratch output folder: passed; and
- `npx vitest run`: 12 files, 138 tests, all passed.

## BSA corrections already made

The requirements, design, and acceptance evidence now state the Feature 1 boundary precisely:

- Feature 1 production code, fixtures, tests, scripts, and configuration must not create, modify, import, test, or depend on an example application.
- Existing suite steering and `docs/tayovi-system-map.html` may describe later example work. They predate Feature 1 and are not Feature 1 outputs or acceptance targets.
- Contract parsing and reference resolution are an explicit preflight. A failed preflight leaves all four validation stages `not-run`.

## Required builder corrections

### 1. Complete A2UI extension compatibility proof

Add official A2UI compatibility tests for every extension scope Feature 1 claims to support:

- action scope;
- catalog scope; and
- component-definition scope.

The current proof covers only surface and component scopes. If the official v1.0 package cannot parse or preserve a claimed scope, document that exact limit and revise the design, requirements, readers, fixtures, and acceptance claim together. Do not simulate official support with Tayovi-only unit tests.

### 2. Prove the contract preflight behavior

Add or identify tests showing that malformed contracts, unsupported versions, and unresolved catalog or surface references return contract findings while all four stages report `not-run`.

### 3. Align boundary checks and claims

Keep dependency checks focused on Feature 1 implementation outputs. Ensure tests and `docs/acceptance-evidence.md` name their exact scope. Do not claim that all Tayovi repository documentation is free of example names, because suite steering and the system map intentionally describe later examples.

### 4. Refresh evidence

After the corrections:

1. run `npm run lint`;
2. run `npm run build`;
3. run `npm test`;
4. update `docs/a2ui-compat.md`;
5. update `docs/acceptance-evidence.md` with exact test names and totals; and
6. leave independent reviewer and BSA sign-off marked incomplete.

## Later gates

- Independent review passed on November 13, 2026.
- The BSA shared-contract checkpoint passed on November 13, 2026.
- Do not claim hosted CI passed until it runs there.
- Do not create or modify any example application.
- Do not commit or start another development orchestrator without product-owner approval.

## BSA shared-contract checkpoint

**Passed.** The BSA confirmed:

- official A2UI v1.0 validation remains Stage 1;
- supported extension scopes match official package behavior;
- action-definition metadata is excluded after official rejection;
- `baseId`, `contractVersion`, validation results, policy, and grant records give Feature 2 stable shared terms;
- host components, data, actions, policy, and grants remain explicit and separate;
- finding codes are stable and documented;
- the template-only boundary excludes all example-application work; and
- later executable references remain versioned and non-executable in contract 1.0.

Non-blocking cleanup: rename the `action:` comment labels for `sensitive` and `confirmation` in `src/contract/extensions.ts`. Their real homes are component metadata and the host contract.
