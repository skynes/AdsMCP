import {
  pullMicrosoftAdsReport,
  syncMicrosoftAdsReport,
  type MicrosoftAdsRangePreset,
} from "../integrations/microsoft-ads.js";

export async function runMicrosoftAdsReport(args: {
  from?: string;
  to?: string;
  preset?: MicrosoftAdsRangePreset;
  module_id?: string;
  tool_name?: string;
  customer_id?: string;
  account_id?: string;
  currency?: string;
}) {
  return pullMicrosoftAdsReport({
    from: args.from,
    to: args.to,
    preset: args.preset,
    moduleId: args.module_id,
    tool: args.tool_name,
    customerId: args.customer_id,
    accountId: args.account_id,
    currency: args.currency,
  });
}

export async function runMicrosoftAdsSync(args: {
  from?: string;
  to?: string;
  preset?: MicrosoftAdsRangePreset;
  module_id?: string;
  tool_name?: string;
  customer_id?: string;
  account_id?: string;
  currency?: string;
  project_id?: string;
}) {
  const report = await runMicrosoftAdsReport(args);
  return { report, sync: syncMicrosoftAdsReport(report, args.project_id) };
}
