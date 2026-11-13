import type { ValidationStage } from "../types.js";
import { a2uiStage } from "./a2ui.js";
import { capabilityPolicyStage } from "./capability-policy.js";
import { hostCompatStage } from "./host-compat.js";
import { invariantsStage } from "./invariants.js";

/** The default stage list, in the required order. */
export const defaultStages: ValidationStage[] = [
  a2uiStage,
  invariantsStage,
  hostCompatStage,
  capabilityPolicyStage,
];
