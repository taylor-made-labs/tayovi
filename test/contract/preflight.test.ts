// Contract preflight: parsing and reference resolution run before the four
// stages. A failed preflight returns `contract` findings and leaves all four
// stages `not-run`. No stage is called.

import { describe, it, expect } from "vitest";
import { validate } from "../../src/index.js";
import type { StageId, ValidationInput, ValidationStage } from "../../src/index.js";
import { validInput } from "../helpers.js";

const NOT_RUN = [
  { stage: "a2ui", status: "not-run" },
  { stage: "invariants", status: "not-run" },
  { stage: "host-compat", status: "not-run" },
  { stage: "capability-policy", status: "not-run" },
];

function spyStages(calls: StageId[]): ValidationStage[] {
  return (["a2ui", "invariants", "host-compat", "capability-policy"] as StageId[]).map((id) => ({
    id,
    run: () => {
      calls.push(id);
      return [];
    },
  }));
}

function expectPreflightFailure(input: ValidationInput, code: string, location?: string) {
  const calls: StageId[] = [];
  const r = validate(input, { stages: spyStages(calls) });
  expect(r.accepted).toBe(false);
  expect(r.stages).toEqual(NOT_RUN);
  expect(r.findings.length).toBeGreaterThan(0);
  expect(r.findings.every((f) => f.stage === "contract")).toBe(true);
  expect(r.findings.map((f) => f.code)).toContain(code);
  if (location) expect(r.findings.some((f) => f.location === location)).toBe(true);
  expect(calls).toEqual([]);
  return r;
}

describe("contract preflight leaves every stage not-run", () => {
  it("malformed contract: not an object", () => {
    const i = validInput();
    i.contract = "not a contract";
    expectPreflightFailure(i, "TAYOVI_CONTRACT_MALFORMED", "/");
  });

  it("malformed contract: fails the schema", () => {
    const i = validInput();
    delete (i.contract as any).host;
    expectPreflightFailure(i, "TAYOVI_CONTRACT_MALFORMED");
  });

  it("unversioned contract", () => {
    const i = validInput();
    delete (i.contract as any).contractVersion;
    expectPreflightFailure(i, "TAYOVI_CONTRACT_UNVERSIONED", "/contractVersion");
  });

  it("unsupported contract version", () => {
    const i = validInput();
    (i.contract as any).contractVersion = "2.0.0";
    expectPreflightFailure(i, "TAYOVI_CONTRACT_VERSION_UNSUPPORTED", "/contractVersion");
  });

  it("unresolved catalog (not in the host registry)", () => {
    const i = validInput();
    i.registry.catalogs = [];
    expectPreflightFailure(i, "TAYOVI_CONTRACT_UNKNOWN_CATALOG", "/base/catalogs/0/id");
  });

  it("unresolved surface (not in the base version)", () => {
    const i = validInput();
    (i.contract as any).base.surfaces = [{ id: "ghost" }];
    expectPreflightFailure(i, "TAYOVI_CONTRACT_UNKNOWN_SURFACE", "/base/surfaces/0/id");
  });

  it("executable artifact kind in a 1.0 contract", () => {
    const i = validInput();
    (i.contract as any).artifacts = [{ kind: "implementation-ref", id: "x" }];
    expectPreflightFailure(i, "TAYOVI_ARTIFACT_KIND_UNSUPPORTED", "/artifacts/0/kind");
  });

  it("runs the stages once the preflight passes", () => {
    const calls: StageId[] = [];
    const r = validate(validInput(), { stages: spyStages(calls) });
    expect(calls).toEqual(["a2ui", "invariants", "host-compat", "capability-policy"]);
    expect(r.accepted).toBe(true);
  });

  it("keeps non-error preflight findings (info) while the stages still run", () => {
    const i = validInput();
    (i.contract as any).artifacts = [{ kind: "future-thing", id: "x", critical: false }];
    const calls: StageId[] = [];
    const r = validate(i, { stages: spyStages(calls) });
    expect(calls).toHaveLength(4);
    expect(r.findings).toMatchObject([{ stage: "contract", code: "TAYOVI_ARTIFACT_KIND_UNKNOWN", severity: "info" }]);
    expect(r.accepted).toBe(true);
  });
});
