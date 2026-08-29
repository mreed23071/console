import { beforeEach, describe, expect, it } from "vitest";

import { type Persona, SCOPES, useAuthStore } from "./store";

function reset(): void {
  useAuthStore.setState({ session: null });
}

function signIn(email: string, persona: Persona): void {
  useAuthStore.getState().signIn(email, persona);
}

beforeEach(reset);

describe("signIn", () => {
  it("stores the session", () => {
    signIn("amara.osei@mabinsoft.dev", "admin");
    expect(useAuthStore.getState().session).toMatchObject({
      email: "amara.osei@mabinsoft.dev",
      persona: "admin",
    });
  });

  it("derives a display name from the email local part", () => {
    signIn("amara.osei@mabinsoft.dev", "admin");
    expect(useAuthStore.getState().session!.name).toBe("Amara Osei");
  });

  it("handles underscores and hyphens as separators", () => {
    signIn("jane_okafor-smith@mabinsoft.dev", "analyst");
    expect(useAuthStore.getState().session!.name).toBe("Jane Okafor Smith");
  });

  it("falls back to a persona address when no email is given", () => {
    signIn("", "viewer");
    expect(useAuthStore.getState().session!.email).toBe("viewer@mabinsoft.dev");
  });
});

describe("signOut", () => {
  it("clears the session", () => {
    signIn("a@b.dev", "admin");
    useAuthStore.getState().signOut();
    expect(useAuthStore.getState().session).toBe(null);
  });
});

describe("setPersona", () => {
  it("switches the persona on the active session", () => {
    signIn("a@b.dev", "viewer");
    useAuthStore.getState().setPersona("admin");
    expect(useAuthStore.getState().session!.persona).toBe("admin");
  });

  it("does nothing when signed out", () => {
    useAuthStore.getState().setPersona("admin");
    expect(useAuthStore.getState().session).toBe(null);
  });

  it("keeps the rest of the session intact", () => {
    signIn("amara.osei@mabinsoft.dev", "viewer");
    const before = useAuthStore.getState().session!;
    useAuthStore.getState().setPersona("admin");
    expect(useAuthStore.getState().session!.email).toBe(before.email);
  });
});

describe("SCOPES", () => {
  it("gives the viewer no scopes", () => {
    expect(SCOPES.viewer).toEqual([]);
  });

  it("gives the analyst read access without write", () => {
    expect(SCOPES.analyst).toContain("people:read");
    expect(SCOPES.analyst).not.toContain("runs:write");
    expect(SCOPES.analyst).not.toContain("org:write");
  });

  it("gives the admin every scope the analyst has", () => {
    for (const scope of SCOPES.analyst) expect(SCOPES.admin).toContain(scope);
  });

  it("gates org editing behind admin only", () => {
    expect(SCOPES.admin).toContain("org:write");
    expect(SCOPES.viewer).not.toContain("org:read");
  });
});
