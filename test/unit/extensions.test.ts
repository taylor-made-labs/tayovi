import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { collectSites, readTayoviExtension, reservedKeys, unknownKeys } from "../../src/contract/extensions.js";
import { readBundle, writeBundle } from "../../src/a2ui/bundle.js";
import { deepEqual } from "../../src/util/json.js";
import { loadFixture } from "../helpers.js";

describe("extension reading", () => {
  it("finds surface and component sites in the base fixture", () => {
    const sites = collectSites(loadFixture("base.valid.json"));
    expect(sites.map((s) => [s.scope, s.location])).toEqual([
      ["surface", "/surfaces/home/metadata/extensions/tayovi"],
      ["component", "/surfaces/home/components/title/metadata/extensions/tayovi"],
      ["component", "/surfaces/home/components/submit/metadata/extensions/tayovi"],
    ]);
  });

  it("does not read action-level metadata: A2UI closes the action object (see a2ui-extension-scopes.test.ts)", () => {
    const bundle = {
      messages: [
        { version: "1.0", createSurface: { surfaceId: "s", catalogId: "c" } },
        {
          version: "1.0",
          updateComponents: {
            surfaceId: "s",
            components: [
              {
                id: "b",
                component: "Button",
                action: { event: { name: "x" }, metadata: { extensions: { tayovi: { sensitive: true } } } },
              },
            ],
          },
        },
      ],
    };
    expect(collectSites(bundle)).toEqual([]);
  });

  it("reads catalog and component-definition scope from catalog documents", () => {
    const sites = collectSites({
      messages: [],
      catalogDocuments: [
        {
          metadata: { extensions: { tayovi: { critical: false } } },
          components: { Box: { metadata: { extensions: { tayovi: { role: "x" } } } } },
        },
      ],
    });
    expect(sites.map((s) => s.scope)).toEqual(["catalog", "component-definition"]);
  });

  it("flags reserved a2ui_ keys and unknown tayovi keys", () => {
    expect(reservedKeys(["a2ui_x", "tayovi", "other"])).toEqual(["a2ui_x"]);
    expect(unknownKeys({ role: "r", future: 1, alsoFuture: 2 })).toEqual(["alsoFuture", "future"]);
  });

  it("returns undefined without a tayovi object", () => {
    expect(readTayoviExtension({ extensions: { other: {} } })).toBeUndefined();
    expect(readTayoviExtension(undefined)).toBeUndefined();
  });
});

describe("metadata preservation (Req 7)", () => {
  it("round-trips Tayovi, unknown non-Tayovi, and unknown future Tayovi metadata", () => {
    const bundle = {
      messages: [
        {
          version: "1.0",
          createSurface: {
            surfaceId: "s",
            catalogId: "c",
            metadata: {
              extensions: {
                tayovi: { baseId: "b", futureThing: { nested: [1, { a: null }] }, critical: false },
                vendor_x: { keep: "me", n: 1.5 },
                a_third: [],
              },
            },
          },
        },
      ],
    };
    const text = JSON.stringify(bundle);
    const round = readBundle(writeBundle(readBundle(text)));
    expect(deepEqual(round, bundle)).toBe(true);
  });

  it("round-trips the fixture files", () => {
    for (const name of ["base.valid.json", "personal.valid.json"]) {
      const dir = fileURLToPath(new URL("../../fixtures/contract/", import.meta.url));
      const text = readFileSync(dir + name, "utf8");
      expect(deepEqual(readBundle(writeBundle(readBundle(text))), JSON.parse(text))).toBe(true);
    }
  });

  it("rejects text that is not a bundle", () => {
    expect(() => readBundle('{"nope":1}')).toThrow();
  });
});
