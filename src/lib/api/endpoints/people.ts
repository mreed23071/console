import { connectedAccounts, messages, people, personNotes } from "../mock";
import type { ConnectedAccount, Message, Page, PageParams, Person, PersonWithMeta } from "../types";
import { clearSummaryCache, delay } from "./_shared";

export interface CreatePersonInput {
  full_name: string;
  email: string;
  display_name?: string;
  job_title?: string;
  address?: string;
  timezone?: string;
  employment_start?: string | null;
}

export interface ForgetUserResult {
  deleted_messages: number;
  deleted_accounts: number;
}

function withMeta(p: Person): PersonWithMeta {
  const own = messages.filter((m) => m.sender_user_id === p.id);
  return {
    ...p,
    platforms: Array.from(
      new Set(connectedAccounts.filter((a) => a.user_id === p.id).map((a) => a.platform)),
    ),
    message_count: own.length,
    last_summary_at: own[0]?.sent_at ?? null,
  };
}

/** GET /api/v1/users - unpaged, deliberately. See `getUsersPage`. */
export async function getUsers(): Promise<PersonWithMeta[]> {
  await delay();
  return people.map(withMeta);
}

/** GET /api/v1/users?limit=&offset= */
export async function getUsersPage(page: PageParams): Promise<Page<PersonWithMeta>> {
  await delay();
  const items = people.slice(page.offset, page.offset + page.limit).map(withMeta);
  return {
    items,
    total: people.length,
    limit: page.limit,
    offset: page.offset,
    hasMore: page.offset + items.length < people.length,
  };
}

/** GET /api/v1/users/{id} */
export async function getUser(id: string): Promise<Person> {
  await delay();
  const person = people.find((p) => p.id === id);
  if (!person) throw new Error(`User ${id} not found`);
  return person;
}

/** GET /api/v1/users/{id}/accounts */
export async function getUserAccounts(id: string): Promise<ConnectedAccount[]> {
  await delay(200);
  return connectedAccounts.filter((a) => a.user_id === id);
}

/** GET /api/v1/users/{id}/messages */
export async function getUserMessages(id: string): Promise<Message[]> {
  await delay(300);
  return messages.filter((m) => m.sender_user_id === id);
}

/** PATCH /api/v1/users/{id} */
export async function updateUser(id: string, patch: Partial<Person>): Promise<Person> {
  await delay(400);
  const idx = people.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`User ${id} not found`);
  people[idx] = { ...people[idx]!, ...patch, updated_at: new Date().toISOString() };
  return people[idx]!;
}

/** POST /api/v1/users */
export async function createUser(input: CreatePersonInput): Promise<Person> {
  await delay(500);
  if (people.some((p) => p.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("A person with that email already exists");
  }
  const now = new Date().toISOString();
  const person: Person = {
    id: `usr_${String(people.length + 1).padStart(4, "0")}_${Math.floor(Math.random() * 9999)}`,
    email: input.email,
    full_name: input.full_name,
    display_name: input.display_name || input.full_name.split(" ")[0] || input.full_name,
    job_title: input.job_title ?? "",
    address: input.address ?? "",
    employment_start: input.employment_start ?? now.slice(0, 10),
    employment_end: null,
    timezone: input.timezone || "UTC",
    is_active: true,
    created_at: now,
    updated_at: now,
  };
  people.unshift(person);
  return person;
}

/**
 * DELETE /api/v1/users/{id}
 * Right-to-be-forgotten: removes the person, their linked accounts, their
 * notes and every message attributed to them.
 */
export async function forgetUser(id: string): Promise<ForgetUserResult> {
  await delay(700);
  const idx = people.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`User ${id} not found`);

  let deleted_accounts = 0;
  for (let i = connectedAccounts.length - 1; i >= 0; i--) {
    if (connectedAccounts[i]!.user_id === id) {
      connectedAccounts.splice(i, 1);
      deleted_accounts++;
    }
  }

  let deleted_messages = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.sender_user_id === id) {
      messages.splice(i, 1);
      deleted_messages++;
    }
  }

  for (let i = personNotes.length - 1; i >= 0; i--) {
    if (personNotes[i]!.user_id === id) personNotes.splice(i, 1);
  }

  people.splice(idx, 1);
  clearSummaryCache(id);
  return { deleted_messages, deleted_accounts };
}
