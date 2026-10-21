import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDataDir } from "./env.js";

const { DatabaseSync } = await import("node:sqlite");
type Db = InstanceType<typeof DatabaseSync>;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  metadata_json   TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS projects_updated ON projects(updated_at DESC);

CREATE TABLE IF NOT EXISTS campaigns (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
  source          TEXT,
  name            TEXT NOT NULL,
  objective       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  currency        TEXT NOT NULL DEFAULT 'USD',
  budget_amount   REAL,
  daily_budget    REAL,
  starts_at       TEXT,
  ends_at         TEXT,
  targeting_json  TEXT,
  tracking_json   TEXT,
  metadata_json   TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS campaigns_updated ON campaigns(updated_at DESC);

CREATE TABLE IF NOT EXISTS marketing_events (
  id              TEXT PRIMARY KEY,
  campaign_id     TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL,
  event_name      TEXT NOT NULL,
  occurred_at     TEXT NOT NULL,
  amount          REAL,
  event_count     REAL NOT NULL DEFAULT 1,
  currency        TEXT,
  visitor_id      TEXT,
  session_id      TEXT,
  provider        TEXT,
  external_id     TEXT,
  dedupe_key      TEXT UNIQUE,
  tracking_json   TEXT,
  metadata_json   TEXT
);
CREATE INDEX IF NOT EXISTS marketing_events_campaign_date
  ON marketing_events(campaign_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS marketing_events_kind
  ON marketing_events(kind, occurred_at DESC);

CREATE TABLE IF NOT EXISTS spend_records (
  id              TEXT PRIMARY KEY,
  campaign_id     TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  day             TEXT NOT NULL,
  provider        TEXT NOT NULL,
  amount          REAL NOT NULL,
  currency        TEXT NOT NULL,
  impressions     INTEGER NOT NULL DEFAULT 0,
  clicks          INTEGER NOT NULL DEFAULT 0,
  external_id     TEXT,
  dedupe_key      TEXT UNIQUE,
  metadata_json   TEXT
);
CREATE INDEX IF NOT EXISTS spend_records_campaign_day
  ON spend_records(campaign_id, day DESC);

CREATE TABLE IF NOT EXISTS campaign_metric_points (
  id                TEXT PRIMARY KEY,
  campaign_id       TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,
  period            TEXT NOT NULL,
  bucket_at         TEXT NOT NULL,
  interval_seconds  INTEGER NOT NULL,
  spend             REAL NOT NULL DEFAULT 0,
  impressions       INTEGER NOT NULL DEFAULT 0,
  clicks            INTEGER NOT NULL DEFAULT 0,
  conversions       REAL NOT NULL DEFAULT 0,
  metrics_json      TEXT,
  metadata_json     TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  UNIQUE (campaign_id, provider, period, bucket_at)
);
CREATE INDEX IF NOT EXISTS campaign_metric_points_campaign_time
  ON campaign_metric_points(campaign_id, bucket_at DESC);
CREATE INDEX IF NOT EXISTS campaign_metric_points_provider_time
  ON campaign_metric_points(provider, period, bucket_at DESC);

CREATE TABLE IF NOT EXISTS integrations (
  id              TEXT PRIMARY KEY,
  provider        TEXT NOT NULL,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'paused',
  secret_env_json TEXT NOT NULL DEFAULT '[]',
  config_json     TEXT,
  last_sync_at    TEXT,
  last_error      TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS integrations_provider ON integrations(provider);

CREATE TABLE IF NOT EXISTS integration_sync_state (
  provider              TEXT NOT NULL,
  scope                 TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'idle',
  last_attempt_at       TEXT,
  last_success_at       TEXT,
  last_success_to       TEXT,
  last_error            TEXT,
  consecutive_failures  INTEGER NOT NULL DEFAULT 0,
  updated_at            TEXT NOT NULL,
  PRIMARY KEY (provider, scope)
);
CREATE INDEX IF NOT EXISTS integration_sync_state_status
  ON integration_sync_state(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS automation_rules (
  id                TEXT PRIMARY KEY,
  campaign_id       TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  metric            TEXT NOT NULL,
  operator          TEXT NOT NULL,
  threshold         REAL NOT NULL,
  action            TEXT NOT NULL,
  enabled           INTEGER NOT NULL DEFAULT 1,
  cooldown_minutes  INTEGER NOT NULL DEFAULT 60,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS automation_rules_enabled ON automation_rules(enabled);

CREATE TABLE IF NOT EXISTS automation_runs (
  id              TEXT PRIMARY KEY,
  rule_id         TEXT NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  campaign_id     TEXT,
  evaluated_at    TEXT NOT NULL,
  metric_value    REAL,
  matched         INTEGER NOT NULL,
  executed        INTEGER NOT NULL,
  action          TEXT,
  result          TEXT
);
CREATE INDEX IF NOT EXISTS automation_runs_rule_date
  ON automation_runs(rule_id, evaluated_at DESC);

CREATE TABLE IF NOT EXISTS client_profiles (
  id                 TEXT PRIMARY KEY,
  telegram_user_id   TEXT NOT NULL UNIQUE,
  channel            TEXT NOT NULL DEFAULT 'telegram',
  external_user_id   TEXT,
  contact_account_id TEXT,
  display_name       TEXT,
  username           TEXT,
  source             TEXT NOT NULL DEFAULT 'neron',
  status             TEXT NOT NULL DEFAULT 'active',
  consent_status     TEXT NOT NULL DEFAULT 'unknown',
  context_json       TEXT,
  dialogue_summary   TEXT,
  last_contact_at    TEXT,
  next_action_at     TEXT,
  metadata_json      TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS client_profiles_status
  ON client_profiles(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS client_profiles_consent
  ON client_profiles(consent_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS client_profiles_source
  ON client_profiles(source, updated_at DESC);

CREATE TABLE IF NOT EXISTS client_profile_messages (
  id                  TEXT PRIMARY KEY,
  profile_id          TEXT NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  direction           TEXT NOT NULL,
  text                TEXT NOT NULL,
  sent_at             TEXT NOT NULL,
  contact_account_id  TEXT,
  telegram_message_id TEXT,
  metadata_json       TEXT
);
CREATE INDEX IF NOT EXISTS client_profile_messages_profile_time
  ON client_profile_messages(profile_id, sent_at DESC);

CREATE TABLE IF NOT EXISTS interest_contacts (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  channel             TEXT NOT NULL,
  external_user_id    TEXT NOT NULL,
  instance_url        TEXT,
  profile_url         TEXT,
  display_name        TEXT,
  username            TEXT,
  category            TEXT NOT NULL DEFAULT 'potential_user'
                      CHECK (category IN ('potential_user', 'distribution_partner')),
  contact_type        TEXT NOT NULL DEFAULT 'potential_user'
                      CHECK (contact_type IN ('potential_user', 'distribution_partner')),
  status              TEXT NOT NULL DEFAULT 'candidate'
                      CHECK (status IN ('candidate', 'reviewed', 'contacted', 'ignored', 'archived')),
  consent_status      TEXT NOT NULL DEFAULT 'unknown'
                      CHECK (consent_status IN ('unknown', 'opted_in', 'opted_out')),
  relevance_score     REAL NOT NULL DEFAULT 0,
  followers_count    INTEGER,
  matched_topics_json TEXT,
  evidence_json       TEXT,
  notes               TEXT,
  outreach_eligibility TEXT NOT NULL DEFAULT 'research_only'
                      CHECK (outreach_eligibility IN ('research_only', 'public_reply_candidate', 'dm_eligible')),
  outreach_reason     TEXT,
  outreach_draft      TEXT,
  reviewed_at         TEXT,
  metadata_json       TEXT,
  first_seen_at       TEXT NOT NULL,
  last_seen_at        TEXT NOT NULL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  UNIQUE (project_id, channel, external_user_id)
);
CREATE INDEX IF NOT EXISTS interest_contacts_project_status
  ON interest_contacts(project_id, status, relevance_score DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS interest_contacts_project_category
  ON interest_contacts(project_id, category, relevance_score DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS interest_contacts_project_type
  ON interest_contacts(project_id, contact_type, relevance_score DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS interest_contacts_channel_external
  ON interest_contacts(channel, external_user_id);

CREATE TABLE IF NOT EXISTS interest_research_posts (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  contact_id            TEXT REFERENCES interest_contacts(id) ON DELETE SET NULL,
  channel               TEXT NOT NULL,
  external_post_id      TEXT NOT NULL,
  post_url              TEXT NOT NULL,
  author_external_user_id TEXT NOT NULL,
  author_username       TEXT,
  author_display_name   TEXT,
  published_at          TEXT,
  content_excerpt       TEXT,
  signal_type           TEXT,
  relevance_score       REAL NOT NULL DEFAULT 0,
  tags_json             TEXT,
  metadata_json         TEXT,
  status                TEXT NOT NULL DEFAULT 'candidate'
                        CHECK (status IN ('candidate', 'reviewed', 'ignored', 'archived')),
  first_seen_at         TEXT NOT NULL,
  last_seen_at          TEXT NOT NULL,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  UNIQUE (project_id, channel, external_post_id)
);
CREATE INDEX IF NOT EXISTS interest_research_posts_project_time
  ON interest_research_posts(project_id, channel, relevance_score DESC, published_at DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS interest_research_posts_contact
  ON interest_research_posts(contact_id, published_at DESC);

CREATE TABLE IF NOT EXISTS interest_research_tags (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL,
  tag             TEXT NOT NULL,
  normalized_tag  TEXT NOT NULL,
  tag_kind        TEXT NOT NULL DEFAULT 'hashtag'
                  CHECK (tag_kind IN ('hashtag', 'topic', 'signal')),
  occurrence_count INTEGER NOT NULL DEFAULT 0,
  first_seen_at   TEXT NOT NULL,
  last_seen_at    TEXT NOT NULL,
  metadata_json   TEXT,
  UNIQUE (project_id, channel, tag_kind, normalized_tag)
);
CREATE INDEX IF NOT EXISTS interest_research_tags_project_count
  ON interest_research_tags(project_id, channel, occurrence_count DESC, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS interest_research_stats (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  channel               TEXT NOT NULL,
  period_start          TEXT NOT NULL,
  period_end            TEXT NOT NULL,
  stat_kind             TEXT NOT NULL CHECK (stat_kind IN ('summary', 'tag')),
  tag                   TEXT NOT NULL,
  normalized_tag        TEXT NOT NULL,
  post_count            INTEGER NOT NULL DEFAULT 0,
  unique_author_count   INTEGER NOT NULL DEFAULT 0,
  unique_contact_count  INTEGER NOT NULL DEFAULT 0,
  average_relevance     REAL NOT NULL DEFAULT 0,
  potential_user_count  INTEGER NOT NULL DEFAULT 0,
  partner_count         INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL,
  metadata_json         TEXT,
  UNIQUE (project_id, channel, period_start, period_end, stat_kind, normalized_tag)
);
CREATE INDEX IF NOT EXISTS interest_research_stats_project_period
  ON interest_research_stats(project_id, channel, period_start DESC, stat_kind, post_count DESC);

CREATE TABLE IF NOT EXISTS telegram_ai_chats (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  telegram_chat_id      TEXT NOT NULL,
  title                 TEXT NOT NULL,
  username              TEXT,
  chat_type             TEXT NOT NULL DEFAULT 'group',
  public_url            TEXT,
  status                TEXT NOT NULL DEFAULT 'candidate',
  relevance_score       REAL,
  discovery_queries_json TEXT,
  topic_hits_json       TEXT,
  notes                 TEXT,
  metadata_json         TEXT,
  first_seen_at         TEXT NOT NULL,
  last_scanned_at       TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  UNIQUE (project_id, telegram_chat_id)
);
CREATE INDEX IF NOT EXISTS telegram_ai_chats_project_status
  ON telegram_ai_chats(project_id, status, relevance_score DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS telegram_ai_chats_scanned
  ON telegram_ai_chats(last_scanned_at DESC);

CREATE TABLE IF NOT EXISTS tg_resources (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  telegram_resource_id  TEXT NOT NULL,
  type                  TEXT NOT NULL DEFAULT 'chat' CHECK (type IN ('chat', 'channel')),
  title                 TEXT NOT NULL,
  username              TEXT,
  public_url            TEXT,
  source                TEXT NOT NULL DEFAULT 'manual',
  status                TEXT NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'reviewed', 'ignored', 'archived')),
  membership_status     TEXT NOT NULL DEFAULT 'unknown' CHECK (membership_status IN ('unknown', 'joined', 'left', 'join_requested', 'blocked')),
  rules_status          TEXT NOT NULL DEFAULT 'unknown' CHECK (rules_status IN ('unknown', 'unchecked', 'allowed', 'restricted', 'forbidden')),
  topics_json           TEXT,
  notes                 TEXT,
  metadata_json         TEXT,
  first_seen_at         TEXT NOT NULL,
  last_checked_at       TEXT,
  joined_at             TEXT,
  left_at               TEXT,
  has_posted            INTEGER NOT NULL DEFAULT 0,
  post_count            INTEGER NOT NULL DEFAULT 0,
  last_post_recorded_at TEXT,
  last_post_url         TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  UNIQUE (project_id, telegram_resource_id)
);
CREATE INDEX IF NOT EXISTS tg_resources_project_type_status
  ON tg_resources(project_id, type, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS tg_resources_membership
  ON tg_resources(project_id, membership_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS tg_resources_username
  ON tg_resources(username);

CREATE TABLE IF NOT EXISTS tg_resource_posts (
  id                   TEXT PRIMARY KEY,
  project_id           TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  resource_id          TEXT NOT NULL REFERENCES tg_resources(id) ON DELETE CASCADE,
  telegram_message_id TEXT,
  public_url           TEXT NOT NULL,
  posted_at            TEXT,
  recorded_at          TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'deleted', 'unknown')),
  moderation_status    TEXT NOT NULL DEFAULT 'unknown' CHECK (moderation_status IN ('unknown', 'allowed', 'blocked')),
  notes                TEXT,
  metadata_json        TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  UNIQUE (project_id, public_url)
);
CREATE INDEX IF NOT EXISTS tg_resource_posts_resource_time
  ON tg_resource_posts(resource_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS tg_resource_posts_project_time
  ON tg_resource_posts(project_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS telegram_ai_posts (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  telegram_message_key  TEXT NOT NULL,
  query                 TEXT NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL,
  public_url            TEXT,
  telegram_chat_id      TEXT NOT NULL,
  telegram_message_id   TEXT NOT NULL,
  chat_title            TEXT,
  posted_at             TEXT,
  classification        TEXT NOT NULL DEFAULT 'discussion',
  relevance_score       REAL NOT NULL DEFAULT 0,
  explicit_request      INTEGER NOT NULL DEFAULT 0,
  public_reply_draft    TEXT,
  status                TEXT NOT NULL DEFAULT 'candidate',
  metadata_json         TEXT,
  first_seen_at         TEXT NOT NULL,
  last_seen_at          TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  UNIQUE (project_id, telegram_message_key)
);
CREATE INDEX IF NOT EXISTS telegram_ai_posts_project_classification
  ON telegram_ai_posts(project_id, classification, relevance_score DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS telegram_ai_posts_query
  ON telegram_ai_posts(query, updated_at DESC);

CREATE TABLE IF NOT EXISTS telegram_public_replies (
  id                         TEXT PRIMARY KEY,
  project_id                 TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  telegram_chat_id           TEXT NOT NULL,
  chat_username              TEXT,
  chat_title                 TEXT,
  telegram_message_id        TEXT NOT NULL,
  public_url                 TEXT NOT NULL,
  relation_type              TEXT NOT NULL DEFAULT 'reply' CHECK (relation_type IN ('reply', 'mention')),
  parent_message_id          TEXT,
  parent_public_url          TEXT,
  author_telegram_id         TEXT,
  author_username            TEXT,
  author_display_name        TEXT,
  text                       TEXT NOT NULL,
  posted_at                  TEXT,
  status                     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'no_reply', 'ignored', 'blocked')),
  decision_note              TEXT,
  our_reply_message_id       TEXT,
  our_reply_url              TEXT,
  reviewed_at                TEXT,
  first_seen_at              TEXT NOT NULL,
  last_seen_at               TEXT NOT NULL,
  metadata_json              TEXT,
  created_at                 TEXT NOT NULL,
  updated_at                 TEXT NOT NULL,
  UNIQUE (project_id, telegram_chat_id, telegram_message_id)
);
CREATE INDEX IF NOT EXISTS telegram_public_replies_project_status
  ON telegram_public_replies(project_id, status, posted_at DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS telegram_public_replies_chat_time
  ON telegram_public_replies(project_id, telegram_chat_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS telegram_public_replies_parent
  ON telegram_public_replies(project_id, telegram_chat_id, parent_message_id);

CREATE TABLE IF NOT EXISTS telegram_action_queue (
  id                    TEXT PRIMARY KEY,
  queue_id               TEXT NOT NULL,
  project_id             TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sequence_no            INTEGER NOT NULL,
  action_type            TEXT NOT NULL CHECK (action_type IN ('send_message', 'chat_reply', 'public_post_reply', 'reaction')),
  target_ref             TEXT NOT NULL,
  target_message_id      INTEGER,
  text                   TEXT,
  reaction               TEXT,
  expected_text          TEXT,
  min_delay_seconds      INTEGER NOT NULL DEFAULT 15,
  status                 TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'sent', 'failed', 'cancelled')),
  attempts               INTEGER NOT NULL DEFAULT 0,
  result_json            TEXT,
  error_text             TEXT,
  created_at             TEXT NOT NULL,
  started_at             TEXT,
  completed_at           TEXT,
  updated_at             TEXT NOT NULL,
  UNIQUE (queue_id, sequence_no)
);
CREATE INDEX IF NOT EXISTS telegram_action_queue_order
  ON telegram_action_queue(project_id, queue_id, sequence_no);
CREATE INDEX IF NOT EXISTS telegram_action_queue_status
  ON telegram_action_queue(project_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS telegram_ai_search_queries (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  query                 TEXT NOT NULL,
  normalized_query      TEXT NOT NULL,
  topic                 TEXT,
  intent                TEXT,
  language              TEXT NOT NULL DEFAULT 'ru',
  source                TEXT NOT NULL DEFAULT 'manual',
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  priority              INTEGER NOT NULL DEFAULT 0,
  notes                 TEXT,
  metadata_json         TEXT,
  last_run_at           TEXT,
  last_run_status       TEXT NOT NULL DEFAULT 'never' CHECK (last_run_status IN ('never', 'ok', 'payment_required', 'error', 'blocked')),
  last_remaining_free   INTEGER,
  last_result_count     INTEGER NOT NULL DEFAULT 0,
  last_actionable_count INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  UNIQUE (project_id, normalized_query)
);
CREATE INDEX IF NOT EXISTS telegram_ai_search_queries_project_status
  ON telegram_ai_search_queries(project_id, status, priority DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS telegram_ai_search_queries_topic
  ON telegram_ai_search_queries(project_id, topic, updated_at DESC);

CREATE TABLE IF NOT EXISTS telegram_ai_search_runs (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  query_id              TEXT REFERENCES telegram_ai_search_queries(id) ON DELETE SET NULL,
  query                 TEXT NOT NULL,
  source                TEXT NOT NULL,
  scope                 TEXT,
  status                TEXT NOT NULL CHECK (status IN ('ok', 'payment_required', 'error', 'blocked')),
  started_at            TEXT,
  finished_at           TEXT NOT NULL,
  remaining_free        INTEGER,
  result_count          INTEGER,
  actionable_count      INTEGER,
  paid_search_attempted INTEGER NOT NULL DEFAULT 0,
  stars_amount          INTEGER,
  error                 TEXT,
  metadata_json         TEXT
);
CREATE INDEX IF NOT EXISTS telegram_ai_search_runs_project_time
  ON telegram_ai_search_runs(project_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS telegram_ai_search_runs_query_time
  ON telegram_ai_search_runs(query_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS telegram_ai_search_runs_source_time
  ON telegram_ai_search_runs(project_id, source, finished_at DESC);

CREATE TABLE IF NOT EXISTS telegram_ai_keywords (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword               TEXT NOT NULL,
  normalized_keyword    TEXT NOT NULL,
  kind                  TEXT NOT NULL CHECK (kind IN ('word', 'phrase')),
  language              TEXT NOT NULL DEFAULT 'ru',
  topic                 TEXT,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ignored')),
  total_count           INTEGER NOT NULL DEFAULT 0,
  query_count           INTEGER NOT NULL DEFAULT 0,
  telegram_message_count INTEGER NOT NULL DEFAULT 0,
  public_post_count     INTEGER NOT NULL DEFAULT 0,
  client_message_count  INTEGER NOT NULL DEFAULT 0,
  web_search_count      INTEGER NOT NULL DEFAULT 0,
  first_seen_at         TEXT NOT NULL,
  last_seen_at          TEXT NOT NULL,
  last_source_type      TEXT NOT NULL,
  metadata_json         TEXT,
  updated_at            TEXT NOT NULL,
  UNIQUE (project_id, normalized_keyword)
);
CREATE INDEX IF NOT EXISTS telegram_ai_keywords_project_status
  ON telegram_ai_keywords(project_id, status, total_count DESC, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS telegram_ai_keywords_topic
  ON telegram_ai_keywords(project_id, topic, total_count DESC);

CREATE TABLE IF NOT EXISTS telegram_ai_keyword_observations (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword_id            TEXT NOT NULL REFERENCES telegram_ai_keywords(id) ON DELETE CASCADE,
  source_type           TEXT NOT NULL CHECK (source_type IN ('search_query', 'telegram_message', 'public_post', 'client_message', 'web_search')),
  source_ref            TEXT NOT NULL,
  observed_at           TEXT NOT NULL,
  intent                TEXT,
  metadata_json         TEXT,
  UNIQUE (project_id, keyword_id, source_type, source_ref)
);
CREATE INDEX IF NOT EXISTS telegram_ai_keyword_observations_keyword_time
  ON telegram_ai_keyword_observations(keyword_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS telegram_ai_keyword_observations_project_source_time
  ON telegram_ai_keyword_observations(project_id, source_type, observed_at DESC);

CREATE TABLE IF NOT EXISTS telegram_ai_trend_snapshots (
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  period_start          TEXT NOT NULL,
  period_end            TEXT NOT NULL,
  source_scope          TEXT NOT NULL DEFAULT 'all',
  topic                 TEXT NOT NULL,
  intent                TEXT NOT NULL,
  source_count          INTEGER NOT NULL DEFAULT 0,
  keyword_observation_count INTEGER NOT NULL DEFAULT 0,
  query_count           INTEGER NOT NULL DEFAULT 0,
  telegram_message_count INTEGER NOT NULL DEFAULT 0,
  public_post_count     INTEGER NOT NULL DEFAULT 0,
  client_message_count  INTEGER NOT NULL DEFAULT 0,
  web_search_count      INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL,
  metadata_json         TEXT,
  UNIQUE (project_id, period_start, source_scope, topic, intent)
);
CREATE INDEX IF NOT EXISTS telegram_ai_trend_snapshots_project_period
  ON telegram_ai_trend_snapshots(project_id, period_start DESC, source_scope, source_count DESC);

CREATE TABLE IF NOT EXISTS meta (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
`;

function ensureColumn(conn: Db, table: string, definition: string): void {
  try {
    conn.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  } catch (error) {
    if (!(error instanceof Error) || !/duplicate column name/i.test(error.message)) {
      throw error;
    }
  }
}

let handle: { db: Db; dir: string } | null = null;

export function db(): Db {
  const dir = resolveDataDir();
  if (handle && handle.dir === dir) return handle.db;
  if (handle) handle.db.close();

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const conn = new DatabaseSync(join(dir, "ads.db"));
  conn.exec("PRAGMA journal_mode = WAL");
  conn.exec("PRAGMA busy_timeout = 5000");
  conn.exec("PRAGMA foreign_keys = ON");
  conn.exec(SCHEMA);
  ensureColumn(conn, "campaigns", "project_id TEXT");
  ensureColumn(conn, "campaigns", "source TEXT");
  conn.exec("CREATE INDEX IF NOT EXISTS campaigns_project ON campaigns(project_id, updated_at DESC)");
  ensureColumn(conn, "marketing_events", "tracking_json TEXT");
  ensureColumn(conn, "marketing_events", "event_count REAL NOT NULL DEFAULT 1");
  ensureColumn(conn, "tg_resources", "has_posted INTEGER NOT NULL DEFAULT 0");
  ensureColumn(conn, "tg_resources", "post_count INTEGER NOT NULL DEFAULT 0");
  ensureColumn(conn, "tg_resources", "last_post_recorded_at TEXT");
  ensureColumn(conn, "tg_resources", "last_post_url TEXT");
  conn.exec("CREATE INDEX IF NOT EXISTS tg_resources_posted ON tg_resources(project_id, has_posted, last_post_recorded_at DESC)");
  ensureColumn(conn, "tg_resource_posts", "moderation_status TEXT NOT NULL DEFAULT 'unknown'");
  conn.exec("CREATE INDEX IF NOT EXISTS tg_resource_posts_moderation ON tg_resource_posts(project_id, moderation_status, recorded_at DESC)");
  ensureColumn(conn, "telegram_ai_keywords", "updated_at TEXT");
  ensureColumn(conn, "telegram_ai_keyword_observations", "intent TEXT");
  ensureColumn(conn, "client_profiles", "channel TEXT NOT NULL DEFAULT 'telegram'");
  ensureColumn(conn, "client_profiles", "external_user_id TEXT");
  ensureColumn(conn, "client_profiles", "contact_account_id TEXT");
  ensureColumn(conn, "client_profile_messages", "contact_account_id TEXT");
  ensureColumn(conn, "interest_contacts", "outreach_eligibility TEXT NOT NULL DEFAULT 'research_only'");
  ensureColumn(conn, "interest_contacts", "contact_type TEXT NOT NULL DEFAULT 'potential_user'");
  conn.exec("UPDATE interest_contacts SET contact_type = category WHERE category IN ('potential_user', 'distribution_partner')");
  ensureColumn(conn, "interest_contacts", "outreach_reason TEXT");
  ensureColumn(conn, "interest_contacts", "outreach_draft TEXT");
  ensureColumn(conn, "interest_contacts", "reviewed_at TEXT");
  conn.exec("CREATE INDEX IF NOT EXISTS interest_contacts_project_type ON interest_contacts(project_id, contact_type, relevance_score DESC, updated_at DESC)");
  conn.exec("CREATE INDEX IF NOT EXISTS interest_contacts_outreach ON interest_contacts(project_id, channel, outreach_eligibility, relevance_score DESC)");
  conn.exec("CREATE UNIQUE INDEX IF NOT EXISTS client_profiles_channel_external ON client_profiles(channel, external_user_id) WHERE external_user_id IS NOT NULL");
  conn.exec("CREATE INDEX IF NOT EXISTS client_profiles_contact_account ON client_profiles(contact_account_id, updated_at DESC)");
  conn.exec("CREATE INDEX IF NOT EXISTS client_profile_messages_contact_account ON client_profile_messages(contact_account_id, sent_at DESC)");

  handle = { db: conn, dir };
  return conn;
}

export function dataDir(): string {
  return resolveDataDir();
}

export function jsonOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

export function parseJson<T>(value: string | null | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export function closeDb(): void {
  handle?.db.close();
  handle = null;
}

export const projectRoot = ROOT;
