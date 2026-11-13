# A2UI v1.0 compatibility notes

Proven against `@a2ui/web_core@0.15.0` (checked 2026-11-13) by:

- `test/compat/a2ui-proof.test.ts`: messages, surface and component scope.
- `test/compat/a2ui-extension-scopes.test.ts`: catalog, component-definition, and action scope.

Both files call the official package only. They do not use Tayovi readers.

## Extension scopes: what the official package supports

| Scope | Where it lives | Official support | Proof |
|-------|----------------|------------------|-------|
| surface | `createSurface.metadata.extensions` | Parsed and kept | `a2ui-proof.test.ts` "survives parsing at surface scope" |
| component | `component.metadata.extensions` | Parsed and kept | `a2ui-proof.test.ts` "survives parsing at component scope" |
| catalog | catalog document `metadata.extensions` | Written back unchanged by `Catalog.toJson`; catalog still validates messages | `a2ui-extension-scopes.test.ts` "catalog scope (official)" |
| component-definition | catalog document `components.<Name>.metadata.extensions` | Accepted by `ComponentDefinitionSchema`, kept on `catalog.components.get(name).metadata`, written back unchanged | `a2ui-extension-scopes.test.ts` "component-definition scope (official)" |
| action | not on the action definition | **Not supported.** `ActionSchema` is closed (`event` or `functionCall` only) and A2UI rejects a component whose action carries `metadata`. Action `metadata.extensions` exists only on the dispatched action message (renderer to agent) | `a2ui-extension-scopes.test.ts` "action scope (official)" |

### Limits and what follows from them

- **Action scope is dropped** from Feature 1's claim. A personal version cannot carry action-scope extensions, so Tayovi readers do not look for them. Action rules sit on the component (`protectedActions`, `confirmation`) and on the contract's `host.actions` list (`sensitive`, `confirmation`). Requirement 2.1, the design, the readers, and the acceptance evidence were revised together.
- **Catalog and component-definition scope** live in catalog JSON documents, not in messages. Tayovi reads them from the optional `catalogDocuments` of a bundle. Personal JSON-only versions cannot change catalogs, so Stage 2 compares only surface and component scope between base and personal. Reserved-key and unknown-metadata checks still run on every site read.
- The built-in basic catalog carries no Tayovi metadata.

## Settled technical choices

- **U1: adapter API.** All A2UI calls live in `src/validation/a2ui-adapter.ts`. It builds a `MessageProcessor([...catalogs], undefined, { version: "v1.0", validationConfig: STRICT_VALIDATION })`, calls `processMessagesWithErrors(messages)`, and maps each error (`code`, `path`, `message`, `surfaceId`) to a Tayovi finding. Error codes seen: `VALIDATION_FAILED`, `INTEGRITY_ERROR`.
- **U3: component markers.** A component carries Tayovi data at `component.metadata.extensions.tayovi`. A surface carries it at `createSurface.metadata.extensions.tayovi`.
- **U4: preservation.** A2UI keeps unknown extension keys (Tayovi and non-Tayovi) at surface, component, catalog, and component-definition scope. Tayovi still reads its data from the raw JSON it was given, so it does not depend on this.

## Differences from the first design draft

- The wire `version` literal is `"1.0"`. The `MessageProcessor` option is `"v1.0"`.
- Extension keys must be UAX #31 identifiers. `tayovi.dev/personalization` is rejected by A2UI. **The Tayovi namespace key is `tayovi`.**
- A2UI does not reject `a2ui_`-prefixed extension keys. Tayovi rejects them in personal versions itself.
- The basic catalog id is `https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json`.
- Function calls use `@call` in v1.0.
- Stage 1 results are identical with and without Tayovi extensions.
