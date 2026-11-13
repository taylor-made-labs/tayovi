// Stage 3: host compatibility and registration checks.
// Components, data scope, host-approved actions, and host-owned confirmation,
// checked against the contract's host lists and the host registry snapshot.

import { collectBindingPaths, readAction, readSurfaces } from "../../a2ui/surfaces.js";
import { TAYOVI_NAMESPACE, readTayoviExtension } from "../../contract/extensions.js";
import type { Contract } from "../../contract/schema.js";
import { decodePointer, isRecord, pointer } from "../../util/json.js";
import type { Finding, StageContext, ValidationStage } from "../types.js";

type DataEntry = Contract["host"]["data"][number];

const CONSENT_KEY = /^(confirmed|confirmation|consent|userconsent|userconfirmed|approved|userapproved)$/i;

function error(code: string, location: string, message: string, details: Record<string, string>): Finding {
  return { stage: "host-compat", code, severity: "error", location, message, details };
}

/**
 * Finds the host data entry that covers a pointer. Compares decoded segments,
 * never raw string prefixes, so "/viewer" is not inside "/view" and "~1" in a
 * name is a slash inside one segment, not a path separator.
 */
export function findDataEntry(entries: readonly DataEntry[], path: string): DataEntry | undefined {
  const target = decodePointer(path);
  if (!target) return undefined;
  let best: DataEntry | undefined;
  let bestLength = -1;
  for (const entry of entries) {
    const scope = decodePointer(entry.pointer);
    if (!scope) continue;
    if (scope.length > target.length) continue;
    if (!scope.every((segment, i) => segment === target[i])) continue;
    if (scope.length < target.length && !entry.includeDescendants) continue;
    if (scope.length > bestLength) {
      best = entry;
      bestLength = scope.length;
    }
  }
  return best;
}

function claimsConsent(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = claimsConsent(item);
      if (hit) return hit;
    }
  } else if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (CONSENT_KEY.test(key)) return key;
      const hit = claimsConsent(child);
      if (hit) return hit;
    }
  }
  return undefined;
}

export const hostCompatStage: ValidationStage = {
  id: "host-compat",
  run(ctx: StageContext): Finding[] {
    const { contract, registry } = ctx;
    const findings: Finding[] = [];
    const hostComponents = new Set(contract.host.components.map((c) => `${c.catalog}|${c.name}`));
    const registryComponents = new Set(registry.components.map((c) => `${c.catalog}|${c.name}`));

    for (const surface of readSurfaces(ctx.personal)) {
      // Components
      for (const component of surface.components.values()) {
        const loc = pointer("surfaces", surface.surfaceId, "components", component.id);
        const key = `${component.catalogId}|${component.type}`;
        if (!hostComponents.has(key) || !registryComponents.has(key)) {
          findings.push(
            error("TAYOVI_COMPONENT_UNSUPPORTED", loc,
              `Component "${component.type}" in catalog "${component.catalogId}" is not supported by the host.`,
              {
                component: component.type,
                catalog: component.catalogId,
                missingFrom: [!hostComponents.has(key) ? "contract" : "", !registryComponents.has(key) ? "registry" : ""]
                  .filter(Boolean)
                  .join(","),
              }),
          );
        }

        // Data bindings (reads). Relative paths resolve inside a template whose
        // parent binding is itself checked, so only absolute pointers are checked here.
        for (const path of collectBindingPaths(component.raw)) {
          if (!path.startsWith("/")) continue;
          if (!findDataEntry(contract.host.data, path)) {
            findings.push(
              error("TAYOVI_DATA_OUT_OF_SCOPE", loc,
                `Component "${component.id}" binds "${path}", which is outside the scoped host data.`,
                { path, component: component.id }),
            );
          }
        }

        // Actions
        const action = readAction(component.raw);
        if (action) checkAction(ctx, surface.surfaceId, component.id, component.catalogId, action, component.raw, loc, findings);
      }

      // Data writes (createSurface.dataModel and updateDataModel)
      for (const write of surface.dataWrites) {
        for (const { path, source } of expandWrite(write.path, write.value, write.source)) {
          const entry = findDataEntry(contract.host.data, path);
          if (!entry) {
            findings.push(
              error("TAYOVI_DATA_OUT_OF_SCOPE", source,
                `The personal version writes "${path}", which is outside the scoped host data.`, { path }),
            );
          } else if (entry.scope === "host-owned") {
            findings.push(
              error("TAYOVI_INLINE_HOST_DATA", source,
                `The personal version writes inline data at "${path}", which is host-owned and may only be referenced.`,
                { path, entry: entry.pointer }),
            );
          }
        }
      }
    }
    return findings;
  },
};

/** Splits a write at the root into one write per top-level key, so each key is scope-checked. */
function expandWrite(path: string, value: unknown, source: string): { path: string; source: string }[] {
  if ((path === "/" || path === "") && isRecord(value)) {
    return Object.keys(value)
      .sort()
      .map((k) => ({ path: pointer(k), source: `${source}/${k.replace(/~/g, "~0").replace(/\//g, "~1")}` }));
  }
  return [{ path, source }];
}

function checkAction(
  ctx: StageContext,
  _surfaceId: string,
  componentId: string,
  catalogId: string,
  action: { ref: string; raw: Record<string, unknown> },
  component: Record<string, unknown>,
  loc: string,
  findings: Finding[],
): void {
  const { contract, registry } = ctx;
  const listed = contract.host.actions.find((a) => a.catalog === catalogId && a.ref === action.ref);
  const inRegistry = registry.actions.find((a) => a.catalog === catalogId && a.ref === action.ref);
  if (!listed || !inRegistry) {
    findings.push(
      error("TAYOVI_ACTION_NOT_APPROVED", `${loc}/action`,
        `Action "${action.ref}" on component "${componentId}" is not a host-approved action.`,
        {
          action: action.ref,
          component: componentId,
          missingFrom: [!listed ? "contract" : "", !inRegistry ? "registry" : ""].filter(Boolean).join(","),
        }),
    );
    return;
  }
  if (!listed.sensitive) return;

  const reasons: string[] = [];
  if (listed.confirmation !== "host-owned") reasons.push("contract entry lacks host-owned confirmation");
  if (inRegistry.confirmation !== "host-owned") reasons.push("registry entry lacks host-owned confirmation");
  const claimed = claimsConsent(action.raw["event"] ?? action.raw["functionCall"]);
  if (claimed) reasons.push(`the action payload claims consent (key "${claimed}")`);
  // A2UI closes the action object, so confirmation markers live on the component.
  const ext = readTayoviExtension(component["metadata"]);
  if (ext && ext["confirmation"] !== undefined && ext["confirmation"] !== "host-owned") {
    reasons.push(`metadata sets confirmation to "${String(ext["confirmation"])}"`);
  }
  if (reasons.length > 0) {
    findings.push(
      error("TAYOVI_CONFIRMATION_NOT_HOST_OWNED", `${loc}/action`,
        `Sensitive action "${action.ref}" must use host-owned confirmation: ${reasons.join("; ")}.`,
        { action: action.ref, component: componentId, namespace: TAYOVI_NAMESPACE, reasons: reasons.join("; ") }),
    );
  }
}
