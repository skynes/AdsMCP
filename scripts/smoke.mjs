import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const smokeDir = mkdtempSync(join(tmpdir(), "adsmcp-smoke-"));
process.env.ADS_MCP_DATA = smokeDir;

try {
  const store = await import("../dist/store.js");
  const { runAutomation } = await import("../dist/automation.js");
  const { parseYandexDirectRows, syncYandexDirectReport } = await import("../dist/integrations/yandex-direct.js");
  const { syncTelegramAdsReport } = await import("../dist/integrations/telegram-ads.js");
  const { registerIntegration, listIntegrations } = store;

  const project = store.createProject({
    id: "smoke-project",
    name: "Smoke project",
    description: "Project grouping test",
  });
  const campaign = store.createCampaign({
    projectId: project.id,
    source: "smoke_network",
    name: "Smoke campaign",
    objective: "sales",
    currency: "USD",
  });
  store.updateCampaign(campaign.id, { status: "active" });

  store.recordSpend({
    campaignId: campaign.id,
    day: "2026-10-07",
    provider: "smoke",
    amount: 25,
    currency: "USD",
    impressions: 1000,
    clicks: 100,
    dedupeKey: "smoke-spend-1",
  });
  store.ingestEvent({
    campaignId: campaign.id,
    kind: "click",
    eventName: "ad.click",
    occurredAt: "2026-10-07T09:00:00.000Z",
    visitorId: "visitor-1",
    tracking: {
      source: "newsletter",
      medium: "email",
      campaign: "smoke-launch",
      clickId: "click-1",
      channel: "owned",
    },
    dedupeKey: "smoke-click-1",
  });
  const firstEvent = store.ingestEvent({
    campaignId: campaign.id,
    kind: "purchase",
    eventName: "checkout.completed",
    occurredAt: "2026-10-07T10:00:00.000Z",
    amount: 100,
    currency: "USD",
    visitorId: "visitor-1",
    dedupeKey: "smoke-conversion-1",
  });
  const duplicateEvent = store.ingestEvent({
    campaignId: campaign.id,
    kind: "purchase",
    eventName: "checkout.completed",
    occurredAt: "2026-10-07T10:00:00.000Z",
    amount: 100,
    currency: "USD",
    visitorId: "visitor-1",
    dedupeKey: "smoke-conversion-1",
  });
  assert.equal(firstEvent.duplicate, false);
  assert.equal(duplicateEvent.duplicate, true);

  const [analytics] = store.campaignAnalytics({
    campaignId: campaign.id,
    from: "2026-10-01",
    to: "2026-10-31T23:59:59.999Z",
  });
  assert.equal(analytics.spend, 25);
  assert.equal(analytics.impressions, 1000);
  assert.equal(analytics.clicks, 100);
  assert.equal(analytics.conversions, 1);
  assert.equal(analytics.revenue, 100);
  assert.equal(analytics.roas, 4);

  const projectCampaigns = store.listCampaigns({ projectId: project.id });
  assert.equal(projectCampaigns.length, 1);
  assert.equal(projectCampaigns[0].projectId, project.id);
  assert.equal(projectCampaigns[0].source, "smoke_network");
  assert.equal(store.listCampaigns({ source: "SMOKE_NETWORK" }).length, 1);
  const projectReport = store.projectAnalytics({
    projectId: project.id,
    from: "2026-10-01",
    to: "2026-10-31T23:59:59.999Z",
  });
  assert.equal(projectReport?.projectName, "Smoke project");
  assert.equal(projectReport?.totals.spend, 25);

  const { attributionReport } = await import("../dist/attribution.js");
  const attribution = attributionReport({
    model: "last_touch",
    from: "2026-10-01",
    to: "2026-10-31T23:59:59.999Z",
  });
  assert.equal(attribution.conversionEvents, 1);
  assert.equal(attribution.rows[0].source, "newsletter");
  assert.equal(attribution.rows[0].conversions, 1);

  const rule = store.createAutomationRule({
    campaignId: campaign.id,
    name: "Pause if ROAS is too low",
    metric: "roas",
    operator: "lt",
    threshold: 5,
    action: "pause_campaign",
  });
  const dryRun = runAutomation({
    campaignId: campaign.id,
    from: "2026-10-01",
    to: "2026-10-31T23:59:59.999Z",
  });
  assert.equal(dryRun.dryRun, true);
  assert.equal(dryRun.results[0].ruleId, rule.id);
  assert.equal(dryRun.results[0].executed, false);

  const execution = runAutomation({
    campaignId: campaign.id,
    from: "2026-10-01",
    to: "2026-10-31T23:59:59.999Z",
    execute: true,
  });
  assert.equal(execution.results[0].result, "cooldown_active");

  const yandexTsv = [
    "2026-10-07",
    "123",
    "Yandex smoke campaign",
    "2400",
    "120",
    "1500.50",
    "12",
    "5.00",
    "12.50",
  ].join("\t");
  const yandexRows = parseYandexDirectRows(yandexTsv);
  assert.equal(yandexRows.length, 1);
  assert.equal(yandexRows[0].cost, 1500.5);
  assert.equal(yandexRows[0].conversions, 12);
  const yandexReport = {
    moduleId: "yandex_direct",
    tool: "get_statistics",
    from: "2026-10-07",
    to: "2026-10-07",
    currency: "RUB",
    days: yandexRows,
    totals: { cost: 1500.5, impressions: 2400, clicks: 120, conversions: 12 },
    raw: yandexTsv,
  };
  const yandexSync = syncYandexDirectReport(yandexReport, project.id);
  assert.equal(yandexSync.campaignsCreated, 1);
  assert.equal(yandexSync.spendRecords, 1);
  assert.equal(yandexSync.conversionCount, 12);
  const yandexCampaign = store.listCampaigns({ projectId: project.id, source: "yandex_direct" });
  assert.equal(yandexCampaign.length, 1);
  assert.equal(yandexCampaign[0].source, "yandex_direct");
  const yandexRetry = syncYandexDirectReport(yandexReport);
  assert.equal(yandexRetry.campaignsCreated, 0);
  assert.equal(yandexRetry.spendRecords, 0);
  assert.equal(yandexRetry.conversionEvents, 0);

  const telegramReport = {
    moduleId: "telegram_ads",
    listTool: "get_ads",
    statsTool: "get_ad_stats",
    statsPeriod: "day",
    date: "2026-10-07",
    account: { owner_id: "telegram-account-1", currency: "GRAM" },
    ads: [
      {
        adId: "tg-ad-1",
        accountId: "telegram-account-1",
        name: "Telegram smoke campaign",
        status: "active",
        externalStatus: "Active",
        currency: "GRAM",
        date: "2026-10-07",
        spend: 3.5,
        impressions: 800,
        clicks: 42,
        ctr: 0.0525,
        cpc: 0.0833,
        cpm: 4.375,
        budget: 10,
        dailyBudget: 2,
        promoteUrl: "https://t.me/skynes",
        rawAd: { ad_id: "tg-ad-1" },
      },
    ],
    statsErrors: [],
    totals: { spend: 3.5, impressions: 800, clicks: 42 },
  };
  const telegramSync = syncTelegramAdsReport(telegramReport, project.id);
  assert.equal(telegramSync.campaignsCreated, 1);
  assert.equal(telegramSync.spendRecords, 1);
  const telegramCampaigns = store.listCampaigns({ projectId: project.id, source: "telegram_ads" });
  assert.equal(telegramCampaigns.length, 1);
  assert.equal(telegramCampaigns[0].currency, "GRAM");
  const telegramRetry = syncTelegramAdsReport(telegramReport);
  assert.equal(telegramRetry.campaignsCreated, 0);
  assert.equal(telegramRetry.spendRecords, 0);

  registerIntegration({
    provider: "webhook",
    name: "Smoke webhook",
    secretEnv: [],
  });
  assert.equal(listIntegrations().length, 1);
  console.log("AdsMCP smoke test passed");
} finally {
  const db = await import("../dist/db.js");
  db.closeDb();
  rmSync(smokeDir, { recursive: true, force: true });
}
