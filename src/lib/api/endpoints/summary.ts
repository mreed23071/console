import { messages, people, summaryCache } from "../mock";
import type { Summary, SummaryRange } from "../types";
import { clearSummaryCache, delay } from "./_shared";

function inRange(sentAt: string, range?: SummaryRange): boolean {
  if (!range) return true;
  if (range.from && sentAt < range.from) return false;
  // `to` is an inclusive day: compare against end of that day when it's a plain date.
  if (range.to) {
    const bound = range.to.length === 10 ? `${range.to}T23:59:59.999Z` : range.to;
    if (sentAt > bound) return false;
  }
  return true;
}

function rangeLabel(range?: SummaryRange): string {
  if (!range || (!range.from && !range.to)) return "all retained history";
  const fmt = (v: string) => v.slice(0, 10);
  if (range.from && range.to) return `${fmt(range.from)} – ${fmt(range.to)}`;
  if (range.from) return `since ${fmt(range.from)}`;
  return `up to ${fmt(range.to!)}`;
}

function emptySummary(error: string, range?: SummaryRange): Summary {
  return {
    summary: "",
    summary_error: error,
    generated_at: new Date().toISOString(),
    message_count: 0,
    recent_messages: [],
    range_from: range?.from ?? null,
    range_to: range?.to ?? null,
    range_label: rangeLabel(range),
  };
}

function summaryFor(personId: string, range?: SummaryRange): Summary {
  const person = people.find((p) => p.id === personId);
  if (!person) return emptySummary("No such user", range);

  const own = messages.filter((m) => m.sender_user_id === personId && inRange(m.sent_at, range));
  if (own.length === 0) {
    return emptySummary("Not enough retained messages to generate a summary.", range);
  }

  const business = own.filter((m) => m.filter_category === "business");
  const commits = own.filter((m) => m.kind === "commit");
  const recent = own.slice(0, 5);
  const cacheKey = `${personId}|${range?.from ?? ""}|${range?.to ?? ""}`;
  const cached = summaryCache.get(cacheKey);
  const platforms = Array.from(new Set(own.map((m) => m.platform)));

  const text =
    cached ??
    `${person.display_name} has ${own.length} retained items (${commits.length} GitHub commits) across ${platforms.join(
      ", ",
    )} covering ${rangeLabel(range)}, ${business.length} of them work-related. Recent activity centres on ${
      business[0]?.content.slice(0, 90).replace(/\.$/, "") ?? "routine coordination"
    }. As ${person.job_title}, they mostly appear in delivery and review threads, with occasional automation follow-ups.`;

  return {
    summary: text,
    summary_error: null,
    generated_at: new Date().toISOString(),
    message_count: own.length,
    recent_messages: recent,
    range_from: range?.from ?? null,
    range_to: range?.to ?? null,
    range_label: rangeLabel(range),
  };
}

/** GET /api/v1/users/{id}/summary */
export async function getUserSummary(id: string, range?: SummaryRange): Promise<Summary> {
  await delay(500);
  return summaryFor(id, range);
}

/** POST /api/v1/users/{id}/summary/regenerate */
export async function regenerateUserSummary(id: string, range?: SummaryRange): Promise<Summary> {
  await delay(1100);
  clearSummaryCache(id);
  const fresh = summaryFor(id, range);
  summaryCache.set(`${id}|${range?.from ?? ""}|${range?.to ?? ""}`, fresh.summary);
  return fresh;
}
