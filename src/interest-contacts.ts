import { randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";

export type InterestContactCategory = "potential_user" | "distribution_partner";
export type InterestContactType = "potential_user" | "distribution_partner";
export type InterestContactStatus = "candidate" | "reviewed" | "contacted" | "ignored" | "archived";
export type InterestContactConsentStatus = "unknown" | "opted_in" | "opted_out";
export type InterestOutreachEligibility = "research_only" | "public_reply_candidate" | "dm_eligible";

export type InterestContact = {
  id: string;
  projectId: string;
  channel: string;
  externalUserId: string;
  instanceUrl?: string;
  profileUrl?: string;
  displayName?: string;
  username?: string;
  category: InterestContactCategory;
  contactType: InterestContactType;
  status: InterestContactStatus;
  consentStatus: InterestContactConsentStatus;
  relevanceScore: number;
  followersCount?: number;
  matchedTopics?: string[];
  evidence?: Array<Record<string, unknown>>;
  notes?: string;
  outreachEligibility: InterestOutreachEligibility;
  outreachReason?: string;
  outreachDraft?: string;
  reviewedAt?: string;
  metadata?: Record<string, unknown>;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type InterestResearchPost = {
  id: string;
  projectId: string;
  contactId?: string;
  channel: string;
  externalPostId: string;
  postUrl: string;
  authorExternalUserId: string;
  authorUsername?: string;
  authorDisplayName?: string;
  publishedAt?: string;
  contentExcerpt?: string;
  signalType?: string;
  relevanceScore: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  status: "candidate" | "reviewed" | "ignored" | "archived";
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type InterestResearchStat = {
  id: string;
  projectId: string;
  channel: string;
  periodStart: string;
  periodEnd: string;
  statKind: "summary" | "tag";
  tag: string;
  normalizedTag: string;
  postCount: number;
  uniqueAuthorCount: number;
  uniqueContactCount: number;
  averageRelevance: number;
  potentialUserCount: number;
  partnerCount: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type InterestContactRow = {
  id: string;
  project_id: string;
  channel: string;
  external_user_id: string;
  instance_url: string | null;
  profile_url: string | null;
  display_name: string | null;
  username: string | null;
  category: string;
  contact_type: string;
  status: string;
  consent_status: string;
  relevance_score: number;
  followers_count: number | null;
  matched_topics_json: string | null;
  evidence_json: string | null;
  notes: string | null;
  outreach_eligibility: string;
  outreach_reason: string | null;
  outreach_draft: string | null;
  reviewed_at: string | null;
  metadata_json: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

type InterestResearchPostRow = {
  id: string;
  project_id: string;
  contact_id: string | null;
  channel: string;
  external_post_id: string;
  post_url: string;
  author_external_user_id: string;
  author_username: string | null;
  author_display_name: string | null;
  published_at: string | null;
  content_excerpt: string | null;
  signal_type: string | null;
  relevance_score: number;
  tags_json: string | null;
  metadata_json: string | null;
  status: string;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

type InterestResearchStatRow = {
  id: string;
  project_id: string;
  channel: string;
  period_start: string;
  period_end: string;
  stat_kind: string;
  tag: string;
  normalized_tag: string;
  post_count: number;
  unique_author_count: number;
  unique_contact_count: number;
  average_relevance: number;
  potential_user_count: number;
  partner_count: number;
  created_at: string;
  metadata_json: string | null;
};

function optionalText(value: string | null): string | undefined {
  return value?.trim() || undefined;
}

function toInterestContact(row: InterestContactRow): InterestContact {
  const matchedTopics = parseJson<string[]>(row.matched_topics_json);
  const evidence = parseJson<Array<Record<string, unknown>>>(row.evidence_json);
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    channel: row.channel,
    externalUserId: row.external_user_id,
    ...(optionalText(row.instance_url) ? { instanceUrl: row.instance_url! } : {}),
    ...(optionalText(row.profile_url) ? { profileUrl: row.profile_url! } : {}),
    ...(optionalText(row.display_name) ? { displayName: row.display_name! } : {}),
    ...(optionalText(row.username) ? { username: row.username! } : {}),
    category: row.category as InterestContactCategory,
    contactType: row.contact_type as InterestContactType,
    status: row.status as InterestContactStatus,
    consentStatus: row.consent_status as InterestContactConsentStatus,
    relevanceScore: Number(row.relevance_score || 0),
    ...(row.followers_count === null ? {} : { followersCount: row.followers_count }),
    ...(matchedTopics ? { matchedTopics } : {}),
    ...(evidence ? { evidence } : {}),
    ...(optionalText(row.notes) ? { notes: row.notes! } : {}),
    outreachEligibility: row.outreach_eligibility as InterestOutreachEligibility,
    ...(optionalText(row.outreach_reason) ? { outreachReason: row.outreach_reason! } : {}),
    ...(optionalText(row.outreach_draft) ? { outreachDraft: row.outreach_draft! } : {}),
    ...(optionalText(row.reviewed_at) ? { reviewedAt: row.reviewed_at! } : {}),
    ...(metadata ? { metadata } : {}),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInterestResearchPost(row: InterestResearchPostRow): InterestResearchPost {
  const tags = parseJson<string[]>(row.tags_json);
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    ...(row.contact_id ? { contactId: row.contact_id } : {}),
    channel: row.channel,
    externalPostId: row.external_post_id,
    postUrl: row.post_url,
    authorExternalUserId: row.author_external_user_id,
    ...(optionalText(row.author_username) ? { authorUsername: row.author_username! } : {}),
    ...(optionalText(row.author_display_name) ? { authorDisplayName: row.author_display_name! } : {}),
    ...(optionalText(row.published_at) ? { publishedAt: row.published_at! } : {}),
    ...(optionalText(row.content_excerpt) ? { contentExcerpt: row.content_excerpt! } : {}),
    ...(optionalText(row.signal_type) ? { signalType: row.signal_type! } : {}),
    relevanceScore: Number(row.relevance_score || 0),
    ...(tags ? { tags } : {}),
    ...(metadata ? { metadata } : {}),
    status: row.status as InterestResearchPost["status"],
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInterestResearchStat(row: InterestResearchStatRow): InterestResearchStat {
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    channel: row.channel,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    statKind: row.stat_kind as InterestResearchStat["statKind"],
    tag: row.tag,
    normalizedTag: row.normalized_tag,
    postCount: Number(row.post_count || 0),
    uniqueAuthorCount: Number(row.unique_author_count || 0),
    uniqueContactCount: Number(row.unique_contact_count || 0),
    averageRelevance: Number(row.average_relevance || 0),
    potentialUserCount: Number(row.potential_user_count || 0),
    partnerCount: Number(row.partner_count || 0),
    createdAt: row.created_at,
    ...(metadata ? { metadata } : {}),
  };
}

function text(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function ensureProject(projectId: string): void {
  const project = db().prepare("SELECT id FROM projects WHERE id = ?").get(projectId) as { id?: string } | undefined;
  if (!project?.id) throw new Error(`Project not found: ${projectId}`);
}

export function upsertInterestContact(input: {
  projectId?: string;
  channel: string;
  externalUserId: string;
  instanceUrl?: string;
  profileUrl?: string;
  displayName?: string;
  username?: string;
  category?: InterestContactCategory;
  contactType?: InterestContactType;
  status?: InterestContactStatus;
  consentStatus?: InterestContactConsentStatus;
  relevanceScore?: number;
  followersCount?: number;
  matchedTopics?: string[];
  evidence?: Array<Record<string, unknown>>;
  notes?: string;
  metadata?: Record<string, unknown>;
  firstSeenAt?: string;
  lastSeenAt?: string;
}): InterestContact {
  const projectId = text(input.projectId) || "neron";
  const channel = text(input.channel);
  const externalUserId = text(input.externalUserId);
  if (!channel) throw new Error("channel is required");
  if (!externalUserId) throw new Error("externalUserId is required");
  ensureProject(projectId);
  const now = new Date().toISOString();
  const firstSeenAt = text(input.firstSeenAt) || now;
  const lastSeenAt = text(input.lastSeenAt) || now;
  db().prepare(
    `INSERT INTO interest_contacts (
       id, project_id, channel, external_user_id, instance_url, profile_url,
       display_name, username, category, contact_type, status, consent_status, relevance_score,
       followers_count, matched_topics_json, evidence_json, notes, metadata_json,
       first_seen_at, last_seen_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id, channel, external_user_id) DO UPDATE SET
       instance_url = COALESCE(excluded.instance_url, interest_contacts.instance_url),
       profile_url = COALESCE(excluded.profile_url, interest_contacts.profile_url),
       display_name = COALESCE(excluded.display_name, interest_contacts.display_name),
       username = COALESCE(excluded.username, interest_contacts.username),
       category = excluded.category,
       contact_type = excluded.contact_type,
       relevance_score = excluded.relevance_score,
       followers_count = COALESCE(excluded.followers_count, interest_contacts.followers_count),
       matched_topics_json = COALESCE(excluded.matched_topics_json, interest_contacts.matched_topics_json),
       evidence_json = COALESCE(excluded.evidence_json, interest_contacts.evidence_json),
       notes = COALESCE(excluded.notes, interest_contacts.notes),
       metadata_json = COALESCE(excluded.metadata_json, interest_contacts.metadata_json),
       last_seen_at = excluded.last_seen_at,
       updated_at = excluded.updated_at`,
  ).run(
    randomUUID(), projectId, channel, externalUserId,
    text(input.instanceUrl) || null, text(input.profileUrl) || null,
    text(input.displayName) || null, text(input.username).replace(/^@/, "") || null,
    input.category || "potential_user", input.contactType || input.category || "potential_user",
    input.status || "candidate", input.consentStatus || "unknown",
    Number.isFinite(input.relevanceScore) ? Math.max(0, Math.min(100, Number(input.relevanceScore))) : 0,
    Number.isFinite(input.followersCount) ? Math.max(0, Math.floor(Number(input.followersCount))) : null,
    jsonOrNull(input.matchedTopics), jsonOrNull(input.evidence), text(input.notes) || null, jsonOrNull(input.metadata),
    firstSeenAt, lastSeenAt, now, now,
  );
  return listInterestContacts({ projectId, channel, externalUserId, limit: 1 })[0]!;
}

export function listInterestContacts(input?: {
  projectId?: string;
  channel?: string;
  externalUserId?: string;
  category?: InterestContactCategory;
  contactType?: InterestContactType;
  status?: InterestContactStatus;
  consentStatus?: InterestContactConsentStatus;
  outreachEligibility?: InterestOutreachEligibility;
  limit?: number;
}): InterestContact[] {
  const clauses = ["1 = 1"];
  const params: Array<string | number> = [];
  if (input?.projectId) { clauses.push("project_id = ?"); params.push(input.projectId); }
  if (input?.channel) { clauses.push("channel = ?"); params.push(input.channel); }
  if (input?.externalUserId) { clauses.push("external_user_id = ?"); params.push(input.externalUserId); }
  if (input?.category) { clauses.push("category = ?"); params.push(input.category); }
  if (input?.contactType) { clauses.push("contact_type = ?"); params.push(input.contactType); }
  if (input?.status) { clauses.push("status = ?"); params.push(input.status); }
  if (input?.consentStatus) { clauses.push("consent_status = ?"); params.push(input.consentStatus); }
  if (input?.outreachEligibility) { clauses.push("outreach_eligibility = ?"); params.push(input.outreachEligibility); }
  const limit = Math.max(1, Math.min(Math.floor(input?.limit ?? 50), 500));
  params.push(limit);
  return (db().prepare(
    `SELECT * FROM interest_contacts WHERE ${clauses.join(" AND ")}
     ORDER BY relevance_score DESC, updated_at DESC LIMIT ?`,
  ).all(...params) as unknown as InterestContactRow[]).map(toInterestContact);
}

export function upsertInterestResearchPost(input: {
  projectId?: string;
  channel: string;
  externalPostId: string;
  postUrl: string;
  authorExternalUserId: string;
  authorUsername?: string;
  authorDisplayName?: string;
  publishedAt?: string;
  contentExcerpt?: string;
  signalType?: string;
  relevanceScore?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  status?: InterestResearchPost["status"];
  firstSeenAt?: string;
  lastSeenAt?: string;
}): InterestResearchPost {
  const projectId = text(input.projectId) || "neron";
  const channel = text(input.channel);
  const externalPostId = text(input.externalPostId);
  const postUrl = text(input.postUrl);
  const authorExternalUserId = text(input.authorExternalUserId);
  if (!channel) throw new Error("channel is required");
  if (!externalPostId) throw new Error("externalPostId is required");
  if (!postUrl) throw new Error("postUrl is required");
  if (!authorExternalUserId) throw new Error("authorExternalUserId is required");
  ensureProject(projectId);
  const now = new Date().toISOString();
  const firstSeenAt = text(input.firstSeenAt) || now;
  const lastSeenAt = text(input.lastSeenAt) || now;
  const contact = db().prepare(
    "SELECT id FROM interest_contacts WHERE project_id = ? AND channel = ? AND external_user_id = ?",
  ).get(projectId, channel, authorExternalUserId) as { id?: string } | undefined;
  const tags = Array.from(new Set((input.tags || []).map(text).filter(Boolean))).slice(0, 50);
  db().prepare(
    `INSERT INTO interest_research_posts (
       id, project_id, contact_id, channel, external_post_id, post_url,
       author_external_user_id, author_username, author_display_name, published_at,
       content_excerpt, signal_type, relevance_score, tags_json, metadata_json,
       status, first_seen_at, last_seen_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id, channel, external_post_id) DO UPDATE SET
       contact_id = COALESCE(excluded.contact_id, interest_research_posts.contact_id),
       post_url = excluded.post_url,
       author_username = COALESCE(excluded.author_username, interest_research_posts.author_username),
       author_display_name = COALESCE(excluded.author_display_name, interest_research_posts.author_display_name),
       published_at = COALESCE(excluded.published_at, interest_research_posts.published_at),
       content_excerpt = COALESCE(excluded.content_excerpt, interest_research_posts.content_excerpt),
       signal_type = COALESCE(excluded.signal_type, interest_research_posts.signal_type),
       relevance_score = excluded.relevance_score,
       tags_json = COALESCE(excluded.tags_json, interest_research_posts.tags_json),
       metadata_json = COALESCE(excluded.metadata_json, interest_research_posts.metadata_json),
       last_seen_at = excluded.last_seen_at,
       updated_at = excluded.updated_at`,
  ).run(
    randomUUID(), projectId, contact?.id || null, channel, externalPostId, postUrl,
    authorExternalUserId, text(input.authorUsername).replace(/^@/, "") || null,
    text(input.authorDisplayName) || null, text(input.publishedAt) || null,
    text(input.contentExcerpt).slice(0, 1000) || null, text(input.signalType) || null,
    Number.isFinite(input.relevanceScore) ? Math.max(0, Math.min(100, Number(input.relevanceScore))) : 0,
    jsonOrNull(tags), jsonOrNull(input.metadata), input.status || "candidate",
    firstSeenAt, lastSeenAt, now, now,
  );
  for (const tag of tags) {
    const normalized = tag.toLowerCase().replace(/^#/, "").trim();
    if (!normalized) continue;
    db().prepare(
      `INSERT INTO interest_research_tags (
         id, project_id, channel, tag, normalized_tag, tag_kind,
         occurrence_count, first_seen_at, last_seen_at, metadata_json
       ) VALUES (?, ?, ?, ?, ?, 'hashtag', 1, ?, ?, ?)
       ON CONFLICT(project_id, channel, tag_kind, normalized_tag) DO UPDATE SET
         tag = excluded.tag,
         occurrence_count = interest_research_tags.occurrence_count + 1,
         last_seen_at = excluded.last_seen_at`,
    ).run(randomUUID(), projectId, channel, tag.replace(/^#/, "#"), normalized, now, now, null);
  }
  return listInterestResearchPosts({ projectId, channel, externalPostId, limit: 1 })[0]!;
}

export function listInterestResearchPosts(input?: {
  projectId?: string;
  channel?: string;
  externalPostId?: string;
  contactId?: string;
  status?: InterestResearchPost["status"];
  limit?: number;
}): InterestResearchPost[] {
  const clauses = ["1 = 1"];
  const params: Array<string | number> = [];
  if (input?.projectId) { clauses.push("project_id = ?"); params.push(input.projectId); }
  if (input?.channel) { clauses.push("channel = ?"); params.push(input.channel); }
  if (input?.externalPostId) { clauses.push("external_post_id = ?"); params.push(input.externalPostId); }
  if (input?.contactId) { clauses.push("contact_id = ?"); params.push(input.contactId); }
  if (input?.status) { clauses.push("status = ?"); params.push(input.status); }
  const limit = Math.max(1, Math.min(Math.floor(input?.limit ?? 100), 500));
  params.push(limit);
  return (db().prepare(
    `SELECT * FROM interest_research_posts WHERE ${clauses.join(" AND ")}
     ORDER BY relevance_score DESC, published_at DESC, updated_at DESC LIMIT ?`,
  ).all(...params) as unknown as InterestResearchPostRow[]).map(toInterestResearchPost);
}

export function listInterestResearchTags(input?: { projectId?: string; channel?: string; limit?: number }): Array<Record<string, unknown>> {
  const clauses = ["1 = 1"];
  const params: Array<string | number> = [];
  if (input?.projectId) { clauses.push("project_id = ?"); params.push(input.projectId); }
  if (input?.channel) { clauses.push("channel = ?"); params.push(input.channel); }
  const limit = Math.max(1, Math.min(Math.floor(input?.limit ?? 100), 500));
  params.push(limit);
  return db().prepare(
    `SELECT tag, normalized_tag, tag_kind, occurrence_count, first_seen_at, last_seen_at
     FROM interest_research_tags WHERE ${clauses.join(" AND ")}
     ORDER BY occurrence_count DESC, last_seen_at DESC LIMIT ?`,
  ).all(...params) as Array<Record<string, unknown>>;
}

function utcDayStart(value: Date): Date {
  const day = new Date(value);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}

export function buildInterestResearchStats(input?: {
  projectId?: string;
  channel?: string;
  days?: number;
}): { projectId: string; channel: string; periodStart: string; periodEnd: string; stats: InterestResearchStat[] } {
  const projectId = text(input?.projectId) || "neron";
  const channel = text(input?.channel) || "mastodon";
  const days = Math.max(1, Math.min(Math.floor(input?.days ?? 7), 90));
  ensureProject(projectId);
  const periodEndDate = new Date(utcDayStart(new Date()).getTime() + 86_399_999);
  const periodStartDate = new Date(utcDayStart(new Date()).getTime() - (days - 1) * 86_400_000);
  const periodStart = periodStartDate.toISOString();
  const periodEnd = periodEndDate.toISOString();
  const rows = db().prepare(
    `SELECT p.*, c.contact_type AS contact_type
     FROM interest_research_posts p
     LEFT JOIN interest_contacts c ON c.id = p.contact_id
     WHERE p.project_id = ? AND p.channel = ?
       AND COALESCE(p.published_at, p.last_seen_at) >= ?
       AND COALESCE(p.published_at, p.last_seen_at) <= ?`,
  ).all(projectId, channel, periodStart, periodEnd) as Array<InterestResearchPostRow & { contact_type: string | null }>;

  type Aggregate = {
    tag: string;
    normalizedTag: string;
    posts: Set<string>;
    authors: Set<string>;
    contacts: Set<string>;
    relevances: number[];
    potentialUsers: Set<string>;
    partners: Set<string>;
  };
  const all: Aggregate = {
    tag: "all",
    normalizedTag: "__all__",
    posts: new Set(), authors: new Set(), contacts: new Set(), relevances: [], potentialUsers: new Set(), partners: new Set(),
  };
  const byTag = new Map<string, Aggregate>();
  for (const row of rows) {
    const author = row.author_external_user_id;
    const contact = row.contact_id || author;
    const contactType = row.contact_type;
    all.posts.add(row.id); all.authors.add(author); all.contacts.add(contact); all.relevances.push(Number(row.relevance_score || 0));
    if (contactType === "potential_user") all.potentialUsers.add(contact);
    if (contactType === "distribution_partner") all.partners.add(contact);
    const tags = parseJson<string[]>(row.tags_json) || [];
    for (const rawTag of tags) {
      const tag = text(rawTag).replace(/^#/, "#");
      const normalizedTag = tag.toLowerCase().replace(/^#/, "");
      if (!normalizedTag) continue;
      const aggregate = byTag.get(normalizedTag) || {
        tag, normalizedTag, posts: new Set(), authors: new Set(), contacts: new Set(), relevances: [], potentialUsers: new Set(), partners: new Set(),
      };
      aggregate.posts.add(row.id); aggregate.authors.add(author); aggregate.contacts.add(contact); aggregate.relevances.push(Number(row.relevance_score || 0));
      if (contactType === "potential_user") aggregate.potentialUsers.add(contact);
      if (contactType === "distribution_partner") aggregate.partners.add(contact);
      byTag.set(normalizedTag, aggregate);
    }
  }
  const now = new Date().toISOString();
  db().prepare("DELETE FROM interest_research_stats WHERE project_id = ? AND channel = ? AND period_start = ? AND period_end = ?").run(projectId, channel, periodStart, periodEnd);
  const insert = db().prepare(
    `INSERT INTO interest_research_stats (
       id, project_id, channel, period_start, period_end, stat_kind, tag,
       normalized_tag, post_count, unique_author_count, unique_contact_count,
       average_relevance, potential_user_count, partner_count, created_at, metadata_json
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const save = (statKind: "summary" | "tag", aggregate: Aggregate): void => {
    const avg = aggregate.relevances.length
      ? Math.round((aggregate.relevances.reduce((sum, value) => sum + value, 0) / aggregate.relevances.length) * 100) / 100
      : 0;
    insert.run(
      randomUUID(), projectId, channel, periodStart, periodEnd, statKind, aggregate.tag,
      aggregate.normalizedTag, aggregate.posts.size, aggregate.authors.size, aggregate.contacts.size,
      avg, aggregate.potentialUsers.size, aggregate.partners.size, now,
      jsonOrNull({ generatedBy: "interest_research_stats", days }),
    );
  };
  save("summary", all);
  for (const aggregate of [...byTag.values()].sort((left, right) => right.posts.size - left.posts.size)) save("tag", aggregate);
  const stats = listInterestResearchStats({ projectId, channel, periodStart, periodEnd, limit: 501 });
  return { projectId, channel, periodStart, periodEnd, stats };
}

export function listInterestResearchStats(input?: {
  projectId?: string;
  channel?: string;
  periodStart?: string;
  periodEnd?: string;
  statKind?: "summary" | "tag";
  limit?: number;
}): InterestResearchStat[] {
  const clauses = ["1 = 1"];
  const params: Array<string | number> = [];
  if (input?.projectId) { clauses.push("project_id = ?"); params.push(input.projectId); }
  if (input?.channel) { clauses.push("channel = ?"); params.push(input.channel); }
  if (input?.periodStart) { clauses.push("period_start = ?"); params.push(input.periodStart); }
  if (input?.periodEnd) { clauses.push("period_end = ?"); params.push(input.periodEnd); }
  if (input?.statKind) { clauses.push("stat_kind = ?"); params.push(input.statKind); }
  const limit = Math.max(1, Math.min(Math.floor(input?.limit ?? 100), 1000));
  params.push(limit);
  return (db().prepare(
    `SELECT * FROM interest_research_stats WHERE ${clauses.join(" AND ")}
     ORDER BY period_start DESC, stat_kind ASC, post_count DESC, average_relevance DESC LIMIT ?`,
  ).all(...params) as unknown as InterestResearchStatRow[]).map(toInterestResearchStat);
}
