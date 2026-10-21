export type TelegramLanguageSignal = {
  language: string;
  source: string;
  confidence: number;
  evidence?: string;
};

export type TelegramLanguageInference = {
  language: string;
  source: string;
  confidence: number;
  evidence: string[];
  signals: TelegramLanguageSignal[];
  phoneCountryCode?: string;
};

type LinkedChannelLanguageInput = {
  title?: string;
  username?: string;
  about?: string;
};

type TelegramLanguageInput = {
  telegramLangCode?: string;
  bio?: string;
  linkedChannel?: LinkedChannelLanguageInput;
  phone?: string;
  messageText?: string;
};

const LANGUAGE_CODES = new Set([
  "ar", "az", "bn", "de", "el", "en", "es", "fa", "fr", "he", "hi", "hy", "id", "it", "ja", "ka", "kk",
  "ko", "ky", "pl", "pt", "ro", "ru", "tg", "th", "tk", "tr", "uk", "ur", "uz", "vi", "zh",
]);

const PHONE_LANGUAGE_PREFIXES: Array<[string, string]> = [
  ["+998", "uz"], ["+995", "ka"], ["+994", "az"], ["+992", "tg"], ["+993", "tk"], ["+996", "ky"],
  ["+374", "hy"], ["+972", "he"], ["+971", "ar"], ["+974", "ar"], ["+973", "ar"], ["+965", "ar"],
  ["+968", "ar"], ["+962", "ar"], ["+964", "ar"], ["+963", "ar"], ["+970", "ar"], ["+961", "ar"],
  ["+966", "ar"], ["+967", "ar"], ["+249", "ar"], ["+218", "ar"], ["+216", "ar"], ["+213", "ar"],
  ["+212", "ar"], ["+20", "ar"], ["+98", "fa"], ["+93", "fa"], ["+86", "zh"], ["+81", "ja"],
  ["+82", "ko"], ["+880", "bn"], ["+91", "hi"], ["+92", "ur"], ["+95", "my"], ["+84", "vi"],
  ["+90", "tr"], ["+49", "de"], ["+33", "fr"], ["+39", "it"], ["+34", "es"], ["+48", "pl"],
  ["+7", "ru"], ["+44", "en"], ["+1", "en"],
];

function clean(value?: string | null): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function normalizeTelegramLanguage(value?: string | null): string | undefined {
  const normalized = clean(value).toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_CODES.has(normalized) ? normalized : undefined;
}

export function phoneCountryCode(phone?: string | null): string | undefined {
  const digits = clean(phone).replace(/\D/g, "");
  if (!digits) return undefined;
  const normalized = `+${digits}`;
  return PHONE_LANGUAGE_PREFIXES.find(([prefix]) => normalized.startsWith(prefix))?.[0];
}

export function languageFromPhone(phone?: string | null): { language?: string; countryCode?: string } {
  const countryCode = phoneCountryCode(phone);
  if (!countryCode) return {};
  const language = PHONE_LANGUAGE_PREFIXES.find(([prefix]) => prefix === countryCode)?.[1];
  return { language, countryCode };
}

function languageFromText(text: string): string | undefined {
  const value = clean(text);
  if (!value) return undefined;

  // These characters are strong Persian markers and distinguish common Persian text
  // from Arabic text written in the same Unicode block.
  if (/[پچژگک]/u.test(value)) return "fa";
  if (/[\u0600-\u06ff]/u.test(value)) return "ar";
  if (/[\u0400-\u04ff]/u.test(value)) return "ru";
  if (/[\u4e00-\u9fff]/u.test(value)) return "zh";
  if (/[\u3040-\u30ff]/u.test(value)) return "ja";
  if (/[\uac00-\ud7af]/u.test(value)) return "ko";

  const lower = value.toLowerCase();
  if (/\b(the|and|you|your|with|from|speak|little|maintain|standing|hello|thanks)\b/.test(lower)) return "en";
  if (/\b(el|la|los|las|que|para|con|hola|gracias)\b/.test(lower)) return "es";
  if (/\b(le|la|les|des|pour|avec|bonjour|merci)\b/.test(lower)) return "fr";
  if (/\b(der|die|das|und|mit|für|hallo|danke)\b/.test(lower)) return "de";
  if (/[а-яё]/iu.test(value)) return "ru";
  return undefined;
}

function addTextSignal(signals: TelegramLanguageSignal[], source: string, text?: string, confidence = 0.86): void {
  const evidence = clean(text);
  const language = languageFromText(evidence);
  if (!language) return;
  signals.push({ language, source, confidence, ...(evidence ? { evidence: evidence.slice(0, 240) } : {}) });
}

export function inferTelegramLanguage(input: TelegramLanguageInput): TelegramLanguageInference {
  const signals: TelegramLanguageSignal[] = [];
  const explicit = normalizeTelegramLanguage(input.telegramLangCode);
  if (explicit) signals.push({ language: explicit, source: "telegram_profile_lang_code", confidence: 0.3, evidence: clean(input.telegramLangCode) });

  addTextSignal(signals, "telegram_profile_bio", input.bio, 0.5);
  const channelText = [input.linkedChannel?.title, input.linkedChannel?.username, input.linkedChannel?.about]
    .map(clean)
    .filter(Boolean)
    .join(" | ");
  addTextSignal(signals, "linked_personal_channel", channelText, 1.0);

  const phone = languageFromPhone(input.phone);
  if (phone.language) {
    signals.push({
      language: phone.language,
      source: "phone_country_code",
      confidence: 0.5,
      evidence: phone.countryCode,
    });
  }
  addTextSignal(signals, "latest_message_heuristic", input.messageText, 0.35);

  const sourcePriority: Record<string, number> = {
    linked_personal_channel: 4,
    phone_country_code: 3,
    telegram_profile_bio: 2,
    latest_message_heuristic: 1,
    telegram_profile_lang_code: 0,
  };
  const ranked = new Map<string, { score: number; priority: number; best: TelegramLanguageSignal }>();
  for (const signal of signals) {
    const current = ranked.get(signal.language);
    const priority = sourcePriority[signal.source] ?? 0;
    if (!current || signal.confidence > current.score || (signal.confidence === current.score && priority > current.priority)) {
      ranked.set(signal.language, { score: signal.confidence, priority, best: signal });
    }
  }
  const winner = [...ranked.values()].sort((a, b) => b.score - a.score || b.priority - a.priority)[0];
  if (!winner) {
    return {
      language: "en",
      source: "default_fallback",
      confidence: 0.1,
      evidence: [],
      signals: [],
      ...(phone.countryCode ? { phoneCountryCode: phone.countryCode } : {}),
    };
  }
  return {
    language: winner.best.language,
    source: winner.best.source,
    confidence: winner.score,
    evidence: signals.filter((signal) => signal.language === winner.best.language).map((signal) => signal.evidence).filter(Boolean) as string[],
    signals,
    ...(phone.countryCode ? { phoneCountryCode: phone.countryCode } : {}),
  };
}
