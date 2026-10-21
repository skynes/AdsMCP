import { createHash, randomBytes } from "node:crypto";
import { loadEnv } from "../env.js";
import {
  getMastodonPendingAuthorization,
  getMastodonStoredAccount,
  listMastodonStoredAccounts,
  mastodonStateFilePath,
  removeMastodonPendingAuthorization,
  removeMastodonStoredAccount,
  saveMastodonPendingAuthorization,
  saveMastodonStoredAccount,
  type MastodonStoredAccount,
} from "./storage.js";

const OOB_REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";
const LOCAL_CALLBACK_PATH = "/api/mastodon/oauth/callback";
const DEFAULT_SCOPES = [
  "read:accounts",
  "read:follows",
  "read:notifications",
  "read:statuses",
  "write:follows",
  "write:statuses",
  "write:accounts",
];

export type MastodonAccount = {
  id: string;
  username?: string;
  acct?: string;
  display_name?: string;
  url?: string;
  avatar?: string;
  header?: string;
  note?: string;
  locked?: boolean;
  discoverable?: boolean;
  indexable?: boolean;
  bot?: boolean;
  followers_count?: number;
  following_count?: number;
  statuses_count?: number;
  fields?: Array<{ name: string; value: string; verified_at?: string | null }>;
};

export type MastodonStatus = {
  id: string;
  uri?: string;
  url?: string | null;
  created_at?: string;
  edited_at?: string | null;
  content?: string;
  visibility?: "public" | "unlisted" | "private" | "direct";
  sensitive?: boolean;
  spoiler_text?: string;
  in_reply_to_id?: string | null;
  in_reply_to_account_id?: string | null;
  account?: MastodonAccount;
  mentions?: Array<{ id: string; username: string; url: string; acct: string }>;
  tags?: Array<{ name: string; url: string }>;
  media_attachments?: unknown[];
};

export type MastodonRelationship = {
  id: string;
  following?: boolean;
  requested?: boolean;
  notifying?: boolean;
  showing_reblogs?: boolean;
};

export type MastodonNotification = {
  id: string;
  type: string;
  created_at?: string;
  account?: MastodonAccount;
  status?: MastodonStatus;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH";
  token?: string;
  body?: URLSearchParams;
};

type TokenResponse = {
  access_token: string;
  token_type?: string;
  scope?: string;
  created_at?: number;
};

type CredentialApplication = {
  client_id: string;
  client_secret: string;
};

function normalizeInstanceUrl(value: string): string {
  const input = value.trim();
  if (!input) throw new Error("Mastodon instance URL is required");
  const url = new URL(input);
  if (url.protocol !== "https:") throw new Error("Mastodon instance URL must use https://");
  if (url.username || url.password || url.pathname !== "/" && url.pathname !== "") {
    throw new Error("Mastodon instance URL must contain only the instance origin");
  }
  return url.origin;
}
function normalizeRedirectUri(value: string | undefined): string {
  const redirectUri = value?.trim() || OOB_REDIRECT_URI;
  if (redirectUri === OOB_REDIRECT_URI) return redirectUri;
  const url = new URL(redirectUri);
  if (
    url.protocol !== "http:" ||
    url.hostname !== "127.0.0.1" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== LOCAL_CALLBACK_PATH ||
    !/^\d+$/.test(url.port)
  ) {
    throw new Error("Mastodon callback must be the local http://127.0.0.1 callback");
  }
  return url.toString().replace(/\/$/, "");
}

export function mastodonLocalRedirectUri(port = 8790): string {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid local Mastodon callback port");
  return `http://127.0.0.1:${port}${LOCAL_CALLBACK_PATH}`;
}

