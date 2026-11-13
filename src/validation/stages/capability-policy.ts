// Stage 4: capability-policy evaluation.
// A personal version may REQUEST capabilities. It may never carry GRANTS.
// This stage only reads the host-owned policy and grant snapshots. It has no
// code path that creates, widens, merges, or implies a grant (Req 9.6).

import { collectSites } from "../../contract/extensions.js";
import type { Finding, StageContext, ValidationStage } from "../types.js";

function error(code: string, location: string, message: string, details: Record<string, string>): Finding {
  return { stage: "capability-policy", code, severity: "error", location, message, details };
}

export const capabilityPolicyStage: ValidationStage = {
  id: "capability-policy",
  run(ctx: StageContext): Finding[] {
    const findings: Finding[] = [];
    const inContract = new Set(ctx.contract.capabilities.available);
    const inPolicy = new Set(ctx.policy.available);
    const granted = new Set(ctx.grants.granted);

    for (const site of collectSites(ctx.personal)) {
      if (site.value["grants"] !== undefined) {
        findings.push(
          error("TAYOVI_GRANT_IN_PERSONAL", `${site.location}/grants`,
            "A personal version cannot carry capability grants. Grants are host-owned.", { scope: site.scope }),
        );
      }

      const requests = site.value["requests"];
      if (requests === undefined) continue;
      if (!Array.isArray(requests) || requests.some((r) => typeof r !== "string")) {
        findings.push(
          error("TAYOVI_CAPABILITY_REQUEST_INVALID", `${site.location}/requests`,
            "Capability requests must be a list of capability names.", { scope: site.scope }),
        );
        continue;
      }
      (requests as string[]).forEach((capability, index) => {
        const missing = [
          !inContract.has(capability) ? "contract" : "",
          !inPolicy.has(capability) ? "policy" : "",
          !granted.has(capability) ? "grants" : "",
        ].filter(Boolean);
        if (missing.length > 0) {
          findings.push(
            error("TAYOVI_CAPABILITY_REFUSED", `${site.location}/requests/${index}`,
              `Capability "${capability}" is requested but not already available and granted by the host (missing from: ${missing.join(", ")}).`,
              { capability, missingFrom: missing.join(",") }),
          );
        }
      });
    }
    return findings;
  },
};
