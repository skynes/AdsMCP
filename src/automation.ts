import {
  campaignAnalytics,
  latestAutomationRun,
  listAutomationRules,
  recordAutomationRun,
  updateCampaign,
} from "./store.js";
import type { AutomationMetric, AutomationRule, CampaignAnalytics } from "./types.js";

export interface AutomationExecution {
  ruleId: string;
  ruleName: string;
  campaignId: string;
  campaignName: string;
  metric: AutomationMetric;
  value: number;
  threshold: number;
  operator: AutomationRule["operator"];
  matched: boolean;
  executed: boolean;
  action: AutomationRule["action"];
  result: string;
}

function compare(
  value: number,
  operator: AutomationRule["operator"],
  threshold: number,
): boolean {
  switch (operator) {
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
    case "eq":
      return value === threshold;
  }
}

function metricValue(stats: CampaignAnalytics, metric: AutomationMetric): number {
  // A funded campaign with no conversions has an effectively infinite CPA.
  // This makes a `cpa > N` safety rule useful before the first conversion.
  if (metric === "cpa" && stats.conversions === 0 && stats.spend > 0) return Number.POSITIVE_INFINITY;
  return stats[metric === "conversion_rate" ? "conversionRate" : metric];
}

function withinCooldown(rule: AutomationRule): boolean {
  const last = latestAutomationRun(rule.id);
  if (!last || !last.matched || rule.cooldownMinutes <= 0) return false;
  return Date.now() - Date.parse(last.evaluatedAt) < rule.cooldownMinutes * 60_000;
}

export function runAutomation(input: {
  from: string;
  to: string;
  campaignId?: string;
  execute?: boolean;
}): { dryRun: boolean; period: { from: string; to: string }; results: AutomationExecution[] } {
  const rules = listAutomationRules({ campaignId: input.campaignId, enabledOnly: true });
  const results: AutomationExecution[] = [];

  for (const rule of rules) {
    const stats = campaignAnalytics({
      from: input.from,
      to: input.to,
      campaignId: rule.campaignId ?? input.campaignId,
    });
    for (const row of stats) {
      const value = metricValue(row, rule.metric);
      const matched = compare(value, rule.operator, rule.threshold);
      const cooling = matched && withinCooldown(rule);
      let executed = false;
      let result = matched ? "condition_matched" : "condition_not_matched";

      if (cooling) {
        result = "cooldown_active";
      } else if (matched && input.execute) {
        if (rule.action === "pause_campaign") {
          updateCampaign(row.campaignId, { status: "paused" });
          executed = true;
          result = "campaign_paused";
        } else {
          result = "notification_queued_for_integration";
        }
      } else if (matched) {
        result = "dry_run";
      }

      recordAutomationRun({
        ruleId: rule.id,
        campaignId: row.campaignId,
        evaluatedAt: new Date().toISOString(),
        metricValue: Number.isFinite(value) ? value : undefined,
        matched,
        executed,
        action: rule.action,
        result,
      });

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        operator: rule.operator,
        matched,
        executed,
        action: rule.action,
        result,
      });
    }
  }

  return {
    dryRun: !input.execute,
    period: { from: input.from, to: input.to },
    results,
  };
}
