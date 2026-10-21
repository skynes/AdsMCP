import { randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";
import { recordTelegramAiKeywordText } from "./telegram-ai-keywords.js";
import type {
  ClientConsentStatus,
  ClientProfile,
  ClientProfileMessage,
  ClientProfileMessageDirection,
  ClientProfileStatus,
} from "./types.js";

type ClientProfileRow = {
  id: string;
  telegram_user_id: string;
  channel: string;
  external_user_id: string | null;
  contact_account_id: string | null;
  display_name: string | null;
  username: string | null;
  source: string;
  status: string;
  consent_status: string;
  context_json: string | null;
  dialogue_summary: string | null;
  last_contact_at: string | null;
  next_action_at: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
};

type ClientProfileMessageRow = {
  id: string;
  profile_id: string;
  direction: string;
  text: string;
  sent_at: string;
  contact_account_id: string | null;
  telegram_message_id: string | null;
  metadata_json: string | null;
};

function optionalText(value: string | null): string | undefined {
  return value?.trim() || undefined;
}

function toClientProfile(row: ClientProfileRow): ClientProfile {
  const context = parseJson<Record<string, unknown>>(row.context_json);
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    telegramUserId: row.telegram_user_id,
    channel: row.channel,
    ...(optionalText(row.external_user_id) ? { externalUserId: optionalText(row.external_user_id) } : {}),
    ...(optionalText(row.contact_account_id) ? { contactAccountId: optionalText(row.contact_account_id) } : {}),
    ...(optionalText(row.display_name) ? { displayName: optionalText(row.display_name) } : {}),
    ...(optionalText(row.username) ? { username: optionalText(row.username) } : {}),
    source: row.source,
    status: row.status as ClientProfileStatus,
    consentStatus: row.consent_status as ClientConsentStatus,
    ...(context ? { context } : {}),
    ...(optionalText(row.dialogue_summary) ? { dialogueSummary: optionalText(row.dialogue_summary) } : {}),
    ...(optionalText(row.last_contact_at) ? { lastContactAt: row.last_contact_at! } : {}),
    ...(optionalText(row.next_action_at) ? { nextActionAt: row.next_action_at! } : {}),
    ...(metadata ? { metadata } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toClientProfileMessage(row: ClientProfileMessageRow): ClientProfileMessage {
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    profileId: row.profile_id,
    direction: row.direction as ClientProfileMessageDirection,
    text: row.text,
    sentAt: row.sent_at,
    ...(optionalText(row.contact_account_id) ? { contactAccountId: optionalText(row.contact_account_id) } : {}),
    ...(optionalText(row.telegram_message_id) ? { telegramMessageId: row.telegram_message_id! } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

function profileRow(id: string): ClientProfileRow | undefined {
  return db().prepare("SELECT * FROM client_profiles WHERE id = ?").get(id) as ClientProfileRow | undefined;
}

function assertProfileStatus(value: ClientProfileStatus): void {
  if (!(["active", "paused", "archived"] as string[]).includes(value)) {
    throw new Error(`Unsupported client profile status: ${value}`);
  }
}

function assertConsentStatus(value: ClientConsentStatus): void {
  if (!(["unknown", "opted_in", "opted_out"] as string[]).includes(value)) {
    throw new Error(`Unsupported client consent status: ${value}`);
  }
}

function assertMessageDirection(value: ClientProfileMessageDirection): void {
  if (!("inbound" === value || "outbound" === value || "note" === value)) {
    throw new Error(`Unsupported client profile message direction: ${value}`);
  }
}

export function createClientProfile(input: {
  id?: string;
  telegramUserId: string;
  channel?: string;
  externalUserId?: string;
  contactAccountId?: string;
  displayName?: string;
  username?: string;
  source?: string;
  status?: ClientProfileStatus;
  consentStatus?: ClientConsentStatus;
  context?: Record<string, unknown>;
  dialogueSummary?: string;
  lastContactAt?: string;
  nextActionAt?: string;
  metadata?: Record<string, unknown>;
}): ClientProfile {
  const telegramUserId = input.telegramUserId.trim();
  const channel = input.channel?.trim() || "telegram";
  const externalUserId = input.externalUserId?.trim() || telegramUserId;
  const source = input.source?.trim() || "neron";
  if (!telegramUserId) throw new Error("telegramUserId is required");
  if (!channel) throw new Error("channel is required");
  if (!externalUserId) throw new Error("externalUserId is required");
  if (!source) throw new Error("source is required");
  const status = input.status ?? "active";
  const consentStatus = input.consentStatus ?? "unknown";
  assertProfileStatus(status);
  assertConsentStatus(consentStatus);

  const now = new Date().toISOString();
  const id = input.id?.trim() || randomUUID();
  db()
    .prepare(
      `INSERT INTO client_profiles
       (id, telegram_user_id, channel, external_user_id, display_name, username, source, status, consent_status,
        contact_account_id, context_json, dialogue_summary, last_contact_at, next_action_at, metadata_json,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      telegramUserId,
      channel,
      externalUserId,
      input.displayName?.trim() || null,
      input.username?.trim().replace(/^@/, "") || null,
      source,
      status,
      consentStatus,
      input.contactAccountId?.trim() || null,
      jsonOrNull(input.context),
      input.dialogueSummary?.trim() || null,
      input.lastContactAt?.trim() || null,
      input.nextActionAt?.trim() || null,
      jsonOrNull(input.metadata),
      now,
      now,
    );
  return getClientProfile(id)!;
}

export function createOrUpdateExternalClientProfile(input: {
  channel: string;
  externalUserId: string;
  contactAccountId?: string;
  displayName?: string;
  username?: string;
  source?: string;
  status?: ClientProfileStatus;
  consentStatus?: ClientConsentStatus;
  context?: Record<string, unknown>;
  dialogueSummary?: string;
  lastContactAt?: string;
  nextActionAt?: string;
  metadata?: Record<string, unknown>;
}): ClientProfile {
  const channel = input.channel.trim();
  const externalUserId = input.externalUserId.trim();
  if (!channel) throw new Error("channel is required");
  if (!externalUserId) throw new Error("externalUserId is required");
  const existing = db()
    .prepare("SELECT id FROM client_profiles WHERE channel = ? AND external_user_id = ?")
    .get(channel, externalUserId) as { id?: string } | undefined;
  if (existing?.id) {
    return updateClientProfile(existing.id, {
      displayName: input.displayName,
      username: input.username,
      contactAccountId: input.contactAccountId,
      source: input.source,
      status: input.status,
      consentStatus: input.consentStatus,
      context: input.context,
      dialogueSummary: input.dialogueSummary,
      lastContactAt: input.lastContactAt,
      nextActionAt: input.nextActionAt,
      metadata: input.metadata,
    })!;
  }
  return createClientProfile({
    telegramUserId: `${channel}:${externalUserId}`,
    channel,
    externalUserId,
    contactAccountId: input.contactAccountId,
    displayName: input.displayName,
    username: input.username,
    source: input.source,
    status: input.status,
    consentStatus: input.consentStatus,
    context: input.context,
    dialogueSummary: input.dialogueSummary,
    lastContactAt: input.lastContactAt,
    nextActionAt: input.nextActionAt,
    metadata: input.metadata,
  });
}

export function getClientProfile(id: string): ClientProfile | undefined {
  const row = profileRow(id.trim());
  return row ? toClientProfile(row) : undefined;
}

export function listClientProfiles(input?: {
  status?: ClientProfileStatus;
  consentStatus?: ClientConsentStatus;
  source?: string;
  limit?: number;
}): ClientProfile[] {
  if (input?.status) assertProfileStatus(input.status);
  if (input?.consentStatus) assertConsentStatus(input.consentStatus);
  const clauses = ["1 = 1"];
  const params: Array<string | number> = [];
  if (input?.status) {
    clauses.push("status = ?");
    params.push(input.status);
  }
  if (input?.consentStatus) {
    clauses.push("consent_status = ?");
    params.push(input.consentStatus);
  }
  if (input?.source?.trim()) {
    clauses.push("source = ?");
    params.push(input.source.trim());
  }
  const limit = Math.max(1, Math.min(input?.limit ?? 50, 200));
  params.push(limit);
  const rows = db()
    .prepare(`SELECT * FROM client_profiles WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC LIMIT ?`)
    .all(...params) as unknown as ClientProfileRow[];
  return rows.map(toClientProfile);
}

export function updateClientProfile(
  id: string,
  patch: {
    displayName?: string | null;
    username?: string | null;
    source?: string;
    status?: ClientProfileStatus;
    consentStatus?: ClientConsentStatus;
    context?: Record<string, unknown> | null;
    dialogueSummary?: string | null;
    lastContactAt?: string | null;
    nextActionAt?: string | null;
    metadata?: Record<string, unknown> | null;
    contactAccountId?: string | null;
  },
): ClientProfile | undefined {
  const current = profileRow(id.trim());
  if (!current) return undefined;
  const status = patch.status ?? (current.status as ClientProfileStatus);
  const consentStatus = patch.consentStatus ?? (current.consent_status as ClientConsentStatus);
  assertProfileStatus(status);
  assertConsentStatus(consentStatus);
  const source = patch.source === undefined ? current.source : patch.source.trim();
  if (!source) throw new Error("source is required");
  const now = new Date().toISOString();

  db()
    .prepare(
      `UPDATE client_profiles SET
       display_name = ?, username = ?, source = ?, status = ?, consent_status = ?,
       contact_account_id = ?, context_json = ?, dialogue_summary = ?, last_contact_at = ?, next_action_at = ?,
       metadata_json = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      patch.displayName === undefined ? current.display_name : patch.displayName?.trim() || null,
      patch.username === undefined ? current.username : patch.username?.trim().replace(/^@/, "") || null,
      source,
      status,
      consentStatus,
      patch.contactAccountId === undefined ? current.contact_account_id : patch.contactAccountId?.trim() || null,
      patch.context === undefined ? current.context_json : jsonOrNull(patch.context),
      patch.dialogueSummary === undefined ? current.dialogue_summary : patch.dialogueSummary?.trim() || null,
      patch.lastContactAt === undefined ? current.last_contact_at : patch.lastContactAt?.trim() || null,
      patch.nextActionAt === undefined ? current.next_action_at : patch.nextActionAt?.trim() || null,
      patch.metadata === undefined ? current.metadata_json : jsonOrNull(patch.metadata),
      now,
      id.trim(),
    );
  return getClientProfile(id);
}

export function addClientProfileMessage(input: {
  profileId: string;
  direction: ClientProfileMessageDirection;
  text: string;
  sentAt?: string;
  contactAccountId?: string;
  telegramMessageId?: string;
  metadata?: Record<string, unknown>;
}): ClientProfileMessage {
  const profileId = input.profileId.trim();
  if (!profileRow(profileId)) throw new Error(`Client profile not found: ${profileId}`);
  const text = input.text.trim();
  if (!text) throw new Error("text is required");
  if (text.length > 20_000) throw new Error("text must be 20000 characters or less");
  assertMessageDirection(input.direction);
  const id = randomUUID();
  const sentAt = input.sentAt?.trim() || new Date().toISOString();
  db()
    .prepare(
      `INSERT INTO client_profile_messages
       (id, profile_id, direction, text, sent_at, contact_account_id, telegram_message_id, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      profileId,
      input.direction,
      text,
      sentAt,
      input.contactAccountId?.trim() || null,
      input.telegramMessageId?.trim() || null,
      jsonOrNull(input.metadata),
    );
  if (input.direction !== "note") {
    db()
      .prepare("UPDATE client_profiles SET last_contact_at = ?, contact_account_id = COALESCE(?, contact_account_id), updated_at = ? WHERE id = ?")
      .run(sentAt, input.contactAccountId?.trim() || null, new Date().toISOString(), profileId);
  }
  if (input.direction === "inbound") {
    recordTelegramAiKeywordText({
      projectId: "neron",
      text,
      sourceType: "client_message",
      sourceRef: `client-message:${id}`,
      observedAt: sentAt,
      metadata: { profileId, source: "client_profile_message" },
    });
  }
  return toClientProfileMessage(
    db().prepare("SELECT * FROM client_profile_messages WHERE id = ?").get(id) as ClientProfileMessageRow,
  );
}

export function listClientProfileMessages(profileId: string, limit = 100): ClientProfileMessage[] {
  if (!profileRow(profileId.trim())) throw new Error(`Client profile not found: ${profileId.trim()}`);
  const rowLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  const rows = db()
    .prepare(
      `SELECT * FROM client_profile_messages
       WHERE profile_id = ? ORDER BY sent_at DESC LIMIT ?`,
    )
    .all(profileId.trim(), rowLimit) as unknown as ClientProfileMessageRow[];
  return rows.reverse().map(toClientProfileMessage);
}
