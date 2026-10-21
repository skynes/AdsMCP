import { pullGoogleAdsReport } from "../integrations/google-ads.js";
import { syncGoogleAdsReport } from "../integrations/google-ads-sync.js";

export async function runGoogleAdsReport(args: {
  from?: string;
  to?: string;
  customer_id?: string;
  login_customer_id?: string;
}) {
  const to = args.to ?? new Date().toISOString().slice(0, 10);
  const from = args.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  return pullGoogleAdsReport({
    from,
    to,
    customerId: args.customer_id,
    loginCustomerId: args.login_customer_id,
  });
}

export async function runGoogleAdsSync(args: {
  from?: string;
  to?: string;
  customer_id?: string;
  login_customer_id?: string;
  project_id?: string;
}) {
  const report = await runGoogleAdsReport(args);
  return {
    report,
    sync: syncGoogleAdsReport(report, args.project_id),
  };
}
