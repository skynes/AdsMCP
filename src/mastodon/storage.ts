import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveDataDir } from "../env.js";

export type MastodonPendingAuthorization = {
  state: string;
  accountId: string;
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier: string;
  scopes: string[];
  createdAt: string;
};

export type MastodonStoredAccount = {
  id: string;
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  tokenType: string;
  scope: string;
  account: {
    id: string;
    username?: string;
    acct?: string;
    display_name?: string;
    url?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type MastodonState = {
  accounts?: MastodonStoredAccount[];
  pending?: MastodonPendingAuthorization[];
};

function statePath(): string {
  return join(resolveDataDir(), "mastodon-accounts.json");
}
function readState(): MastodonState {
  const path = statePath();
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as MastodonState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(state: MastodonState): void {
  const path = statePath();
  const directory = resolveDataDir();
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

export function mastodonStateFilePath(): string {
  return statePath();
}

export function listMastodonStoredAccounts(): MastodonStoredAccount[] {
  const accounts = readState().accounts;
  return Array.isArray(accounts) ? accounts : [];
}

export function getMastodonStoredAccount(id: string): MastodonStoredAccount | undefined {
  return listMastodonStoredAccounts().find((account) => account.id === id.trim());
}

export function saveMastodonStoredAccount(account: MastodonStoredAccount): MastodonStoredAccount {
  const state = readState();
  const accounts = Array.isArray(state.accounts) ? state.accounts : [];
  const index = accounts.findIndex((candidate) => candidate.id === account.id);
  if (index >= 0) accounts[index] = account;
  else accounts.push(account);
  writeState({ ...state, accounts });
  return account;
}

export function removeMastodonStoredAccount(id: string): MastodonStoredAccount | undefined {
  const state = readState();
  const accounts = Array.isArray(state.accounts) ? state.accounts : [];
  const index = accounts.findIndex((account) => account.id === id.trim());
  if (index < 0) return undefined;
  const [removed] = accounts.splice(index, 1);
  writeState({ ...state, accounts });
  return removed;
}

export function getMastodonPendingAuthorization(state: string): MastodonPendingAuthorization | undefined {
  return (readState().pending || []).find((candidate) => candidate.state === state.trim());
}

export function saveMastodonPendingAuthorization(pending: MastodonPendingAuthorization): void {
  const state = readState();
  const current = Array.isArray(state.pending) ? state.pending : [];
  const now = Date.now();
  const fresh = current.filter((candidate) => now - Date.parse(candidate.createdAt) < 15 * 60 * 1000);
  const index = fresh.findIndex((candidate) => candidate.state === pending.state);
  if (index >= 0) fresh[index] = pending;
  else fresh.push(pending);
  writeState({ ...state, pending: fresh });
}

export function removeMastodonPendingAuthorization(stateValue: string): void {
  const state = readState();
  const pending = (state.pending || []).filter((candidate) => candidate.state !== stateValue.trim());
  writeState({ ...state, pending });
}
