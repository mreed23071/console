import { describe, expect, it } from "vitest";

import { NAMESPACES } from "./config";
import { en } from "./resources";

type Catalog = { [key: string]: string | Catalog };

function flatten(node: Catalog, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

const catalogs = Object.entries(en) as Array<[string, Catalog]>;

/**
 * Structural checks over the translation catalogs. They exist because a broken
 * token does not fail a build or a render — it just renders the key name to a
 * user, which nobody notices until it ships.
 */
describe("catalog registration", () => {
  it("declares every namespace that has a catalog", () => {
    expect([...NAMESPACES].sort()).toEqual(Object.keys(en).sort());
  });

  it("has no empty namespace", () => {
    for (const [name, catalog] of catalogs) {
      expect(Object.keys(catalog).length, `${name} is empty`).toBeGreaterThan(0);
    }
  });
});

describe("every value", () => {
  it("is a non-empty string", () => {
    for (const [name, catalog] of catalogs) {
      for (const [key, value] of Object.entries(flatten(catalog))) {
        expect(value.trim().length, `${name}:${key} is blank`).toBeGreaterThan(0);
      }
    }
  });

  it("has balanced interpolation braces", () => {
    for (const [name, catalog] of catalogs) {
      for (const [key, value] of Object.entries(flatten(catalog))) {
        const opens = (value.match(/\{\{/g) ?? []).length;
        const closes = (value.match(/\}\}/g) ?? []).length;
        expect(opens, `${name}:${key} has unbalanced braces`).toBe(closes);
      }
    }
  });

  it("uses no single-brace placeholders, which i18next would not substitute", () => {
    for (const [name, catalog] of catalogs) {
      for (const [key, value] of Object.entries(flatten(catalog))) {
        const stripped = value.replace(/\{\{[^}]*\}\}/g, "");
        expect(/[{}]/.test(stripped), `${name}:${key} has a stray brace`).toBe(false);
      }
    }
  });

  it("names every interpolation variable", () => {
    for (const [name, catalog] of catalogs) {
      for (const [key, value] of Object.entries(flatten(catalog))) {
        for (const match of value.matchAll(/\{\{([^}]*)\}\}/g)) {
          expect(
            match[1]!.trim().length,
            `${name}:${key} has an empty placeholder`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("plural keys", () => {
  it("always provide an _other form alongside _one", () => {
    // i18next falls back to _other; a lone _one silently renders the key.
    for (const [name, catalog] of catalogs) {
      const keys = Object.keys(flatten(catalog));
      for (const key of keys.filter((k) => k.endsWith("_one"))) {
        expect(keys, `${name}:${key} has no _other form`).toContain(key.replace(/_one$/, "_other"));
      }
    }
  });

  it("interpolate a count", () => {
    for (const [name, catalog] of catalogs) {
      const flat = flatten(catalog);
      for (const [key, value] of Object.entries(flat)) {
        if (key.endsWith("_one") || key.endsWith("_other")) {
          expect(value.includes("{{count}}"), `${name}:${key} has no {{count}}`).toBe(true);
        }
      }
    }
  });
});

describe("common namespace", () => {
  it("carries the shared action and error vocabulary every feature reuses", () => {
    // Note: assert against the key list, not toHaveProperty — these keys
    // contain literal dots, which toHaveProperty would read as a path.
    const keys = Object.keys(flatten(en.common as unknown as Catalog));
    for (const key of ["action.cancel", "action.saveChanges", "error.title", "empty.title"]) {
      expect(keys, `common:${key} is missing`).toContain(key);
    }
  });
});
