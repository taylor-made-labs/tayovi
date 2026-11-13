// Reads A2UI v1.0 messages into a plain per-surface view.
// This is a read-only reading of JSON. It does not validate (A2UI does that)
// and it never changes the messages it is given.

import { isRecord } from "../util/json.js";
import type { A2uiBundle } from "../validation/types.js";

export interface ComponentView {
  id: string;
  type: string;
  /** Catalog the component belongs to: its own catalogId, else the surface catalog. */
  catalogId: string;
  /** The raw component object exactly as sent. */
  raw: Record<string, unknown>;
}

export interface DataWrite {
  /** JSON Pointer the message writes to. */
  path: string;
  value: unknown;
  /** Where in the bundle this write came from, as a JSON Pointer. */
  source: string;
}

export interface SurfaceView {
  surfaceId: string;
  catalogId: string;
  /** Raw surface `metadata` from createSurface (may be undefined). */
  metadata: unknown;
  components: Map<string, ComponentView>;
  dataWrites: DataWrite[];
}

/** Builds surface views from a bundle. A later component with the same id replaces an earlier one. */
export function readSurfaces(bundle: A2uiBundle): SurfaceView[] {
  const surfaces = new Map<string, SurfaceView>();
  bundle.messages.forEach((message, index) => {
    if (!isRecord(message)) return;
    const create = message["createSurface"];
    if (isRecord(create) && typeof create["surfaceId"] === "string") {
      const surfaceId = create["surfaceId"];
      const catalogId = typeof create["catalogId"] === "string" ? create["catalogId"] : "";
      const view: SurfaceView = {
        surfaceId,
        catalogId,
        metadata: create["metadata"],
        components: new Map(),
        dataWrites: [],
      };
      const initial = create["dataModel"];
      if (isRecord(initial)) {
        for (const key of Object.keys(initial).sort()) {
          view.dataWrites.push({
            path: "/" + key.replace(/~/g, "~0").replace(/\//g, "~1"),
            value: initial[key],
            source: `/messages/${index}/createSurface/dataModel/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`,
          });
        }
      }
      if (Array.isArray(create["components"])) addComponents(view, create["components"]);
      surfaces.set(surfaceId, view);
      return;
    }
    const update = message["updateComponents"];
    if (isRecord(update) && typeof update["surfaceId"] === "string" && Array.isArray(update["components"])) {
      const view = surfaces.get(update["surfaceId"]);
      if (view) addComponents(view, update["components"]);
      return;
    }
    const data = message["updateDataModel"];
    if (isRecord(data) && typeof data["surfaceId"] === "string") {
      const view = surfaces.get(data["surfaceId"]);
      if (view) {
        const path = typeof data["path"] === "string" ? data["path"] : "/";
        view.dataWrites.push({ path, value: data["value"], source: `/messages/${index}/updateDataModel` });
      }
    }
  });
  return [...surfaces.values()];
}

function addComponents(view: SurfaceView, list: unknown[]): void {
  for (const raw of list) {
    if (!isRecord(raw) || typeof raw["id"] !== "string" || typeof raw["component"] !== "string") continue;
    const catalogId = typeof raw["catalogId"] === "string" ? raw["catalogId"] : view.catalogId;
    view.components.set(raw["id"], { id: raw["id"], type: raw["component"], catalogId, raw });
  }
}

/** Collects every data-binding path ({"path": "/x"}) found inside a value. */
export function collectBindingPaths(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectBindingPaths(item, out);
  } else if (isRecord(value)) {
    const p = value["path"];
    if (typeof p === "string" && Object.keys(value).length === 1) out.push(p);
    for (const [key, child] of Object.entries(value)) {
      if (key === "metadata") continue;
      collectBindingPaths(child, out);
    }
  }
  return out;
}

export interface ActionRef {
  /** Event name or function name. */
  ref: string;
  kind: "event" | "function";
  /** The raw action object. */
  raw: Record<string, unknown>;
}

/** Reads the action a component carries, if any. */
export function readAction(component: Record<string, unknown>): ActionRef | undefined {
  const action = component["action"];
  if (!isRecord(action)) return undefined;
  const event = action["event"];
  if (isRecord(event) && typeof event["name"] === "string") {
    return { ref: event["name"], kind: "event", raw: action };
  }
  const fn = action["functionCall"];
  if (isRecord(fn) && typeof fn["call"] === "string") {
    return { ref: fn["call"], kind: "function", raw: action };
  }
  return undefined;
}
