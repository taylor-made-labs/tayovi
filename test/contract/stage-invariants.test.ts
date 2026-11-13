import { describe, it, expect } from "vitest";
import { validate } from "../../src/validation/pipeline.js";
import { a2uiStage } from "../../src/validation/stages/a2ui.js";
import { invariantsStage } from "../../src/validation/stages/invariants.js";
import type { Finding, ValidationInput } from "../../src/validation/types.js";
import { deepFreeze, validInput } from "../helpers.js";

const stages = [a2uiStage, invariantsStage];
const run = (input: ValidationInput) => validate(input, { stages });
const errors = (fs: Finding[]) => fs.filter((f) => f.severity === "error");

const list = (i: ValidationInput): any[] => (i.personal.messages as any[])[1].updateComponents.components;
const comp = (i: ValidationInput, id: string): any => list(i).find((c) => c.id === id);
const surface = (i: ValidationInput): any => (i.personal.messages as any[])[0].createSurface;
const remove = (i: ValidationInput, id: string) => {
  const l = list(i);
  l.splice(l.findIndex((c) => c.id === id), 1);
};

describe("stage 2: invariants", () => {
  it("accepts the valid personal version (layout, composition, and presentation changes)", () => {
    const r = run(validInput());
    expect(errors(r.findings)).toEqual([]);
    expect(r.stages.slice(0, 2).map((s) => s.status)).toEqual(["passed", "passed"]);
  });

  describe("base identity and pins (Req 1.6, 10.4)", () => {
    it("rejects a missing base", () => {
      const i = validInput();
      delete surface(i).metadata.extensions.tayovi.baseId;
      const r = run(i);
      expect(r.findings).toMatchObject([
        { code: "TAYOVI_BASE_MISSING", location: "/surfaces/home/metadata/extensions/tayovi/baseId" },
      ]);
    });

    it("rejects a mismatched base and names both ids", () => {
      const i = validInput();
      surface(i).metadata.extensions.tayovi.baseId = "base-OLD";
      const r = run(i);
      expect(r.findings[0]).toMatchObject({
        code: "TAYOVI_BASE_MISMATCH",
        details: { expected: "base-2026-11-13", actual: "base-OLD" },
      });
    });

    it("rejects a missing or different contract version pin", () => {
      const i = validInput();
      delete surface(i).metadata.extensions.tayovi.contractVersion;
      expect(run(i).findings[0]?.code).toBe("TAYOVI_PIN_MISSING");
      surface(i).metadata.extensions.tayovi.contractVersion = "0.9.0";
      expect(run(i).findings[0]?.code).toBe("TAYOVI_PIN_MISMATCH");
    });

    it("rejects an unknown surface and a missing pinned surface", () => {
      const i = validInput();
      surface(i).surfaceId = "other";
      (i.personal.messages as any[])[1].updateComponents.surfaceId = "other";
      const codes = run(i).findings.map((f) => f.code);
      expect(codes).toContain("TAYOVI_SURFACE_UNKNOWN");
      expect(codes).toContain("TAYOVI_SURFACE_MISSING");
    });
  });

  describe("protected invariants (Req 6.1, 6.2)", () => {
    it("rejects a removed required role", () => {
      const i = validInput();
      delete comp(i, "title").metadata.extensions.tayovi.role;
      const f = run(i).findings;
      expect(f).toMatchObject([{ code: "TAYOVI_INVARIANT_REMOVED", details: { invariant: "role:page-title" } }]);
    });

    it("accepts the role moving to another component", () => {
      const i = validInput();
      const title = comp(i, "title");
      const ext = title.metadata.extensions.tayovi;
      comp(i, "submitLabel").metadata = { extensions: { tayovi: { role: ext.role } } };
      delete ext.role;
      expect(errors(run(i).findings)).toEqual([]);
    });

    it("rejects a removed protected component (binding)", () => {
      const i = validInput();
      remove(i, "title");
      (comp(i, "root")).children = ["body", "submit"];
      const f = run(i).findings.filter((x) => x.code === "TAYOVI_INVARIANT_REMOVED");
      expect(f.map((x) => x.details?.["invariant"]).sort()).toEqual(["binding:/view/title", "role:page-title"]);
    });

    it("rejects a protected binding that was rebound", () => {
      const i = validInput();
      comp(i, "title").text = "static";
      const f = run(i).findings;
      expect(f.some((x) => x.code === "TAYOVI_INVARIANT_REMOVED" && x.details?.["invariant"] === "binding:/view/title")).toBe(true);
    });

    it("rejects a removed protected action", () => {
      const i = validInput();
      comp(i, "submit").action = { event: { name: "host.other" } };
      const f = run(i).findings;
      expect(f.some((x) => x.code === "TAYOVI_INVARIANT_REMOVED" && x.details?.["invariant"] === "action:host.submit")).toBe(true);
    });

    it("rejects a removed non-removable capability", () => {
      const i = validInput();
      surface(i).metadata.extensions.tayovi.capabilities = [];
      const f = run(i).findings;
      expect(f).toMatchObject([{ code: "TAYOVI_INVARIANT_REMOVED", details: { invariant: "capability:read.view" } }]);
    });

    it("rejects a deleted marker whose invariant still holds", () => {
      const i = validInput();
      delete surface(i).metadata.extensions.tayovi.nonRemovableCapabilities;
      const f = run(i).findings;
      expect(f).toMatchObject([{ code: "TAYOVI_MARKER_ALTERED", details: { keys: "nonRemovableCapabilities" } }]);
    });

    it("rejects an altered protected marker", () => {
      const i = validInput();
      comp(i, "submit").metadata.extensions.tayovi.sensitive = true;
      expect(run(i).findings).toMatchObject([{ code: "TAYOVI_MARKER_ALTERED", details: { keys: "sensitive" } }]);
    });
  });

  describe("personalization policy (Req 6.3, 6.4)", () => {
    it("rejects a change no rule allows and names the rules checked", () => {
      const i = validInput();
      comp(i, "root").align = "center";
      const f = run(i).findings;
      expect(f).toHaveLength(1);
      expect(f[0]).toMatchObject({
        code: "TAYOVI_POLICY_DISALLOWED",
        location: "/surfaces/home/components/root/align",
        details: { change: "change", component: "root", property: "align", rule: "present" },
      });
    });

    it("rejects an added component of a type no composition rule allows", () => {
      const i = validInput();
      list(i).push({ id: "extra", component: "Button", child: "submitLabel", action: { event: { name: "host.refresh" } } });
      comp(i, "root").children.push("extra");
      const f = run(i).findings.filter((x) => x.code === "TAYOVI_POLICY_DISALLOWED");
      expect(f.map((x) => x.details?.["change"])).toEqual(["addition"]);
      expect(f[0]?.details?.["rule"]).toBe("arrange, compose");
    });

    it("allows adding a Text through the composition rule", () => {
      const i = validInput();
      list(i).push({ id: "note", component: "Text", text: "added" });
      comp(i, "root").children.push("note");
      expect(errors(run(i).findings)).toEqual([]);
    });

    it("leaves every input unchanged when it rejects (Req 4.5, 6.4)", () => {
      const i = validInput();
      comp(i, "root").align = "center";
      deepFreeze(i);
      const before = JSON.stringify(i);
      expect(run(i).accepted).toBe(false);
      expect(JSON.stringify(i)).toBe(before);
    });
  });

  describe("metadata (Req 2.2, 7.3)", () => {
    it("rejects reserved a2ui_ keys in a personal version", () => {
      const i = validInput();
      surface(i).metadata.extensions.a2ui_secret = { x: 1 };
      expect(run(i).findings).toMatchObject([
        { code: "TAYOVI_RESERVED_KEY", location: "/surfaces/home/metadata/extensions/a2ui_secret" },
      ]);
    });

    it("rejects critical unknown Tayovi metadata", () => {
      const i = validInput();
      Object.assign(surface(i).metadata.extensions.tayovi, { critical: true, futureRule: { a: 1 } });
      expect(run(i).findings).toMatchObject([
        { code: "TAYOVI_CRITICAL_UNSUPPORTED", details: { keys: "futureRule" } },
      ]);
    });

    it("keeps non-critical unknown Tayovi metadata and reports info", () => {
      const i = validInput();
      Object.assign(comp(i, "title").metadata.extensions.tayovi, { futureRule: { a: 1 } });
      const r = run(i);
      expect(r.accepted).toBe(false); // only stages 1 and 2 supplied
      expect(r.findings).toMatchObject([{ code: "TAYOVI_UNKNOWN_METADATA", severity: "info" }]);
      expect(r.stages.slice(0, 2).map((s) => s.status)).toEqual(["passed", "passed"]);
      expect(comp(i, "title").metadata.extensions.tayovi.futureRule).toEqual({ a: 1 });
    });

    it("does not treat unknown non-Tayovi extensions as findings", () => {
      const r = run(validInput());
      expect(r.findings.filter((f) => f.code.startsWith("TAYOVI_"))).toEqual([]);
    });
  });
});
