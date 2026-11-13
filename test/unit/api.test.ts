import { describe, it, expect } from "vitest";
import { validate, STAGE_ORDER, defaultStages } from "../../src/index.js";
import { validInput } from "../helpers.js";

describe("public API", () => {
  it("accepts the valid fixture end to end", () => {
    const r = validate(validInput());
    expect(r.findings).toEqual([]);
    expect(r.accepted).toBe(true);
    expect(r.stages.map((s) => [s.stage, s.status])).toEqual([
      ["a2ui", "passed"],
      ["invariants", "passed"],
      ["host-compat", "passed"],
      ["capability-policy", "passed"],
    ]);
  });

  it("wires the default stages in the required order", () => {
    expect(defaultStages.map((s) => s.id)).toEqual([...STAGE_ORDER]);
  });
});
