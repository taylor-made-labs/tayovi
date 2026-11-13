import { describe, it, expect } from "vitest";
import { validate } from "../../src/validation/pipeline.js";
import { capabilityPolicyStage } from "../../src/validation/stages/capability-policy.js";
import type { ValidationInput } from "../../src/validation/types.js";
import { deepFreeze, validInput } from "../helpers.js";

const run = (input: ValidationInput) => validate(input, { stages: [capabilityPolicyStage] });
const surface = (i: ValidationInput): any => (i.personal.messages as any[])[0].createSurface;
const ext = (i: ValidationInput): any => surface(i).metadata.extensions.tayovi;

describe("stage 4: capability policy", () => {
  it("passes when nothing is requested", () => {
    expect(run(validInput()).findings).toEqual([]);
  });

  it("accepts a request that policy, contract, and grants already satisfy", () => {
    const i = validInput();
    ext(i).requests = ["read.view"];
    expect(run(i).findings).toEqual([]);
  });

  it("refuses a request that is available but not granted (request is not a grant)", () => {
    const i = validInput();
    ext(i).requests = ["write.view"];
    expect(run(i).findings).toMatchObject([
      {
        code: "TAYOVI_CAPABILITY_REFUSED",
        location: "/surfaces/home/metadata/extensions/tayovi/requests/0",
        details: { capability: "write.view", missingFrom: "grants" },
      },
    ]);
  });

  it("refuses a request for a capability that does not exist", () => {
    const i = validInput();
    ext(i).requests = ["delete.everything"];
    expect(run(i).findings[0]).toMatchObject({ details: { missingFrom: "contract,policy,grants" } });
  });

  it("refuses a request the policy snapshot does not offer even if a grant exists", () => {
    const i = validInput();
    i.grants.granted.push("write.view");
    i.policy.available = ["read.view"];
    ext(i).requests = ["write.view"];
    expect(run(i).findings[0]).toMatchObject({ details: { missingFrom: "policy" } });
  });

  it("rejects a grant carried by a personal version, at any scope", () => {
    const i = validInput();
    ext(i).grants = ["write.view"];
    (i.personal.messages as any[])[1].updateComponents.components[1].metadata.extensions.tayovi.grants = { x: 1 };
    const f = run(i).findings.filter((x) => x.code === "TAYOVI_GRANT_IN_PERSONAL");
    expect(f.map((x) => x.location)).toEqual([
      "/surfaces/home/components/title/metadata/extensions/tayovi/grants",
      "/surfaces/home/metadata/extensions/tayovi/grants",
    ]);
  });

  it("rejects a malformed request list", () => {
    const i = validInput();
    ext(i).requests = [{ capability: "read.view" }];
    expect(run(i).findings).toMatchObject([{ code: "TAYOVI_CAPABILITY_REQUEST_INVALID" }]);
  });

  it("never changes the policy or grant snapshots (Req 9.6)", () => {
    const i = validInput();
    ext(i).requests = ["write.view", "read.view"];
    ext(i).grants = ["admin"];
    deepFreeze(i);
    const before = JSON.stringify({ p: i.policy, g: i.grants });
    expect(() => run(i)).not.toThrow();
    expect(JSON.stringify({ p: i.policy, g: i.grants })).toBe(before);
  });
});
