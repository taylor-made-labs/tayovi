// Tayovi's data inside A2UI v1.0 `metadata.extensions`.
// One namespace key (`tayovi`). A2UI requires extension keys to be UAX #31
// identifiers, so a dotted or slashed key is not allowed (see docs/a2ui-compat.md).

import { readSurfaces } from "../a2ui/surfaces.js";
import { isRecord, pointer } from "../util/json.js";
import type { A2uiBundle } from "../validation/types.js";

export const TAYOVI_NAMESPACE = "tayovi";

// Official A2UI v1.0 support, proved in test/compat/a2ui-extension-scopes.test.ts:
//   catalog, surface, component, component-definition: carried in documents and messages.
//   action: NOT carried by an action definition (A2UI closes that object). Action
//           metadata exists only on the dispatched action message at run time, so
//           it is not part of a personal version and is not read here.
export type ExtensionScope = "catalog" | "surface" | "component" | "component-definition";

/** Keys this version of Tayovi understands inside the `tayovi` extension object. */
export const KNOWN_KEYS: readonly string[] = [
  "critical", // true: a reader that does not understand every key must reject
  "baseId", // surface: the base version this personal version derives from
  "contractVersion", // surface: the contract version this version pins
  "role", // component: required role marker
  "protectedBindings", // component: JSON Pointers that must stay bound
  "protectedActions", // component: action refs that must stay
  "nonRemovableCapabilities", // surface/component: capabilities that must stay declared
  "capabilities", // surface/component: capabilities declared in this scope
  "requests", // capability requests (never grants)
  "grants", // forbidden in personal versions
  "sensitive", // component metadata or host contract: needs host-owned confirmation
  "confirmation", // component metadata or host contract: must be "host-owned"
];

/** Keys that protect behavior. A personal version may not drop or change them. */
export const PROTECTED_KEYS: readonly string[] = [
  "role",
  "protectedBindings",
  "protectedActions",
  "nonRemovableCapabilities",
  "sensitive",
  "confirmation",
];

export interface ExtensionSite {
  scope: ExtensionScope;
  /** JSON Pointer to the `tayovi` object (or its would-be place). */
  location: string;
  surfaceId?: string;
  componentId?: string;
  /** The `tayovi` extension object exactly as given. */
  value: Record<string, unknown>;
  /** Every extension key at this site (to find reserved `a2ui_` keys). */
  extensionKeys: string[];
}

/** Returns the `tayovi` extension object in a `metadata` value, if there is one. */
export function readTayoviExtension(metadata: unknown): Record<string, unknown> | undefined {
  if (!isRecord(metadata)) return undefined;
  const extensions = metadata["extensions"];
  if (!isRecord(extensions)) return undefined;
  const value = extensions[TAYOVI_NAMESPACE];
  return isRecord(value) ? value : undefined;
}

function extensionKeysOf(metadata: unknown): string[] {
  if (!isRecord(metadata)) return [];
  const extensions = metadata["extensions"];
  return isRecord(extensions) ? Object.keys(extensions).sort() : [];
}

/** Keys that A2UI reserves for itself (`a2ui_` prefix). Personal versions must not use them. */
export function reservedKeys(keys: readonly string[]): string[] {
  return keys.filter((k) => k.startsWith("a2ui_"));
}

/** Unknown keys inside a `tayovi` extension object, sorted. */
export function unknownKeys(value: Record<string, unknown>): string[] {
  return Object.keys(value)
    .filter((k) => !KNOWN_KEYS.includes(k))
    .sort();
}

/**
 * Lists every place a bundle carries extensions: surface and component scope
 * from messages, plus catalog and component-definition scope from optional
 * catalog documents.
 * Sites without a `tayovi` object are listed too when they carry other keys, so
 * reserved-key checks see them.
 */
export function collectSites(bundle: A2uiBundle): ExtensionSite[] {
  const sites: ExtensionSite[] = [];
  const push = (site: Omit<ExtensionSite, "value" | "extensionKeys">, metadata: unknown) => {
    const value = readTayoviExtension(metadata);
    const extensionKeys = extensionKeysOf(metadata);
    if (value === undefined && extensionKeys.length === 0) return;
    sites.push({ ...site, value: value ?? {}, extensionKeys });
  };

  for (const surface of readSurfaces(bundle)) {
    const sBase = pointer("surfaces", surface.surfaceId);
    push(
      { scope: "surface", location: `${sBase}/metadata/extensions/${TAYOVI_NAMESPACE}`, surfaceId: surface.surfaceId },
      surface.metadata,
    );
    for (const component of surface.components.values()) {
      const cBase = pointer("surfaces", surface.surfaceId, "components", component.id);
      push(
        {
          scope: "component",
          location: `${cBase}/metadata/extensions/${TAYOVI_NAMESPACE}`,
          surfaceId: surface.surfaceId,
          componentId: component.id,
        },
        component.raw["metadata"],
      );
    }
  }

  (bundle.catalogDocuments ?? []).forEach((doc, i) => {
    if (!isRecord(doc)) return;
    push({ scope: "catalog", location: `/catalogDocuments/${i}/metadata/extensions/${TAYOVI_NAMESPACE}` }, doc["metadata"]);
    const defs = doc["components"];
    if (isRecord(defs)) {
      for (const name of Object.keys(defs).sort()) {
        const def = defs[name];
        if (isRecord(def)) {
          push(
            {
              scope: "component-definition",
              location: `/catalogDocuments/${i}/components/${name.replace(/~/g, "~0").replace(/\//g, "~1")}/metadata/extensions/${TAYOVI_NAMESPACE}`,
            },
            def["metadata"],
          );
        }
      }
    }
  });

  return sites;
}
