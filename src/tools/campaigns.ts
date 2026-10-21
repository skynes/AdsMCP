import {
  createCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
} from "../store.js";
import type { CampaignObjective, CampaignStatus } from "../types.js";

export function runCampaignCreate(args: {
  project_id?: string;
  source?: string;
  name: string;
  objective: CampaignObjective;
  currency?: string;
  budget_amount?: number;
  daily_budget?: number;
  starts_at?: string;
  ends_at?: string;
  targeting?: Record<string, unknown>;
  tracking?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  return {
    created: true,
    campaign: createCampaign({
      projectId: args.project_id,
      source: args.source,
      name: args.name,
      objective: args.objective,
      currency: args.currency,
      budgetAmount: args.budget_amount,
      dailyBudget: args.daily_budget,
      startsAt: args.starts_at,
      endsAt: args.ends_at,
      targeting: args.targeting,
      tracking: args.tracking,
      metadata: args.metadata,
    }),
  };
}

export function runCampaignGet(args: { campaign_id: string }) {
  const campaign = getCampaign(args.campaign_id);
  return campaign ? { campaign } : { error: `Campaign not found: ${args.campaign_id}` };
}

export function runCampaignList(args: {
  project_id?: string;
  source?: string;
  status?: CampaignStatus;
  limit?: number;
}) {
  return {
    campaigns: listCampaigns({
      projectId: args.project_id,
      source: args.source,
      status: args.status,
      limit: args.limit,
    }),
  };
}

export function runCampaignUpdate(args: {
  campaign_id: string;
  project_id?: string | null;
  source?: string | null;
  name?: string;
  objective?: CampaignObjective;
  status?: CampaignStatus;
  currency?: string;
  budget_amount?: number | null;
  daily_budget?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  targeting?: Record<string, unknown> | null;
  tracking?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}) {
  const campaign = updateCampaign(args.campaign_id, {
    ...(args.project_id === undefined ? {} : { projectId: args.project_id }),
    ...(args.source === undefined ? {} : { source: args.source }),
    ...(args.name === undefined ? {} : { name: args.name }),
    ...(args.objective === undefined ? {} : { objective: args.objective }),
    ...(args.status === undefined ? {} : { status: args.status }),
    ...(args.currency === undefined ? {} : { currency: args.currency }),
    ...(args.budget_amount === undefined ? {} : { budgetAmount: args.budget_amount }),
    ...(args.daily_budget === undefined ? {} : { dailyBudget: args.daily_budget }),
    ...(args.starts_at === undefined ? {} : { startsAt: args.starts_at }),
    ...(args.ends_at === undefined ? {} : { endsAt: args.ends_at }),
    ...(args.targeting === undefined ? {} : { targeting: args.targeting }),
    ...(args.tracking === undefined ? {} : { tracking: args.tracking }),
    ...(args.metadata === undefined ? {} : { metadata: args.metadata }),
  });
  return campaign ? { updated: true, campaign } : { error: `Campaign not found: ${args.campaign_id}` };
}
