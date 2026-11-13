// Writes the rejected-case fixtures under fixtures/contract/cases/.
// Each case starts from the valid fixtures, changes one thing, and states the
// EXPECTED findings by hand. Run: node scripts/generate-case-fixtures.mjs
// The checked-in JSON files are the shared fixtures; this script only keeps
// them reproducible and reviewable.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const dir = fileURLToPath(new URL("../fixtures/contract/", import.meta.url));
const out = join(dir, "cases");
mkdirSync(out, { recursive: true });

const load = (name) => JSON.parse(readFileSync(join(dir, name), "utf8"));
const CATALOG = "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json";
const S = "/surfaces/home";
const X = "metadata/extensions/tayovi";

const pending = (stage, code, location, severity = "error") => ({ stage, code, severity, location });
const stagesOf = (...s) => s;
const PASS = "passed", FAIL = "failed", SKIP = "not-run";

/** A case: which documents it replaces, plus the hand-written expectation. */
const cases = [];
function add(name, description, change, expected) {
  const docs = {
    contract: load("contract.valid.json"),
    base: load("base.valid.json"),
    personal: load("personal.valid.json"),
    registry: load("registry.json"),
    policy: load("policy.json"),
    grants: load("grants.json"),
  };
  change(docs);
  const replaces = {};
  const originals = {
    contract: load("contract.valid.json"),
    base: load("base.valid.json"),
    personal: load("personal.valid.json"),
    registry: load("registry.json"),
    policy: load("policy.json"),
    grants: load("grants.json"),
  };
  for (const key of Object.keys(docs)) {
    if (JSON.stringify(docs[key]) !== JSON.stringify(originals[key])) replaces[key] = docs[key];
  }
  cases.push({ name, file: { description, replaces, expected } });
}

const comps = (d) => d.personal.messages[1].updateComponents.components;
const comp = (d, id) => comps(d).find((c) => c.id === id);
const surf = (d) => d.personal.messages[0].createSurface;
const baseComp = (d, id) => d.base.messages[1].updateComponents.components.find((c) => c.id === id);
// Same change in base and personal: the base itself carries the problem, so no
// base-versus-personal difference exists and the later stage is what must catch it.
const both = (d, id, fn) => { fn(comp(d, id)); fn(baseComp(d, id)); };

// ---- Stage 1: A2UI ---------------------------------------------------------
add("a2ui-unknown-component", "A component that is not in the catalog.",
  (d) => { comp(d, "bodyText").component = "Nope"; },
  { accepted: false, stages: stagesOf(FAIL, SKIP, SKIP, SKIP),
    findings: [pending("a2ui", "A2UI_VALIDATION_FAILED", `${S}/components/3/component`)] });

add("a2ui-broken-reference", "A child id that does not exist.",
  (d) => { comp(d, "root").children.push("ghost"); },
  { accepted: false, stages: stagesOf(FAIL, SKIP, SKIP, SKIP),
    findings: [pending("a2ui", "A2UI_INTEGRITY_ERROR", S)] });

add("a2ui-placement-violation", "A Button without its required action.",
  (d) => { delete comp(d, "submit").action; },
  { accepted: false, stages: stagesOf(FAIL, SKIP, SKIP, SKIP),
    findings: [pending("a2ui", "A2UI_VALIDATION_FAILED", `${S}/components/4/action`)] });

add("a2ui-function-rule", "A call to a function the catalog does not define.",
  (d) => { comp(d, "bodyText").text = { "@call": "notAFunction", args: {} }; },
  { accepted: false, stages: stagesOf(FAIL, SKIP, SKIP, SKIP),
    findings: [pending("a2ui", "A2UI_VALIDATION_FAILED", `${S}/components/3/text`)] });

// ---- Stage 2: invariants ---------------------------------------------------
add("invariant-role-removed", "The required page-title role marker is deleted.",
  (d) => { delete comp(d, "title").metadata.extensions.tayovi.role; },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [pending("invariants", "TAYOVI_INVARIANT_REMOVED", `${S}/components/title/${X}`)] });

