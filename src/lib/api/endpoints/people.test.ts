import { describe, expect, it } from "vitest";

import { connectedAccounts, messages, personNotes } from "@/lib/api/mock";
import { setupCleanDatabase } from "@/test/setup-endpoints";

import {
  createUser,
  forgetUser,
  getUser,
  getUserAccounts,
  getUserMessages,
  getUsers,
  getUsersPage,
  updateUser,
} from "./people";

setupCleanDatabase();

describe("getUsers", () => {
  it("returns every person with derived metadata", async () => {
    const users = await getUsers();
    expect(users.length).toBeGreaterThan(0);

    const [first] = users;
    expect(first).toHaveProperty("platforms");
    expect(first).toHaveProperty("message_count");
    expect(first).toHaveProperty("last_summary_at");
  });

  it("counts only that person's messages", async () => {
    const users = await getUsers();
    for (const user of users.slice(0, 3)) {
      const actual = messages.filter((m) => m.sender_user_id === user.id).length;
      expect(user.message_count).toBe(actual);
    }
  });

  it("lists each platform once, even with several accounts on it", async () => {
    for (const user of await getUsers()) {
      expect(user.platforms).toEqual([...new Set(user.platforms)]);
    }
  });
});

describe("getUsersPage", () => {
  it("returns a page, not the whole roster", async () => {
    const all = await getUsers();
    const page = await getUsersPage({ limit: 1, offset: 0 });

    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(all.length);
    expect(page.hasMore).toBe(all.length > 1);
  });

  it("offset moves the window, and the last page reports no more", async () => {
    const { total } = await getUsersPage({ limit: 1, offset: 0 });
    const last = await getUsersPage({ limit: 1, offset: total - 1 });

    expect(last.items).toHaveLength(1);
    expect(last.hasMore).toBe(false);
  });

  it("every item carries the same derived metadata getUsers does", async () => {
    const { items } = await getUsersPage({ limit: 1, offset: 0 });
    expect(items[0]).toHaveProperty("platforms");
    expect(items[0]).toHaveProperty("message_count");
  });
});

describe("getUser", () => {
  it("returns the person", async () => {
    expect((await getUser("usr_0001")).id).toBe("usr_0001");
  });

  it("rejects an unknown id", async () => {
    await expect(getUser("nope")).rejects.toThrow();
  });
});

describe("createUser", () => {
  const input = { full_name: "Jane Okafor", email: "jane@mabinsoft.dev" };

  it("adds the person", async () => {
    const created = await createUser(input);
    expect((await getUser(created.id)).full_name).toBe("Jane Okafor");
  });

  it("derives a display name from the first name", async () => {
    expect((await createUser(input)).display_name).toBe("Jane");
  });

  it("keeps an explicit display name", async () => {
    const created = await createUser({ ...input, display_name: "JJ" });
    expect(created.display_name).toBe("JJ");
  });

  it("defaults timezone to UTC and marks the person active", async () => {
    const created = await createUser(input);
    expect(created.timezone).toBe("UTC");
    expect(created.is_active).toBe(true);
    expect(created.employment_end).toBe(null);
  });

  it("rejects a duplicate email regardless of case", async () => {
    const existing = (await getUsers())[0]!;
    await expect(
      createUser({ full_name: "Clone", email: existing.email.toUpperCase() }),
    ).rejects.toThrow();
  });

  it("puts the new person at the top of the list", async () => {
    const created = await createUser(input);
    expect((await getUsers())[0]!.id).toBe(created.id);
  });
});

describe("updateUser", () => {
  it("applies the patch", async () => {
    await updateUser("usr_0001", { job_title: "Principal Engineer" });
    expect((await getUser("usr_0001")).job_title).toBe("Principal Engineer");
  });

  it("leaves unpatched fields alone", async () => {
    const before = await getUser("usr_0001");
    await updateUser("usr_0001", { job_title: "Principal Engineer" });
    expect((await getUser("usr_0001")).email).toBe(before.email);
  });

  it("touches updated_at", async () => {
    const before = await getUser("usr_0001");
    const after = await updateUser("usr_0001", { job_title: "x" });
    expect(after.updated_at >= before.updated_at).toBe(true);
  });

  it("rejects an unknown id", async () => {
    await expect(updateUser("nope", { job_title: "x" })).rejects.toThrow();
  });
});

describe("getUserAccounts / getUserMessages", () => {
  it("returns only that person's accounts", async () => {
    const accounts = await getUserAccounts("usr_0001");
    expect(accounts.every((a) => a.user_id === "usr_0001")).toBe(true);
  });

  it("returns only that person's messages", async () => {
    const own = await getUserMessages("usr_0001");
    expect(own.every((m) => m.sender_user_id === "usr_0001")).toBe(true);
  });

  it("returns empty for someone with nothing", async () => {
    expect(await getUserAccounts("nope")).toEqual([]);
    expect(await getUserMessages("nope")).toEqual([]);
  });
});

describe("forgetUser", () => {
  /** Right-to-be-forgotten has to erase every trace, not just the row. */
  it("removes the person", async () => {
    await forgetUser("usr_0001");
    await expect(getUser("usr_0001")).rejects.toThrow();
  });

  it("removes their linked accounts", async () => {
    const before = connectedAccounts.filter((a) => a.user_id === "usr_0001").length;
    const result = await forgetUser("usr_0001");

    expect(result.deleted_accounts).toBe(before);
    expect(connectedAccounts.some((a) => a.user_id === "usr_0001")).toBe(false);
  });

  it("removes their messages", async () => {
    const before = messages.filter((m) => m.sender_user_id === "usr_0001").length;
    const result = await forgetUser("usr_0001");

    expect(result.deleted_messages).toBe(before);
    expect(messages.some((m) => m.sender_user_id === "usr_0001")).toBe(false);
  });

  it("removes their admin notes", async () => {
    // usr_0002 is the seeded note owner.
    expect(personNotes.some((n) => n.user_id === "usr_0002")).toBe(true);
    await forgetUser("usr_0002");
    expect(personNotes.some((n) => n.user_id === "usr_0002")).toBe(false);
  });

  it("leaves everyone else untouched", async () => {
    const others = messages.filter((m) => m.sender_user_id === "usr_0003").length;
    await forgetUser("usr_0001");
    expect(messages.filter((m) => m.sender_user_id === "usr_0003")).toHaveLength(others);
  });

  it("rejects an unknown id", async () => {
    await expect(forgetUser("nope")).rejects.toThrow();
  });
});
