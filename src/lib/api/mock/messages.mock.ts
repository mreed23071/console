import type { CommitDetail, CommitFile, CommitFileStatus, FilterCategory, Message } from "../types";
import type { ConnectedAccount, Person } from "../types";
import { connectedAccounts } from "./accounts.mock";
import { people } from "./people.mock";
import { DAY, HOUR, int, iso, NOW, pick, rnd } from "./random";

const CONTENT: Record<FilterCategory, string[]> = {
  business: [
    "Pushed the retry backoff change to the ingestion worker — queue depth is back under 200.",
    "Can we move the schema review to Thursday? I want the pgvector index numbers first.",
    "Customer escalation on tenant 4471: embeddings are stale by about six hours.",
    "Draft of the scoped-auth RFC is up. Main open question is token rotation cadence.",
    "Deploy to staging is green. Holding prod until the migration dry-run finishes.",
    "The identity resolution pass merged two accounts incorrectly — filed a bug with the trace.",
    "Reviewed the connector health endpoint; suggest we split readiness from liveness.",
    "Sprint capacity looks tight. Proposing we drop the Linear connector to next cycle.",
    "Latency p95 on /v1/messages jumped to 480ms after the new join. Investigating.",
    "Signed off on the API versioning approach — /v1 stays frozen once we publish.",
  ],
  personal: [
    "Out tomorrow morning for a dentist appointment, back by noon.",
    "Anyone up for lunch at the place near the office on Friday?",
    "Taking PTO the week of the 14th, handing off the on-call rotation.",
    "Congrats on the new place! Photos please.",
    "Running late, subway is a mess this morning.",
  ],
  automated: [
    "[bot] Build #4821 succeeded on main in 3m 12s.",
    "[bot] PR #1183 has been merged by daniel-w.",
    "[alert] Embedding worker queue depth above threshold (1200) for 5 minutes.",
    "[bot] Dependabot opened 3 pull requests for security updates.",
    "[bot] Nightly ingestion run completed: 412 fetched, 388 retained.",
    "[alert] Database connection pool at 92% utilization.",
  ],
  unclear: [
    "yep",
    "see thread above",
    "+1",
    "will follow up on this later, need more context",
    "not sure that's the same issue?",
  ],
};

const REASONS: Record<FilterCategory, string> = {
  business: "Contains work context: project, system, or delivery discussion.",
  personal: "Social or personal scheduling content with no work artifact.",
  automated: "Emitted by an automation or alerting integration.",
  unclear: "Too short or context-free to classify with confidence.",
};

const CATEGORY_WEIGHTS: FilterCategory[] = [
  "business",
  "business",
  "business",
  "business",
  "business",
  "business",
  "personal",
  "personal",
  "automated",
  "automated",
  "unclear",
];

// ---- GitHub commits -------------------------------------------------------

const REPOS = [
  "threadline/ingestion-worker",
  "threadline/api",
  "threadline/console",
  "threadline/connectors",
  "threadline/infra",
];

const COMMIT_SUBJECTS = [
  "fix(ingestion): retry embedding batches with exponential backoff",
  "feat(api): expose /v1/users/{id}/summary date range filters",
  "refactor(connectors): share the pagination cursor helper across platforms",
  "chore(deps): bump pgvector client to 0.7.2",
  "feat(console): add unresolved account linking flow",
  "fix(auth): stop leaking scope claims into the audit log",
  "perf(embeddings): batch inserts in chunks of 256",
  "test(filter): cover unclear-category fallbacks",
  "feat(github): ingest commit metadata alongside messages",
  "fix(runs): mark partially failed runs as partial, not success",
];

const FILE_PATHS = [
  "src/ingestion/worker.py",
  "src/ingestion/backoff.py",
  "src/api/routes/users.py",
  "src/api/schemas/summary.py",
  "src/connectors/github/client.py",
  "src/connectors/base.py",
  "src/embeddings/batcher.py",
  "migrations/0043_commit_metadata.sql",
  "tests/test_filter.py",
  "README.md",
];

const FILE_STATUSES: CommitFileStatus[] = ["modified", "modified", "modified", "added", "removed"];