function envAccount(): MastodonStoredAccount | undefined {
  loadEnv();
  const instance = process.env.MASTODON_INSTANCE_URL?.trim();
  const accessToken = process.env.MASTODON_ACCESS_TOKEN?.trim();
  if (!instance || !accessToken) return undefined;
  return {
    id: process.env.MASTODON_ACCOUNT_ID?.trim() || "env_default",
    instanceUrl: normalizeInstanceUrl(instance),
    clientId: "",
    clientSecret: "",
    accessToken,
    tokenType: "Bearer",
    scope: process.env.MASTODON_SCOPES?.trim() || "",
    account: { id: "unknown" },
    createdAt: "",
    updatedAt: "",
  };
}

export function mastodonCredentialsConfigured(): boolean {
  return Boolean(envAccount() || listMastodonStoredAccounts().length);
}

export function mastodonDefaultScopes(): string[] {
  loadEnv();
  const configured = process.env.MASTODON_SCOPES?.trim();
  if (!configured) return [...DEFAULT_SCOPES];
  return [...new Set([...configured.split(/\s+/).filter(Boolean), "read:follows"])]
}

export function listMastodonAccounts(): Array<{
  id: string;
  instanceUrl: string;
  source: "local" | "environment";
  account: MastodonStoredAccount["account"];
  updatedAt?: string;
}> {
  const local: Array<{
    id: string;
    instanceUrl: string;
    source: "local" | "environment";
    account: MastodonStoredAccount["account"];
    updatedAt?: string;
  }> = listMastodonStoredAccounts().map((account) => ({
    id: account.id,
    instanceUrl: account.instanceUrl,
    source: "local" as const,
    account: account.account,
    updatedAt: account.updatedAt,
  }));
  const configured = envAccount();
  if (configured && !local.some((account) => account.id === configured.id)) {
    local.push({
      id: configured.id,
      instanceUrl: configured.instanceUrl,
      source: "environment",
      account: configured.account,
    });
  }
  return local;
}

function resolveAccount(accountId?: string): MastodonStoredAccount {
  const requested = accountId?.trim();
  const account = requested
    ? getMastodonStoredAccount(requested) || (envAccount()?.id === requested ? envAccount() : undefined)
    : listMastodonStoredAccounts()[0] || envAccount();
  if (!account) {
    throw new Error("No Mastodon account is connected. Run ads_mastodon_auth_start first.");
  }
  return account;
}

function apiUrl(instanceUrl: string, path: string): string {
  return `${instanceUrl}${path}`;
}

async function mastodonRequest<T>(instanceUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(apiUrl(instanceUrl, path), {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(options.body ? { body: options.body.toString() } : {}),
  });
  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }
  if (!response.ok) {
    const details = typeof payload === "object" && payload !== null
      ? JSON.stringify(payload)
      : String(payload || response.statusText);
    throw new Error(`Mastodon API ${response.status}: ${details}`);
  }
  return payload as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const values = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).length > 0) values.set(key, String(value));
  }
  const encoded = values.toString();
  return encoded ? `?${encoded}` : "";
}

function pkceVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

function safeAccountId(instanceUrl: string, requested?: string): string {
  const value = requested?.trim();
  if (value) {
    if (!/^[A-Za-z0-9_.:-]{1,120}$/.test(value)) throw new Error("Mastodon account_id contains unsupported characters");
    return value;
  }
  return `mastodon_${new URL(instanceUrl).hostname.replace(/[^A-Za-z0-9-]/g, "-")}`;
}

function mastodonClientName(accountId: string, custom?: string): string {
  const explicit = custom?.trim();
  if (explicit) return explicit;
  const accountKey = accountId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  return process.env[`MASTODON_CLIENT_NAME_${accountKey}`]?.trim()
    || process.env.MASTODON_CLIENT_NAME?.trim()
    || "AdsMCP";
}

