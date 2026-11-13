import { parseContract } from "../contract/parse.js";
import { resolveContractReferences } from "../contract/resolve.js";
import { defaultCatalogs } from "./a2ui-adapter.js";
import { defaultStages } from "./stages/index.js";
import { compareStrings } from "../util/json.js";
import {
  STAGE_ORDER,
  type Finding,
  type StageContext,
  type StageId,
  type StageResult,
  type ValidateOptions,
  type ValidationInput,
  type ValidationResult,
} from "./types.js";

function stageRank(stage: Finding["stage"]): number {
  return stage === "contract" ? -1 : STAGE_ORDER.indexOf(stage);
}

/** Stable order: stage order, then location, then code, then message. */
export function sortFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) =>
      stageRank(a.stage) - stageRank(b.stage) ||
      compareStrings(a.location, b.location) ||
      compareStrings(a.code, b.code) ||
      compareStrings(a.message, b.message),
  );
}

const hasError = (findings: readonly Finding[]) => findings.some((f) => f.severity === "error");

/**
 * Runs the ordered validation. Pure: reads the input, returns a result, and
 * never changes the input, any active version, or any stored data.
 */
export function validate(input: ValidationInput, options: ValidateOptions = {}): ValidationResult {
  const notRun = (): StageResult[] => STAGE_ORDER.map((stage) => ({ stage, status: "not-run" as const }));

  // Contract check comes before the four stages.
  const parsed = parseContract(input.contract, options.contract);
  if (!parsed.contract) {
    return { accepted: false, stages: notRun(), findings: sortFindings(parsed.findings) };
  }
  const refFindings = resolveContractReferences(parsed.contract, input.base, input.registry);
  const contractFindings = [...parsed.findings, ...refFindings];
  if (hasError(contractFindings)) {
    return { accepted: false, stages: notRun(), findings: sortFindings(contractFindings) };
  }

  const context: StageContext = {
    contract: parsed.contract,
    base: input.base,
    personal: input.personal,
    registry: input.registry,
    policy: input.policy,
    grants: input.grants,
    catalogs: options.catalogs ?? defaultCatalogs,
  };

  const stages = options.stages ?? defaultStages;
  const byId = new Map(stages.map((s) => [s.id, s]));
  const findings: Finding[] = [...contractFindings];
  const results: StageResult[] = [];
  let stopped = false;

  for (const id of STAGE_ORDER as readonly StageId[]) {
    const stage = byId.get(id);
    if (stopped || !stage) {
      results.push({ stage: id, status: "not-run" });
      continue;
    }
    const out = stage.run(context);
    findings.push(...out);
    if (hasError(out)) {
      results.push({ stage: id, status: "failed" });
      stopped = true;
    } else {
      results.push({ stage: id, status: "passed" });
    }
  }

  const accepted = results.every((r) => r.status === "passed") && !hasError(findings);
  return { accepted, stages: results, findings: sortFindings(findings) };
}
