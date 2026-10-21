import { attributionReport } from "../attribution.js";
import type { AttributionModel } from "../types.js";

export function runAttributionReport(args: {
  model: AttributionModel;
  campaign_id?: string;
  project_id?: string;
  from?: string;
  to?: string;
  lookback_days?: number;
}) {
  const to = args.to ?? new Date().toISOString();
  const from = args.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
  return attributionReport({
    model: args.model,
    campaignId: args.campaign_id,
    projectId: args.project_id,
    from,
    to,
    lookbackDays: args.lookback_days,
  });
}
