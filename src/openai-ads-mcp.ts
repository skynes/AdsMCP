#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { openaiAdsGet, type OpenAIAdsQueryValue } from "./integrations/openai-ads.js";
import { textResult } from "./tools/common.js";

const server = new McpServer(
  { name: "openai-ads-mcp", version: "1.0.0" },
  {
    instructions: [
      "This is a read-only bridge for the official OpenAI Ads Advertiser API.",
      "It uses OPENAI_ADS_API_KEY and never accepts credentials in tool arguments.",
      "Campaign, ad group, ad, budget and audience mutations are intentionally not exposed.",
    ].join(" "),
  },
);

const pagination = {
  limit: z.number().int().min(1).max(500).optional(),
  after: z.string().min(1).optional(),
  before: z.string().min(1).optional(),
};

const orderedPagination = {
  ...pagination,
  order: z.enum(["asc", "desc"]).optional(),
};

const listFilters = {
  ...orderedPagination,
  name: z.string().min(1).optional(),
  include: z.array(z.string().min(1)).max(20).optional(),
};

function listQuery(input: Record<string, unknown>): Record<string, OpenAIAdsQueryValue> {
  const query: Record<string, OpenAIAdsQueryValue> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) query[key] = value as OpenAIAdsQueryValue;
  }
  return query;
}

function idPath(value: string): string {
  return encodeURIComponent(value.trim());
}

server.tool(
  "openai_ads_account_get",
  "Get metadata for the OpenAI Ads ad account associated with the API key.",
  {},
  async () => textResult(await openaiAdsGet({ path: "/ad_account" })),
);

server.tool(
  "openai_ads_accounts_list",
  "List ad accounts accessible to the authenticated OpenAI Ads API key.",
  pagination,
  async (input) => textResult(await openaiAdsGet({ path: "/ad_accounts", query: listQuery(input) })),
);

server.tool(
  "openai_ads_campaigns_list",
  "List campaigns for the authenticated OpenAI Ads account.",
  listFilters,
  async (input) => textResult(await openaiAdsGet({ path: "/campaigns", query: listQuery(input) })),
);

server.tool(
  "openai_ads_campaign_get",
  "Get one OpenAI Ads campaign by ID.",
  { campaign_id: z.string().min(1) },
  async ({ campaign_id }) => textResult(await openaiAdsGet({ path: `/campaigns/${idPath(campaign_id)}` })),
);

server.tool(
  "openai_ads_ad_groups_list",
  "List OpenAI Ads ad groups, optionally filtered by campaign.",
  {
    ...listFilters,
    campaign_id: z.string().min(1).optional(),
  },
  async (input) => textResult(await openaiAdsGet({ path: "/ad_groups", query: listQuery(input) })),
);

server.tool(
  "openai_ads_ad_group_get",
  "Get one OpenAI Ads ad group by ID.",
  { ad_group_id: z.string().min(1) },
  async ({ ad_group_id }) => textResult(await openaiAdsGet({ path: `/ad_groups/${idPath(ad_group_id)}` })),
);

server.tool(
  "openai_ads_ads_list",
  "List OpenAI Ads, optionally filtered by ad group.",
  {
    ...listFilters,
    ad_group_id: z.string().min(1).optional(),
  },
  async (input) => textResult(await openaiAdsGet({ path: "/ads", query: listQuery(input) })),
);

server.tool(
  "openai_ads_ad_get",
  "Get one OpenAI Ad by ID.",
  { ad_id: z.string().min(1) },
  async ({ ad_id }) => textResult(await openaiAdsGet({ path: `/ads/${idPath(ad_id)}` })),
);

const insightQuery = {
  attribution_window_days: z.union([z.literal(7), z.literal(14), z.literal(30)]).optional(),
  view_through_attribution_window_days: z.union([z.literal(0), z.literal(1)]).optional(),
  attribution_time_basis: z.enum(["ad_event_time", "conversion_time"]).optional(),
  time_granularity: z.string().min(1).optional(),
  aggregation_level: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(2000).optional(),
  before: z.string().min(1).optional(),
  after: z.string().min(1).optional(),
  time_ranges: z.array(z.string().min(1)).max(50).optional(),
  filters: z.array(z.string().min(1)).max(50).optional(),
  fields: z.array(z.string().min(1)).max(100).optional(),
  sort: z.array(z.string().min(1)).max(50).optional(),
  segments: z.array(z.string().min(1)).max(50).optional(),
  override_segment_group_order: z.array(z.string().min(1)).max(50).optional(),
  includes: z.array(z.string().min(1)).max(50).optional(),
};

server.tool(
  "openai_ads_insights",
  "Read time-granular insights for an ad account, campaign, ad group or ad.",
  {
    scope: z.enum(["ad_account", "campaign", "ad_group", "ad"]),
    entity_id: z.string().min(1).optional(),
    ...insightQuery,
  },
  async ({ scope, entity_id, ...input }) => {
    if (scope !== "ad_account" && !entity_id) {
      throw new Error(`entity_id is required for ${scope} insights`);
    }
    const path = scope === "ad_account"
      ? "/ad_account/insights"
      : `/${scope === "campaign" ? "campaigns" : scope === "ad_group" ? "ad_groups" : "ads"}/${idPath(entity_id!)}/insights`;
    return textResult(await openaiAdsGet({ path, query: listQuery(input) }));
  },
);

server.tool(
  "openai_ads_custom_audiences_list",
  "List custom audiences for the authenticated OpenAI Ads account.",
  {
    intended_use: z.string().min(1).optional(),
    custom_audience_ids: z.array(z.string().min(1)).max(500).optional(),
    policy_revision: z.string().length(64).optional(),
    matched_count_granularity: z.string().min(1).optional(),
    ...pagination,
  },
  async (input) => textResult(await openaiAdsGet({ path: "/custom_audiences", query: listQuery(input) })),
);

server.tool(
  "openai_ads_custom_audience_get",
  "Get one OpenAI Ads custom audience by ID.",
  { custom_audience_id: z.string().min(1) },
  async ({ custom_audience_id }) => textResult(await openaiAdsGet({ path: `/custom_audiences/${idPath(custom_audience_id)}` })),
);

server.tool(
  "openai_ads_audit_logs_list",
  "List OpenAI Ads audit logs for the account or selected campaign, ad group or ad.",
  {
    limit: z.number().int().min(1).max(100).optional(),
    after: z.string().min(1).optional(),
    before: z.string().min(1).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    campaign_id: z.string().min(1).optional(),
    ad_group_id: z.string().min(1).optional(),
    ad_id: z.string().min(1).optional(),
  },
  async (input) => textResult(await openaiAdsGet({ path: "/audit_logs", query: listQuery(input) })),
);

server.tool(
  "openai_ads_product_feeds_list",
  "List product feeds for the authenticated OpenAI Ads account.",
  { include: z.array(z.string().min(1)).max(20).optional(), ...pagination },
  async (input) => textResult(await openaiAdsGet({ path: "/feeds", query: listQuery(input) })),
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error(`OpenAI Ads MCP failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
