import type { OrgNode, Person } from "../types";
import { people } from "./people.mock";
import { DAY, iso, NOW } from "./random";

/** [id, name, subtitle, parent, indices into `people`] */
const ORG_SEED: Array<[string, string, string, string | null, number[]]> = [
  ["org_root", "Executive", "Company leadership", null, [0]],
  ["org_cto", "CTO Division", "Engineering & Tech", "org_root", [1, 2]],
  ["org_cpo", "CPO Division", "Product Management", "org_root", [3]],
  ["org_cfo", "CFO Division", "Finance & Valuation", "org_root", [4]],
  ["org_coo", "COO Division", "Ops & Compliance", "org_root", [5]],
  ["org_devops", "DevOps Unit", "Platform & Cloud", "org_cto", [6, 7]],
  ["org_secops", "SecOps Unit", "Security & VPC", "org_cto", [8]],
];

/** Builds a fresh copy of the table from the current people. */
export function seedOrgNodes(source: readonly Person[]): OrgNode[] {
  const siblingCount = new Map<string | null, number>();
  return ORG_SEED.map(([id, name, subtitle, parent_id, members], i) => {
    const position = siblingCount.get(parent_id) ?? 0;
    siblingCount.set(parent_id, position + 1);
    return {
      id,
      name,
      subtitle,
      parent_id,
      position,
      member_ids: members.map((m) => source[m]?.id).filter((v): v is string => Boolean(v)),
      created_at: iso(NOW - (30 - i) * DAY),
    };
  });
}

/** Mutable in-memory table of organization nodes. */
export const orgNodes: OrgNode[] = seedOrgNodes(people);