add("invariant-binding-removed", "A protected binding is replaced by a literal.",
  (d) => { comp(d, "title").text = "static"; },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [pending("invariants", "TAYOVI_INVARIANT_REMOVED", `${S}/components/title/${X}`)] });

add("invariant-action-removed", "A protected action is swapped for another approved action.",
  (d) => { comp(d, "submit").action = { event: { name: "host.refresh" } }; },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [
      pending("invariants", "TAYOVI_POLICY_DISALLOWED", `${S}/components/submit/action`),
      pending("invariants", "TAYOVI_INVARIANT_REMOVED", `${S}/components/submit/${X}`),
    ] });

add("invariant-capability-removed", "A non-removable capability is no longer declared.",
  (d) => { surf(d).metadata.extensions.tayovi.capabilities = []; },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [pending("invariants", "TAYOVI_INVARIANT_REMOVED", `${S}/${X}`)] });

add("invariant-marker-altered", "A protected marker is changed.",
  (d) => { comp(d, "submit").metadata.extensions.tayovi.sensitive = true; },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [pending("invariants", "TAYOVI_MARKER_ALTERED", `${S}/components/submit/${X}`)] });

add("policy-disallowed-change", "A property change no allowed-change rule covers.",
  (d) => { comp(d, "root").align = "center"; },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [pending("invariants", "TAYOVI_POLICY_DISALLOWED", `${S}/components/root/align`)] });

add("base-missing", "The personal version does not name its base.",
  (d) => { delete surf(d).metadata.extensions.tayovi.baseId; },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [pending("invariants", "TAYOVI_BASE_MISSING", `${S}/${X}/baseId`)] });

add("base-mismatch", "The personal version names a different base.",
  (d) => { surf(d).metadata.extensions.tayovi.baseId = "base-OLD"; },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [pending("invariants", "TAYOVI_BASE_MISMATCH", `${S}/${X}/baseId`)] });

add("reserved-extension-key", "A personal version uses an a2ui_ extension key.",
  (d) => { surf(d).metadata.extensions.a2ui_custom = { x: 1 }; },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [pending("invariants", "TAYOVI_RESERVED_KEY", `${S}/metadata/extensions/a2ui_custom`)] });

add("critical-unknown-metadata", "Critical Tayovi metadata this version does not understand.",
  (d) => { Object.assign(surf(d).metadata.extensions.tayovi, { critical: true, futureRule: { a: 1 } }); },
  { accepted: false, stages: stagesOf(PASS, FAIL, SKIP, SKIP),
    findings: [pending("invariants", "TAYOVI_CRITICAL_UNSUPPORTED", `${S}/${X}`)] });

// ---- Stage 3: host compatibility -------------------------------------------
add("host-unsupported-component", "A catalog-valid component the host does not support.",
  (d) => { d.contract.host.components = d.contract.host.components.filter((c) => c.name !== "Card"); },
  { accepted: false, stages: stagesOf(PASS, PASS, FAIL, SKIP),
    findings: [pending("host-compat", "TAYOVI_COMPONENT_UNSUPPORTED", `${S}/components/body`)] });

add("host-data-out-of-scope", "A binding outside the scoped host data.",
  (d) => { comp(d, "bodyText").text = { path: "/secrets/key" }; },
  { accepted: false, stages: stagesOf(PASS, PASS, FAIL, SKIP),
    findings: [
      pending("host-compat", "TAYOVI_DATA_OUT_OF_SCOPE", `${S}/components/bodyText`),
    ] });

add("host-action-not-approved", "An action the host does not approve (carried by base and personal alike).",
  (d) => both(d, "submit", (c) => {
    c.action = { event: { name: "host.delete" } };
    delete c.metadata.extensions.tayovi.protectedActions;
  }),
  { accepted: false, stages: stagesOf(PASS, PASS, FAIL, SKIP),
    findings: [pending("host-compat", "TAYOVI_ACTION_NOT_APPROVED", `${S}/components/submit/action`)] });

add("host-confirmation-claimed", "A sensitive action payload that claims consent (carried by base and personal alike).",
  (d) => both(d, "submit", (c) => {
    c.action = { event: { name: "host.submit", context: { userConfirmed: true } } };
  }),
  { accepted: false, stages: stagesOf(PASS, PASS, FAIL, SKIP),
    findings: [pending("host-compat", "TAYOVI_CONFIRMATION_NOT_HOST_OWNED", `${S}/components/submit/action`)] });

