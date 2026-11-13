// Task 2: compatibility proof against @a2ui/web_core (protocol v1.0).
// Imports only from the explicit v1_0 export (Req 3.2, 10.3).
import { describe, it, expect } from "vitest";
import { MessageProcessor, basicCatalog, STRICT_VALIDATION } from "@a2ui/web_core/v1_0";

const CATALOG = basicCatalog.id;

function run(messages: unknown[]) {
  const mp = new MessageProcessor([basicCatalog], undefined, {
    version: "v1.0",
    validationConfig: STRICT_VALIDATION,
  });
  const errors = mp.processMessagesWithErrors(messages);
  return { mp, errors };
}
const createSurface = (extra: Record<string, unknown> = {}) => ({
  version: "1.0",
  createSurface: { surfaceId: "s", catalogId: CATALOG, ...extra },
});
const updateComponents = (components: unknown[]) => ({
  version: "1.0",
  updateComponents: { surfaceId: "s", components },
});

describe("A2UI v1.0 adapter surface (U1)", () => {
  it("accepts a valid message set under strict validation", () => {
    const { errors } = run([
      createSurface(),
      updateComponents([
        { id: "root", component: "Column", children: ["t"] },
        { id: "t", component: "Text", text: "hello" },
      ]),
    ]);
    expect(errors).toEqual([]);
  });

  it("reports an unknown component with the catalog id", () => {
    const { errors } = run([createSurface(), updateComponents([{ id: "root", component: "Nope" }])]);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.error.code).toBe("VALIDATION_FAILED");
    expect(errors[0]?.error.message).toContain("Nope");
    expect(errors[0]?.error.message).toContain(CATALOG);
  });

  it("reports a dangling child reference", () => {
    const { errors } = run([
      createSurface(),
      updateComponents([{ id: "root", component: "Column", children: ["missing"] }]),
    ]);
    expect(errors[0]?.error.code).toBe("INTEGRITY_ERROR");
    expect(errors[0]?.error.message).toContain("missing");
  });

  it("reports a property type violation", () => {
    const { errors } = run([createSurface(), updateComponents([{ id: "root", component: "Text", text: 5 }])]);
    expect(errors[0]?.error.code).toBe("VALIDATION_FAILED");
  });

  it("exposes the wire version literal as 1.0 (not v1.0)", () => {
    const { errors } = run([{ version: "v1.0", createSurface: { surfaceId: "s", catalogId: CATALOG } }]);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("metadata.extensions (U3, U4)", () => {
  const ext = { tayovi: { baseId: "b1", critical: false }, other_ext: { keep: [1, 2, 3] } };
  const compExt = { tayovi: { role: "page-title" }, other_ext: { q: 2 } };

  it("survives parsing at surface scope", () => {
    const { mp, errors } = run([
      createSurface({ metadata: { extensions: ext } }),
      updateComponents([{ id: "root", component: "Text", text: "x" }]),
    ]);
    expect(errors).toEqual([]);
    expect(JSON.parse(JSON.stringify(mp.getSurface("s")?.metadata))).toEqual({ extensions: ext });
  });

  it("survives parsing at component scope (U3: component.metadata.extensions)", () => {
    const { mp, errors } = run([
      createSurface(),
      updateComponents([{ id: "root", component: "Text", text: "x", metadata: { extensions: compExt } }]),
    ]);
    expect(errors).toEqual([]);
    const comp = mp.getSurface("s")?.componentsModel.get("root");
    expect(JSON.parse(JSON.stringify(comp?.metadata))).toEqual({ extensions: compExt });
  });

  it("requires extension keys to be UAX #31 identifiers, so the Tayovi key is `tayovi`", () => {
    const { errors } = run([createSurface({ metadata: { extensions: { "tayovi.dev/personalization": {} } } })]);
    expect(errors[0]?.error.message).toContain("UAX #31");
  });

  it("does not itself reject a2ui_-prefixed keys, so Tayovi must", () => {
    const { errors } = run([
      createSurface({ metadata: { extensions: { a2ui_x: {} } } }),
      updateComponents([{ id: "root", component: "Text", text: "x" }]),
    ]);
    expect(errors).toEqual([]);
  });

  it("stage 1 result is identical with and without Tayovi extensions (Req 2.4)", () => {
    const bad = (withExt: boolean) =>
      run([
        createSurface(withExt ? { metadata: { extensions: ext } } : {}),
        updateComponents([{ id: "root", component: "Nope", ...(withExt ? { metadata: { extensions: compExt } } : {}) }]),
      ]).errors.map((e) => [e.error.code, e.error.path, e.error.message]);
    expect(bad(true)).toEqual(bad(false));
    const good = (withExt: boolean) =>
      run([
        createSurface(withExt ? { metadata: { extensions: ext } } : {}),
        updateComponents([{ id: "root", component: "Text", text: "x", ...(withExt ? { metadata: { extensions: compExt } } : {}) }]),
      ]).errors;
    expect(good(true)).toEqual(good(false));
  });
});
