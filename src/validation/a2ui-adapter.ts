// The only file that touches @a2ui/web_core. Everything else in Tayovi works
// on plain JSON, so a package change stays in one place (design U1).
import { MessageProcessor, basicCatalog, STRICT_VALIDATION } from "@a2ui/web_core/v1_0";
import type { Catalog } from "@a2ui/web_core/v1_0";

/** Any A2UI catalog object the host registers (renderer-side catalog). */
export type A2uiCatalog = Catalog<any, any>;

/** One error reported by the official A2UI v1.0 validation, unchanged. */
export interface A2uiError {
  code: string;
  path: string;
  message: string;
  surfaceId?: string;
}

/** The A2UI basic catalog shipped by @a2ui/web_core, used when a host registers none. */
export const defaultCatalogs: readonly A2uiCatalog[] = [basicCatalog];

/**
 * Runs the official A2UI v1.0 MessageProcessor under strict validation.
 * Tayovi adds no rules here. Input is cloned so the caller's data is never touched.
 */
export function runA2uiValidation(messages: readonly unknown[], catalogs: readonly A2uiCatalog[]): A2uiError[] {
  const processor = new MessageProcessor([...catalogs], undefined, {
    version: "v1.0",
    validationConfig: STRICT_VALIDATION,
  });
  try {
    const errors = processor.processMessagesWithErrors(structuredClone(messages));
    return errors.map((e) => {
      const err = e.error as { code: string; path?: string | null; message: string; surfaceId?: string };
      const out: A2uiError = { code: err.code, path: err.path ?? "/", message: err.message };
      if (err.surfaceId !== undefined) out.surfaceId = err.surfaceId;
      return out;
    });
  } finally {
    processor.dispose();
  }
}
