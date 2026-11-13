import { describe, it, expect } from "vitest";
import { validate } from "../../src/validation/pipeline.js";
import { a2uiStage } from "../../src/validation/stages/a2ui.js";
import { deepEqual } from "../../src/util/json.js";
import { loadFixture, validInput, CATALOG } from "../helpers.js";

const only = [a2uiStage];

function withComponents(components: unknown[]) {
  const input = validInput();
  const update = (input.personal.messages as any[])[1].updateComponents;
  update.components = components;
  return input;
}

describe("stage 1: A2UI", () => {
  it("passes the valid personal version and does not change it (Req 5.3)", () => {
    const input = validInput();
    const before = structuredClone(input.personal);
    const r = validate(input, { stages: only });
    expect(r.findings).toEqual([]);
    expect(r.stages[0]).toEqual({ stage: "a2ui", status: "passed" });
    expect(deepEqual(input.personal, before)).toBe(true);
  });

  it("rejects a component that is not in the catalog, naming component and catalog (Req 5.1)", () => {
    const r = validate(withComponents([{ id: "root", component: "Nope" }]), { stages: only });
    expect(r.accepted).toBe(false);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0]).toMatchObject({
      stage: "a2ui",
      code: "A2UI_VALIDATION_FAILED",
      details: { component: "Nope", catalog: CATALOG },
    });
    expect(r.findings[0]?.message).toContain("Nope");
    expect(r.findings[0]?.message).toContain(CATALOG);
    expect(r.stages.slice(1).every((s) => s.status === "not-run")).toBe(true);
  });

  it("rejects a broken component reference through A2UI (Req 5.2)", () => {
    const r = validate(withComponents([{ id: "root", component: "Column", children: ["missing"] }]), { stages: only });
    expect(r.findings[0]).toMatchObject({ code: "A2UI_INTEGRITY_ERROR" });
    expect(r.findings[0]?.message).toContain("missing");
  });

  it("rejects a placement/property violation through A2UI (Req 5.2)", () => {
    const r = validate(
      withComponents([
        { id: "root", component: "Column", children: ["b"] },
        { id: "b", component: "Button", child: "root" },
      ]),
      { stages: only },
    );
    expect(r.findings[0]).toMatchObject({ stage: "a2ui", code: "A2UI_VALIDATION_FAILED" });
    expect(r.findings[0]?.location).toBe("/surfaces/home/components/1/action");
  });

  it("rejects a function-rule violation through A2UI (Req 5.2)", () => {
    const r = validate(
      withComponents([{ id: "root", component: "Text", text: { "@call": "notAFunction", args: {} } }]),
      { stages: only },
    );
    expect(r.accepted).toBe(false);
    expect(r.findings[0]).toMatchObject({ stage: "a2ui", code: "A2UI_VALIDATION_FAILED" });
    expect(r.findings[0]?.message).toContain("notAFunction");
  });

  it("gives the same stage 1 result with and without Tayovi extensions (Req 2.4)", () => {
    const bad = (strip: boolean) => {
      const input = withComponents([{ id: "root", component: "Nope", metadata: { extensions: { tayovi: { role: "x" } } } }]);
      if (strip) delete (input.personal.messages as any[])[1].updateComponents.components[0].metadata;
      return validate(input, { stages: only }).findings.map((f) => [f.code, f.location, f.message]);
    };
    expect(bad(false)).toEqual(bad(true));
  });

  it("contains no Tayovi rule: an invariant-breaking but A2UI-valid version passes stage 1", () => {
    const input = loadFixture("personal.valid.json");
    delete input.messages[1].updateComponents.components[1].metadata;
    const r = validate({ ...validInput(), personal: input }, { stages: only });
    expect(r.findings).toEqual([]);
    expect(r.stages[0]).toEqual({ stage: "a2ui", status: "passed" });
  });
});
