import { describe, expect, it } from "vitest";

import { connectedAccounts, messages } from "@/lib/api/mock";
import { setupCleanDatabase } from "@/test/setup-endpoints";

import {
  createAccount,
  deleteAccount,
  getUnlinkedAccounts,
  linkAccount,
  unlinkAccount,
} from "./accounts";

setupCleanDatabase();

const anyLinkedAccount = () => connectedAccounts.find((a) => a.user_id !== null)!;

describe("getUnlinkedAccounts", () => {
  it("returns only accounts with no person", async () => {
    const unlinked = await getUnlinkedAccounts();
    expect(unlinked.length).toBeGreaterThan(0);
    expect(unlinked.every((a) => a.user_id === null)).toBe(true);
  });

  it("counts the messages each unresolved account produced", async () => {
    for (const account of await getUnlinkedAccounts()) {
      const actual = messages.filter((m) => m.sender_relation_id === account.id).length;
      expect(account.message_count).toBe(actual);
    }
  });
});

describe("linkAccount", () => {
  it("attaches the account to the person", async () => {
    const [orphan] = await getUnlinkedAccounts();
    const linked = await linkAccount(orphan!.id, "usr_0001");
    expect(linked.user_id).toBe("usr_0001");
  });

  it("reattributes every message from that account", async () => {
    const [orphan] = await getUnlinkedAccounts();
    const owned = messages.filter((m) => m.sender_relation_id === orphan!.id);
    expect(owned.length).toBeGreaterThan(0);

    await linkAccount(orphan!.id, "usr_0001");

    for (const message of messages.filter((m) => m.sender_relation_id === orphan!.id)) {
      expect(message.sender_user_id).toBe("usr_0001");
    }
  });

  it("drops the account out of the unresolved pool", async () => {
    const [orphan] = await getUnlinkedAccounts();
    await linkAccount(orphan!.id, "usr_0001");
    expect((await getUnlinkedAccounts()).some((a) => a.id === orphan!.id)).toBe(false);
  });

  it("becomes primary only when the person has no primary yet", async () => {
    const [first, second] = await getUnlinkedAccounts();
    // usr_0001 already has a primary account from the seed.
    const linked = await linkAccount(first!.id, "usr_0001");
    expect(linked.is_primary).toBe(false);
    expect(second).toBeDefined();
  });

  it("rejects an unknown account", async () => {
    await expect(linkAccount("nope", "usr_0001")).rejects.toThrow();
  });

  it("rejects an unknown person", async () => {
    const [orphan] = await getUnlinkedAccounts();
    await expect(linkAccount(orphan!.id, "nope")).rejects.toThrow();
  });
});

describe("unlinkAccount", () => {
  it("detaches the account", async () => {
    const account = anyLinkedAccount();
    const result = await unlinkAccount(account.id);
    expect(result.user_id).toBe(null);
    expect(result.is_primary).toBe(false);
  });

  it("returns its messages to the unresolved pool", async () => {
    const account = anyLinkedAccount();
    await unlinkAccount(account.id);

    for (const message of messages.filter((m) => m.sender_relation_id === account.id)) {
      expect(message.sender_user_id).toBe(null);
    }
  });

  it("round-trips: unlink then relink restores attribution", async () => {
    const account = anyLinkedAccount();
    const owner = account.user_id!;

    await unlinkAccount(account.id);
    await linkAccount(account.id, owner);

    for (const message of messages.filter((m) => m.sender_relation_id === account.id)) {
      expect(message.sender_user_id).toBe(owner);
    }
  });

  it("rejects an unknown account", async () => {
    await expect(unlinkAccount("nope")).rejects.toThrow();
  });
});

describe("deleteAccount", () => {
  it("removes the account and its messages", async () => {
    const account = anyLinkedAccount();
    const owned = messages.filter((m) => m.sender_relation_id === account.id).length;

    const result = await deleteAccount(account.id);

    expect(result.deleted_messages).toBe(owned);
    expect(connectedAccounts.some((a) => a.id === account.id)).toBe(false);
    expect(messages.some((m) => m.sender_relation_id === account.id)).toBe(false);
  });

  it("rejects an unknown account", async () => {
    await expect(deleteAccount("nope")).rejects.toThrow();
  });
});

describe("createAccount", () => {
  const input = {
    user_id: "usr_0001",
    platform: "github" as const,
    external_handle: "octo-jane",
  };

  it("adds the account to the person", async () => {
    const created = await createAccount(input);
    expect(created.user_id).toBe("usr_0001");
    expect(created.external_handle).toBe("octo-jane");
  });

  it("defaults the email to an empty string", async () => {
    expect((await createAccount(input)).external_email).toBe("");
  });

  it("is not primary when the person already has one", async () => {
    expect((await createAccount(input)).is_primary).toBe(false);
  });

  it("is primary when the person has none", async () => {
    for (const account of connectedAccounts.filter((a) => a.user_id === "usr_0001")) {
      account.is_primary = false;
    }
    expect((await createAccount(input)).is_primary).toBe(true);
  });
});
