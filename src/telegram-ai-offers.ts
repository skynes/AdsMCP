export type NeronOfferKey =
  | "text_assistant"
  | "image_generation_editing"
  | "image_to_video"
  | "video_generation"
  | "voice_generation"
  | "source_research"
  | "multi_model_workspace";

export type NeronOfferMatch = {
  key: NeronOfferKey;
  label: string;
  score: number;
  reason: string;
  reviewOnly?: boolean;
};

type NeronOffer = Omit<NeronOfferMatch, "score" | "reason" | "reviewOnly"> & {
  triggers: RegExp[];
  baseScore: number;
  reason: string;
};

/**
 * Claims that are safe to use in a public reply. Product limits and model
 * availability are intentionally not hard-coded here: they can change and
 * must be checked at the time of publication.
 */
export const NERON_OFFER_CATALOG: readonly NeronOffer[] = [
  {
    key: "image_to_video",
    label: "оживление изображения и image-to-video",
    triggers: [/ожив|анимир|image\s*[- ]?to\s*video|видео\s+из\s+(?:фото|картин)|видео.{0,60}(?:из|на\s+основе).{0,40}(?:фото|картин)|(?:фото|картин).{0,50}видео/i],
    baseScore: 90,
    reason: "Запрос связан с оживлением изображения или image-to-video.",
  },
  {
    key: "video_generation",
    label: "генерация и подготовка видео",
    triggers: [/генерир\w*\s+видео|созда\w*\s+видео|ролик|видеогенерац|video/i],
    baseScore: 82,
    reason: "Запрос связан с созданием видео или ролика.",
  },
  {
    key: "voice_generation",
    label: "генерация и озвучка голоса",
    triggers: [/голос|озвуч|аудио|speech|voice|подкаст/i],
    baseScore: 80,
    reason: "Запрос связан с голосом, озвучкой или аудио.",
  },
  {
    key: "image_generation_editing",
    label: "создание и обработка изображений",
    triggers: [/картин|изображен|фото|фон|вырез|figma|дизайн|референс|баннер|арт/i],
    baseScore: 78,
    reason: "Запрос связан с изображениями, фото или дизайн-задачей.",
  },
  {
    key: "source_research",
    label: "поиск справочной информации и референсов",
    triggers: [/найти\s+(?:информац|источник|референс|исходник)|поиск|справоч|research|источник|референс/i],
    baseScore: 70,
    reason: "В запросе есть потребность в поиске информации, источников или референсов.",
  },
  {
    key: "text_assistant",
    label: "текстовый AI-помощник",
    triggers: [/текст|написа|переписа|промпт|код|сайт|файл|объясн|chatgpt|claude|llm/i],
    baseScore: 62,
    reason: "Запрос можно связать с текстовой, кодовой или объяснительной задачей.",
  },
  {
    key: "multi_model_workspace",
    label: "несколько AI-моделей в одном рабочем месте",
    triggers: [/единый\s+(?:интерфейс|хаб|инструмент)|один\s+интерфейс|все\s+(?:модели|инструменты).{0,60}(?:вместе|под\s+капотом)|под\s+капотом|нейросет|нейрон|ии|\bai\b|модел|сервис|инструмент|бесплат|лимит|подписк|vpn|оплат/i],
    baseScore: 55,
    reason: "Пользователь ищет AI-инструмент, модель, доступ или альтернативу сервису.",
  },
];

