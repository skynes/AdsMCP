export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type ProjectStatus = "active" | "archived";

export type CampaignObjective =
  | "awareness"
  | "traffic"
  | "leads"
  | "sales"
  | "app_installs"
  | "custom";

export type EventKind =
  | "impression"
  | "click"
  | "lead"
  | "signup"
  | "purchase"
  | "conversion"
  | "custom";

export type AttributionModel =
  | "first_touch"
  | "last_touch"
  | "linear"
  | "position_based";

export type IntegrationStatus = "active" | "paused" | "error";

export type IntegrationSyncStatus = "idle" | "running" | "success" | "error";

export type AutomationMetric =
  | "roas"
  | "cpa"
  | "ctr"
  | "conversion_rate"
  | "spend";

export type AutomationOperator = "gt" | "gte" | "lt" | "lte" | "eq";

export type AutomationAction = "pause_campaign" | "notify";

export interface Campaign {
  id: string;
  projectId?: string;
  source?: string;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  currency: string;
  budgetAmount?: number;
  dailyBudget?: number;
  startsAt?: string;
  endsAt?: string;
  targeting?: Record<string, unknown>;
  tracking?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingEvent {
  id: string;
  campaignId: string;
  kind: EventKind;
  eventName: string;
  occurredAt: string;
  amount?: number;
  count?: number;
  currency?: string;
  visitorId?: string;
  sessionId?: string;
  provider?: string;
  externalId?: string;
  dedupeKey?: string;
  tracking?: TrackingContext;
  metadata?: Record<string, unknown>;
}

export interface TrackingContext {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  clickId?: string;
  landingPage?: string;
  referrer?: string;
  channel?: string;
}

export interface AttributionRow {
  campaignId: string;
  campaignName: string;
  provider?: string;
  channel?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  clickId?: string;
  conversions: number;
  revenue: number;
}

export interface AttributionReport {
  model: AttributionModel;
  period: { from: string; to: string };
  lookbackDays: number;
  conversionEvents: number;
  attributedConversions: number;
  attributedRevenue: number;
  rows: AttributionRow[];
}

export interface SpendRecord {
  id: string;
  campaignId: string;
  day: string;
  provider: string;
  amount: number;
  currency: string;
  impressions: number;
  clicks: number;
  externalId?: string;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}

export type MetricPointPeriod = "5min" | "day";

export interface CampaignMetricPoint {
  id: string;
  campaignId: string;
  provider: string;
  period: MetricPointPeriod;
  bucketAt: string;
  intervalSeconds: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  metrics?: Record<string, number>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  projectId?: string;
  projectName?: string;
  source?: string;
  campaignName: string;
  currency: string;
  period: { from: string; to: string };
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  conversionRate: number;
  roas: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAnalytics {
  projectId: string;
  projectName: string;
  period: { from: string; to: string };
  currencies: string[];
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    cpa: number;
    conversionRate: number;
    roas: number;
  };
  campaigns: CampaignAnalytics[];
}

export interface Integration {
  id: string;
  provider: string;
  name: string;
  status: IntegrationStatus;
  secretEnv: string[];
  config?: Record<string, unknown>;
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationSyncState {
  provider: string;
  scope: string;
  status: IntegrationSyncStatus;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastSuccessTo?: string;
  lastError?: string;
  consecutiveFailures: number;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  campaignId?: string;
  name: string;
  metric: AutomationMetric;
  operator: AutomationOperator;
  threshold: number;
  action: AutomationAction;
  enabled: boolean;
  cooldownMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRun {
  id: string;
  ruleId: string;
  campaignId?: string;
  evaluatedAt: string;
  metricValue?: number;
  matched: boolean;
  executed: boolean;
  action?: AutomationAction;
  result?: string;
}

export type ClientProfileStatus = "active" | "paused" | "archived";

export type ClientConsentStatus = "unknown" | "opted_in" | "opted_out";

export type ClientProfileMessageDirection = "inbound" | "outbound" | "note";

export interface ClientProfile {
  id: string;
  telegramUserId: string;
  channel?: string;
  externalUserId?: string;
  contactAccountId?: string;
  displayName?: string;
  username?: string;
  source: string;
  status: ClientProfileStatus;
  consentStatus: ClientConsentStatus;
  context?: Record<string, unknown>;
  dialogueSummary?: string;
  lastContactAt?: string;
  nextActionAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfileMessage {
  id: string;
  profileId: string;
  direction: ClientProfileMessageDirection;
  text: string;
  sentAt: string;
  contactAccountId?: string;
  telegramMessageId?: string;
  metadata?: Record<string, unknown>;
}

export interface StoreStats {
  projects: number;
  campaigns: number;
  events: number;
  spendRecords: number;
  integrations: number;
  automationRules: number;
  automationRuns: number;
  clientProfiles: number;
  clientProfileMessages: number;
}
