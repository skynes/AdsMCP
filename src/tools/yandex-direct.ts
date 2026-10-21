import { callModuleTool } from "../integrations/mcp-modules.js";
import { pullYandexDirectReport, syncYandexDirectReport } from "../integrations/yandex-direct.js";

export async function runYandexDirectReport(args: {
  from?: string;
  to?: string;
  module_id?: string;
  tool_name?: string;
  currency?: string;
  campaign_ids?: string[];
}) {
  return pullYandexDirectReport({
    from: args.from,
    to: args.to,
    moduleId: args.module_id,
    tool: args.tool_name,
    currency: args.currency,
    campaignIds: args.campaign_ids,
  });
}

export async function runYandexDirectSync(args: {
  from?: string;
  to?: string;
  module_id?: string;
  tool_name?: string;
  currency?: string;
  campaign_ids?: string[];
  project_id?: string;
}) {
  const report = await runYandexDirectReport(args);
  return { report, sync: syncYandexDirectReport(report, args.project_id) };
}

export async function runYandexDirectWrite(args: {
  service: "campaigns";
  method: "update" | "suspend" | "resume" | "archive" | "unarchive";
  items: Record<string, unknown>[];
  idempotency_key: string;
  confirm: true;
}) {
  return callModuleTool({
    moduleId: "yandex_mcp_zai",
    toolName: "direct_write",
    arguments: {
      service: args.service,
      method: args.method,
      items: args.items,
      idempotency_key: args.idempotency_key,
    },
    timeoutMs: 60_000,
    internal: true,
  });
}

export async function runYandexDirectCreateCampaign(args: {
  name: string;
  start_date: string;
  time_zone?: string;
  client_info?: string;
  idempotency_key: string;
  confirm: true;
}) {
  const campaign: Record<string, unknown> = {
    Name: args.name,
    StartDate: args.start_date,
    TextCampaign: {
      BiddingStrategy: {
        Search: { BiddingStrategyType: "SERVING_OFF" },
        Network: { BiddingStrategyType: "SERVING_OFF" },
      },
    },
  };
  if (args.time_zone) campaign.TimeZone = args.time_zone;
  if (args.client_info) campaign.ClientInfo = args.client_info;
  return callModuleTool({
    moduleId: "yandex_mcp_zai",
    toolName: "direct_write",
    arguments: {
      service: "campaigns",
      method: "add",
      items: [campaign],
      idempotency_key: args.idempotency_key,
    },
    timeoutMs: 240_000,
    internal: true,
  });
}
