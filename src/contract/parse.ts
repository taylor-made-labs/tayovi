import { Ajv } from "ajv";
import { contractSchema, SUPPORTED_CONTRACT_VERSIONS, type Contract } from "./schema.js";
import { isRecord } from "../util/json.js";
import type { Finding } from "../validation/types.js";

export interface ParseOptions {
  /** Contract versions to accept. Defaults to the versions this build supports. */
  supportedVersions?: readonly string[];
  /** Extra artifact kinds to accept (a later compatible contract version adds some). */
  allowedArtifactKinds?: readonly string[];
}

/** Artifact kinds that carry JSON only. Version 1.0 accepts these. */
export const JSON_ARTIFACT_KINDS: readonly string[] = ["composition", "component-definition", "catalog-function"];
/** Kinds that point at executable code. Version 1.0 never accepts them. */
export const EXECUTABLE_ARTIFACT_KINDS: readonly string[] = ["implementation-ref"];

export interface ParseResult {
  contract?: Contract;
  findings: Finding[];
}

const ajv = new Ajv({ allErrors: true, strict: true });
const validateSchema = ajv.compile(contractSchema);

function err(code: string, location: string, message: string, details?: Record<string, string>): Finding {
  const f: Finding = { stage: "contract", code, severity: "error", location, message };
  if (details) f.details = details;
  return f;
}

/** Parses and schema-checks a contract. Pure: the input is never changed. */
export function parseContract(raw: unknown, options: ParseOptions = {}): ParseResult {
  const supported = options.supportedVersions ?? SUPPORTED_CONTRACT_VERSIONS;
  if (!isRecord(raw)) {
    return { findings: [err("TAYOVI_CONTRACT_MALFORMED", "/", "The contract must be a JSON object.")] };
  }
  if (raw["contractVersion"] === undefined) {
    return {
      findings: [err("TAYOVI_CONTRACT_UNVERSIONED", "/contractVersion", "The contract has no contractVersion.")],
    };
  }
  const version = raw["contractVersion"];
  if (typeof version !== "string" || !supported.includes(version)) {
    return {
      findings: [
        err(
          "TAYOVI_CONTRACT_VERSION_UNSUPPORTED",
          "/contractVersion",
          `Contract version ${JSON.stringify(version)} is not supported. Supported: ${supported.join(", ")}.`,
          { version: String(version), supported: supported.join(",") },
        ),
      ],
    };
  }

  const findings: Finding[] = [];
  if (!validateSchema(raw)) {
    for (const e of validateSchema.errors ?? []) {
      const where = e.instancePath === "" ? "/" : e.instancePath;
      const extra = e.params && "additionalProperty" in e.params ? ` (${String(e.params["additionalProperty"])})` : "";
      findings.push(err("TAYOVI_CONTRACT_MALFORMED", where, `${where} ${e.message ?? "is invalid"}${extra}.`));
    }
    return { findings };
  }

  const contract = raw as unknown as Contract;
  const allowed = [...JSON_ARTIFACT_KINDS, ...(options.allowedArtifactKinds ?? [])];
  contract.artifacts.forEach((artifact, i) => {
    if (allowed.includes(artifact.kind)) return;
    const location = `/artifacts/${i}/kind`;
    const executable = EXECUTABLE_ARTIFACT_KINDS.includes(artifact.kind);
    if (executable || artifact.critical !== false) {
      findings.push(
        err(
          "TAYOVI_ARTIFACT_KIND_UNSUPPORTED",
          location,
          `Artifact kind "${artifact.kind}" is not supported by contract ${contract.contractVersion}.`,
          { kind: artifact.kind, artifact: artifact.id },
        ),
      );
    } else {
      findings.push({
        stage: "contract",
        code: "TAYOVI_ARTIFACT_KIND_UNKNOWN",
        severity: "info",
        location,
        message: `Artifact kind "${artifact.kind}" is unknown and not critical. It is kept and ignored.`,
        details: { kind: artifact.kind, artifact: artifact.id },
      });
    }
  });

  if (findings.some((f) => f.severity === "error")) return { findings };
  return { contract, findings };
}
