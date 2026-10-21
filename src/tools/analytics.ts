import { campaignAnalytics, listCampaignMetricPoints } from "../store.js";

function defaultFrom(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString();
}

export function runCampaignAnalytics(args: {
  campaign_id?: string;
  project_id?: string;
  source?: string;
  from?: string;
  to?: string;
}) {
  const from = args.from ?? defaultFrom();
  const to = args.to ?? new Date().toISOString();
  return {
    period: { from, to },
    campaigns: campaignAnalytics({
      campaignId: args.campaign_id,
      projectId: args.project_id,
      source: args.source,
      from,
      to,
    }),
    definitions: {
      ctr: "clicks / impressions",
      cpc: "spend / clicks",
      cpa: "spend / conversions",
      conversion_rate: "conversions / clicks",
      roas: "revenue / spend",
    },
  };
}

export function runCampaignTimeseries(args: {
  campaign_id?: string;
  project_id?: string;
  source?: string;
  provider?: string;
  period?: "5min" | "day";
  from?: string;
  to?: string;
  limit?: number;
}) {
  const points = listCampaignMetricPoints({
    campaignId: args.campaign_id,
    projectId: args.project_id,
    source: args.source,
    provider: args.provider,
    period: args.period,
    from: args.from,
    to: args.to,
    limit: args.limit,
  });
  return {
    period: {
      ...(args.from ? { from: args.from } : {}),
      ...(args.to ? { to: args.to } : {}),
      ...(args.period ? { granularity: args.period } : {}),
    },
    points,
    definitions: {
      spend: "provider-reported spend in the bucket",
      impressions: "provider-reported views/impressions in the bucket",
      clicks: "provider-reported clicks in the bucket",
      conversions: "provider-reported conversion-like metric, for Telegram Ads this is Started bot",
    },
  };
}
