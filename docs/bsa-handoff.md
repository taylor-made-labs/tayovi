# Shared contract checkpoint: handoff for the BSA and suite architect

Feature 1: A2UI personalization contract and invariant validation. Owner repository: `tayovi`.

## What to review

| Area | Where |
|------|-------|
| A2UI v1.0 compatibility | `docs/a2ui-compat.md`, `test/compat/a2ui-proof.test.ts` |
| Contract document and schema | `src/contract/schema.ts`, `fixtures/contract/contract.valid.json` |
| Terms shared with Feature 2 | Base identity (`baseId`), fork pins (`fork.mustPin`), finding vocabulary below |
| Host contract boundary | `contract.host` (components, data, actions), `RegistrySnapshot`, `CapabilityPolicySnapshot`, `CapabilityGrantSnapshot` in `src/validation/types.ts` |
| Finding codes | `docs/finding-codes.md` |
| Shared fixtures | `fixtures/contract/` (valid set) and `fixtures/contract/cases/` (27 cases with hand-written expected findings) |
| Acceptance evidence | `docs/acceptance-evidence.md` |
| Version pins | `docs/version-pins.md` |

## Decisions the review should confirm

1. The Tayovi extension key is `tayovi` (A2UI requires UAX #31 identifiers; a dotted key is rejected by A2UI).
2. The validator receives a fully materialized personal version. Applying a stored delta to its base belongs to Feature 2 and Feature 3.
3. Feature 2 must record, per personal version: the `baseId` it pins, the `contractVersion` it pins, and the validation result (`accepted`, `stages`, `findings`) as lifecycle evidence.
4. Requested capabilities live in the personal version's `tayovi.requests`. Grants live only in host-owned snapshots. A `grants` field in a personal version is always rejected.
5. Contract versions are separate from the A2UI protocol (`v1.0`) and from package versions (`@a2ui/web_core` `0.15.0`).
6. Extension scopes proved against the official package: surface, component, catalog, component-definition. Action scope is not supported on an action definition and is dropped from the claim (`docs/a2ui-compat.md`).
7. Later executable artifacts join the same `artifacts` list under a later contract version. Version 1.0 rejects the `implementation-ref` kind.

## Not done by this feature

- Independent reviewer sign-off.
- Running CI on a hosting service.
- Any example-application fixture, adapter, or test. Those belong to their own specs.
