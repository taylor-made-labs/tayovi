// The Tayovi contract: one JSON document a host publishes.
// It only references A2UI catalogs and surfaces. It never redefines A2UI.

export const CONTRACT_FAMILY = "contract";
export const A2UI_PROTOCOL = "v1.0";
/** Contract versions this build understands. Others are rejected with an exact finding. */
export const SUPPORTED_CONTRACT_VERSIONS: readonly string[] = ["1.0.0"];

export type PinName = "base.id" | "base.catalogs" | "base.surfaces" | "contractVersion";
export type ChangeKind = "layout" | "composition" | "binding-presentation";
export type DataScope = "interface-state" | "host-owned";

export interface ComponentRef {
  catalog: string;
  name: string;
}

export interface Contract {
  tayovi: "contract";
  contractVersion: string;
  a2uiProtocol: "v1.0";
  app: { id: string; name: string };
  base: {
    id: string;
    catalogs: { id: string; version: string }[];
    surfaces: { id: string; source?: string }[];
  };
  fork: { mustPin: PinName[] };
  policy: {
    allowedChanges: {
      id: string;
      kind: ChangeKind;
      components?: ComponentRef[];
      properties?: string[];
    }[];
  };
  host: {
    components: ComponentRef[];
    data: { pointer: string; includeDescendants: boolean; scope: DataScope }[];
    actions: {
      catalog: string;
      ref: string;
      sensitive: boolean;
      confirmation?: "host-owned";
    }[];
  };
  capabilities: { available: string[] };
  invariants: {
    namespace: "tayovi";
    sources: ({ catalog: string } | { surface: string })[];
  };
  artifacts: { kind: string; id: string; critical?: boolean; [key: string]: unknown }[];
}

const nonEmpty = { type: "string", minLength: 1 } as const;
const componentRef = {
  type: "object",
  required: ["catalog", "name"],
  additionalProperties: false,
  properties: { catalog: nonEmpty, name: nonEmpty },
} as const;

/** JSON Schema for the contract. Tayovi-owned objects are closed (additionalProperties: false). */
export const contractSchema = {
  $id: "https://tayovi.invalid/schemas/contract-1.json",
  type: "object",
  required: [
    "tayovi", "contractVersion", "a2uiProtocol", "app", "base", "fork",
    "policy", "host", "capabilities", "invariants", "artifacts",
  ],
  additionalProperties: false,
  properties: {
    tayovi: { const: CONTRACT_FAMILY },
    contractVersion: { type: "string", pattern: "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$" },
    a2uiProtocol: { const: A2UI_PROTOCOL },
    app: {
      type: "object", required: ["id", "name"], additionalProperties: false,
      properties: { id: nonEmpty, name: nonEmpty },
    },
    base: {
      type: "object", required: ["id", "catalogs", "surfaces"], additionalProperties: false,
      properties: {
        id: nonEmpty,
        catalogs: {
          type: "array", minItems: 1,
          items: {
            type: "object", required: ["id", "version"], additionalProperties: false,
            properties: { id: nonEmpty, version: nonEmpty },
          },
        },
        surfaces: {
          type: "array", minItems: 1,
          items: {
            type: "object", required: ["id"], additionalProperties: false,
            properties: { id: nonEmpty, source: nonEmpty },
          },
        },
      },
    },
    fork: {
      type: "object", required: ["mustPin"], additionalProperties: false,
      properties: {
        mustPin: {
          type: "array", uniqueItems: true,
          items: { enum: ["base.id", "base.catalogs", "base.surfaces", "contractVersion"] },
        },
      },
    },
    policy: {
      type: "object", required: ["allowedChanges"], additionalProperties: false,
      properties: {
        allowedChanges: {
          type: "array",
          items: {
            type: "object", required: ["id", "kind"], additionalProperties: false,
            properties: {
              id: nonEmpty,
              kind: { enum: ["layout", "composition", "binding-presentation"] },
              components: { type: "array", items: componentRef },
              properties: { type: "array", items: nonEmpty },
            },
          },
        },
      },
    },
    host: {
      type: "object", required: ["components", "data", "actions"], additionalProperties: false,
      properties: {
        components: { type: "array", items: componentRef },
        data: {
          type: "array",
          items: {
            type: "object", required: ["pointer", "includeDescendants", "scope"], additionalProperties: false,
            properties: {
              pointer: { type: "string", pattern: "^(/([^/~]|~[01])*)*$" },
              includeDescendants: { type: "boolean" },
              scope: { enum: ["interface-state", "host-owned"] },
            },
          },
        },
        actions: {
          type: "array",
          items: {
            type: "object", required: ["catalog", "ref", "sensitive"], additionalProperties: false,
            properties: {
              catalog: nonEmpty, ref: nonEmpty, sensitive: { type: "boolean" },
              confirmation: { const: "host-owned" },
            },
          },
        },
      },
    },
    capabilities: {
      type: "object", required: ["available"], additionalProperties: false,
      properties: { available: { type: "array", items: nonEmpty, uniqueItems: true } },
    },
    invariants: {
      type: "object", required: ["namespace", "sources"], additionalProperties: false,
      properties: {
        namespace: { const: "tayovi" },
        sources: {
          type: "array",
          items: {
            oneOf: [
              { type: "object", required: ["catalog"], additionalProperties: false, properties: { catalog: nonEmpty } },
              { type: "object", required: ["surface"], additionalProperties: false, properties: { surface: nonEmpty } },
            ],
          },
        },
      },
    },
    artifacts: {
      type: "array",
      items: {
        type: "object", required: ["kind", "id"],
        properties: { kind: nonEmpty, id: nonEmpty, critical: { type: "boolean" } },
      },
    },
  },
} as const;
