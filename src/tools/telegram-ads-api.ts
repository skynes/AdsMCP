import {
  createTelegramAdsOfficialApiAd,
  increaseTelegramAdsOfficialApiAdBudget,
  pullTelegramAdsOfficialApiReport,
  setTelegramAdsOfficialApiAdPaused,
  submitTelegramAdsOfficialApiAdForReview,
  syncTelegramAdsOfficialApiReport,
  telegramAdsOfficialApiPlan,
  telegramAdsOfficialApiStatus,
} from "../integrations/telegram-ads-api.js";

export async function runTelegramAdsApiIncreaseBudget(args: {
  account_id?: string;
  ad_id: string | number;
  amount: number;
  idempotency_key?: string;
  timeout_ms?: number;
  confirm?: boolean;
}) {
  return increaseTelegramAdsOfficialApiAdBudget({
    accountId: args.account_id,
    adId: args.ad_id,
    amount: args.amount,
    idempotencyKey: args.idempotency_key,
    timeoutMs: args.timeout_ms,
    confirm: args.confirm,
  });
}
export async function runTelegramAdsApiSubmitForReview(args: {
  account_id?: string;
  ad_id: string | number;
  timeout_ms?: number;
  confirm?: boolean;
}) {
  return submitTelegramAdsOfficialApiAdForReview({
    accountId: args.account_id,
    adId: args.ad_id,
    timeoutMs: args.timeout_ms,
    confirm: args.confirm,
  });
}

export async function runTelegramAdsApiSetPaused(args: {
  account_id?: string;
  ad_id: string | number;
  is_paused: boolean;
  timeout_ms?: number;
  confirm?: boolean;
}) {
  return setTelegramAdsOfficialApiAdPaused({
    accountId: args.account_id,
    adId: args.ad_id,
    isPaused: args.is_paused,
    timeoutMs: args.timeout_ms,
    confirm: args.confirm,
  });
}

export async function runTelegramAdsApiCreateAd(args: {
  account_id?: string;
  title: string;
  text?: string;
  promote_url: string;
  cpm: number;
  placement: "channel_post" | "bot_banner" | "search_result" | "video_banner";
  target: Record<string, unknown>;
  impression_frequency?: number;
  show_userpic?: boolean;
  initial_budget?: number;
  daily_budget_limit?: number;
  is_paused?: boolean;
  return_target?: boolean;
  idempotency_key?: string;
  timeout_ms?: number;
  confirm?: boolean;
}) {
  return createTelegramAdsOfficialApiAd({
    accountId: args.account_id,
    title: args.title,
    text: args.text,
    promoteUrl: args.promote_url,
    cpm: args.cpm,
    placement: args.placement,
    target: args.target,
    impressionFrequency: args.impression_frequency,
    showUserpic: args.show_userpic,
    initialBudget: args.initial_budget,
    dailyBudgetLimit: args.daily_budget_limit,
    isPaused: args.is_paused,
    returnTarget: args.return_target,
    idempotencyKey: args.idempotency_key,
    timeoutMs: args.timeout_ms,
    confirm: args.confirm,
  });
}

export function runTelegramAdsApiPlan() {
  return telegramAdsOfficialApiPlan();
}

export async function runTelegramAdsApiStatus(args: { probe?: boolean }) {
  return telegramAdsOfficialApiStatus({ probe: args.probe });
}

export async function runTelegramAdsApiReport(args: {
  account_id?: string;
  stats_period?: "5min" | "day";
  include_stats?: boolean;
  max_ads?: number;
  from?: string;
  to?: string;
  timeout_ms?: number;
}) {
  return pullTelegramAdsOfficialApiReport({
    accountId: args.account_id,
    statsPeriod: args.stats_period,
    includeStats: args.include_stats,
    maxAds: args.max_ads,
    from: args.from,
    to: args.to,
    timeoutMs: args.timeout_ms,
  });
}

export async function runTelegramAdsApiSync(args: {
  account_id?: string;
  stats_period?: "5min" | "day";
  include_stats?: boolean;
  max_ads?: number;
  from?: string;
  to?: string;
  timeout_ms?: number;
  project_id?: string;
}) {
  const report = await runTelegramAdsApiReport(args);
  return { report, sync: syncTelegramAdsOfficialApiReport(report, args.project_id) };
}
