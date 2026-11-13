# Finding codes

Every finding has `stage`, `code`, `severity`, `location`, `message`, and optional `details`. Codes are stable. Findings are sorted by stage order, then location, then code, then message.

Stage order: `contract` (before the four stages), then `a2ui`, `invariants`, `host-compat`, `capability-policy`.

## Contract (stage `contract`)

| Code | Meaning |
|------|---------|
| `TAYOVI_CONTRACT_MALFORMED` | Not an object, or fails the contract JSON Schema. `location` points at the problem. |
| `TAYOVI_CONTRACT_UNVERSIONED` | No `contractVersion`. |
| `TAYOVI_CONTRACT_VERSION_UNSUPPORTED` | Version not in the supported list (`1.0.0`). |
| `TAYOVI_CONTRACT_UNKNOWN_CATALOG` | A catalog the registry or contract does not know. |
| `TAYOVI_CONTRACT_UNKNOWN_SURFACE` | A surface the base or contract does not have. |
| `TAYOVI_ARTIFACT_KIND_UNSUPPORTED` | Artifact kind not accepted by this contract version (executable kinds always). |
| `TAYOVI_ARTIFACT_KIND_UNKNOWN` | (info) Unknown non-critical artifact kind, kept and ignored. |

## Stage 1: `a2ui`

`A2UI_<code>` wraps each official A2UI v1.0 error unchanged (`A2UI_VALIDATION_FAILED`, `A2UI_INTEGRITY_ERROR`). `details.original` holds the official message. Unknown components add `details.component` and `details.catalog`.

## Stage 2: `invariants`

| Code | Meaning |
|------|---------|
| `TAYOVI_BASE_MISSING` / `TAYOVI_BASE_MISMATCH` | Personal version does not name, or names a different, base. |
| `TAYOVI_PIN_MISSING` / `TAYOVI_PIN_MISMATCH` | A pin from `fork.mustPin` is absent or different. |
| `TAYOVI_SURFACE_MISSING` / `TAYOVI_SURFACE_UNKNOWN` | A pinned surface is gone, or a surface is not in the contract. |
| `TAYOVI_INVARIANT_REMOVED` | Required role, protected binding, protected action, or non-removable capability is gone. `details.invariant` names it. |
| `TAYOVI_MARKER_ALTERED` | A protected Tayovi marker was changed or deleted while its invariant still holds. |
| `TAYOVI_POLICY_DISALLOWED` | A change no `allowedChanges` rule covers. `details.rule` lists the rules checked. |
| `TAYOVI_RESERVED_KEY` | An extension key starting with `a2ui_`. |
| `TAYOVI_CRITICAL_UNSUPPORTED` | Unknown Tayovi metadata marked `critical: true`. |
| `TAYOVI_UNKNOWN_METADATA` | (info) Unknown non-critical Tayovi metadata, kept and ignored. |

## Stage 3: `host-compat`

| Code | Meaning |
|------|---------|
| `TAYOVI_COMPONENT_UNSUPPORTED` | Catalog-valid component the host contract or registry does not support. |
| `TAYOVI_DATA_OUT_OF_SCOPE` | Binding or data write outside `host.data`. |
| `TAYOVI_INLINE_HOST_DATA` | Inline values written to host-owned data. |
| `TAYOVI_ACTION_NOT_APPROVED` | Action not listed in both the contract and the registry. |
| `TAYOVI_CONFIRMATION_NOT_HOST_OWNED` | Sensitive action without host-owned confirmation, or a payload that claims consent. |

## Stage 4: `capability-policy`

| Code | Meaning |
|------|---------|
| `TAYOVI_GRANT_IN_PERSONAL` | A personal version carries a `grants` field. |
| `TAYOVI_CAPABILITY_REFUSED` | Requested capability not in the contract, the policy snapshot, and the grant snapshot. |
| `TAYOVI_CAPABILITY_REQUEST_INVALID` | `requests` is not a list of names. |
