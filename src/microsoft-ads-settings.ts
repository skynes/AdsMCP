import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveDataDir } from "./env.js";

export interface MicrosoftAdsProfile {
  id: string;
  name: string;
  clientId: string;
  developerToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  updatedAt: string;
}

interface MicrosoftAdsSettings {
  profiles?: MicrosoftAdsProfile[];
  activeProfileId?: string;
}

const AUTHORITY = "https://login.microsoftonline.com/common/oauth2/v2.0";
export const MICROSOFT_ADS_SCOPE = "https://ads.microsoft.com/msads.manage offline_access";
export const MICROSOFT_ADS_REDIRECT_URI = "http://127.0.0.1:8790/api/microsoft/oauth/callback";

function settingsPath(): string {
  return join(resolveDataDir(), "microsoft-ads-settings.json");
}

function readSettings(): MicrosoftAdsSettings {
  const path = settingsPath();
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as MicrosoftAdsSettings;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSettings(value: MicrosoftAdsSettings): void {
  const dir = resolveDataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(settingsPath(), `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

function randomProfileId(): string {
  return `microsoft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getProfiles(): MicrosoftAdsProfile[] {
  const profiles = readSettings().profiles;
  return Array.isArray(profiles) ? profiles : [];
}

export function getActiveMicrosoftAdsProfile(): MicrosoftAdsProfile | undefined {
  const settings = readSettings();
  const profiles = getProfiles();
  if (!profiles.length) return undefined;
  return profiles.find((profile) => profile.id === settings.activeProfileId) ?? profiles[0];
}

export function saveMicrosoftAdsProfile(input: {
  id?: string;
  name: string;
  clientId: string;
  developerToken?: string;
}): MicrosoftAdsProfile {
  const name = input.name.trim();
  const clientId = input.clientId.trim();
  if (!name) throw new Error("Microsoft profile name is required");
  if (!clientId || !/^[a-zA-Z0-9-]{16,}$/.test(clientId)) {
    throw new Error("Microsoft Client ID looks invalid");
  }
  const developerToken = input.developerToken?.trim() || undefined;
  if (developerToken && developerToken.length > 4096) {
    throw new Error("Microsoft Developer Token is too long");
  }

  const settings = readSettings();
  const profiles = getProfiles();
  const id = input.id?.trim() || randomProfileId();
  const existing = profiles.find((profile) => profile.id === id);
  const profile: MicrosoftAdsProfile = {
    id,
    name,
    clientId,
    developerToken: developerToken ?? existing?.developerToken,
    accessToken: existing?.accessToken,
    refreshToken: existing?.refreshToken,
    expiresAt: existing?.expiresAt,
    updatedAt: new Date().toISOString(),
  };
  const index = profiles.findIndex((candidate) => candidate.id === id);
  if (index >= 0) profiles[index] = profile;
  else profiles.push(profile);
  writeSettings({ ...settings, profiles, activeProfileId: id });
  return profile;
}

export function setActiveMicrosoftAdsProfile(profileId: string): MicrosoftAdsProfile {
  const settings = readSettings();
  const profiles = getProfiles();
  const profile = profiles.find((candidate) => candidate.id === profileId.trim());
  if (!profile) throw new Error("Microsoft profile not found");
  writeSettings({ ...settings, profiles, activeProfileId: profile.id });
  return profile;
}

export function microsoftAdsProfilesStatus(): {
  activeProfileId?: string;
  redirectUri: string;
  scope: string;
  profiles: Array<{
    id: string;
    name: string;
    clientId: string;
    clientIdMasked: string;
    developerTokenConfigured: boolean;
    connected: boolean;
    expiresAt?: string;
    active: boolean;
  }>;
} {
  const active = getActiveMicrosoftAdsProfile();
  return {
    activeProfileId: active?.id,
    redirectUri: MICROSOFT_ADS_REDIRECT_URI,
    scope: MICROSOFT_ADS_SCOPE,
    profiles: getProfiles().map((profile) => ({
      id: profile.id,
      name: profile.name,
      clientId: profile.clientId,
      clientIdMasked: maskClientId(profile.clientId),
      developerTokenConfigured: Boolean(profile.developerToken),
      connected: Boolean(profile.refreshToken || profile.accessToken),
      expiresAt: profile.expiresAt,
      active: profile.id === active?.id,
    })),
  };
}

export function getMicrosoftAdsProfile(profileId: string): MicrosoftAdsProfile | undefined {
  return getProfiles().find((profile) => profile.id === profileId.trim());
}

export function saveMicrosoftAdsTokens(input: {
  profileId: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}): MicrosoftAdsProfile {
  const settings = readSettings();
  const profiles = getProfiles();
  const index = profiles.findIndex((profile) => profile.id === input.profileId.trim());
  if (index < 0) throw new Error("Microsoft profile not found");
  const current = profiles[index];
  const expiresAt = Number.isFinite(input.expiresIn)
    ? new Date(Date.now() + Math.max(0, Number(input.expiresIn)) * 1000).toISOString()
    : current.expiresAt;
  const updated: MicrosoftAdsProfile = {
    ...current,
    accessToken: input.accessToken.trim(),
    refreshToken: input.refreshToken?.trim() || current.refreshToken,
    expiresAt,
    updatedAt: new Date().toISOString(),
  };
  profiles[index] = updated;
  writeSettings({ ...settings, profiles, activeProfileId: updated.id });
  return updated;
}

export async function getMicrosoftAdsAccessToken(): Promise<string | undefined> {
  const profile = getActiveMicrosoftAdsProfile();
  if (!profile) return process.env.MICROSOFT_ADS_ACCESS_TOKEN?.trim() || undefined;
  const expiresAt = profile.expiresAt ? Date.parse(profile.expiresAt) : 0;
  if (profile.accessToken && expiresAt > Date.now() + 60_000) return profile.accessToken;
  if (!profile.refreshToken) return profile.accessToken;

  const response = await fetch(`${AUTHORITY}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: profile.clientId,
      scope: MICROSOFT_ADS_SCOPE,
      refresh_token: profile.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || `Microsoft token refresh failed (${response.status})`);
  }
  return saveMicrosoftAdsTokens({
    profileId: profile.id,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
  }).accessToken;
}

export function createMicrosoftOAuthState(): { state: string; codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64Url(randomBytes(32));
  const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());
  return { state: base64Url(randomBytes(24)), codeVerifier, codeChallenge };
}

export function microsoftAuthorizationUrl(input: {
  clientId: string;
  state: string;
  codeChallenge: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    response_type: "code",
    redirect_uri: MICROSOFT_ADS_REDIRECT_URI,
    response_mode: "query",
    scope: MICROSOFT_ADS_SCOPE,
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });
  return `${AUTHORITY}/authorize?${params.toString()}`;
}

export async function exchangeMicrosoftOAuthCode(input: {
  profileId: string;
  clientId: string;
  code: string;
  codeVerifier: string;
}): Promise<MicrosoftAdsProfile> {
  const response = await fetch(`${AUTHORITY}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: input.clientId,
      scope: MICROSOFT_ADS_SCOPE,
      code: input.code,
      redirect_uri: MICROSOFT_ADS_REDIRECT_URI,
      grant_type: "authorization_code",
      code_verifier: input.codeVerifier,
    }),
  });
  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || `Microsoft OAuth failed (${response.status})`);
  }
  return saveMicrosoftAdsTokens({
    profileId: input.profileId,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
  });
}

function base64Url(value: Buffer): string {
  return value.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function maskClientId(clientId: string): string {
  const value = clientId.trim();
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
