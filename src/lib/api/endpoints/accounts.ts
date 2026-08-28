import { connectedAccounts, messages, people } from "../mock";
import type { ConnectedAccount, Platform } from "../types";
import { clearSummaryCache, delay } from "./_shared";

export interface UnlinkedAccount extends ConnectedAccount {
  message_count: number;
  last_seen_at: string | null;
}

export interface CreateAccountInput {
  user_id: string;
  platform: Platform;
  external_handle: string;
  external_email?: string;
}

/** GET /api/v1/accounts?unlinked=true */
export async function getUnlinkedAccounts(): Promise<UnlinkedAccount[]> {
  await delay(280);
  return connectedAccounts
    .filter((a) => a.user_id === null)
    .map((a) => {
      const own = messages.filter((m) => m.sender_relation_id === a.id);
      return { ...a, message_count: own.length, last_seen_at: own[0]?.sent_at ?? null };
    });
}

/**
 * POST /api/v1/accounts/{id}/link
 * Links an external account to a person; every message from it is reattributed.
 */
export async function linkAccount(accountId: string, userId: string): Promise<ConnectedAccount> {
  await delay(600);
  const account = connectedAccounts.find((a) => a.id === accountId);
  if (!account) throw new Error(`Account ${accountId} not found`);
  if (!people.some((p) => p.id === userId)) throw new Error(`User ${userId} not found`);
  account.user_id = userId;
  account.is_primary = !connectedAccounts.some((a) => a.user_id === userId && a.is_primary);
  messages.forEach((m) => {
    if (m.sender_relation_id === account.id) m.sender_user_id = userId;
  });
  clearSummaryCache(userId);
  return account;
}

/**
 * POST /api/v1/accounts/{id}/unlink
 * Unlinks an account; its messages return to the unresolved pool.
 */
export async function unlinkAccount(accountId: string): Promise<ConnectedAccount> {
  await delay(450);
  const account = connectedAccounts.find((a) => a.id === accountId);
  if (!account) throw new Error(`Account ${accountId} not found`);
  const previous = account.user_id;
  account.user_id = null;
  account.is_primary = false;
  messages.forEach((m) => {
    if (m.sender_relation_id === account.id) m.sender_user_id = null;
  });
  if (previous) clearSummaryCache(previous);
  return account;
}

/** DELETE /api/v1/accounts/{id} — removes the account and its messages entirely. */
export async function deleteAccount(accountId: string): Promise<{ deleted_messages: number }> {
  await delay(450);
  const idx = connectedAccounts.findIndex((a) => a.id === accountId);
  if (idx === -1) throw new Error(`Account ${accountId} not found`);
  let deleted_messages = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.sender_relation_id === accountId) {
      messages.splice(i, 1);
      deleted_messages++;
    }
  }
  connectedAccounts.splice(idx, 1);
  return { deleted_messages };
}

/** POST /api/v1/accounts */
export async function createAccount(input: CreateAccountInput): Promise<ConnectedAccount> {
  await delay(450);
  const account: ConnectedAccount = {
    id: `acc_manual_${Date.now()}`,
    user_id: input.user_id,
    platform: input.platform,
    external_id: `${input.platform.toUpperCase()}-${Math.floor(Math.random() * 900000 + 100000)}`,
    external_handle: input.external_handle,
    external_email: input.external_email ?? "",
    is_primary: !connectedAccounts.some((a) => a.user_id === input.user_id && a.is_primary),
    created_at: new Date().toISOString(),
  };
  connectedAccounts.push(account);
  return account;
}
