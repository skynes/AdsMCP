import { ingestEvent, recordSpend } from "../store.js";
import type { EventKind, TrackingContext } from "../types.js";

export function runEventIngest(args: {
  id?: string;
  campaign_id: string;
  kind: EventKind;
  event_name: string;
  occurred_at?: string;
  amount?: number;
  count?: number;
  currency?: string;
  visitor_id?: string;
  session_id?: string;
  provider?: string;
  external_id?: string;
  dedupe_key?: string;
  tracking?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    click_id?: string;
    landing_page?: string;
    referrer?: string;
    channel?: string;
  };
  metadata?: Record<string, unknown>;
}) {
  const result = ingestEvent({
    id: args.id,
    campaignId: args.campaign_id,
    kind: args.kind,
    eventName: args.event_name,
    occurredAt: args.occurred_at ?? new Date().toISOString(),
    amount: args.amount,
    count: args.count,
    currency: args.currency,
    visitorId: args.visitor_id,
    sessionId: args.session_id,
    provider: args.provider,
    externalId: args.external_id,
    dedupeKey: args.dedupe_key,
    tracking: args.tracking
      ? ({
          source: args.tracking.utm_source,
          medium: args.tracking.utm_medium,
          campaign: args.tracking.utm_campaign,
          content: args.tracking.utm_content,
          term: args.tracking.utm_term,
          clickId: args.tracking.click_id,
          landingPage: args.tracking.landing_page,
          referrer: args.tracking.referrer,
          channel: args.tracking.channel,
        } satisfies TrackingContext)
      : undefined,
    metadata: args.metadata,
  });
  return { ingested: !result.duplicate, duplicate: result.duplicate, event: result.event };
}

export function runSpendRecord(args: {
  id?: string;
  campaign_id: string;
  day?: string;
  provider: string;
  amount: number;
  currency?: string;
  impressions?: number;
  clicks?: number;
  external_id?: string;
  dedupe_key?: string;
  metadata?: Record<string, unknown>;
}) {
  const result = recordSpend({
    id: args.id,
    campaignId: args.campaign_id,
    day: args.day ?? new Date().toISOString().slice(0, 10),
    provider: args.provider,
    amount: args.amount,
    currency: args.currency ?? "USD",
    impressions: args.impressions ?? 0,
    clicks: args.clicks ?? 0,
    externalId: args.external_id,
    dedupeKey: args.dedupe_key,
    metadata: args.metadata,
  });
  return { recorded: !result.duplicate, duplicate: result.duplicate, spend: result.spend };
}