export async function startMastodonAuthorization(input: {
  instanceUrl: string;
  accountId?: string;
  scopes?: string[];
  forceLogin?: boolean;
  redirectUri?: string;
  clientName?: string;
}): Promise<{
  accountId: string;
  instanceUrl: string;
  clientName: string;
  authorizationUrl: string;
  state: string;
  redirectUri: string;
  scopes: string[];
}> {
  const instanceUrl = normalizeInstanceUrl(input.instanceUrl);
  const scopes = (input.scopes?.length ? input.scopes : mastodonDefaultScopes())
    .map((scope) => scope.trim())
    .filter(Boolean);
  if (!scopes.length) throw new Error("At least one Mastodon OAuth scope is required");
  const redirectUri = normalizeRedirectUri(input.redirectUri);
  loadEnv();
  const accountId = safeAccountId(instanceUrl, input.accountId);
  const clientName = mastodonClientName(accountId, input.clientName);

  const application = await mastodonRequest<CredentialApplication>(instanceUrl, "/api/v1/apps", {
    method: "POST",
    body: new URLSearchParams({
      client_name: clientName,
      redirect_uris: redirectUri,
      scopes: scopes.join(" "),
      ...(process.env.MASTODON_APP_WEBSITE?.trim() ? { website: process.env.MASTODON_APP_WEBSITE.trim() } : {}),
    }),
  });
  const verifier = pkceVerifier();
  const state = randomBytes(24).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: application.client_id,
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
  });
  if (input.forceLogin === true) params.set("force_login", "true");
  saveMastodonPendingAuthorization({
    state,
    accountId,
    instanceUrl,
    clientId: application.client_id,
    clientSecret: application.client_secret,
    redirectUri,
    codeVerifier: verifier,
    scopes,
    createdAt: new Date().toISOString(),
  });
  return {
    accountId,
    instanceUrl,
    clientName,
    authorizationUrl: `${instanceUrl}/oauth/authorize?${params.toString()}`,
    state,
    redirectUri,
    scopes,
  };
}

export async function completeMastodonAuthorization(state: string, code: string): Promise<{
  accountId: string;
  instanceUrl: string;
  account: MastodonAccount;
  stateFile: string;
}> {
  const pending = getMastodonPendingAuthorization(state);
  if (!pending) throw new Error("Mastodon OAuth state is missing or expired; start authorization again");
  const authorizationCode = code.trim();
  if (!authorizationCode) throw new Error("Mastodon authorization code is required");
  if (authorizationCode.length > 4096) throw new Error("Mastodon authorization code is too long");

  const token = await mastodonRequest<TokenResponse>(pending.instanceUrl, "/oauth/token", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      client_id: pending.clientId,
      client_secret: pending.clientSecret,
      redirect_uri: pending.redirectUri,
      code_verifier: pending.codeVerifier,
    }),
  });
  if (!token.access_token) throw new Error("Mastodon did not return an access token");
  const account = await mastodonRequest<MastodonAccount>(pending.instanceUrl, "/api/v1/accounts/verify_credentials", {
    token: token.access_token,
  });
  const now = new Date().toISOString();
  saveMastodonStoredAccount({
    id: pending.accountId,
    instanceUrl: pending.instanceUrl,
    clientId: pending.clientId,
    clientSecret: pending.clientSecret,
    accessToken: token.access_token,
    tokenType: token.token_type || "Bearer",
    scope: token.scope || pending.scopes.join(" "),
    account: {
      id: account.id,
      username: account.username,
      acct: account.acct,
      display_name: account.display_name,
      url: account.url,
    },
    createdAt: now,
    updatedAt: now,
  });
  removeMastodonPendingAuthorization(state);
  return { accountId: pending.accountId, instanceUrl: pending.instanceUrl, account, stateFile: mastodonStateFilePath() };
}

export function mastodonAccountState(accountId?: string): { account: MastodonStoredAccount; source: "local" | "environment" } {
  const account = resolveAccount(accountId);
  return {
    account,
    source: account.clientId ? "local" : "environment",
  };
}

