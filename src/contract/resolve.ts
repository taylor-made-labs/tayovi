import type { Contract } from "./schema.js";
import { readSurfaces } from "../a2ui/surfaces.js";
import type { A2uiBundle, Finding, RegistrySnapshot } from "../validation/types.js";

function err(code: string, location: string, message: string, details: Record<string, string>): Finding {
  return { stage: "contract", code, severity: "error", location, message, details };
}

/**
 * Checks that every catalog and surface the contract names exists in the
 * supplied registry and base. Pure; returns findings only.
 */
export function resolveContractReferences(
  contract: Contract,
  base: A2uiBundle,
  registry: RegistrySnapshot,
): Finding[] {
  const findings: Finding[] = [];
  const registryCatalogs = new Set(registry.catalogs.map((c) => c.id));
  const contractCatalogs = new Set(contract.base.catalogs.map((c) => c.id));
  const baseSurfaces = new Map(readSurfaces(base).map((s) => [s.surfaceId, s]));
  const contractSurfaces = new Set(contract.base.surfaces.map((s) => s.id));

  contract.base.catalogs.forEach((c, i) => {
    if (!registryCatalogs.has(c.id)) {
      findings.push(
        err("TAYOVI_CONTRACT_UNKNOWN_CATALOG", `/base/catalogs/${i}/id`,
          `Catalog "${c.id}" is not in the host registry.`, { catalog: c.id }),
      );
    }
  });

  contract.base.surfaces.forEach((s, i) => {
    const surface = baseSurfaces.get(s.id);
    if (!surface) {
      findings.push(
        err("TAYOVI_CONTRACT_UNKNOWN_SURFACE", `/base/surfaces/${i}/id`,
          `Surface "${s.id}" is not in the base version.`, { surface: s.id }),
      );
    } else if (!contractCatalogs.has(surface.catalogId)) {
      findings.push(
        err("TAYOVI_CONTRACT_UNKNOWN_CATALOG", `/base/surfaces/${i}/id`,
          `Surface "${s.id}" uses catalog "${surface.catalogId}", which the contract does not reference.`,
          { surface: s.id, catalog: surface.catalogId }),
      );
    }
  });

  contract.host.components.forEach((c, i) => {
    if (!contractCatalogs.has(c.catalog)) {
      findings.push(
        err("TAYOVI_CONTRACT_UNKNOWN_CATALOG", `/host/components/${i}/catalog`,
          `Host component "${c.name}" names catalog "${c.catalog}", which the contract does not reference.`,
          { catalog: c.catalog, component: c.name }),
      );
    }
  });
  contract.host.actions.forEach((a, i) => {
    if (!contractCatalogs.has(a.catalog)) {
      findings.push(
        err("TAYOVI_CONTRACT_UNKNOWN_CATALOG", `/host/actions/${i}/catalog`,
          `Host action "${a.ref}" names catalog "${a.catalog}", which the contract does not reference.`,
          { catalog: a.catalog, action: a.ref }),
      );
    }
  });

  contract.invariants.sources.forEach((source, i) => {
    if ("catalog" in source && !contractCatalogs.has(source.catalog)) {
      findings.push(
        err("TAYOVI_CONTRACT_UNKNOWN_CATALOG", `/invariants/sources/${i}/catalog`,
          `Invariant source catalog "${source.catalog}" is not referenced by the contract.`,
          { catalog: source.catalog }),
      );
    }
    if ("surface" in source && !contractSurfaces.has(source.surface)) {
      findings.push(
        err("TAYOVI_CONTRACT_UNKNOWN_SURFACE", `/invariants/sources/${i}/surface`,
          `Invariant source surface "${source.surface}" is not referenced by the contract.`,
          { surface: source.surface }),
      );
    }
  });

  return findings;
}
