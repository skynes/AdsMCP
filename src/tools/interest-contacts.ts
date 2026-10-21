import {
  listInterestContacts,
  listInterestResearchPosts,
  listInterestResearchTags,
  listInterestResearchStats,
  buildInterestResearchStats,
  upsertInterestResearchPost,
  upsertInterestContact,
  type InterestContactCategory,
  type InterestContactType,
  type InterestContactConsentStatus,
  type InterestOutreachEligibility,
  type InterestContactStatus,
} from "../interest-contacts.js";

export function runInterestContactUpsert(args: {
  project_id?: string;
  channel: string;
  external_user_id: string;
  instance_url?: string;
  profile_url?: string;
  display_name?: string;
  username?: string;
  category?: InterestContactCategory;
  contact_type?: InterestContactType;
  status?: InterestContactStatus;
  consent_status?: InterestContactConsentStatus;
  relevance_score?: number;
  followers_count?: number;
  matched_topics?: string[];
  evidence?: Array<Record<string, unknown>>;
  notes?: string;
  metadata?: Record<string, unknown>;
  first_seen_at?: string;
  last_seen_at?: string;
}) {
  return {
    upserted: true,
    contact: upsertInterestContact({
      projectId: args.project_id,
      channel: args.channel,
      externalUserId: args.external_user_id,
      instanceUrl: args.instance_url,
      profileUrl: args.profile_url,
      displayName: args.display_name,
      username: args.username,
      category: args.category,
      contactType: args.contact_type,
      status: args.status,
      consentStatus: args.consent_status,
      relevanceScore: args.relevance_score,
      followersCount: args.followers_count,
      matchedTopics: args.matched_topics,
      evidence: args.evidence,
      notes: args.notes,
      metadata: args.metadata,
      firstSeenAt: args.first_seen_at,
      lastSeenAt: args.last_seen_at,
    }),
  };
}

export function runInterestContactList(args: {
  project_id?: string;
  channel?: string;
  external_user_id?: string;
  category?: InterestContactCategory;
  contact_type?: InterestContactType;
  status?: InterestContactStatus;
  consent_status?: InterestContactConsentStatus;
  outreach_eligibility?: InterestOutreachEligibility;
  limit?: number;
}) {
  return {
    contacts: listInterestContacts({
      projectId: args.project_id,
      channel: args.channel,
      externalUserId: args.external_user_id,
      category: args.category,
      contactType: args.contact_type,
      status: args.status,
      consentStatus: args.consent_status,
      outreachEligibility: args.outreach_eligibility,
      limit: args.limit,
    }),
  };
}

export function runInterestResearchPostUpsert(args: {
  project_id?: string;
  channel: string;
  external_post_id: string;
  post_url: string;
  author_external_user_id: string;
  author_username?: string;
  author_display_name?: string;
  published_at?: string;
  content_excerpt?: string;
  signal_type?: string;
  relevance_score?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  status?: "candidate" | "reviewed" | "ignored" | "archived";
  first_seen_at?: string;
  last_seen_at?: string;
}) {
  return {
    upserted: true,
    post: upsertInterestResearchPost({
      projectId: args.project_id,
      channel: args.channel,
      externalPostId: args.external_post_id,
      postUrl: args.post_url,
      authorExternalUserId: args.author_external_user_id,
      authorUsername: args.author_username,
      authorDisplayName: args.author_display_name,
      publishedAt: args.published_at,
      contentExcerpt: args.content_excerpt,
      signalType: args.signal_type,
      relevanceScore: args.relevance_score,
      tags: args.tags,
      metadata: args.metadata,
      status: args.status,
      firstSeenAt: args.first_seen_at,
      lastSeenAt: args.last_seen_at,
    }),
  };
}

export function runInterestResearchPostList(args: {
  project_id?: string;
  channel?: string;
  external_post_id?: string;
  contact_id?: string;
  status?: "candidate" | "reviewed" | "ignored" | "archived";
  limit?: number;
}) {
  return {
    posts: listInterestResearchPosts({
      projectId: args.project_id,
      channel: args.channel,
      externalPostId: args.external_post_id,
      contactId: args.contact_id,
      status: args.status,
      limit: args.limit,
    }),
  };
}

export function runInterestResearchTagList(args: { project_id?: string; channel?: string; limit?: number }) {
  return { tags: listInterestResearchTags({ projectId: args.project_id, channel: args.channel, limit: args.limit }) };
}

export function runInterestResearchStatsBuild(args: { project_id?: string; channel?: string; days?: number }) {
  return { built: true, ...buildInterestResearchStats({ projectId: args.project_id, channel: args.channel, days: args.days }) };
}

export function runInterestResearchStatsList(args: {
  project_id?: string;
  channel?: string;
  period_start?: string;
  period_end?: string;
  stat_kind?: "summary" | "tag";
  limit?: number;
}) {
  return {
    stats: listInterestResearchStats({
      projectId: args.project_id,
      channel: args.channel,
      periodStart: args.period_start,
      periodEnd: args.period_end,
      statKind: args.stat_kind,
      limit: args.limit,
    }),
  };
}
