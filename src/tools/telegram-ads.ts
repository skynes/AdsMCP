import {
  pullTelegramAdsAccountsReport,
  pullTelegramAdsReport,
  syncTelegramAdsAccountsReport,
  syncTelegramAdsReport,
  type TelegramAdsProjectRule,
} from "../integrations/telegram-ads.js";

export async function runTelegramAdsReport(args: {
  module_id?: string;
  list_tool?: string;
  stats_tool?: string;
  stats_period?: "5min" | "day";
  include_stats?: boolean;
  max_ads?: number;
}) {
  return pullTelegramAdsReport({
    moduleId: args.module_id,
    listTool: args.list_tool,
    statsTool: args.stats_tool,
    statsPeriod: args.stats_period,
    includeStats: args.include_stats,
    maxAds: args.max_ads,
  });
}

export async function runTelegramAdsSync(args: {
  module_id?: string;
  list_tool?: string;
  stats_tool?: string;
  stats_period?: "5min" | "day";
  include_stats?: boolean;
  max_ads?: number;
  project_id?: string;
}) {
  const report = await runTelegramAdsReport(args);
  return { report, sync: syncTelegramAdsReport(report, args.project_id) };
}

export async function runTelegramAdsAccountsReport(args: {
  module_id?: string;
  list_tool?: string;
  stats_tool?: string;
  stats_period?: "5min" | "day";
  include_stats?: boolean;
  max_ads?: number;
  account_id?: string;
  all?: boolean;
  confirm?: boolean;
}) {
  return pullTelegramAdsAccountsReport({
    moduleId: args.module_id,
    listTool: args.list_tool,
    statsTool: args.stats_tool,
    statsPeriod: args.stats_period,
    includeStats: args.include_stats,
    maxAds: args.max_ads,
    accountId: args.account_id,
    all: args.all,
    confirm: args.confirm,
  });
}

export async function runTelegramAdsAccountsSync(args: {
  module_id?: string;
  list_tool?: string;
  stats_tool?: string;
  stats_period?: "5min" | "day";
  include_stats?: boolean;
  max_ads?: number;
  account_id?: string;
  all?: boolean;
  confirm?: boolean;
  project_id?: string;
  project_rules?: TelegramAdsProjectRule[];
}) {
  const report = await runTelegramAdsAccountsReport(args);
  return {
    report,
    sync: syncTelegramAdsAccountsReport(report, args.project_id, args.project_rules),
  };
}
