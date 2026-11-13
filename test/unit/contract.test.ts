import { describe, it, expect } from "vitest";
import { parseContract } from "../../src/contract/parse.js";
import { resolveContractReferences } from "../../src/contract/resolve.js";
import { loadFixture, validInput } from "../helpers.js";

const codes = (r: { findings: { code: string }[] }) => r.findings.map((f) => f.code);

describe("parseContract", () => {
  it("accepts the valid contract", () => {
    const r = parseContract(loadFixture("contract.valid.json"));
    expect(r.findings).toEqual([]);
    expect(r.contract?.contractVersion).toBe("1.0.0");
  });

  it("rejects a non-object", () => {
    expect(codes(parseContract("nope"))).toEqual(["TAYOVI_CONTRACT_MALFORMED"]);
    expect(codes(parseContract(null))).toEqual(["TAYOVI_CONTRACT_MALFORMED"]);
  });

  it("rejects an unversioned contract with an exact location", () => {
    const c = loadFixture("contract.valid.json");
    delete c.contractVersion;
    const r = parseContract(c);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0]).toMatchObject({ code: "TAYOVI_CONTRACT_UNVERSIONED", location: "/contractVersion" });
  });

  it("rejects an unsupported contract version and lists supported ones", () => {
    const c = loadFixture("contract.valid.json");
    c.contractVersion = "9.0.0";
    const r = parseContract(c);
    expect(r.findings[0]).toMatchObject({
      code: "TAYOVI_CONTRACT_VERSION_UNSUPPORTED",
      details: { version: "9.0.0", supported: "1.0.0" },
    });
  });

  it("rejects a malformed contract with a pointer to the problem", () => {
    const c = loadFixture("contract.valid.json");
    c.base.catalogs = [];
    c.extra = true;
    const r = parseContract(c);
    expect(codes(r)).toEqual(["TAYOVI_CONTRACT_MALFORMED", "TAYOVI_CONTRACT_MALFORMED"]);
    expect(r.findings.map((f) => f.location).sort()).toEqual(["/", "/base/catalogs"]);
  });

  it("does not change its input", () => {
    const c = loadFixture("contract.valid.json");
    const before = JSON.stringify(c);
    parseContract(c);
    expect(JSON.stringify(c)).toBe(before);
  });
});

describe("artifacts (Req 11)", () => {
  const withArtifact = (artifact: object) => {
    const c = loadFixture("contract.valid.json");
    c.artifacts = [artifact];
    return c;
  };

  it("accepts JSON-safe artifact kinds", () => {
    expect(parseContract(withArtifact({ kind: "composition", id: "c1" })).findings).toEqual([]);
  });

  it("rejects an unknown critical kind", () => {
    const r = parseContract(withArtifact({ kind: "future-thing", id: "x" }));
    expect(codes(r)).toEqual(["TAYOVI_ARTIFACT_KIND_UNSUPPORTED"]);
  });

  it("keeps an unknown non-critical kind and reports it as info", () => {
    const r = parseContract(withArtifact({ kind: "future-thing", id: "x", critical: false }));
    expect(r.contract).toBeDefined();
    expect(r.findings).toMatchObject([{ code: "TAYOVI_ARTIFACT_KIND_UNKNOWN", severity: "info" }]);
  });

  it("never accepts an executable implementation reference in 1.0, even if non-critical", () => {
    const r = parseContract(withArtifact({ kind: "implementation-ref", id: "i", critical: false }));
    expect(codes(r)).toEqual(["TAYOVI_ARTIFACT_KIND_UNSUPPORTED"]);
  });
});

describe("resolveContractReferences", () => {
  it("accepts the valid references", () => {
    const i = validInput();
    const { contract } = parseContract(i.contract);
    expect(resolveContractReferences(contract!, i.base, i.registry)).toEqual([]);
  });

  it("rejects an unknown catalog", () => {
    const i = validInput();
    i.registry.catalogs = [];
    const { contract } = parseContract(i.contract);
    const f = resolveContractReferences(contract!, i.base, i.registry);
    expect(f[0]).toMatchObject({ code: "TAYOVI_CONTRACT_UNKNOWN_CATALOG", location: "/base/catalogs/0/id" });
  });

  it("rejects an unknown surface", () => {
    const i = validInput();
    (i.contract as any).base.surfaces = [{ id: "ghost" }];
    const { contract } = parseContract(i.contract);
    const f = resolveContractReferences(contract!, i.base, i.registry);
    expect(f[0]).toMatchObject({ code: "TAYOVI_CONTRACT_UNKNOWN_SURFACE", location: "/base/surfaces/0/id" });
  });

  it("rejects a host component that names a catalog the contract does not reference", () => {
    const i = validInput();
    (i.contract as any).host.components[0].catalog = "https://example.invalid/other";
    const { contract } = parseContract(i.contract);
    const f = resolveContractReferences(contract!, i.base, i.registry);
    expect(f.map((x) => x.code)).toEqual(["TAYOVI_CONTRACT_UNKNOWN_CATALOG"]);
    expect(f[0]?.location).toBe("/host/components/0/catalog");
  });
});