export async function resetMastodonAccount(accountId: string): Promise<{
  accountId: string;
  instanceUrl: string;
  revoked: boolean;
  localRecordRemoved: boolean;
  revocationError?: string;
}> {
  const account = getMastodonStoredAccount(accountId);
  if (!account) throw new Error(`Mastodon local account not found: ${accountId}`);
  let revoked = false;
  let revocationError: string | undefined;
  try {
    if (account.clientId && account.clientSecret) {
      await mastodonRequest<Record<string, unknown>>(account.instanceUrl, "/oauth/revoke", {
        method: "POST",
        body: new URLSearchParams({
          client_id: account.clientId,
          client_secret: account.clientSecret,
          token: account.accessToken,
        }),
      });
      revoked = true;
    }
  } catch (error) {
    revocationError = error instanceof Error ? error.message : String(error);
  } finally {
    removeMastodonStoredAccount(account.id);
  }
  return {
    accountId: account.id,
    instanceUrl: account.instanceUrl,
    revoked,
    localRecordRemoved: true,
    ...(revocationError ? { revocationError } : {}),
  };
}

export async function getMastodonCurrentAccount(accountId?: string): Promise<MastodonAccount> {
  const { account } = mastodonAccountState(accountId);
  return mastodonRequest<MastodonAccount>(account.instanceUrl, "/api/v1/accounts/verify_credentials", {
    token: account.accessToken,
  });
}

export async function getMastodonAccount(accountId: string | undefined, targetAccountId: string): Promise<MastodonAccount> {
  const { account } = mastodonAccountState(accountId);
  const target = targetAccountId.trim();
  if (!target) throw new Error("Mastodon target account id is required");
  return mastodonRequest<MastodonAccount>(account.instanceUrl, `/api/v1/accounts/${encodeURIComponent(target)}`, {
    token: account.accessToken,
  });
}

export async function listMastodonNotifications(accountId: string | undefined, limit = 20, sinceId?: string): Promise<MastodonNotification[]> {
  const { account } = mastodonAccountState(accountId);
  const bounded = Math.max(1, Math.min(40, Math.floor(limit || 20)));
  return mastodonRequest<MastodonNotification[]>(
    account.instanceUrl,
    `/api/v1/notifications${query({ limit: bounded, since_id: sinceId })}&types[]=mention`,
    { token: account.accessToken },
  );
}

