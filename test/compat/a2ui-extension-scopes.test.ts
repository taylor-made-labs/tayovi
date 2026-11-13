// Official A2UI v1.0 compatibility proof for the extension scopes Feature 1 claims.
// These tests call @a2ui/web_core (0.15.0) only. They do not use Tayovi readers,
// so they prove what the official package parses and keeps, not what Tayovi does.
//
// Scopes: surface and component are proved in a2ui-proof.test.ts.
// Here: catalog, component-definition, and action.

import { describe, it, expect } from "vitest";
import {
  ActionMessageSchema,
  ActionSchema,
  Catalog,
  ComponentDefinitionSchema,
  MessageProcessor,
  STRICT_VALIDATION,
  basicCatalog,
} from "@a2ui/web_core/v1_0";

const ext = { tayovi: { baseId: "b1", critical: false }, vendor_x: { keep: [1, { a: null }] } };
const defExt = { tayovi: { role: "page-title" }, vendor_x: { k: 2 } };

function probeCatalogDocument(): Record<string, unknown> {
  return {
    catalogId: "https://example.invalid/catalogs/probe/v1",
    protocolVersion: "1.0",
    metadata: { extensions: ext },
    components: {
      Box: {
        type: "object",
        allOf: [
          { $ref: "common_types.json#/$defs/ComponentCommon" },
          {
            type: "object",
            properties: { component: { const: "Box" }, text: { type: "string" } },
            required: ["component"],
          },
        ],
        unevaluatedProperties: false,
        metadata: { extensions: defExt },
      },
    },
    functions: {},
  };
}

describe("component-definition scope (official)", () => {
  it("the official definition schema accepts metadata.extensions", () => {
    const doc = probeCatalogDocument() as any;
    expect(ComponentDefinitionSchema.safeParse(doc.components.Box).success).toBe(true);
  });

  it("the official definition schema rejects metadata keys other than extensions", () => {
    const doc = probeCatalogDocument() as any;
    const bad = { ...doc.components.Box, metadata: { other: 1 } };
    expect(ComponentDefinitionSchema.safeParse(bad).success).toBe(false);
  });

  it("Catalog.fromJson keeps the definition's metadata.extensions, Tayovi and non-Tayovi", () => {
    const catalog: any = Catalog.fromJson(probeCatalogDocument(), "1.0");
    expect(JSON.parse(JSON.stringify(catalog.components.get("Box")?.metadata))).toEqual({ extensions: defExt });
  });

  it("Catalog.toJson writes the definition's metadata back unchanged", () => {
    const catalog: any = Catalog.fromJson(probeCatalogDocument(), "1.0");
    const out = catalog.toJson() as any;
    expect(out.components.Box.metadata).toEqual({ extensions: defExt });
  });
});

describe("catalog scope (official)", () => {
  it("Catalog.toJson writes catalog-level metadata.extensions back unchanged", () => {
    const catalog: any = Catalog.fromJson(probeCatalogDocument(), "1.0");
    const out = catalog.toJson() as any;
    expect(out.metadata).toEqual({ extensions: ext });
  });

  it("the catalog still loads and validates messages with extensions present", () => {
    const catalog: any = Catalog.fromJson(probeCatalogDocument(), "1.0");
    const mp = new MessageProcessor([catalog], undefined, { version: "v1.0", validationConfig: STRICT_VALIDATION });
    const errors = mp.processMessagesWithErrors([
      { version: "1.0", createSurface: { surfaceId: "s", catalogId: catalog.id } },
      { version: "1.0", updateComponents: { surfaceId: "s", components: [{ id: "root", component: "Box", text: "x" }] } },
    ]);
    expect(errors).toEqual([]);
  });

  it("the built-in basic catalog carries no Tayovi metadata (nothing to inherit)", () => {
    expect((basicCatalog as any).toJson().metadata).toBeUndefined();
  });
});

describe("action scope (official)", () => {
  it("an action DEFINITION inside a component is closed: metadata is rejected", () => {
    const withMetadata = { event: { name: "x" }, metadata: { extensions: { tayovi: { sensitive: true } } } };
    expect(ActionSchema.safeParse(withMetadata).success).toBe(false);
    expect(ActionSchema.safeParse({ event: { name: "x" } }).success).toBe(true);
  });

  it("A2UI rejects a component whose action carries metadata", () => {
    const mp = new MessageProcessor([basicCatalog], undefined, { version: "v1.0", validationConfig: STRICT_VALIDATION });
    const errors = mp.processMessagesWithErrors([
      { version: "1.0", createSurface: { surfaceId: "s", catalogId: basicCatalog.id } },
      {
        version: "1.0",
        updateComponents: {
          surfaceId: "s",
          components: [
            { id: "root", component: "Button", child: "t", action: { event: { name: "x" }, metadata: { extensions: { tayovi: {} } } } },
            { id: "t", component: "Text", text: "go" },
          ],
        },
      },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.error.code).toBe("VALIDATION_FAILED");
  });

  it("action metadata exists only on the dispatched action message (renderer to agent)", () => {
    const message = {
      version: "1.0",
      action: {
        name: "x",
        surfaceId: "s",
        sourceComponentId: "b",
        timestamp: "2026-11-13T00:00:00Z",
        context: {},
        metadata: { extensions: { tayovi: { sensitive: true }, vendor_x: { n: 1 } } },
      },
    };
    const parsed = ActionMessageSchema.safeParse(message);
    expect(parsed.success).toBe(true);
    expect((parsed as any).data.action.metadata).toEqual(message.action.metadata);
  });
});
