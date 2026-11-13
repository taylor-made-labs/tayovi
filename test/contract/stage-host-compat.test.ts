import { describe, it, expect } from "vitest";
import { validate } from "../../src/validation/pipeline.js";
import { a2uiStage } from "../../src/validation/stages/a2ui.js";
import { findDataEntry, hostCompatStage } from "../../src/validation/stages/host-compat.js";
import type { ValidationInput } from "../../src/validation/types.js";
import { CATALOG, validInput } from "../helpers.js";

const run = (input: ValidationInput) => validate(input, { stages: [hostCompatStage] });
const list = (i: ValidationInput): any[] => (i.personal.messages as any[])[1].updateComponents.components;
const comp = (i: ValidationInput, id: string): any => list(i).find((c) => c.id === id);
const contract = (i: ValidationInput): any => i.contract;
const codes = (i: ValidationInput) => run(i).findings.map((f) => f.code);

describe("stage 3: host compatibility", () => {
  it("accepts the valid personal version", () => {
    const r = validate(validInput(), { stages: [a2uiStage, hostCompatStage] });
    expect(r.findings).toEqual([]);
  });

  describe("components (Req 5.1)", () => {
    it("rejects a catalog-valid component the host does not support, naming component and catalog", () => {
      const i = validInput();
      contract(i).host.components = contract(i).host.components.filter((c: any) => c.name !== "Card");
      const f = run(i).findings;
      expect(f).toMatchObject([
        {
          code: "TAYOVI_COMPONENT_UNSUPPORTED",
          location: "/surfaces/home/components/body",
          details: { component: "Card", catalog: CATALOG, missingFrom: "contract" },
        },
      ]);
    });

    it("rejects a component missing from the registry snapshot", () => {
      const i = validInput();
      i.registry.components = i.registry.components.filter((c) => c.name !== "Button");
      expect(run(i).findings[0]).toMatchObject({ details: { component: "Button", missingFrom: "registry" } });
    });
  });

  describe("data scope (Req 8.2)", () => {
    it("rejects a binding outside the scoped data and names the path", () => {
      const i = validInput();
      comp(i, "bodyText").text = { path: "/secrets/key" };
      expect(run(i).findings).toMatchObject([
        { code: "TAYOVI_DATA_OUT_OF_SCOPE", details: { path: "/secrets/key", component: "bodyText" } },
      ]);
    });

    it("allows a binding to host-owned data (reference only)", () => {
      const i = validInput();
      comp(i, "bodyText").text = { path: "/account/name" };
      expect(codes(i)).toEqual([]);
    });

    it("does not treat a sibling that shares a prefix as in scope", () => {
      const i = validInput();
      comp(i, "bodyText").text = { path: "/viewer/x" };
      expect(codes(i)).toEqual(["TAYOVI_DATA_OUT_OF_SCOPE"]);
    });

    it("honors includeDescendants=false", () => {
      const i = validInput();
      contract(i).host.data = [{ pointer: "/view", includeDescendants: false, scope: "interface-state" }];
      comp(i, "bodyText").text = { path: "/view/count" };
      const f = run(i).findings;
      expect(f.map((x) => x.code)).toContain("TAYOVI_DATA_OUT_OF_SCOPE");
      comp(i, "bodyText").text = { path: "/view" };
      expect(run(i).findings.filter((x) => x.details?.["component"] === "bodyText")).toEqual([]);
    });

    it("treats ~1 as a slash inside one segment, not a separator", () => {
      const entries = [{ pointer: "/a~1b", includeDescendants: true, scope: "interface-state" as const }];
      expect(findDataEntry(entries, "/a~1b/c")).toBeDefined();
      expect(findDataEntry(entries, "/a/b")).toBeUndefined();
      expect(findDataEntry(entries, "/a/b/c")).toBeUndefined();
    });

    it("treats ~0 as a tilde and rejects malformed pointers", () => {
      const entries = [{ pointer: "/t~0x", includeDescendants: true, scope: "interface-state" as const }];
      expect(findDataEntry(entries, "/t~0x/y")).toBeDefined();
      expect(findDataEntry(entries, "/t~x")).toBeUndefined();
      expect(findDataEntry(entries, "no-slash")).toBeUndefined();
    });

    it("picks the most specific entry", () => {
      const entries = [
        { pointer: "/view", includeDescendants: true, scope: "interface-state" as const },
        { pointer: "/view/owned", includeDescendants: true, scope: "host-owned" as const },
      ];
      expect(findDataEntry(entries, "/view/owned/x")?.scope).toBe("host-owned");
      expect(findDataEntry(entries, "/view/other")?.scope).toBe("interface-state");
    });

    it("rejects a data write outside the scoped data", () => {
      const i = validInput();
      (i.personal.messages as any[])[0].createSurface.dataModel = { view: { title: "t" }, elsewhere: 1 };
      expect(run(i).findings).toMatchObject([
        { code: "TAYOVI_DATA_OUT_OF_SCOPE", details: { path: "/elsewhere" } },
      ]);
    });
  });

  describe("inline host data (Req 8.4)", () => {
    it("rejects inline values for host-owned data in the initial data model", () => {
      const i = validInput();
      (i.personal.messages as any[])[0].createSurface.dataModel = { view: { title: "t" }, account: { name: "Real Name" } };
      expect(run(i).findings).toMatchObject([
        { code: "TAYOVI_INLINE_HOST_DATA", details: { path: "/account", entry: "/account" } },
      ]);
    });

    it("rejects an updateDataModel write to host-owned data, including a root write", () => {
      const i = validInput();
      (i.personal.messages as any[]).push({
        version: "1.0",
        updateDataModel: { surfaceId: "home", path: "/", value: { account: { n: 1 } } },
      });
      expect(codes(i)).toEqual(["TAYOVI_INLINE_HOST_DATA"]);
    });

    it("allows interface-state values", () => {
      const i = validInput();
      (i.personal.messages as any[]).push({
        version: "1.0",
        updateDataModel: { surfaceId: "home", path: "/view/count", value: 9 },
      });
      expect(codes(i)).toEqual([]);
    });
  });

  describe("actions (Req 8.3)", () => {
    it("rejects an action the contract does not list", () => {
      const i = validInput();
      comp(i, "submit").action = { event: { name: "host.delete" } };
      expect(run(i).findings).toMatchObject([
        { code: "TAYOVI_ACTION_NOT_APPROVED", details: { action: "host.delete", missingFrom: "contract,registry" } },
      ]);
    });

    it("rejects an action listed by the contract but not the registry", () => {
      const i = validInput();
      i.registry.actions = i.registry.actions.filter((a) => a.ref !== "host.refresh");
      comp(i, "submit").action = { event: { name: "host.refresh" } };
      expect(run(i).findings[0]).toMatchObject({ details: { action: "host.refresh", missingFrom: "registry" } });
    });

    it("allows a non-sensitive approved action", () => {
      const i = validInput();
      comp(i, "submit").action = { event: { name: "host.refresh" } };
      expect(codes(i)).toEqual([]);
    });
  });

  describe("host-owned confirmation (Req 8.5)", () => {
    it("rejects a sensitive action when the registry lacks host-owned confirmation", () => {
      const i = validInput();
      delete (i.registry.actions.find((a) => a.ref === "host.submit") as any).confirmation;
      expect(run(i).findings).toMatchObject([{ code: "TAYOVI_CONFIRMATION_NOT_HOST_OWNED" }]);
    });

    it("rejects a payload that claims consent", () => {
      const i = validInput();
      comp(i, "submit").action = { event: { name: "host.submit", context: { nested: { userConfirmed: true } } } };
      const f = run(i).findings;
      expect(f).toHaveLength(1);
      expect(f[0]?.code).toBe("TAYOVI_CONFIRMATION_NOT_HOST_OWNED");
      expect(f[0]?.message).toContain("userConfirmed");
    });

    it("rejects metadata that overrides confirmation", () => {
      const i = validInput();
      comp(i, "submit").metadata.extensions.tayovi.confirmation = "none";
      expect(codes(i)).toEqual(["TAYOVI_CONFIRMATION_NOT_HOST_OWNED"]);
    });

    it("does not restrict context on non-sensitive actions", () => {
      const i = validInput();
      comp(i, "submit").action = { event: { name: "host.refresh", context: { confirmed: true } } };
      expect(codes(i)).toEqual([]);
    });
  });
});