export async function listMastodonHashtagStatuses(
  accountId: string | undefined,
  hashtag: string,
  limit = 20,
): Promise<MastodonStatus[]> {
  const { account } = mastodonAccountState(accountId);
  const normalized = hashtag.trim().replace(/^#/, "");
  if (!normalized || !/^[\p{L}\p{N}_-]+$/u.test(normalized)) {
    throw new Error(`Invalid Mastodon hashtag: ${hashtag}`);
  }
  const bounded = Math.max(1, Math.min(40, Math.floor(limit || 20)));
  return mastodonRequest<MastodonStatus[]>(
    account.instanceUrl,
    `/api/v1/timelines/tag/${encodeURIComponent(normalized)}${query({ limit: bounded })}`,
    { token: account.accessToken },
  );
}

export async function followMastodonAccount(input: {
  accountId?: string;
  targetAccountId: string;
  reblogs?: boolean;
  notify?: boolean;
}): Promise<MastodonRelationship> {
  const { account } = mastodonAccountState(input.accountId);
  const targetAccountId = input.targetAccountId.trim();
  if (!targetAccountId) throw new Error("Mastodon target account id is required");
  return mastodonRequest<MastodonRelationship>(
    account.instanceUrl,
    `/api/v1/accounts/${encodeURIComponent(targetAccountId)}/follow`,
    {
      method: "POST",
      token: account.accessToken,
      body: new URLSearchParams({
        reblogs: String(input.reblogs !== false),
        notify: String(input.notify === true),
      }),
    },
  );
}

export async function getMastodonStatus(accountId: string | undefined, statusId: string): Promise<MastodonStatus> {
  const { account } = mastodonAccountState(accountId);
  return mastodonRequest<MastodonStatus>(account.instanceUrl, `/api/v1/statuses/${encodeURIComponent(statusId)}`, {
    token: account.accessToken,
  });
}

export async function resolveMastodonStatus(accountId: string | undefined, statusUrl: string): Promise<MastodonStatus | undefined> {
  const { account } = mastodonAccountState(accountId);
  const remoteUrl = statusUrl.trim();
  if (!remoteUrl) throw new Error("Mastodon status URL is required");
  const result = await mastodonRequest<{ statuses?: MastodonStatus[] }>(
    account.instanceUrl,
    `/api/v2/search${query({ q: remoteUrl, type: "statuses", resolve: "true" })}`,
    { token: account.accessToken },
  );
  return result.statuses?.find((status) => status.url === remoteUrl) || result.statuses?.[0];
}

export async function createMastodonStatus(input: {
  accountId?: string;
  text: string;
  visibility?: "public" | "unlisted" | "private" | "direct";
  inReplyToId?: string;
}): Promise<MastodonStatus> {
  const { account } = mastodonAccountState(input.accountId);
  const text = input.text.trim();
  if (!text) throw new Error("Mastodon status text must not be empty");
  const body = new URLSearchParams({
    status: text,
    visibility: input.visibility || "public",
  });
  if (input.inReplyToId?.trim()) body.set("in_reply_to_id", input.inReplyToId.trim());
  return mastodonRequest<MastodonStatus>(account.instanceUrl, "/api/v1/statuses", {
    method: "POST",
    token: account.accessToken,
    body,
  });
}

export async function updateMastodonStatus(input: {
  accountId?: string;
  statusId: string;
  text: string;
  language?: string;
}): Promise<MastodonStatus> {
  const { account } = mastodonAccountState(input.accountId);
  const statusId = input.statusId.trim();
  const text = input.text.trim();
  if (!statusId) throw new Error("Mastodon status id is required");
  if (!text) throw new Error("Mastodon status text must not be empty");
  const current = await getMastodonStatus(input.accountId, statusId);
  const body = new URLSearchParams({
    status: text,
    visibility: current.visibility || "public",
    sensitive: String(current.sensitive === true),
    spoiler_text: current.spoiler_text || "",
  });
  if (input.language?.trim()) body.set("language", input.language.trim());
  return mastodonRequest<MastodonStatus>(account.instanceUrl, `/api/v1/statuses/${encodeURIComponent(statusId)}`, {
    method: "PUT",
    token: account.accessToken,
    body,
  });
}

export async function pinMastodonStatus(input: {
  accountId?: string;
  statusId: string;
}): Promise<MastodonStatus> {
  const { account } = mastodonAccountState(input.accountId);
  const statusId = input.statusId.trim();
  if (!statusId) throw new Error("Mastodon status id is required");
  return mastodonRequest<MastodonStatus>(account.instanceUrl, `/api/v1/statuses/${encodeURIComponent(statusId)}/pin`, {
    method: "POST",
    token: account.accessToken,
  });
}

export async function replyToMastodonStatus(input: {
  accountId?: string;
  statusId: string;
  text: string;
  visibility?: "public" | "unlisted" | "private" | "direct";
}): Promise<{ status: MastodonStatus; sourceVisibility: string | null; visibility: string; mention: string }> {
  const { account } = mastodonAccountState(input.accountId);
  const target = await mastodonRequest<MastodonStatus>(account.instanceUrl, `/api/v1/statuses/${encodeURIComponent(input.statusId)}`, {
    token: account.accessToken,
  });
  const sourceVisibility = target.visibility || "public";
  const visibility = input.visibility || (sourceVisibility as "public" | "unlisted" | "private" | "direct");
  const rank: Record<string, number> = { direct: 0, private: 1, unlisted: 2, public: 3 };
  if ((rank[visibility] ?? 3) > (rank[sourceVisibility] ?? 3)) {
    throw new Error(`Reply visibility ${visibility} is more public than the target status visibility ${sourceVisibility}`);
  }
  if (!target.account) throw new Error("Mastodon target status did not include its author; reply aborted to avoid a missing mention");
  const rawText = input.text.trim();
  if (!rawText) throw new Error("Mastodon reply text must not be empty");
  const handle = target.account.acct || target.account.username;
  if (!handle) throw new Error("Mastodon target account does not have a usable handle");
  const mention = `@${handle}`;
  const text = addMastodonMention(rawText, target.account);
  const status = await mastodonRequest<MastodonStatus>(account.instanceUrl, "/api/v1/statuses", {
    method: "POST",
    token: account.accessToken,
    body: new URLSearchParams({
      status: text,
      in_reply_to_id: input.statusId,
      visibility,
    }),
  });
  return { status, sourceVisibility, visibility, mention };
}

function addMastodonMention(text: string, target: MastodonAccount): string {
  const handle = target.acct || target.username;
  if (!handle) throw new Error("Mastodon target account does not have a usable handle");
  const mention = `@${handle}`;
  const escapedMention = mention.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
  return new RegExp(`(^|\\s)${escapedMention}(?=$|\\s|[^\\p{L}\\p{N}_@])`, "iu").test(text)
    ? text
    : `${mention} ${text}`;
}

export async function sendMastodonDirectMessage(input: {
  accountId?: string;
  targetAccountId: string;
  text: string;
}): Promise<{ status: MastodonStatus; target: MastodonAccount; visibility: "direct" }> {
  const { account } = mastodonAccountState(input.accountId);
  const target = await getMastodonAccount(input.accountId, input.targetAccountId);
  const text = input.text.trim();
  if (!text) throw new Error("Mastodon direct message text must not be empty");
  const status = await mastodonRequest<MastodonStatus>(account.instanceUrl, "/api/v1/statuses", {
    method: "POST",
    token: account.accessToken,
    body: new URLSearchParams({
      status: addMastodonMention(text, target),
      visibility: "direct",
    }),
  });
  return { status, target, visibility: "direct" };
}

export async function sendMastodonPublicMention(input: {
  accountId?: string;
  targetAccountId: string;
  text: string;
  inReplyToId?: string;
}): Promise<{ status: MastodonStatus; target: MastodonAccount; visibility: "public" }> {
  const { account } = mastodonAccountState(input.accountId);
  const target = await getMastodonAccount(input.accountId, input.targetAccountId);
  const text = input.text.trim();
  if (!text) throw new Error("Mastodon public mention text must not be empty");
  const body = new URLSearchParams({
    status: addMastodonMention(text, target),
    visibility: "public",
  });
  if (input.inReplyToId?.trim()) body.set("in_reply_to_id", input.inReplyToId.trim());
  const status = await mastodonRequest<MastodonStatus>(account.instanceUrl, "/api/v1/statuses", {
    method: "POST",
    token: account.accessToken,
    body,
  });
  return { status, target, visibility: "public" };
}

export async function updateMastodonProfile(input: {
  accountId?: string;
  displayName?: string;
  note?: string;
  locked?: boolean;
  discoverable?: boolean;
  indexable?: boolean;
  hideCollections?: boolean;
  language?: string;
  fields?: Array<{ name: string; value: string }>;
}): Promise<MastodonAccount> {
  const { account } = mastodonAccountState(input.accountId);
  const body = new URLSearchParams();
  if (input.displayName !== undefined) body.set("display_name", input.displayName);
  if (input.note !== undefined) body.set("note", input.note);
  if (input.locked !== undefined) body.set("locked", String(input.locked));
  if (input.discoverable !== undefined) body.set("discoverable", String(input.discoverable));
  if (input.indexable !== undefined) body.set("indexable", String(input.indexable));
  if (input.hideCollections !== undefined) body.set("hide_collections", String(input.hideCollections));
  if (input.language !== undefined) body.set("source[language]", input.language);
  input.fields?.forEach((field, index) => {
    body.set(`fields_attributes[${index}][name]`, field.name);
    body.set(`fields_attributes[${index}][value]`, field.value);
  });
  if (!body.toString()) throw new Error("At least one Mastodon profile field must be provided");
  return mastodonRequest<MastodonAccount>(account.instanceUrl, "/api/v1/accounts/update_credentials", {
    method: "PATCH",
    token: account.accessToken,
    body,
  });
}
