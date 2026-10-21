import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveDataDir } from "./env.js";

export type ClickruProfileType = "PERSON" | "INDIVIDUAL" | "BUSINESS";
export type ClickruCampaignObjective = "TRAFFIC";
export type ClickruCampaignStatus = "DRAFT" | "READY";

export interface ClickruProfile {
  id: string;
  name: string;
  type: ClickruProfileType;
  inn: string;
  lastName: string;
  firstName: string;
  middleName: string;
  phone?: string;
  updatedAt: string;
}

export interface ClickruCampaignDraft {
  id: string;
  name: string;
  status: ClickruCampaignStatus;
  service: "VK_ADS";
  accountId?: number;
  website: string;
  objective: ClickruCampaignObjective;
  regions: string;
  audience: string;
  dailyBudget: number;
  headline: string;
  adText: string;
  callToAction: string;
  updatedAt: string;
}

export interface ClickruSettings {
  clickru?: {
    apiToken: string;
    updatedAt: string;
  };
  profiles?: ClickruProfile[];
  activeProfileId?: string;
  campaignDrafts?: ClickruCampaignDraft[];
  activeCampaignDraftId?: string;
}

function settingsPath(): string {
  return join(resolveDataDir(), "clickru-settings.json");
}

function readSettings(): ClickruSettings {
  const path = settingsPath();
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as ClickruSettings;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSettings(value: ClickruSettings): void {
  const path = settingsPath();
  const dir = resolveDataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

export function saveClickruToken(apiToken: string): { configured: true; maskedToken: string; updatedAt: string } {
  const token = apiToken.trim();
  if (!token) throw new Error("Click.ru API token is required");
  if (token.length > 4096) throw new Error("Click.ru API token is too long");

  const updatedAt = new Date().toISOString();
  const current = readSettings();
  writeSettings({
    ...current,
    clickru: { apiToken: token, updatedAt },
  });
  return { configured: true, maskedToken: maskClickruToken(token), updatedAt };
}

export function getClickruToken(): string | undefined {
  const token = readSettings().clickru?.apiToken;
  return typeof token === "string" && token.trim() ? token.trim() : undefined;
}

export function clickruSettingsStatus(): {
  configured: boolean;
  maskedToken?: string;
  updatedAt?: string;
  path: string;
} {
  const settings = readSettings().clickru;
  if (!settings?.apiToken) return { configured: false, path: settingsPath() };
  return {
    configured: true,
    maskedToken: maskClickruToken(settings.apiToken),
    updatedAt: settings.updatedAt,
    path: settingsPath(),
  };
}

export function maskClickruToken(token: string): string {
  const value = token.trim();
  if (value.length <= 4) return "••••";
  return `••••••••${value.slice(-4)}`;
}

export function maskClickruInn(inn: string): string {
  const value = inn.trim();
  if (value.length <= 4) return "••••";
  return `••••••••${value.slice(-4)}`;
}

export function getClickruProfiles(): ClickruProfile[] {
  const profiles = readSettings().profiles;
  return Array.isArray(profiles) ? profiles : [];
}

export function getActiveClickruProfile(): ClickruProfile | undefined {
  const settings = readSettings();
  const profiles = Array.isArray(settings.profiles) ? settings.profiles : [];
  if (!profiles.length) return undefined;
  return profiles.find((profile) => profile.id === settings.activeProfileId) ?? profiles[0];
}

export function saveClickruProfile(input: {
  id?: string;
  name: string;
  type?: ClickruProfileType;
  inn: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  phone?: string;
}): ClickruProfile {
  const name = input.name.trim();
  const type = input.type ?? "PERSON";
  const inn = input.inn.trim();
  const lastName = input.lastName.trim();
  const firstName = input.firstName.trim();
  const middleName = input.middleName?.trim() ?? "";
  const phone = input.phone?.trim() || undefined;

  if (!name) throw new Error("Profile name is required");
  if (!['PERSON', 'INDIVIDUAL', 'BUSINESS'].includes(type)) throw new Error("Unsupported profile type");
  if (!/^\d{10,12}$/.test(inn)) throw new Error("INN must contain 10 to 12 digits");
  if (!lastName || !firstName) throw new Error("Last name and first name are required");

  const settings = readSettings();
  const profiles = Array.isArray(settings.profiles) ? settings.profiles : [];
  const id = input.id?.trim() || randomProfileId();
  const profile: ClickruProfile = {
    id,
    name,
    type,
    inn,
    lastName,
    firstName,
    middleName,
    phone,
    updatedAt: new Date().toISOString(),
  };
  const existingIndex = profiles.findIndex((candidate) => candidate.id === id);
  if (existingIndex >= 0) profiles[existingIndex] = profile;
  else profiles.push(profile);
  writeSettings({
    ...settings,
    profiles,
    activeProfileId: id,
  });
  return profile;
}

export function setActiveClickruProfile(profileId: string): ClickruProfile {
  const settings = readSettings();
  const profiles = Array.isArray(settings.profiles) ? settings.profiles : [];
  const profile = profiles.find((candidate) => candidate.id === profileId.trim());
  if (!profile) throw new Error("Profile not found");
  writeSettings({ ...settings, profiles, activeProfileId: profile.id });
  return profile;
}

export function clickruProfilesStatus(): {
  activeProfileId?: string;
  profiles: Array<Omit<ClickruProfile, "inn"> & { innMasked: string; active: boolean }>;
} {
  const settings = readSettings();
  const profiles = Array.isArray(settings.profiles) ? settings.profiles : [];
  const activeProfile = getActiveClickruProfile();
  return {
    activeProfileId: activeProfile?.id,
    profiles: profiles.map(({ inn, ...profile }) => ({
      ...profile,
      innMasked: maskClickruInn(inn),
      active: profile.id === activeProfile?.id,
    })),
  };
}

function randomProfileId(): string {
  return `profile_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getClickruCampaignDrafts(): ClickruCampaignDraft[] {
  const drafts = readSettings().campaignDrafts;
  if (!Array.isArray(drafts)) return [];
  return drafts.map((draft) => ({
    ...draft,
    status: draft.status === "READY" ? "READY" : "DRAFT",
  }));
}

export function getActiveClickruCampaignDraft(): ClickruCampaignDraft | undefined {
  const settings = readSettings();
  const drafts = getClickruCampaignDrafts();
  if (!drafts.length) return undefined;
  return drafts.find((draft) => draft.id === settings.activeCampaignDraftId) ?? drafts[0];
}

export function saveClickruCampaignDraft(input: {
  id?: string;
  name: string;
  status?: ClickruCampaignStatus;
  service?: "VK_ADS";
  accountId?: number;
  website: string;
  objective?: ClickruCampaignObjective;
  regions: string;
  audience: string;
  dailyBudget: number;
  headline: string;
  adText: string;
  callToAction: string;
}): ClickruCampaignDraft {
  const name = input.name.trim();
  const website = input.website.trim();
  const regions = input.regions.trim();
  const audience = input.audience.trim();
  const headline = input.headline.trim();
  const adText = input.adText.trim();
  const callToAction = input.callToAction.trim();
  if (!name || !website || !regions || !audience || !headline || !adText || !callToAction) {
    throw new Error("Campaign name, website, regions, audience and ad text are required");
  }
  try {
    const parsedUrl = new URL(website);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error("unsupported protocol");
  } catch {
    throw new Error("Website must be a valid http(s) URL");
  }
  if (!Number.isFinite(input.dailyBudget) || input.dailyBudget <= 0) {
    throw new Error("Daily budget must be greater than zero");
  }
  if (input.accountId !== undefined && (!Number.isInteger(input.accountId) || input.accountId <= 0)) {
    throw new Error("Account ID must be a positive integer");
  }

  const settings = readSettings();
  const drafts = getClickruCampaignDrafts();
  const id = input.id?.trim() || randomDraftId();
  const draft: ClickruCampaignDraft = {
    id,
    name,
    status: input.status ?? "DRAFT",
    service: input.service ?? "VK_ADS",
    accountId: input.accountId,
    website,
    objective: input.objective ?? "TRAFFIC",
    regions,
    audience,
    dailyBudget: Math.round(input.dailyBudget * 100) / 100,
    headline,
    adText,
    callToAction,
    updatedAt: new Date().toISOString(),
  };
  const existingIndex = drafts.findIndex((candidate) => candidate.id === id);
  if (existingIndex >= 0) drafts[existingIndex] = draft;
  else drafts.push(draft);
  writeSettings({ ...settings, campaignDrafts: drafts, activeCampaignDraftId: id });
  return draft;
}

export function setClickruCampaignDraftStatus(
  draftId: string,
  status: ClickruCampaignStatus,
): ClickruCampaignDraft {
  if (status !== "DRAFT" && status !== "READY") throw new Error("Unsupported campaign status");
  const settings = readSettings();
  const drafts = getClickruCampaignDrafts();
  const index = drafts.findIndex((draft) => draft.id === draftId.trim());
  if (index < 0) throw new Error("Campaign draft not found");
  const updated: ClickruCampaignDraft = {
    ...drafts[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  drafts[index] = updated;
  writeSettings({ ...settings, campaignDrafts: drafts });
  return updated;
}

export function setActiveClickruCampaignDraft(draftId: string): ClickruCampaignDraft {
  const settings = readSettings();
  const drafts = Array.isArray(settings.campaignDrafts) ? settings.campaignDrafts : [];
  const draft = drafts.find((candidate) => candidate.id === draftId.trim());
  if (!draft) throw new Error("Campaign draft not found");
  writeSettings({ ...settings, campaignDrafts: drafts, activeCampaignDraftId: draft.id });
  return draft;
}

export function clickruCampaignDraftsStatus(): {
  activeDraftId?: string;
  drafts: Array<ClickruCampaignDraft & { active: boolean }>;
} {
  const drafts = getClickruCampaignDrafts();
  const activeDraft = getActiveClickruCampaignDraft();
  return {
    activeDraftId: activeDraft?.id,
    drafts: drafts.map((draft) => ({ ...draft, active: draft.id === activeDraft?.id })),
  };
}

function randomDraftId(): string {
  return `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