add("host-inline-host-data", "Inline values written to host-owned data.",
  (d) => { surf(d).dataModel = { view: { title: "Welcome", count: 3 }, account: { name: "Real Name" } }; },
  { accepted: false, stages: stagesOf(PASS, PASS, FAIL, SKIP),
    findings: [pending("host-compat", "TAYOVI_INLINE_HOST_DATA", "/messages/0/createSurface/dataModel/account")] });

// ---- Stage 4: capability policy --------------------------------------------
add("capability-grant-in-personal", "A personal version carries a grant.",
  (d) => { surf(d).metadata.extensions.tayovi.grants = ["write.view"]; },
  { accepted: false, stages: stagesOf(PASS, PASS, PASS, FAIL),
    findings: [pending("capability-policy", "TAYOVI_GRANT_IN_PERSONAL", `${S}/${X}/grants`)] });

add("capability-request-refused", "A request for a capability the host has not granted.",
  (d) => { surf(d).metadata.extensions.tayovi.requests = ["write.view"]; },
  { accepted: false, stages: stagesOf(PASS, PASS, PASS, FAIL),
    findings: [pending("capability-policy", "TAYOVI_CAPABILITY_REFUSED", `${S}/${X}/requests/0`)] });

// ---- Contract level --------------------------------------------------------
add("contract-version-unsupported", "A contract version this validator does not support.",
  (d) => { d.contract.contractVersion = "9.0.0"; },
  { accepted: false, stages: stagesOf(SKIP, SKIP, SKIP, SKIP),
    findings: [pending("contract", "TAYOVI_CONTRACT_VERSION_UNSUPPORTED", "/contractVersion")] });

add("contract-unversioned", "A contract with no version.",
  (d) => { delete d.contract.contractVersion; },
  { accepted: false, stages: stagesOf(SKIP, SKIP, SKIP, SKIP),
    findings: [pending("contract", "TAYOVI_CONTRACT_UNVERSIONED", "/contractVersion")] });

add("contract-unknown-surface", "A contract that names a surface the base does not have.",
  (d) => { d.contract.base.surfaces = [{ id: "ghost" }]; },
  { accepted: false, stages: stagesOf(SKIP, SKIP, SKIP, SKIP),
    findings: [
      pending("contract", "TAYOVI_CONTRACT_UNKNOWN_SURFACE", "/base/surfaces/0/id"),
      pending("contract", "TAYOVI_CONTRACT_UNKNOWN_SURFACE", "/invariants/sources/0/surface"),
    ] });

add("contract-unknown-catalog", "A contract that names a catalog the host registry does not have.",
  (d) => { d.registry.catalogs = []; },
  { accepted: false, stages: stagesOf(SKIP, SKIP, SKIP, SKIP),
    findings: [pending("contract", "TAYOVI_CONTRACT_UNKNOWN_CATALOG", "/base/catalogs/0/id")] });

add("contract-executable-artifact", "A contract that points at executable code.",
  (d) => { d.contract.artifacts = [{ kind: "implementation-ref", id: "impl-1" }]; },
  { accepted: false, stages: stagesOf(SKIP, SKIP, SKIP, SKIP),
    findings: [pending("contract", "TAYOVI_ARTIFACT_KIND_UNSUPPORTED", "/artifacts/0/kind")] });

// ---- Accepted with information ---------------------------------------------
add("accepted-unknown-metadata", "Non-critical unknown Tayovi metadata is kept and reported as information.",
  (d) => { Object.assign(comp(d, "title").metadata.extensions.tayovi, { futureRule: { a: 1 } }); },
  { accepted: true, stages: stagesOf(PASS, PASS, PASS, PASS),
    findings: [pending("invariants", "TAYOVI_UNKNOWN_METADATA", `${S}/components/title/${X}`, "info")] });

for (const { name, file } of cases) {
  writeFileSync(join(out, `${name}.json`), JSON.stringify(file, null, 2) + "\n");
}
console.log(`wrote ${cases.length} cases`);
