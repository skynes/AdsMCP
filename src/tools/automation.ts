import { runAutomation } from "../automation.js";
import { createAutomationRule, listAutomationRules } from "../store.js";
import type { AutomationAction, AutomationMetric, AutomationOperator } from "../types.js";

export function runAutomationRuleCreate(args: {
  id?: string;
  campaign_id?: string;
  name: string;
  metric: AutomationMetric;
  operator: AutomationOperator;
  threshold: number;
  action: AutomationAction;
  enabled?: boolean;
  cooldown_minutes?: number;
}) {
  return {
    created: true,
    rule: createAutomationRule({
      id: args.id,
      campaignId: args.campaign_id,
      name: args.name,
      metric: args.metric,
      operator: args.operator,
      threshold: args.threshold,
      action: args.action,
      enabled: args.enabled,
      cooldownMinutes: args.cooldown_minutes,
    }),
  };
}

export function runAutomationRulesList(args: { campaign_id?: string; enabled_only?: boolean }) {
  return { rules: listAutomationRules({ campaignId: args.campaign_id, enabledOnly: args.enabled_only }) };
}

export function runAutomationExecute(args: {
  campaign_id?: string;
  from: string;
  to: string;
  execute?: boolean;
}) {
  return runAutomation({
    campaignId: args.campaign_id,
    from: args.from,
    to: args.to,
    execute: args.execute === true,
  });
}
