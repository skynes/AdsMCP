import { randomUUID } from "node:crypto";
import { addClientProfileMessage, createClientProfile, getClientProfile, listClientProfileMessages, listClientProfiles, updateClientProfile } from "../dist/client-profiles.js";
import { getGramjsClient } from "../dist/telegram/gramjs.js";
import { inferTelegramLanguage } from "../dist/telegram-language.js";

const RUN_ID = randomUUID();
const MAX_DIALOGS = 500;
const HISTORY_PAGE_SIZE = 100;
const MAX_HISTORY_MESSAGES_PER_DIALOG = 10_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dateOf(message) {
  const raw = message?.date;
  if (raw instanceof Date) return raw.toISOString();
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return new Date().toISOString();
  return new Date(n < 1_000_000_000_000 ? n * 1000 : n).toISOString();
}

function displayName(entity) {
  return [entity?.firstName, entity?.lastName]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ") || String(entity?.username || entity?.id || "Telegram contact");
}

function isOptOut(text) {
  return /(неинтересно|не интересно|неактуально|не актуально|не пиши|не пишите|отстань|стоп|не надо писать|not interested|don't message|do not message|leave me alone|no thanks|علاقه.?ای ندارم|دیگه پیام نده)/i.test(text);
}

function normalizeRecipientGender(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "male" || normalized === "female" ? normalized : "unknown";
}

function detectExplicitRecipientGender(about) {
  const text = String(about || "").replace(/\s+/g, " ").trim();
  if (!text) return { gender: "unknown" };

  const patterns = [
    {
      gender: "female",
      regex: /(?:^|[^\p{L}])я\s+(?:сама|женщина|девушка|мама|дочь|сестра|жена|художница|актриса|писательница|программистка|разработчица|дизайнерка|иллюстраторка|предпринимательница|владелица|студентка)(?=$|[^\p{L}])/iu,
    },
    {
      gender: "male",
      regex: /(?:^|[^\p{L}])я\s+(?:сам|мужчина|парень|папа|сын|брат|муж|художник|актёр|актер|писатель|программист|разработчик|иллюстратор|предприниматель|владелец|студент)(?=$|[^\p{L}])/iu,
    },
    {
      gender: "female",
      regex: /(?:^|[^\p{L}])i\s+(?:am|'m)\s+(?:a\s+)?(?:woman|girl|mother|daughter|sister|wife)(?=$|[^\p{L}])/iu,
    },
    {
      gender: "male",
      regex: /(?:^|[^\p{L}])i\s+(?:am|'m)\s+(?:a\s+)?(?:man|boy|father|son|brother|husband)(?=$|[^\p{L}])/iu,
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) return { gender: pattern.gender, evidence: match[0].trim() };
  }
  return { gender: "unknown" };
}

async function getProfileSignals(client, entity, Api) {
  let full;
  try {
    full = await client.invoke(new Api.users.GetFullUser({ id: entity }));
  } catch {
    full = undefined;
  }
  const fullUser = full?.fullUser;
  const about = String(entity?.about || fullUser?.about || full?.about || "").trim();
  const personalChannelId = String(fullUser?.personalChannelId || "").trim();
  const channelEntity = personalChannelId
    ? (full?.chats || []).find((chat) => String(chat?.id || "") === personalChannelId)
    : undefined;
  let channelAbout = "";
  if (channelEntity) {
    try {
      const channelFull = await client.invoke(new Api.channels.GetFullChannel({ channel: channelEntity }));
      channelAbout = String(channelFull?.fullChat?.about || "").trim();
    } catch {
      // A public title/username is still useful when full channel details are unavailable.
    }
  }
  return {
    about,
    phone: String(entity?.phone || "").trim(),
    telegramLangCode: String(entity?.langCode || "").trim(),
    linkedChannel: channelEntity
      ? {
          id: personalChannelId,
          title: String(channelEntity?.title || "").trim(),
          username: String(channelEntity?.username || "").trim(),
          about: channelAbout,
        }
      : undefined,
  };
}

function profileLanguageContext(profileSignals, languageInference) {
  return {
    language: languageInference.language,
    languageSource: languageInference.source,
    languageConfidence: languageInference.confidence,
    languageEvidence: languageInference.evidence,
    languageSignals: languageInference.signals,
    ...(languageInference.phoneCountryCode ? { phoneCountryCode: languageInference.phoneCountryCode } : {}),
    profileSignals: {
      ...(profileSignals.telegramLangCode ? { telegramLangCode: profileSignals.telegramLangCode } : {}),
      ...(profileSignals.about ? { bioPresent: true } : {}),
      ...(profileSignals.phone ? { phonePresent: true } : {}),
      ...(profileSignals.linkedChannel ? { linkedChannel: profileSignals.linkedChannel } : {}),
    },
  };
}

function makeReplyDraft(language, incomingText, recipientGender = "unknown") {
  const context = incomingText.length > 180 ? `${incomingText.slice(0, 177)}...` : incomingText;
  if (language === "fa") {
    return `ممنون که پیام دادی! من از تیم توسعه Neron هستم. می‌خواستم درباره پیام قبلی و تجربه‌ات با @neronai_bot بدانم. الان از ابزارهای هوش مصنوعی استفاده می‌کنی؟`;
  }
  if (language === "ru") {
    if (recipientGender === "male") {
      return `Спасибо, что написал! Я из команды Neron. Хотела уточнить по твоему сообщению: ты раньше пользовался @neronai_bot? И пользуешься ли сейчас какими-нибудь ИИ-инструментами?`;
    }
    if (recipientGender === "female") {
      return `Спасибо, что написала! Я из команды Neron. Хотела уточнить по твоему сообщению: ты раньше пользовалась @neronai_bot? И пользуешься ли сейчас какими-нибудь ИИ-инструментами?`;
    }
    return `Спасибо за сообщение! Я из команды Neron. Хотела уточнить: вы уже знакомы с @neronai_bot? Какими ИИ-инструментами вы пользуетесь сейчас?`;
  }
  if (language === "es") {
    return `¡Gracias por responder! Soy del equipo de Neron. Quería уточнить sobre tu mensaje: ¿usaste antes @neronai_bot y utilizas ahora alguna herramienta de IA?`;
  }
  if (language === "zh") {
    return `谢谢你的回复！我来自 Neron 团队。想 уточнить 一下：你以前用过 @neronai_bot 吗？现在还在使用什么 AI 工具吗？`;
  }
  return `Thanks for replying! I’m with the Neron team. I wanted to clarify your message: have you used @neronai_bot before, and do you use any AI tools these days?`;
}

function mergeContext(profile, patch) {
  return { ...(profile?.context || {}), ...patch };
}

async function getUnreadHumanDialogs(client) {
  const dialogs = await client.getDialogs({ limit: MAX_DIALOGS });
  return dialogs.filter((dialog) => {
    const entity = dialog?.entity;
    return entity?.className === "User" && entity?.bot !== true && Number(dialog?.unreadCount || 0) > 0;
  });
}

async function getDialogHistory(client, dialog, profile) {
  const entity = dialog.entity;
  const previousMessages = profile ? listClientProfileMessages(profile.id, 10_000) : [];
  const previousIds = previousMessages
    .map((message) => Number(message.telegramMessageId || 0))
    .filter((id) => Number.isFinite(id) && id > 0);
  const previousHistorySync = profile?.context?.historySync;
  const hasCompleteHistory = previousHistorySync?.complete === true;
  const newestKnownId = hasCompleteHistory ? Math.max(0, ...previousIds) : 0;
  const messages = [];
  let offsetId;
  let complete = false;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      while (messages.length < MAX_HISTORY_MESSAGES_PER_DIALOG) {
        const page = await client.getMessages(entity, {
          limit: HISTORY_PAGE_SIZE,
          ...(offsetId ? { offsetId } : {}),
        });
        if (!page.length) {
          complete = true;
          break;
        }

        messages.push(...page);
        const oldestPageId = Number(page.at(-1)?.id || 0);
        if (hasCompleteHistory && newestKnownId > 0 && oldestPageId <= newestKnownId) {
          complete = true;
          break;
        }
        if (page.length < HISTORY_PAGE_SIZE || !oldestPageId) {
          complete = true;
          break;
        }
        offsetId = oldestPageId;
      }
      break;
    } catch (error) {
      const match = String(error?.message || error).match(/FLOOD_WAIT_(\d+)/i);
      if (!match || attempt === 2) throw error;
      await sleep((Number(match[1]) + 1) * 1000);
    }
  }

  const historyTruncated = !complete && messages.length >= MAX_HISTORY_MESSAGES_PER_DIALOG;
  const selectedMessages = hasCompleteHistory && newestKnownId > 0
    ? messages.filter((message) => Number(message.id || 0) > newestKnownId)
    : messages;

  return {
    messages: selectedMessages.sort((a, b) => Number(a.id || 0) - Number(b.id || 0)),
    fetchedCount: messages.length,
    complete: complete && !historyTruncated,
    historyTruncated,
    mode: hasCompleteHistory ? "incremental_after_full_sync" : "full_history",
  };
}

const client = await getGramjsClient();
const { Api } = await import("telegram");
const dialogs = await getUnreadHumanDialogs(client);
const existing = listClientProfiles({ limit: 200 });
const result = [];
const errors = [];

for (const dialog of dialogs) {
  const entity = dialog.entity;
  const telegramUserId = String(entity.id);
  const username = String(entity.username || "").trim() || undefined;
  let profile = existing.find((item) => item.telegramUserId === telegramUserId);
  if (!profile && username) {
    profile = existing.find((item) => String(item.username || "").toLowerCase() === username.toLowerCase());
  }

  let messages;
  let history;
  try {
    history = await getDialogHistory(client, dialog, profile);
    messages = history.messages;
  } catch (error) {
    errors.push({ telegramUserId, username, error: error instanceof Error ? error.message : String(error) });
    continue;
  }
  if (messages.length === 0) continue;

  const incomingMessages = messages.filter((message) => !message?.out);
  if (incomingMessages.length === 0) continue;

  const profileSignals = await getProfileSignals(client, entity, Api);
  const detectedRecipientGender = detectExplicitRecipientGender(profileSignals.about);
  const savedRecipientGender = normalizeRecipientGender(profile?.context?.recipientGender);
  const recipientGender = savedRecipientGender !== "unknown" ? savedRecipientGender : detectedRecipientGender.gender;
  const recipientGenderSource =
    savedRecipientGender !== "unknown"
      ? String(profile?.context?.recipientGenderSource || "manual_or_explicit_only")
      : detectedRecipientGender.gender !== "unknown"
        ? "telegram_profile_about"
        : "not_stated_in_profile_about";
  const recipientGenderEvidence =
    savedRecipientGender !== "unknown"
      ? String(profile?.context?.recipientGenderEvidence || "").trim() || undefined
      : detectedRecipientGender.evidence;

  const latest = incomingMessages[incomingMessages.length - 1];
  const latestText = String(latest?.message || "").trim() || "[медиа/сообщение без текста]";
  const languageInference = inferTelegramLanguage({
    telegramLangCode: profileSignals.telegramLangCode,
    bio: profileSignals.about,
    linkedChannel: profileSignals.linkedChannel,
    phone: profileSignals.phone,
    messageText: latestText,
  });
  const language = languageInference.language;
  const optOut = incomingMessages.some((message) => isOptOut(String(message?.message || "")));
  const preparedDraft = optOut ? undefined : makeReplyDraft(language, latestText, recipientGender);
  const now = new Date().toISOString();
  const unreadSummary = {
    runId: RUN_ID,
    syncedAt: now,
    unreadDialogCount: Number(dialog.unreadCount || messages.length),
    importedMessageCount: messages.length,
    fetchedMessageCount: history.fetchedCount,
    historyMode: history.mode,
    historyComplete: history.complete,
    historyTruncated: history.historyTruncated,
    latestTelegramMessageId: String(latest.id),
    ...profileLanguageContext(profileSignals, languageInference),
    recipientGender,
    recipientGenderSource,
    ...(recipientGenderEvidence ? { recipientGenderEvidence } : {}),
    replyStatus: optOut ? "do_not_reply" : "draft_prepared",
  };

  if (!profile) {
    profile = createClientProfile({
      telegramUserId,
      displayName: displayName(entity),
      username,
      source: "telegram-unread",
      context: {
        segment: "inbound_telegram",
        ...profileLanguageContext(profileSignals, languageInference),
        recipientGender,
        recipientGenderSource,
        ...(recipientGenderEvidence ? { recipientGenderEvidence } : {}),
        unreadSync: unreadSummary,
        historySync: {
          runId: RUN_ID,
          syncedAt: now,
          mode: history.mode,
          fetchedMessageCount: history.fetchedCount,
          complete: history.complete,
          truncated: history.historyTruncated,
        },
        drafts: preparedDraft ? { replyToUnread: preparedDraft, preparedAt: now } : { replyStatus: "do_not_reply" },
        outreach: { manualReviewRequired: true, automaticSending: false },
      },
      consentStatus: optOut ? "opted_out" : "unknown",
      dialogueSummary: optOut
        ? "Получено непрочитанное сообщение с отказом от дальнейшего общения; ответ не готовится."
        : "Получены непрочитанные входящие сообщения; черновик ответа подготовлен, отправка не выполнялась.",
      metadata: { discoveredBy: "telegram_unread_sync", runId: RUN_ID },
    });
    existing.push(profile);
  } else {
    const oldDrafts = profile.context?.drafts && typeof profile.context.drafts === "object" ? profile.context.drafts : {};
    const updated = updateClientProfile(profile.id, {
      displayName: displayName(entity),
      username: username ?? profile.username,
      consentStatus: optOut ? "opted_out" : profile.consentStatus,
      context: mergeContext(profile, {
        ...profileLanguageContext(profileSignals, languageInference),
        recipientGender,
        recipientGenderSource,
        ...(recipientGenderEvidence ? { recipientGenderEvidence } : {}),
        unreadSync: unreadSummary,
        historySync: {
          runId: RUN_ID,
          syncedAt: now,
          mode: history.mode,
          fetchedMessageCount: history.fetchedCount,
          complete: history.complete,
          truncated: history.historyTruncated,
        },
        drafts: {
          ...oldDrafts,
          ...(preparedDraft ? { replyToUnread: preparedDraft, preparedAt: now } : { replyStatus: "do_not_reply" }),
        },
        outreach: { manualReviewRequired: true, automaticSending: false },
      }),
      dialogueSummary: optOut
        ? "Получено непрочитанное сообщение с отказом от дальнейшего общения; ответ не готовится."
        : "Получены новые непрочитанные входящие сообщения; черновик ответа подготовлен, отправка не выполнялась.",
      metadata: { ...(profile.metadata || {}), lastUnreadSyncRunId: RUN_ID },
    });
    profile = updated || profile;
  }

  const stored = [];
  const oldMessages = listClientProfileMessages(profile.id, 10_000);
  const knownTelegramIds = new Set(oldMessages.map((message) => String(message.telegramMessageId || "")));
  for (const message of messages) {
    const telegramMessageId = String(message.id);
    if (knownTelegramIds.has(telegramMessageId)) continue;
    const text = String(message.message || "").trim() || "[Непрочитанное сообщение без текста/медиа]";
    const saved = addClientProfileMessage({
      profileId: profile.id,
      direction: message.out === true ? "outbound" : "inbound",
      text,
      sentAt: dateOf(message),
      telegramMessageId,
      metadata: {
        source: "telegram_history_sync",
        runId: RUN_ID,
        historyMode: history.mode,
      },
    });
    stored.push({ telegramMessageId, sentAt: saved.sentAt });
    knownTelegramIds.add(telegramMessageId);
  }

  result.push({
    profileId: profile.id,
    telegramUserId,
    username: username ? `@${username}` : undefined,
    displayName: displayName(entity),
    unreadCount: Number(dialog.unreadCount || messages.length),
    importedCount: stored.length,
    fetchedMessageCount: history.fetchedCount,
    historyMode: history.mode,
    historyComplete: history.complete,
    historyTruncated: history.historyTruncated,
    language,
    recipientGender,
    recipientGenderSource,
    ...(recipientGenderEvidence ? { recipientGenderEvidence } : {}),
    replyStatus: optOut ? "do_not_reply" : "draft_prepared",
    replyDraft: preparedDraft,
  });
  await sleep(500);
}

console.log(JSON.stringify({
  ok: true,
  runId: RUN_ID,
  humanUnreadDialogs: dialogs.length,
  processedContacts: result.length,
  importedMessages: result.reduce((sum, item) => sum + item.importedCount, 0),
  skippedBotsAndChannels: "Bots and channels were intentionally excluded",
  sentMessages: 0,
  errors,
  contacts: result,
}, null, 2));

await client.disconnect().catch(() => null);
