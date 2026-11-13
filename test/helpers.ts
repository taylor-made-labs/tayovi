import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import type { ValidationInput } from "../src/validation/types.js";

const dir = fileURLToPath(new URL("../fixtures/contract/", import.meta.url));

export function loadFixture<T = any>(name: string): T {
  return JSON.parse(readFileSync(join(dir, name), "utf8")) as T;
}

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

/** A fresh copy of the valid input every call, so tests can change it freely. */
export function validInput(): ValidationInput {
  return {
    contract: loadFixture("contract.valid.json"),
    base: loadFixture("base.valid.json"),
    personal: loadFixture("personal.valid.json"),
    registry: loadFixture("registry.json"),
    policy: loadFixture("policy.json"),
    grants: loadFixture("grants.json"),
  };
}

export const CATALOG = "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json";
