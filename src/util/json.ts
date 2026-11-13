// Small JSON helpers shared by the contract and the validation stages.

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Escapes one reference segment for a JSON Pointer (RFC 6901). */
export function escapePointerSegment(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

/** Builds a JSON Pointer from raw (unescaped) segments. */
export function pointer(...segments: (string | number)[]): string {
  return segments.map((s) => "/" + escapePointerSegment(String(s))).join("");
}

/** Decodes a JSON Pointer into raw segments. Returns undefined when it is not a valid pointer. */
export function decodePointer(ptr: string): string[] | undefined {
  if (ptr === "") return [];
  if (!ptr.startsWith("/")) return undefined;
  const parts = ptr.slice(1).split("/");
  const out: string[] = [];
  for (const raw of parts) {
    if (/~(?![01])/.test(raw)) return undefined;
    out.push(raw.replace(/~1/g, "/").replace(/~0/g, "~"));
  }
  return out;
}

/** Structural JSON equality. Object key order does not matter. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (Array.isArray(b)) return false;
  if (isRecord(a) && isRecord(b)) {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
  }
  return false;
}

/** Locale-independent string comparison, so sort order is the same everywhere. */
export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
