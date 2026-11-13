import { describe, it, expect } from "vitest";
import { validate } from "../../src/validation/pipeline.js";
import type { Finding, ValidationStage, StageId } from "../../src/validation/types.js";
import { deepFreeze, validInput } from "../helpers.js";

const finding = (stage: StageId, code: string, location = "/x", severity: "error" | "info" = "error"): Finding => ({
  stage, code, severity, location, message: code,
});

const stub = (id: StageId, out: Finding[], calls?: StageId[]): ValidationStage => ({
  id,
  run: () => {
    calls?.push(id);
    return out;
  },
});

const allPass = (calls?: StageId[]) => [
  stub("a2ui", [], calls),
  stub("invariants", [], calls),
  stub("host-compat", [], calls),
  stub("capability-policy", [], calls),
];

describe("pipeline order and reporting", () => {
  it("runs the four stages in the required order", () => {
    const calls: StageId[] = [];
    // Hand the stages over in the wrong order: the pipeline must still run them in stage order.
    const stages = allPass(calls).reverse();
    const r = validate(validInput(), { stages });
    expect(calls).toEqual(["a2ui", "invariants", "host-compat", "capability-policy"]);
    expect(r.accepted).toBe(true);
    expect(r.stages.map((s) => s.status)).toEqual(["passed", "passed", "passed", "passed"]);
  });

  it("marks later stages not-run after a failure and names the failed stage", () => {
    const calls: StageId[] = [];
    const stages = allPass(calls);
    stages[1] = stub("invariants", [finding("invariants", "TAYOVI_X")], calls);
    const r = validate(validInput(), { stages });
    expect(calls).toEqual(["a2ui", "invariants"]);
    expect(r.accepted).toBe(false);
    expect(r.stages).toEqual([
      { stage: "a2ui", status: "passed" },
      { stage: "invariants", status: "failed" },
      { stage: "host-compat", status: "not-run" },
      { stage: "capability-policy", status: "not-run" },
    ]);
  });

  it("does not fail a stage on an info finding", () => {
    const stages = allPass();
    stages[0] = stub("a2ui", [finding("a2ui", "NOTE", "/a", "info")]);
    const r = validate(validInput(), { stages });
    expect(r.accepted).toBe(true);
    expect(r.findings).toHaveLength(1);
  });

  it("replacing one stage leaves the others unchanged", () => {
    const base = validate(validInput(), { stages: allPass() });
    const stages = allPass();
    stages[2] = stub("host-compat", []);
    expect(validate(validInput(), { stages })).toEqual(base);
  });

  it("is not accepted when a stage is missing", () => {
    const r = validate(validInput(), { stages: allPass().slice(0, 3) });
    expect(r.accepted).toBe(false);
    expect(r.stages[3]).toEqual({ stage: "capability-policy", status: "not-run" });
  });

  it("reports contract failures with every stage not-run", () => {
    const input = validInput();
    (input.contract as any).contractVersion = "7.0.0";
    const r = validate(input, { stages: allPass() });
    expect(r.accepted).toBe(false);
    expect(r.stages.every((s) => s.status === "not-run")).toBe(true);
    expect(r.findings[0]?.stage).toBe("contract");
  });
});

describe("determinism and purity", () => {
  it("sorts findings by stage, location, code, message", () => {
    const stages = allPass();
    stages[0] = stub("a2ui", [finding("a2ui", "B", "/b"), finding("a2ui", "A", "/b"), finding("a2ui", "Z", "/a")]);
    const r = validate(validInput(), { stages });
    expect(r.findings.map((f) => f.code)).toEqual(["Z", "A", "B"]);
  });

  it("gives equal results on repeat runs", () => {
    const stages = allPass();
    stages[0] = stub("a2ui", [finding("a2ui", "B", "/b"), finding("a2ui", "A", "/a")]);
    const first = validate(validInput(), { stages });
    const second = validate(validInput(), { stages });
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it("accepts deeply frozen input without error and leaves it unchanged", () => {
    const input = deepFreeze(validInput());
    const before = JSON.stringify(input);
    expect(() => validate(input, { stages: allPass() })).not.toThrow();
    expect(JSON.stringify(input)).toBe(before);
  });
});