function makeCommit(subject: string, sentMs: number): CommitDetail {
  const fileCount = int(1, 5);
  const chosen = new Set<string>();
  const files: CommitFile[] = [];
  while (files.length < fileCount) {
    const path = pick(FILE_PATHS);
    if (chosen.has(path)) continue;
    chosen.add(path);
    const status = pick(FILE_STATUSES);
    files.push({
      path,
      status,
      additions: status === "removed" ? 0 : int(2, 140),
      deletions: status === "added" ? 0 : int(0, 60),
    });
  }
  const additions = files.reduce((n, f) => n + f.additions, 0);
  const deletions = files.reduce((n, f) => n + f.deletions, 0);
  const repository = pick(REPOS);
  const sha = Array.from({ length: 7 })
    .map(() => "0123456789abcdef"[int(0, 15)])
    .join("");
  const area = subject.split(":")[0] ?? "change";
  return {
    sha,
    repository,
    branch: pick(["main", "develop", `feature/${sha}`]),
    url: `https://github.com/${repository}/commit/${sha}`,
    files,
    additions,
    deletions,
    ai_summary: `This commit touches ${files.length} file${
      files.length === 1 ? "" : "s"
    } in ${repository} (+${additions}/-${deletions}) and lands a ${area} change. ${
      files[0]!.path
    } carries the bulk of the diff; the remaining edits keep call sites and tests aligned. No migrations outside the listed files, and the change is scoped tightly enough to revert on its own.`,
    ai_summary_generated_at: iso(sentMs + 60_000),
  };
}

/** Builds a fresh copy of the table from the current people and accounts. */
export function seedMessages(
  sourcePeople: readonly Person[],
  sourceAccounts: readonly ConnectedAccount[],
): Message[] {
  const messages: Message[] = [];

  for (let i = 0; i < 138; i++) {
    const person = pick(sourcePeople);
    const accounts = sourceAccounts.filter((a) => a.user_id === person.id);
    const account = accounts[Math.floor(rnd() * accounts.length)]!;
    const category = pick(CATEGORY_WEIGHTS);
    const sent = NOW - Math.floor(rnd() * 29 * DAY) - int(0, 23) * HOUR;
    const isCommit = account.platform === "github";
    const subject = pick(COMMIT_SUBJECTS);
    const commit = isCommit ? makeCommit(subject, sent) : undefined;
    messages.push({
      id: `msg_${String(i + 1).padStart(4, "0")}`,
      kind: isCommit ? "commit" : "message",
      ...(commit ? { commit } : {}),
      sender_user_id: person.id,
      sender_relation_id: account.id,
      platform: account.platform,
      external_message_id: commit
        ? `${commit.repository}@${commit.sha}`
        : `${account.platform}-${int(1000000, 9999999)}`,
      conversation_id: commit ? commit.repository : `conv_${int(100, 140)}`,
      content: commit ? subject : pick(CONTENT[category]),
      embedding_model: "text-embedding-3-small",
      filter_category: category,
      filter_reason: REASONS[category],
      sent_at: iso(sent),
    });
  }

  // Messages arriving from accounts that are not yet resolved to a person.
  sourceAccounts
    .filter((a) => a.user_id === null)
    .forEach((account, k) => {
      const n = int(3, 7);
      for (let i = 0; i < n; i++) {
        const category: FilterCategory = account.external_handle.includes("bot")
          ? "automated"
          : "business";
        const sent = NOW - Math.floor(rnd() * 25 * DAY) - int(0, 23) * HOUR;
        const isCommit = account.platform === "github";
        const subject = pick(COMMIT_SUBJECTS);
        const commit = isCommit ? makeCommit(subject, sent) : undefined;
        messages.push({
          id: `msg_orphan_${k + 1}_${i + 1}`,
          kind: isCommit ? "commit" : "message",
          ...(commit ? { commit } : {}),
          sender_user_id: null,
          sender_relation_id: account.id,
          platform: account.platform,
          external_message_id: commit
            ? `${commit.repository}@${commit.sha}`
            : `${account.platform}-${int(1000000, 9999999)}`,
          conversation_id: commit ? commit.repository : `conv_${int(100, 140)}`,
          content: commit ? subject : pick(CONTENT[category]),
          embedding_model: "text-embedding-3-small",
          filter_category: category,
          filter_reason: REASONS[category],
          sent_at: iso(sent),
        });
      }
    });

  messages.sort((a, b) => b.sent_at.localeCompare(a.sent_at));
  return messages;
}

/** Mutable in-memory table of ingested messages, newest first. */
export const messages: Message[] = seedMessages(people, connectedAccounts);
