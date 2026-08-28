import { describe, expect, it } from "vitest";

import { setupCleanDatabase } from "@/test/setup-endpoints";

import { createUserNote, deleteUserNote, getUserNotes } from "./notes";

setupCleanDatabase();

describe("getUserNotes", () => {
  it("returns only that person's notes", async () => {
    const notes = await getUserNotes("usr_0002");
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((n) => n.user_id === "usr_0002")).toBe(true);
  });

  it("returns newest first", async () => {
    await createUserNote("usr_0002", "newer", "admin@threadline.dev");
    const notes = await getUserNotes("usr_0002");
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i - 1]!.created_at >= notes[i]!.created_at).toBe(true);
    }
  });

  it("returns empty for someone with none", async () => {
    expect(await getUserNotes("usr_0001")).toEqual([]);
  });
});

describe("createUserNote", () => {
  it("stores the body and author against the person", async () => {
    const note = await createUserNote("usr_0001", "Handle with care", "admin@threadline.dev");
    expect(note).toMatchObject({
      user_id: "usr_0001",
      body: "Handle with care",
      author: "admin@threadline.dev",
    });
  });

  it("makes the note readable straight away", async () => {
    await createUserNote("usr_0001", "Handle with care", "admin@threadline.dev");
    expect(await getUserNotes("usr_0001")).toHaveLength(1);
  });
});

describe("deleteUserNote", () => {
  it("removes the note", async () => {
    const note = await createUserNote("usr_0001", "temp", "admin@threadline.dev");
    await deleteUserNote(note.id);
    expect(await getUserNotes("usr_0001")).toEqual([]);
  });

  it("is a no-op for an unknown id", async () => {
    const before = await getUserNotes("usr_0002");
    await deleteUserNote("nope");
    expect(await getUserNotes("usr_0002")).toHaveLength(before.length);
  });
});
