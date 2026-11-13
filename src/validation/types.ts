import type { Contract } from "../contract/schema.js";
import type { ParseOptions } from "../contract/parse.js";
import type { A2uiCatalog } from "./a2ui-adapter.js";

export type StageId = "a2ui" | "invariants" | "host-compat" | "capability-policy";
export type FindingStage = StageId | "contract";
export type Severity = "error" | "info";

export const STAGE_ORDER: readonly StageId[] = ["a2ui", "invariants", "host-compat", "capability-policy"];

/** One validation result line. Codes are stable; messages are for people. */
export interface Finding {
  stage: FindingStage;
  code: string;
  severity: Severity;
  /** JSON Pointer into the checked input, or a component location. */
  location: string;
  message: string;
  details?: Record<string, string>;
}

export interface StageResult {
  stage: StageId;
  status: "passed" | "failed" | "not-run";
}

export interface ValidationResult {
  accepted: boolean;
  stages: StageResult[];
  findings: Finding[];
}

/** A2UI messages for one version (createSurface, updateComponents, updateDataModel). */
export interface A2uiBundle {
  messages: unknown[];
  /** Optional catalog JSON documents, for catalog and component-definition scope extensions. */
  catalogDocuments?: unknown[];
}

export interface RegistrySnapshot {
  catalogs: { id: string; version: string }[];
  components: { catalog: string; name: string }[];
  actions: { catalog: string; ref: string; confirmation?: string }[];
}

/** Host-owned: which capabilities exist. */
export interface CapabilityPolicySnapshot {
  available: string[];
}

/** Host-owned: which capabilities are currently granted. Kept apart from the policy. */
export interface CapabilityGrantSnapshot {
  granted: string[];
}

export interface ValidationInput {
  contract: unknown;
  base: A2uiBundle;
  /** A fully materialized candidate, never a delta. */
  personal: A2uiBundle;
  registry: RegistrySnapshot;
  policy: CapabilityPolicySnapshot;
  grants: CapabilityGrantSnapshot;
}

/** What each stage receives after the contract has been parsed. */
export interface StageContext {
  contract: Contract;
  base: A2uiBundle;
  personal: A2uiBundle;
  registry: RegistrySnapshot;
  policy: CapabilityPolicySnapshot;
  grants: CapabilityGrantSnapshot;
  catalogs: readonly A2uiCatalog[];
}

export interface ValidationStage {
  id: StageId;
  run(context: StageContext): Finding[];
}

export interface ValidateOptions {
  /** Renderer-side catalogs used by A2UI validation. Defaults to the A2UI basic catalog. */
  catalogs?: readonly A2uiCatalog[];
  /** Replaces the default stage list. Order is the order given. */
  stages?: readonly ValidationStage[];
  /** Contract parser options (supported versions, artifact kinds). */
  contract?: ParseOptions;
}
