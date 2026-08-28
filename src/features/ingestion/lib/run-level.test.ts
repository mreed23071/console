import { describe, expect, it } from "vitest";

import { RUN_STEP_COUNT, RUN_STEP_KEYS, runLevel } from "./run-level";

describe("runLevel", () => {
  it("treats a failed run as critical", () => {
    expect(runLevel("failed")).toBe("critical");
  });

  it("treats a partial run as serious", () => {
    expect(runLevel("partial")).toBe("serious");
  });

  it("warns on a successful run that had filter errors", () => {
    // Success with errors is still worth surfacing — it is silent data loss.
    expect(runLevel("success", 3)).toBe("warning");
  });

  it("treats a clean successful run as good", () => {
    expect(runLevel("success", 0)).toBe("good");
    expect(runLevel("success")).toBe("good");
  });

  it("lets failure outrank filter errors", () => {
    expect(runLevel("failed", 12)).toBe("critical");
    expect(runLevel("partial", 12)).toBe("serious");
  });
});

describe("run steps", () => {
  it("counts the declared steps", () => {
    expect(RUN_STEP_COUNT).toBe(RUN_STEP_KEYS.length);
  });

  it("ends on the done step", () => {
    expect(RUN_STEP_KEYS[RUN_STEP_KEYS.length - 1]).toBe("step.done");
  });

  it("uses unique keys", () => {
    expect(new Set(RUN_STEP_KEYS).size).toBe(RUN_STEP_KEYS.length);
  });
});