function clean(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function matchNeronOffers(input: {
  text: string;
  classification?: string;
  topic?: string;
  intent?: string;
}): NeronOfferMatch[] {
  const value = clean(input.text);
  const unifiedWorkspaceNeed = /единый\s+(?:интерфейс|хаб|инструмент)|один\s+интерфейс|все\s+(?:модели|инструменты).{0,60}(?:вместе|под\s+капотом)|под\s+капотом/i.test(value);
  const matches: NeronOfferMatch[] = [];
  for (const offer of NERON_OFFER_CATALOG) {
    const triggerHits = offer.triggers.filter((trigger) => trigger.test(value)).length;
    if (!triggerHits) continue;
    const topicBoost = input.topic && (
      (input.topic === "image_to_video" && offer.key === "image_to_video")
      || (input.topic === "video_generation" && offer.key === "video_generation")
      || (input.topic === "voice_generation" && offer.key === "voice_generation")
      || ((input.topic === "image_editing" || input.topic === "background_removal" || input.topic === "design") && offer.key === "image_generation_editing")
      || (input.topic === "ai_tool_discovery" && offer.key === "multi_model_workspace")
    ) ? 15 : 0;
    const intentBoost = input.intent === "how_to" || input.intent === "troubleshooting" ? 5 : 0;
    const workspaceBoost = unifiedWorkspaceNeed && offer.key === "multi_model_workspace" ? 40 : 0;
    matches.push({
      key: offer.key,
      label: offer.label,
      score: Math.min(100, offer.baseScore + topicBoost + intentBoost + workspaceBoost + Math.min(10, (triggerHits - 1) * 3)),
      reason: offer.reason,
      ...(input.intent === "hiring_request" || input.classification === "opportunity" ? { reviewOnly: true } : {}),
    });
  }
  return matches
    .sort((left, right) => right.score - left.score)
    .filter((match, index, all) => index === all.findIndex((item) => item.key === match.key))
    .slice(0, 3);
}

function primaryMatch(matches: NeronOfferMatch[]): NeronOfferMatch | undefined {
  return matches.find((match) => !match.reviewOnly) || matches[0];
}

export function buildNeronPublicReply(input: {
  title: string;
  description: string;
  classification: string;
  topic?: string;
  intent?: string;
}): { draft?: string; matches: NeronOfferMatch[] } {
  const value = `${clean(input.title)} ${clean(input.description)}`;
  const matches = matchNeronOffers({
    text: value,
    classification: input.classification,
    topic: input.topic,
    intent: input.intent,
  });
  if (input.classification !== "request" && input.classification !== "opportunity") {
    return { matches };
  }
  const primary = primaryMatch(matches);
  if (!primary) return { matches };

  let answer: string;
  switch (primary.key) {
    case "image_to_video":
      answer = `Для оживления фото или создания видео из изображения можно попробовать Neron.one: там есть сценарии image-to-video. ${/бесплат|без\s+лимит/i.test(value) ? "Можно проверить доступные бесплатные модели и лимиты." : "Лучше проверить задачу на своём примере и сравнить актуальные лимиты и качество."}`;
      break;
    case "video_generation":
      answer = `Для генерации видео можно посмотреть Neron.one — там доступны AI-модели для видеосценариев. ${/бесплат|без\s+лимит/i.test(value) ? "Доступные бесплатные модели и лимиты лучше проверить перед запуском." : "Я бы сначала проверила один короткий пример на нужном стиле и качестве."}`;
      break;
    case "voice_generation":
      answer = "Для озвучки и работы с голосом можно попробовать Neron.one: там есть сценарии генерации голоса. Перед выбором лучше проверить нужный язык, тембр и актуальные ограничения.";
      break;
    case "image_generation_editing":
      answer = `Для создания и обработки изображений можно попробовать Neron.one — в том числе сценарии с фото, фоном и подготовкой визуалов. ${/бесплат|без\s+лимит/i.test(value) ? "Можно начать с проверки доступных бесплатных моделей и лимитов." : "Для дизайна лучше сразу проверить результат на своём макете."}`;
      break;
    case "source_research":
      answer = "Если нужна не только генерация, но и поиск информации или референсов, можно попробовать Neron.one и проверить, подходит ли его исследовательский сценарий под вашу задачу.";
      break;
    case "text_assistant":
      answer = "Для текста, объяснений, промптов или кода можно попробовать Neron.one как AI-помощника и сравнить ответ на своём примере.";
      break;
    case "multi_model_workspace":
    default:
      answer = /единый\s+(?:интерфейс|хаб)|один\s+интерфейс|под\s+капотом|все\s+(?:модели|инструменты)/i.test(value)
        ? "Если нужен один интерфейс для разных AI-моделей и сценариев, можно посмотреть Neron.one — там удобно проверить несколько вариантов в одном рабочем месте. Важно сравнивать именно актуальную доступность моделей и лимиты."
        : "Если ищете альтернативу привычным AI-сервисам, можно посмотреть Neron.one: там собраны разные AI-сценарии и модели. Доступные лимиты и условия лучше проверить на момент использования.";
      break;
  }

  if (primary.reviewOnly) {
    return {
      matches,
      draft: `${answer} Если вы ищете именно специалиста, это не заменяет художника или исполнителя — скорее вариант для быстрых черновиков и проверки идеи.`,
    };
  }
  return { draft: answer, matches };
}

export function normalizeOfferKeys(matches: NeronOfferMatch[]): NeronOfferKey[] {
  return unique(matches.map((match) => match.key));
}
