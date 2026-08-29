import type { PersonNote } from "../types";
import { DAY, iso, NOW } from "./random";

/** Builds a fresh copy of the table. */
export function seedPersonNotes(): PersonNote[] {
  return [
    {
      id: "note_1",
      user_id: "usr_0002",
      author: "admin@mabinsoft.dev",
      body: "Requested that personal Slack DMs be excluded from summaries — revisit filter rules next quarter.",
      created_at: iso(NOW - 12 * DAY),
    },
    {
      id: "note_2",
      user_id: "usr_0006",
      author: "admin@mabinsoft.dev",
      body: "Two GitHub identities in use (work + contractor). Keep both linked until the contractor account is archived.",
      created_at: iso(NOW - 4 * DAY),
    },
  ];
}

/** Mutable in-memory table of admin-only notes attached to a person. */
export const personNotes: PersonNote[] = seedPersonNotes();
