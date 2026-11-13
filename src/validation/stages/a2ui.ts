// Stage 1: A2UI protocol and catalog validation.
// Delegated unchanged to the official A2UI v1.0 validation. Tayovi adds no rules here.

import { runA2uiValidation } from "../a2ui-adapter.js";
import { pointer } from "../../util/json.js";
import type { Finding, StageContext, ValidationStage } from "../types.js";

const UNKNOWN_COMPONENT = /Unknown component type '([^']+)' not found in catalog '([^']+)'/;

export const a2uiStage: ValidationStage = {
  id: "a2ui",
  run(context: StageContext): Finding[] {
    const errors = runA2uiValidation(context.personal.messages, context.catalogs);
    return errors.map((e): Finding => {
      const base = e.surfaceId ? pointer("surfaces", e.surfaceId) : "";
      const location = e.path === "/" ? base || "/" : base + e.path;
      const details: Record<string, string> = { original: e.message, a2uiCode: e.code };
      const unknown = UNKNOWN_COMPONENT.exec(e.message);
      if (unknown) {
        details["component"] = unknown[1] ?? "";
        details["catalog"] = unknown[2] ?? "";
      }
      if (e.surfaceId) details["surface"] = e.surfaceId;
      return {
        stage: "a2ui",
        code: `A2UI_${e.code}`,
        severity: "error",
        location,
        message: e.message,
        details,
      };
    });
  },
};
