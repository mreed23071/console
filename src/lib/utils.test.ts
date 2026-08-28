import { describe, expect, it } from "vitest";

import { cn, initialsOf } from "./utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("lets a later tailwind class win over an earlier conflicting one", () => {
    // This is the whole reason cn exists rather than plain clsx.
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("keeps non-conflicting tailwind classes", () => {
    expect(cn("p-2", "m-4")).toBe("p-2 m-4");
  });
});

describe("initialsOf", () => {
  it("takes the first letter of the first two words", () => {
    expect(initialsOf("Amara Osei")).toBe("AO");
  });

  it("stops at two initials", () => {
    expect(initialsOf("Jean Claude Van Damme")).toBe("JC");
  });

  it("handles a single name", () => {
    expect(initialsOf("Cher")).toBe("C");
  });

  it("uppercases", () => {
    expect(initialsOf("amara osei")).toBe("AO");
  });

  it("ignores extra whitespace rather than producing blanks", () => {
    expect(initialsOf("  Amara   Osei  ")).toBe("AO");
  });

  it("returns empty for an empty name", () => {
    expect(initialsOf("")).toBe("");
  });
});
