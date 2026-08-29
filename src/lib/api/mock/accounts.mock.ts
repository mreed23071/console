import type { ConnectedAccount, Platform } from "../types";
import { people } from "./people.mock";
import { DAY, int, iso, NOW, PLATFORMS, rnd, slugify } from "./random";

/** Accounts seen during ingestion that could not be resolved to a person yet. */
const UNRESOLVED: Array<[Platform, string, string]> = [
  ["github", "m-reedbennett", "mreed@users.noreply.github.com"],
  ["github", "octo-deploybot", "deploy@acme-labs.io"],
  ["slack", "@t.novak", "tomas.novak@mabinsoft.dev"],
  ["email", "a.silva@contractor.dev", "a.silva@contractor.dev"],
  ["linear", "@lpark", "lena.park@mabinsoft.dev"],
];

/** Builds a fresh copy of the table from whatever `people` currently holds. */
export function seedConnectedAccounts(
  source: readonly (typeof people)[number][],
): ConnectedAccount[] {
  const accounts: ConnectedAccount[] = [];

  source.forEach((p, i) => {
    const count = int(1, 4);
    const shuffled = [...PLATFORMS].sort(() => rnd() - 0.5).slice(0, count);
    shuffled.forEach((platform, j) => {
      accounts.push({
        id: `acc_${i + 1}_${j + 1}`,
        user_id: p.id,
        platform,
        external_id: `${platform.toUpperCase()}-${int(100000, 999999)}`,
        external_handle:
          platform === "github"
            ? slugify(p.full_name).replace(/\./g, "-")
            : `@${p.display_name.toLowerCase()}`,
        external_email: p.email,
        is_primary: j === 0,
        created_at: p.created_at,
      });
    });
  });

  UNRESOLVED.forEach(([platform, handle, email], j) => {
    accounts.push({
      id: `acc_orphan_${j + 1}`,
      user_id: null,
      platform,
      external_id: `${platform.toUpperCase()}-${int(100000, 999999)}`,
      external_handle: handle,
      external_email: email,
      is_primary: false,
      created_at: iso(NOW - int(5, 60) * DAY),
    });
  });

  return accounts;
}

/** Mutable in-memory table of external platform accounts. */
export const connectedAccounts: ConnectedAccount[] = seedConnectedAccounts(people);
