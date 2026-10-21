import { createHash } from "node:crypto";
import { ingestEvent, createCampaign, getCampaign, recordSpend, updateCampaign } from "../store.js";
import type { CampaignStatus } from "../types.js";
import type { GoogleAdsReport } from "./google-ads.js";

function localCampaignId(customerId: string, externalCampaignId: string): string {
  const digest = createHash("sha256")
    .update(`google_ads:${customerId}:${externalCampaignId}`)
    .digest("hex")
    .slice(0, 32);
  return `gads_${digest}`;
}

function campaignStatus(status: string | undefined): CampaignStatus {
  switch (status) {
    case "ENABLED":
      return "active";
    case "PAUSED":
      return "paused";
    case "REMOVED":
      return "archived";
    default:
      return "draft";
  }
}

export function syncGoogleAdsReport(report: GoogleAdsReport, projectId?: string) {
  const campaigns = new Map<string, { id: string; name: string; status: CampaignStatus }>();
  let campaignsCreated = 0;
  let campaignsUpdated = 0;
  let spendRecords = 0;
  let conversionEvents = 0;
  let conversionCount = 0;
  let skippedRows = 0;

  for (const day of report.days) {
    if (!day.campaignId || !day.date) {
      skippedRows += 1;
      continue;
    }
    const id = localCampaignId(report.customerId, day.campaignId);
    const nextStatus = campaignStatus(day.campaignStatus);
    let local = campaigns.get(id);
    if (!local) {
      const existing = getCampaign(id);
      if (!existing) {
        const created = createCampaign({
          id,
          ...(projectId ? { projectId } : {}),
          source: "google_ads",
          name: day.campaignName || `Google Ads campaign ${day.campaignId}`,
          objective: "custom",
          status: nextStatus,
          currency: report.currency || "USD",
          metadata: {
            integrationProvider: "google_ads",
            customerId: report.customerId,
            externalCampaignId: day.campaignId,
          },
        });
        local = { id: created.id, name: created.name, status: created.status };
        campaignsCreated += 1;
      } else {
        const updated = updateCampaign(id, {
          ...(projectId ? { projectId } : {}),
          source: "google_ads",
          name: day.campaignName || existing.name,
          status: nextStatus,
          currency: report.currency || existing.currency,
          metadata: {
            ...(existing.metadata || {}),
            integrationProvider: "google_ads",
            customerId: report.customerId,
            externalCampaignId: day.campaignId,
          },
        });
        local = { id, name: updated?.name || existing.name, status: updated?.status || existing.status };
        campaignsUpdated += 1;
      }
      campaigns.set(id, local);
    }

    const spend = recordSpend({
      campaignId: local.id,
      day: day.date,
      provider: "google_ads",
      amount: day.cost,
      currency: report.currency || "USD",
      impressions: day.impressions,
      clicks: day.clicks,
      externalId: `${report.customerId}:${day.campaignId}:${day.date}`,
      dedupeKey: `google_ads:spend:${report.customerId}:${day.campaignId}:${day.date}`,
      metadata: {
        customerId: report.customerId,
        externalCampaignId: day.campaignId,
        conversions: day.conversions,
        allConversions: day.allConversions,
        conversionsValue: day.conversionsValue,
        averageCpc: day.averageCpc,
      },
    });
    if (!spend.duplicate) spendRecords += 1;

    if (day.conversions > 0) {
      const event = ingestEvent({
        campaignId: local.id,
        kind: "conversion",
        eventName: "google_ads.conversions",
        occurredAt: `${day.date}T23:59:59.999Z`,
        amount: day.conversionsValue,
        count: day.conversions,
        currency: report.currency || "USD",
        provider: "google_ads",
        externalId: `${report.customerId}:${day.campaignId}:${day.date}:conversions`,
        dedupeKey: `google_ads:conversions:${report.customerId}:${day.campaignId}:${day.date}`,
        metadata: {
          customerId: report.customerId,
          externalCampaignId: day.campaignId,
          allConversions: day.allConversions,
        },
      });
      if (!event.duplicate) {
        conversionEvents += 1;
        conversionCount += day.conversions;
      }
    }
  }

  return {
    customerId: report.customerId,
    from: report.from,
    to: report.to,
    campaignsCreated,
    campaignsUpdated,
    spendRecords,
    conversionEvents,
    conversionCount,
    skippedRows,
  };
}
