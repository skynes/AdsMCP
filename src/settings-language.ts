export type SettingsLanguage = "en" | "ru";
export const SETTINGS_LANGUAGE_COOKIE = "ads_mcp_language";

function supportedLanguage(value: string | undefined | null): SettingsLanguage | undefined {
  const primary = value?.trim().toLowerCase().split(/[-_]/)[0];
  return primary === "en" || primary === "ru" ? primary : undefined;
}

export function resolveSettingsLanguage(input: {
  query?: string | null;
  cookie?: string;
  acceptLanguage?: string;
}): { language: SettingsLanguage; selection: SettingsLanguage | "auto" } {
  if (input.query === "en" || input.query === "ru") {
    return { language: input.query, selection: input.query };
  }
  if (input.query !== "auto") {
    const saved = input.cookie?.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(`${SETTINGS_LANGUAGE_COOKIE}=`))?.split("=")[1];
    if (saved === "en" || saved === "ru") return { language: saved, selection: saved };
  }
  // Accept-Language carries the user agent's language preferences; User-Agent
  // itself normally contains browser/OS versions, not the user's language.
  const preferences = (input.acceptLanguage || "").split(",").map((part, index) => {
    const [tag, ...parameters] = part.trim().split(";");
    const weight = parameters.map((parameter) => parameter.trim()).find((parameter) => /^q=/i.test(parameter));
    const quality = weight === undefined ? 1 : Number(weight.slice(2));
    return { language: tag === "*" ? "en" as const : supportedLanguage(tag), quality, index };
  }).filter((item) => item.language && Number.isFinite(item.quality) && item.quality > 0 && item.quality <= 1)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  return { language: preferences[0]?.language || "en", selection: "auto" };
}
