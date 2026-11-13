// Req 11: a later compatible contract version can reference registered
// implementation artifacts inside the SAME contract family, with no second
// artifact model. Version 1.0 never accepts them and never loads code.

import { describe, it, expect } from "vitest";
import { parseContract, validate } from "../../src/index.js";
import { loadFixture, validInput } from "../helpers.js";

const future = () => loadFixture("contract.future-1.1.json");
const opts = { supportedVersions: ["1.0.0", "1.1.0"], allowedArtifactKinds: ["implementation-ref"] };

describe("future contract version (Req 11.1, 11.2, 11.3)", () => {
  it("is rejected by the 1.0 validator as an unsupported version", () => {
    const r = parseContract(future());
    expect(r.findings.map((f) => f.code)).toEqual(["TAYOVI_CONTRACT_VERSION_UNSUPPORTED"]);
  });

  it("is rejected by 1.0 rules even if the version were allowed, because the artifact kind is executable", () => {
    const r = parseContract(future(), { supportedVersions: ["1.0.0", "1.1.0"] });
    expect(r.findings.map((f) => f.code)).toEqual(["TAYOVI_ARTIFACT_KIND_UNSUPPORTED"]);
  });

  it("parses under the same family, same schema, same artifact list when a later version allows the kind", () => {
    const r = parseContract(future(), opts);
    expect(r.findings).toEqual([]);
    expect(r.contract?.tayovi).toBe("contract");
    expect(r.contract?.artifacts).toHaveLength(1);
  });

  it("validates end to end with a pinned 1.1.0 personal version; nothing is loaded or built", () => {
    const input = { ...validInput(), contract: future() };
    (input.personal.messages as any[])[0].createSurface.metadata.extensions.tayovi.contractVersion = "1.1.0";
    const r = validate(input, { contract: opts });
    expect(r.findings).toEqual([]);
    expect(r.accepted).toBe(true);
  });

  it("keeps the 1.0 pin strict: a personal version pinned to 1.0.0 does not match a 1.1.0 contract", () => {
    const r = validate({ ...validInput(), contract: future() }, { contract: opts });
    expect(r.findings.map((f) => f.code)).toEqual(["TAYOVI_PIN_MISMATCH"]);
  });
});
