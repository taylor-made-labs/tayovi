// Stage 2: Tayovi invariant validation.
// Reads Tayovi rules from the base A2UI `metadata.extensions` (the contract
// does not copy them) and checks the fully materialized personal version.

import { collectBindingPaths, readAction, readSurfaces, type SurfaceView } from "../../a2ui/surfaces.js";
import {
  PROTECTED_KEYS,
  TAYOVI_NAMESPACE,
  collectSites,
  reservedKeys,
  unknownKeys,
  type ExtensionSite,
} from "../../contract/extensions.js";
import type { Contract } from "../../contract/schema.js";
import { deepEqual, isRecord, pointer } from "../../util/json.js";
import type { Finding, StageContext, ValidationStage } from "../types.js";

type Change = Contract["policy"]["allowedChanges"][number];

const NOT_PROPERTIES = new Set(["id", "component", "metadata", "catalogId"]);
const STRUCTURAL_PROPERTIES = new Set(["children", "child"]);

function error(code: string, location: string, message: string, details?: Record<string, string>): Finding {
  const f: Finding = { stage: "invariants", code, severity: "error", location, message };
  if (details) f.details = details;
  return f;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function siteKey(site: ExtensionSite): string {
  return `${site.scope}|${site.surfaceId ?? ""}|${site.componentId ?? ""}`;
}

export const invariantsStage: ValidationStage = {
  id: "invariants",
  run(ctx: StageContext): Finding[] {
    const { contract } = ctx;
    const findings: Finding[] = [];
    const baseSurfaces = new Map(readSurfaces(ctx.base).map((s) => [s.surfaceId, s]));
    const personalSurfaces = new Map(readSurfaces(ctx.personal).map((s) => [s.surfaceId, s]));
    const baseSites = collectSites(ctx.base);
    const personalSites = collectSites(ctx.personal);
    const personalByKey = new Map(personalSites.map((s) => [siteKey(s), s]));
    const contractSurfaceIds = contract.base.surfaces.map((s) => s.id);

    checkMetadata(personalSites, "", findings);
    checkMetadata(baseSites, "/base", findings);
    checkSurfaces(ctx, contractSurfaceIds, personalSurfaces, personalByKey, findings);
    checkInvariants(ctx, baseSites, baseSurfaces, personalSurfaces, personalByKey, findings);
    checkPolicy(contract, contractSurfaceIds, baseSurfaces, personalSurfaces, findings);
    return findings;
  },
};

/** Reserved `a2ui_` keys and unknown Tayovi metadata (Req 2.2, 7.3). */
function checkMetadata(sites: ExtensionSite[], prefix: string, findings: Finding[]): void {
  for (const site of sites) {
    const where = prefix + site.location;
    for (const key of reservedKeys(site.extensionKeys)) {
      findings.push(
        error("TAYOVI_RESERVED_KEY", prefix + site.location.replace(/\/tayovi$/, `/${key}`),
          `Extension key "${key}" starts with "a2ui_", which A2UI reserves for itself.`, { key }),
      );
    }
    const unknown = unknownKeys(site.value);
    if (unknown.length === 0) continue;
    if (site.value["critical"] === true) {
      findings.push(
        error("TAYOVI_CRITICAL_UNSUPPORTED", where,
          `Critical Tayovi metadata is not understood: ${unknown.join(", ")}.`, { keys: unknown.join(",") }),
      );
    } else {
      findings.push({
        stage: "invariants",
        code: "TAYOVI_UNKNOWN_METADATA",
        severity: "info",
        location: where,
        message: `Unknown Tayovi metadata is kept and ignored: ${unknown.join(", ")}.`,
        details: { keys: unknown.join(",") },
      });
    }
  }
}

/** Surface presence, base identity, and fork pins (Req 1.5, 1.6, 10.4). */
function checkSurfaces(
  ctx: StageContext,
  contractSurfaceIds: string[],
  personalSurfaces: Map<string, SurfaceView>,
  personalByKey: Map<string, ExtensionSite>,
  findings: Finding[],
): void {
  const { contract } = ctx;
  const pins = new Set(contract.fork.mustPin);
  const catalogIds = new Set(contract.base.catalogs.map((c) => c.id));

  for (const id of personalSurfaces.keys()) {
    if (!contractSurfaceIds.includes(id)) {
      findings.push(
        error("TAYOVI_SURFACE_UNKNOWN", pointer("surfaces", id),
          `Surface "${id}" is not in the contract.`, { surface: id }),
      );
    }
  }

  for (const id of contractSurfaceIds) {
    const surface = personalSurfaces.get(id);
    const loc = pointer("surfaces", id);
    if (!surface) {
      if (pins.has("base.surfaces")) {
        findings.push(error("TAYOVI_SURFACE_MISSING", loc, `Surface "${id}" is pinned by the contract but missing.`, { surface: id }));
      }
      continue;
    }
    const site = personalByKey.get(`surface|${id}|`);
    const ext = site?.value ?? {};
    const extLoc = `${loc}/metadata/extensions/${TAYOVI_NAMESPACE}`;

    const baseId = ext["baseId"];
    if (baseId === undefined) {
      findings.push(
        error("TAYOVI_BASE_MISSING", `${extLoc}/baseId`,
          `The personal version does not name its base. Expected "${contract.base.id}".`,
          { expected: contract.base.id }),
      );
    } else if (baseId !== contract.base.id) {
      findings.push(
        error("TAYOVI_BASE_MISMATCH", `${extLoc}/baseId`,
          `The personal version names base "${String(baseId)}", but the contract base is "${contract.base.id}".`,
          { expected: contract.base.id, actual: String(baseId) }),
      );
    }

    if (pins.has("contractVersion")) {
      const v = ext["contractVersion"];
      if (v === undefined) {
        findings.push(
          error("TAYOVI_PIN_MISSING", `${extLoc}/contractVersion`,
            `The personal version does not pin contractVersion. Expected "${contract.contractVersion}".`,
            { pin: "contractVersion", expected: contract.contractVersion }),
        );
      } else if (v !== contract.contractVersion) {
        findings.push(
          error("TAYOVI_PIN_MISMATCH", `${extLoc}/contractVersion`,
            `The personal version pins contractVersion "${String(v)}", but the contract is "${contract.contractVersion}".`,
            { pin: "contractVersion", expected: contract.contractVersion, actual: String(v) }),
        );
      }
    }

    if (pins.has("base.catalogs") && !catalogIds.has(surface.catalogId)) {
      findings.push(
        error("TAYOVI_PIN_MISMATCH", loc,
          `Surface "${id}" uses catalog "${surface.catalogId}", which is not a pinned base catalog.`,
          { pin: "base.catalogs", actual: surface.catalogId }),
      );
    }
  }
}

/** Required roles, protected bindings and actions, non-removable capabilities, and markers (Req 6.1, 6.2). */
function checkInvariants(
  ctx: StageContext,
  baseSites: ExtensionSite[],
  baseSurfaces: Map<string, SurfaceView>,
  personalSurfaces: Map<string, SurfaceView>,
  personalByKey: Map<string, ExtensionSite>,
  findings: Finding[],
): void {
  const sourceSurfaces = new Set(
    ctx.contract.invariants.sources.flatMap((s) => ("surface" in s ? [s.surface] : [])),
  );

  for (const site of baseSites) {
    if (site.scope !== "surface" && site.scope !== "component") continue;
    if (!site.surfaceId || !sourceSurfaces.has(site.surfaceId)) continue;
    if (!baseSurfaces.has(site.surfaceId)) continue;
    const personalSurface = personalSurfaces.get(site.surfaceId);
    if (!personalSurface) continue; // reported by checkSurfaces when pinned
    const counterpart = personalByKey.get(siteKey(site));
    const personalComponent = site.componentId ? personalSurface.components.get(site.componentId) : undefined;
    let removed = 0;
    const gone = (id: string, what: string) => {
      removed += 1;
      findings.push(
        error("TAYOVI_INVARIANT_REMOVED", site.location,
          `Protected invariant "${id}" (${what}) was removed from the personal version.`,
          { invariant: id, scope: site.scope, ...(site.componentId ? { component: site.componentId } : {}) }),
      );
    };

    const role = site.value["role"];
    if (typeof role === "string") {
      const found = [...personalSurface.components.values()].some((c) => {
        const ext = isRecord(c.raw["metadata"]) ? (c.raw["metadata"] as Record<string, unknown>)["extensions"] : undefined;
        const t = isRecord(ext) ? ext[TAYOVI_NAMESPACE] : undefined;
        return isRecord(t) && t["role"] === role;
      });
      if (!found) gone(`role:${role}`, "required role");
    }

    for (const p of strings(site.value["protectedBindings"])) {
      const bound = personalComponent ? collectBindingPaths(personalComponent.raw).includes(p) : false;
      if (!bound) gone(`binding:${p}`, "protected binding");
    }

    for (const a of strings(site.value["protectedActions"])) {
      const action = personalComponent ? readAction(personalComponent.raw) : undefined;
      if (action?.ref !== a) gone(`action:${a}`, "protected action");
    }

    for (const c of strings(site.value["nonRemovableCapabilities"])) {
      if (!strings(counterpart?.value["capabilities"]).includes(c)) gone(`capability:${c}`, "non-removable capability");
    }

    if (removed === 0) {
      const changed = PROTECTED_KEYS.filter(
        (k) => k !== "role" && !deepEqual(site.value[k], counterpart?.value[k]),
      );
      if (changed.length > 0) {
        findings.push(
          error("TAYOVI_MARKER_ALTERED", site.location,
            `Protected Tayovi marker was changed or deleted: ${changed.join(", ")}.`,
            { keys: changed.join(","), scope: site.scope, ...(site.componentId ? { component: site.componentId } : {}) }),
        );
      }
    }
  }
}

/** Compares base and personal against the allowed changes (Req 6.3). */
function checkPolicy(
  contract: Contract,
  contractSurfaceIds: string[],
  baseSurfaces: Map<string, SurfaceView>,
  personalSurfaces: Map<string, SurfaceView>,
  findings: Finding[],
): void {
  const rules = contract.policy.allowedChanges;
  const componentAllowed = (rule: Change, catalog: string, type: string) =>
    rule.components === undefined || rule.components.some((c) => c.catalog === catalog && c.name === type);
  const structureRules = (catalog: string, type: string) =>
    rules.filter((r) => r.kind !== "binding-presentation" && componentAllowed(r, catalog, type));
  const propertyRules = (catalog: string, type: string, prop: string) =>
    rules.filter((r) => componentAllowed(r, catalog, type) && (r.properties?.includes(prop) ?? false));
  const ruleNames = (list: Change[]) => (list.length > 0 ? list.map((r) => r.id).join(", ") : "(none)");

  const disallow = (location: string, change: string, id: string, type: string, prop: string | undefined, considered: string) => {
    findings.push(
      error("TAYOVI_POLICY_DISALLOWED", location,
        `The ${change} of ${type} "${id}"${prop ? ` property "${prop}"` : ""} is not allowed by any policy rule. Rules checked: ${considered}.`,
        { change, component: id, type, ...(prop ? { property: prop } : {}), rule: considered }),
    );
  };

  for (const surfaceId of contractSurfaceIds) {
    const base = baseSurfaces.get(surfaceId);
    const personal = personalSurfaces.get(surfaceId);
    if (!base || !personal) continue;

    const ids = [...new Set([...base.components.keys(), ...personal.components.keys()])];
    for (const id of ids) {
      const b = base.components.get(id);
      const p = personal.components.get(id);
      const loc = pointer("surfaces", surfaceId, "components", id);
      if (b && !p) {
        if (structureRules(b.catalogId, b.type).length === 0) {
          disallow(loc, "removal", id, b.type, undefined, ruleNames(rules.filter((r) => r.kind !== "binding-presentation")));
        }
        continue;
      }
      if (!b && p) {
        if (structureRules(p.catalogId, p.type).length === 0) {
          disallow(loc, "addition", id, p.type, undefined, ruleNames(rules.filter((r) => r.kind !== "binding-presentation")));
        }
        continue;
      }
      if (!b || !p) continue;
      if (b.type !== p.type || b.catalogId !== p.catalogId) {
        if (structureRules(b.catalogId, b.type).length === 0 || structureRules(p.catalogId, p.type).length === 0) {
          disallow(loc, "type change", id, `${b.type}->${p.type}`, undefined, ruleNames(rules.filter((r) => r.kind !== "binding-presentation")));
        }
        continue;
      }
      const keys = [...new Set([...Object.keys(b.raw), ...Object.keys(p.raw)])].filter((k) => !NOT_PROPERTIES.has(k)).sort();
      for (const key of keys) {
        if (deepEqual(b.raw[key], p.raw[key])) continue;
        const propLoc = `${loc}/${key}`;
        if (STRUCTURAL_PROPERTIES.has(key)) {
          if (structureRules(p.catalogId, p.type).length === 0) {
            disallow(propLoc, "change", id, p.type, key, ruleNames(rules.filter((r) => r.kind !== "binding-presentation")));
          }
        } else if (propertyRules(p.catalogId, p.type, key).length === 0) {
          disallow(propLoc, "change", id, p.type, key, ruleNames(rules.filter((r) => r.kind === "binding-presentation")));
        }
      }
    }
  }
}
