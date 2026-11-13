// Public API of the Tayovi template contract and validator.
// Keep this surface free of host-domain names so it can move into a library later.

export { validate, sortFindings } from "./validation/pipeline.js";
export { STAGE_ORDER } from "./validation/types.js";
export type {
  A2uiBundle,
  CapabilityGrantSnapshot,
  CapabilityPolicySnapshot,
  Finding,
  FindingStage,
  RegistrySnapshot,
  Severity,
  StageContext,
  StageId,
  StageResult,
  ValidateOptions,
  ValidationInput,
  ValidationResult,
  ValidationStage,
} from "./validation/types.js";

export { defaultStages } from "./validation/stages/index.js";
export { a2uiStage } from "./validation/stages/a2ui.js";
export { invariantsStage } from "./validation/stages/invariants.js";
export { hostCompatStage, findDataEntry } from "./validation/stages/host-compat.js";
export { capabilityPolicyStage } from "./validation/stages/capability-policy.js";
export type { A2uiCatalog } from "./validation/a2ui-adapter.js";
export type { FutureSeam, BuildSeam, TestSeam, PreviewSeam, ActivationSeam } from "./validation/future-seams.js";

export { parseContract, JSON_ARTIFACT_KINDS, EXECUTABLE_ARTIFACT_KINDS } from "./contract/parse.js";
export type { ParseOptions, ParseResult } from "./contract/parse.js";
export { resolveContractReferences } from "./contract/resolve.js";
export {
  A2UI_PROTOCOL,
  CONTRACT_FAMILY,
  SUPPORTED_CONTRACT_VERSIONS,
  contractSchema,
} from "./contract/schema.js";
export type { Contract } from "./contract/schema.js";
export { TAYOVI_NAMESPACE, KNOWN_KEYS, PROTECTED_KEYS, collectSites } from "./contract/extensions.js";
export type { ExtensionScope, ExtensionSite } from "./contract/extensions.js";

export { readBundle, writeBundle } from "./a2ui/bundle.js";
