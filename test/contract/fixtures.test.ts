// Runs every shared fixture through the validator and compares the result to
// the hand-written expected findings (Req 12.4). The expected values in the
// case files are written by people, not produced by running the validator.

import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validate } from "../../src/index.js";
import type { ValidationInput } from "../../src/index.js";
import { loadFixture, validInput } from "../helpers.js";

const casesDir = fileURLToPath(new URL("../../fixtures/contract/cases/", import.meta.url));
const names = readdirSync(casesDir).filter((n) => n.endsWith(".json")).sort();

interface CaseFile {
  description: string;
  replaces: Partial<ValidationInput>;
  expected: {
    accepted: boolean;
    stages: string[];
    findings: { stage: string; code: string; severity: string; location: string }[];
  };
}

const project = (r: ReturnType<typeof validate>) => ({
  accepted: r.accepted,
  stages: r.stages.map((s) => s.status),
  findings: r.findings.map((f) => ({ stage: f.stage, code: f.code, severity: f.severity, location: f.location })),
});

describe("shared fixtures", () => {
  it("has the valid fixture accepted", () => {
    expect(project(validate(validInput()))).toEqual({
      accepted: true,
      stages: ["passed", "passed", "passed", "passed"],
      findings: [],
    });
  });

  it("covers every acceptance outcome with at least one case", () => {
    const codes = new Set<string>();
    for (const n of names) {
      for (const f of loadFixture<CaseFile>(`cases/${n}`).expected.findings) codes.add(f.code);
    }
    for (const required of [
      "A2UI_VALIDATION_FAILED", "A2UI_INTEGRITY_ERROR", "TAYOVI_INVARIANT_REMOVED", "TAYOVI_MARKER_ALTERED",
      "TAYOVI_POLICY_DISALLOWED", "TAYOVI_BASE_MISSING", "TAYOVI_BASE_MISMATCH", "TAYOVI_COMPONENT_UNSUPPORTED",
      "TAYOVI_DATA_OUT_OF_SCOPE", "TAYOVI_ACTION_NOT_APPROVED", "TAYOVI_CONFIRMATION_NOT_HOST_OWNED",
      "TAYOVI_INLINE_HOST_DATA", "TAYOVI_GRANT_IN_PERSONAL", "TAYOVI_CAPABILITY_REFUSED",
      "TAYOVI_CRITICAL_UNSUPPORTED", "TAYOVI_UNKNOWN_METADATA", "TAYOVI_CONTRACT_VERSION_UNSUPPORTED",
      "TAYOVI_RESERVED_KEY",
    ]) {
      expect(codes.has(required), required).toBe(true);
    }
  });

  for (const name of names) {
    it(`case ${name}`, () => {
      const file = loadFixture<CaseFile>(`cases/${name}`);
      const input: ValidationInput = { ...validInput(), ...file.replaces };
      expect(project(validate(input))).toEqual(file.expected);
      // Repeat runs match exactly (Req 4.1).
      expect(JSON.stringify(validate(input))).toBe(JSON.stringify(validate(input)));
    });
  }
});
