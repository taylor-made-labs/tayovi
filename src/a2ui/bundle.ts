// Reading and writing bundles without losing anything (Req 7).
// The raw JSON tree is kept as parsed, including unknown keys. Tayovi never
// rebuilds a bundle from a parsed A2UI model.

import { isRecord } from "../util/json.js";
import type { A2uiBundle } from "../validation/types.js";

/** Parses bundle JSON text. Throws a plain Error when the shape is not a bundle. */
export function readBundle(text: string): A2uiBundle {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed) || !Array.isArray(parsed["messages"])) {
    throw new Error("A bundle must be a JSON object with a `messages` array.");
  }
  return parsed as unknown as A2uiBundle;
}

/** Serializes a bundle. Keys keep their original order; nothing is added or removed. */
export function writeBundle(bundle: A2uiBundle): string {
  return JSON.stringify(bundle, null, 2) + "\n";
}
