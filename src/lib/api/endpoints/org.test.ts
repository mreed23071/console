import { describe, expect, it } from "vitest";

import { setupCleanDatabase } from "@/test/setup-endpoints";

import {
  assignOrgMember,
  createOrgNode,
  deleteOrgNode,
  getOrgNodes,
  removeOrgMember,
  updateOrgNode,
} from "./org";

setupCleanDatabase();

const byId = async (id: string) => (await getOrgNodes()).find((n) => n.id === id);

describe("getOrgNodes", () => {
  it("returns the seeded tree", async () => {
    const nodes = await getOrgNodes();
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.filter((n) => n.parent_id === null)).toHaveLength(1);
  });

  it("returns copies, so a caller cannot mutate the table by reference", async () => {
    const first = await getOrgNodes();
    first[0]!.name = "mutated";
    first[0]!.member_ids.push("intruder");

    const second = await getOrgNodes();
    expect(second[0]!.name).not.toBe("mutated");
    expect(second[0]!.member_ids).not.toContain("intruder");
  });
});

describe("createOrgNode", () => {
  it("adds a node under the given parent", async () => {
    const created = await createOrgNode({ name: "QA", parent_id: "org_cto" });
    expect(created.parent_id).toBe("org_cto");
    expect(created.member_ids).toEqual([]);
    expect(await byId(created.id)).toBeTruthy();
  });

  it("adds a root when no parent is given", async () => {
    const created = await createOrgNode({ name: "Board", parent_id: null });
    expect(created.parent_id).toBe(null);
  });

  it("defaults the subtitle to an empty string", async () => {
    const created = await createOrgNode({ name: "QA", parent_id: null });
    expect(created.subtitle).toBe("");
  });

  it("rejects a parent that does not exist", async () => {
    await expect(createOrgNode({ name: "QA", parent_id: "nope" })).rejects.toThrow();
  });
});

describe("updateOrgNode", () => {
  it("renames a node", async () => {
    await updateOrgNode("org_cto", { name: "Engineering" });
    expect((await byId("org_cto"))!.name).toBe("Engineering");
  });

  it("re-parents a node", async () => {
    await updateOrgNode("org_devops", { parent_id: "org_root" });
    expect((await byId("org_devops"))!.parent_id).toBe("org_root");
  });

  it("promotes a node to a root", async () => {
    await updateOrgNode("org_cto", { parent_id: null });
    expect((await byId("org_cto"))!.parent_id).toBe(null);
  });

  it("refuses to make a node its own parent", async () => {
    await expect(updateOrgNode("org_cto", { parent_id: "org_cto" })).rejects.toThrow();
  });

  it("refuses to move a node under its own descendant", async () => {
    // org_devops sits beneath org_cto; this would orphan the whole branch.
    await expect(updateOrgNode("org_cto", { parent_id: "org_devops" })).rejects.toThrow();
  });

  it("leaves the tree untouched when a move is rejected", async () => {
    const before = (await byId("org_cto"))!.parent_id;
    await expect(updateOrgNode("org_cto", { parent_id: "org_devops" })).rejects.toThrow();
    expect((await byId("org_cto"))!.parent_id).toBe(before);
  });

  it("rejects a parent that does not exist", async () => {
    await expect(updateOrgNode("org_cto", { parent_id: "nope" })).rejects.toThrow();
  });

  it("rejects an unknown node", async () => {
    await expect(updateOrgNode("nope", { name: "x" })).rejects.toThrow();
  });
});

describe("deleteOrgNode", () => {
  it("removes the node", async () => {
    await deleteOrgNode("org_secops");
    expect(await byId("org_secops")).toBe(undefined);
  });

  it("promotes children to the deleted node's parent rather than cascading", async () => {
    // org_devops and org_secops hang off org_cto, which hangs off org_root.
    const { promoted } = await deleteOrgNode("org_cto");

    expect(promoted).toBe(2);
    expect(await byId("org_devops")).toBeTruthy();
    expect((await byId("org_devops"))!.parent_id).toBe("org_root");
  });

  it("promotes children to root when a root is deleted", async () => {
    await deleteOrgNode("org_root");
    expect((await byId("org_cto"))!.parent_id).toBe(null);
  });

  it("reports zero promotions for a leaf", async () => {
    expect((await deleteOrgNode("org_secops")).promoted).toBe(0);
  });

  it("is a no-op for an unknown id", async () => {
    const before = (await getOrgNodes()).length;
    expect((await deleteOrgNode("nope")).promoted).toBe(0);
    expect(await getOrgNodes()).toHaveLength(before);
  });
});

describe("assignOrgMember", () => {
  it("adds the person to the target node", async () => {
    const [person] = (await getOrgNodes()).flatMap((n) => n.member_ids);
    await assignOrgMember("org_secops", person!);
    expect((await byId("org_secops"))!.member_ids).toContain(person);
  });

  it("removes them from their previous node — one department at a time", async () => {
    const source = (await byId("org_cto"))!;
    const person = source.member_ids[0]!;

    await assignOrgMember("org_secops", person);

    expect((await byId("org_cto"))!.member_ids).not.toContain(person);
    expect((await byId("org_secops"))!.member_ids).toContain(person);
  });

  it("never leaves a person in two departments", async () => {
    const person = (await byId("org_cto"))!.member_ids[0]!;
    await assignOrgMember("org_secops", person);
    await assignOrgMember("org_cpo", person);

    const holding = (await getOrgNodes()).filter((n) => n.member_ids.includes(person));
    expect(holding).toHaveLength(1);
    expect(holding[0]!.id).toBe("org_cpo");
  });

  it("rejects an unknown node", async () => {
    await expect(assignOrgMember("nope", "usr_0001")).rejects.toThrow();
  });
});

describe("removeOrgMember", () => {
  it("unassigns the person", async () => {
    const person = (await byId("org_cto"))!.member_ids[0]!;
    await removeOrgMember("org_cto", person);
    expect((await byId("org_cto"))!.member_ids).not.toContain(person);
  });

  it("leaves other members alone", async () => {
    const before = (await byId("org_cto"))!.member_ids;
    await removeOrgMember("org_cto", before[0]!);
    expect((await byId("org_cto"))!.member_ids).toEqual(before.slice(1));
  });

  it("is a no-op when the person is not a member", async () => {
    const before = (await byId("org_secops"))!.member_ids;
    await removeOrgMember("org_secops", "not-a-member");
    expect((await byId("org_secops"))!.member_ids).toEqual(before);
  });

  it("rejects an unknown node", async () => {
    await expect(removeOrgMember("nope", "usr_0001")).rejects.toThrow();
  });
});
