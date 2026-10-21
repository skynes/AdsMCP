import { upsertTelegramAiChat } from "../dist/telegram-ai-chats.js";
import { upsertTelegramResource } from "../dist/telegram-resources.js";

// Discovery-only import. It records public resource metadata and provenance;
// it does not join chats, read member lists, collect commenters, or send messages.
const projectId = "neron";
const checkedAt = new Date().toISOString();

const githubSource = "https://github.com/maximus000/ai-telegram";
const timewebSource = "https://timeweb.com/ru/community/articles/top-10-telegram-kanalov-po-neyrosetyam";
const portalSource = "https://portal-tg.online/category/neyroseti-i-ai";
const publicTgSource = "https://public.tg/catalog/ai_creative";
const tgpinSource = "https://tgpin.com/ru/catalog/neural/";
const telegroomSource = "https://telegroom.ru/category-resource/nejroseti/";

const resources = [
  // Public previews inspected during this research pass.
  { id: "GPTMainNews", type: "channel", title: "GPT | ChatGPT | Midjourney — GPTMain News", topics: ["ai", "chatgpt", "midjourney", "news"], source: timewebSource, score: 92, scanned: true, note: "Публичное превью просмотрено: новости моделей и практические разборы." },
  { id: "hiaimedia", type: "channel", title: "Hi, AI • Новости технологий", topics: ["ai", "technology", "business"], source: timewebSource, score: 90, scanned: true, note: "Публичное превью просмотрено: новости и аналитика ИИ." },
  { id: "gptpublic", type: "channel", title: "ChatGPT | Нейросети", topics: ["ai", "chatgpt", "prompts"], source: timewebSource, score: 88, scanned: true, note: "Публичное превью просмотрено; в описании указаны открытые чаты канала." },
  { id: "neuraldvig", type: "channel", title: "Нейродвиж", topics: ["ai", "technology", "it"], source: timewebSource, score: 86, scanned: true, note: "Публичное превью просмотрено: новости ИИ и IT." },
  { id: "chatgpt_try", type: "channel", title: "TryChatGPT.ru GPT | ChatGPT | IT | Нейросети", topics: ["ai", "chatgpt", "it", "howto"], source: timewebSource, score: 84, scanned: true, note: "Публичное превью просмотрено: сценарии использования и обучение." },
  { id: "ai_newz", type: "channel", title: "эйай ньюз", topics: ["ai", "research", "news"], source: timewebSource, score: 83, scanned: true, note: "Публичное превью просмотрено: новости AI и исследования." },
  { id: "StableDiffusionBest", type: "channel", title: "Stable Diffusion News | Нейросети", topics: ["ai", "images", "stable-diffusion"], source: timewebSource, score: 82, scanned: true, note: "Публичное превью просмотрено: изображения и генерация." },
  { id: "neural_houses", type: "channel", title: "Нейросетевые покои: нейросети, ChatGPT, Midjourney", topics: ["ai", "chatgpt", "midjourney", "video", "agents"], source: "https://t.me/s/neural_houses", score: 92, scanned: true, note: "Публичное превью просмотрено: инструменты, видео, агенты, промпты; реакции видны, комментарии отдельно не извлекались." },
  { id: "neironka", type: "channel", title: "Нейросети для разработчиков", topics: ["ai", "development", "llm", "cursor", "qwen"], source: "https://t.me/s/neironka", score: 91, scanned: true, note: "Публичное превью просмотрено: Qwen, Cursor, локальные модели и практические промпты." },
  { id: "paragonzone", type: "channel", title: "Paragon | Нейросети и ИИ", topics: ["ai", "free-tools", "video", "design", "agents"], source: "https://t.me/s/paragonzone", score: 90, scanned: true, note: "Публичное превью просмотрено: бесплатные инструменты, практические тесты, отдельный чат указан в описании." },
  { id: "sky_net_ai", type: "channel", title: "SKYNET AI – НЕЙРОСЕТИ", topics: ["ai", "technology", "tools"], source: "https://t.me/sky_net_ai", score: 78, scanned: true, note: "Публичное описание просмотрено; указан отдельный чат @skynet_chat_ai." },
  { id: "turbotext_ai", type: "channel", title: "TurboText AI. Нейросети", topics: ["ai", "prompts", "chatgpt", "deepseek", "video"], source: "https://t.me/turbotext_ai", score: 80, scanned: true, note: "Публичное описание просмотрено; указан отдельный чат @turbotext_chat." },
  { id: "prompts_image", type: "channel", title: "Рисунки нейросети, идеи, промпты Midjourney, Шедеврум", topics: ["ai", "images", "midjourney", "prompts"], source: "https://t.me/prompts_image", score: 79, scanned: true, note: "Публичное описание просмотрено; указан открытый чат канала." },
  { id: "ai_community_news", type: "channel", title: "AI Community", topics: ["ai", "business", "automation", "agents", "startups"], source: "https://t.me/s/ai_community_news", score: 87, scanned: true, note: "Публичное превью просмотрено: анонсы воркшопов и практические кейсы; чат @ai_community_chat указан в описании." },

  // Additional public channel candidates from the two public catalogues.
  { id: "chatgptv", type: "channel", title: "Цифровой Журнал | IT, Нейросети", topics: ["ai", "it", "news"], source: githubSource, score: 75 },
  { id: "deeptechnet", type: "channel", title: "Нейросети & Технологии | DeepTech", topics: ["ai", "technology", "business"], source: portalSource, score: 82 },
  { id: "aiaiai", type: "channel", title: "Технологии | Нейросети | Боты", topics: ["ai", "bots", "technology"], source: githubSource, score: 72 },
  { id: "fabula_community", type: "channel", title: "COMMUNITY [Ru] • Нейросеть Fabula AI", topics: ["ai", "images", "community"], source: githubSource, score: 74 },
  { id: "ipumpbrain", type: "channel", title: "Прокачай Мозг: Айти, Тренды, Технологии", topics: ["ai", "it", "technology"], source: githubSource, score: 70 },
  { id: "neyroset_vidit", type: "channel", title: "Нейросеть видит", topics: ["ai", "images", "vision"], source: githubSource, score: 70 },
  { id: "gpt_chat_chatgpt", type: "channel", title: "Айтишная", topics: ["ai", "chatgpt", "it"], source: githubSource, score: 70 },
  { id: "midjourney_home", type: "channel", title: "Midjourney Креативы", topics: ["ai", "midjourney", "images"], source: githubSource, score: 76 },
  { id: "sip_ai", type: "channel", title: "Хлебни ИИ", topics: ["ai", "tools", "prompts"], source: githubSource, score: 72 },
  { id: "volosyankov_nik", type: "channel", title: "Николай Волосянков про нейросети", topics: ["ai", "tools", "education"], source: githubSource, score: 72 },
  { id: "obzor_neirosetei", type: "channel", title: "Обзор Нейросетей", topics: ["ai", "tools", "reviews"], source: githubSource, score: 78 },
  { id: "kyberhub", type: "channel", title: "КиберХаб - IT и Нейросети", topics: ["ai", "it", "development"], source: githubSource, score: 76 },
  { id: "gptnewsplus", type: "channel", title: "GPTnews+ Новости ИИ", topics: ["ai", "news"], source: githubSource, score: 70 },
  { id: "chat_ai_bot_news", type: "channel", title: "Chat AI Новости - GPT, Midjourney, Claude, Gemini", topics: ["ai", "chatgpt", "midjourney", "claude", "gemini"], source: githubSource, score: 80 },
  { id: "likeisstrong", type: "channel", title: "Нейросети для предпринимателя", topics: ["ai", "business", "entrepreneurship"], source: githubSource, score: 78 },
  { id: "gpttg", type: "channel", title: "GPTTG | Новости | ChatGPT", topics: ["ai", "chatgpt", "news"], source: githubSource, score: 74 },
  { id: "pro_ai_novosti", type: "channel", title: "Мир нейросетей - новости, обучение и заработок", topics: ["ai", "education", "tools"], source: githubSource, score: 74 },
  { id: "mgerkom", type: "channel", title: "Абьюзер ChatGPT | Python, C++, Freelance", topics: ["ai", "development", "freelance"], source: githubSource, score: 77 },
  { id: "chatgpt_neiro_news", type: "channel", title: "ChatGPT | Нейро News", topics: ["ai", "chatgpt", "news"], source: githubSource, score: 74 },
  { id: "pro_neiroset", type: "channel", title: "PRO | Нейросети", topics: ["ai", "tools", "education"], source: githubSource, score: 73 },
  { id: "gpt4turbo", type: "channel", title: "ЧАТ GPT | IT | НЕЙРОСЕТИ", topics: ["ai", "chatgpt", "it"], source: githubSource, score: 73 },
  { id: "digital_midjourney", type: "channel", title: "Midjourney | Диджитал", topics: ["ai", "midjourney", "images"], source: githubSource, score: 76 },
  { id: "gerwinai_ru", type: "channel", title: "Gerwin AI – лаборатория искусственного интеллекта", topics: ["ai", "tools", "content"], source: githubSource, score: 77 },
  { id: "ai2smm", type: "channel", title: "Промт дня", topics: ["ai", "prompts", "marketing", "midjourney"], source: "https://t.me/s/ai2smm", score: 78, scanned: true, note: "Публичное превью просмотрено: промпты и прикладные сценарии." },

  // Publicly discoverable group chats mentioned by channel descriptions/catalogues.
  { id: "ai_community_chat", type: "chat", title: "Бизнес-чат AI Community", topics: ["ai", "business", "startups"], source: "https://t.me/ai_community_chat", score: 88, scanned: true, note: "Публичное описание просмотрено; релевантный бизнес-чат, правила публикации отдельно проверить." },
  { id: "ai_community_dev", type: "chat", title: "AI Community — вайб-кодинг и ИИ-агенты", topics: ["ai", "development", "agents", "cursor", "n8n"], source: "https://t.me/ai_community_dev", score: 90, scanned: true, note: "Публичное описание просмотрено; технический чат с открытым описанием тем." },
  { id: "chatparagonzone", type: "chat", title: "Чат Paragon", topics: ["ai", "tools", "video", "design"], source: "https://t.me/chatparagonzone", score: 83, note: "Чат указан в публичном описании @paragonzone; история и правила ещё не проверены." },
  { id: "skynet_chat_ai", type: "chat", title: "SKYNET AI — чат", topics: ["ai", "tools", "technology"], source: "https://t.me/skynet_chat_ai", score: 76, note: "Чат указан в публичном описании @sky_net_ai; история и правила ещё не проверены." },
  { id: "tabart_ai_chat", type: "chat", title: "Обратная связь (Нейросеть АРТ)", topics: ["ai", "images", "feedback"], source: "https://t.me/tabart_ai_chat", score: 72, scanned: true, note: "Публичное описание просмотрено: вопросы, ошибки и идеи по нейросети." },
  { id: "turbotext_chat", type: "chat", title: "TurboText — чат", topics: ["ai", "tools", "prompts"], source: "https://t.me/turbotext_chat", score: 76, note: "Чат указан в публичном описании @turbotext_ai; история и правила ещё не проверены." },
  { id: "invite:l8u3RAckq-84YzM6", type: "chat", title: "Флудилка ChatGPT | Нейросети", topics: ["ai", "chatgpt", "community"], source: "https://t.me/gptpublic", publicUrl: "https://t.me/+l8u3RAckq-84YzM6", score: 75, note: "Открытая invite-ссылка найдена в публичном описании канала; доступ и правила не проверены." },
  { id: "invite:2zaH7iO_K745Zjgy", type: "chat", title: "ChatGPT — чат с ветками", topics: ["ai", "chatgpt", "community"], source: "https://t.me/gptpublic", publicUrl: "https://t.me/+2zaH7iO_K745Zjgy", score: 75, note: "Открытая invite-ссылка найдена в публичном описании канала; доступ и правила не проверены." },
  { id: "invite:XnQjf7JUz0wyMTgy", type: "chat", title: "Чат канала Prompts Image", topics: ["ai", "images", "midjourney", "prompts"], source: "https://t.me/prompts_image", publicUrl: "https://t.me/+XnQjf7JUz0wyMTgy", score: 77, note: "Открытая invite-ссылка найдена в публичном описании канала; доступ и правила не проверены." },

  // Second-pass sources. Low-activity catalogue entries remain candidates only
  // and are intentionally scored below the public-preview channels above.
  { id: "sashakomovich", type: "channel", title: "Саша Комович НЕЙРОСЕТИ", topics: ["ai", "video", "reels", "images"], source: "https://t.me/s/sashakomovich", score: 86, scanned: true, note: "Публичное превью просмотрено: AI-видео, нейрофото и практические кейсы." },
  { id: "setka_project", type: "channel", title: "SeTka Project", topics: ["ai", "video", "chatgpt", "gemini", "capcut"], source: "https://t.me/s/setka_project", score: 82, scanned: true, note: "Публичное превью просмотрено: обзоры Gemini, AI-видео, CapCut и прикладные тесты." },
  { id: "ai_and_i_news", type: "channel", title: "Ai&I — Нейросети, Технологии, Стартапы", topics: ["ai", "technology", "startups"], source: telegroomSource, score: 73 },
  { id: "genvoice_ru", type: "channel", title: "GenVoice — технологии работы с голосом", topics: ["ai", "voice", "audio"], source: tgpinSource, score: 68 },
  { id: "ridbowt_ai_art", type: "channel", title: "Ridbowt AI Art", topics: ["ai", "images", "art"], source: tgpinSource, score: 64 },
  { id: "agentic_marketing", type: "channel", title: "Agentic Marketing — AI-агенты в перформансе", topics: ["ai", "agents", "marketing", "automation"], source: publicTgSource, score: 55, note: "Каталог public.tg: узкая тема AI-агентов в performance-маркетинге; активность выглядит низкой, нужна ручная проверка." },
  { id: "image_gen_creo", type: "channel", title: "Image Gen Creo — Midjourney / Flux / Sora", topics: ["ai", "images", "midjourney", "flux", "sora", "comfyui"], source: publicTgSource, score: 55, note: "Каталог public.tg: AI-генерация рекламных креативов; активность выглядит низкой, нужна ручная проверка." },
  { id: "agentic_marketing_lab", type: "channel", title: "Agentic Marketing Lab", topics: ["ai", "agents", "marketing", "sales", "support"], source: publicTgSource, score: 53, note: "Каталог public.tg: AI-агенты в маркетинге, продажах и поддержке; активность выглядит низкой." },
  { id: "creo_stack_aff", type: "channel", title: "Creo Stack — voice / video / prelander tools", topics: ["ai", "voice", "video", "marketing"], source: publicTgSource, score: 53, note: "Каталог public.tg: стек AI voice/video и prelander tools; активность выглядит низкой." },
  { id: "ai_search_desk", type: "channel", title: "AI Search Desk — LLM-SEO и GEO", topics: ["ai", "search", "seo", "llm"], source: publicTgSource, score: 58, note: "Каталог public.tg: LLM-SEO, GEO и AI Overviews; активность выглядит низкой." },
  { id: "ai_creative_desk", type: "channel", title: "AI Creative Desk — креативы через ИИ", topics: ["ai", "images", "video", "advertising"], source: publicTgSource, score: 53, note: "Каталог public.tg: Midjourney, Sora, Veo и бесплатные стоки; активность выглядит низкой." },
  { id: "open_source_llm_aff", type: "channel", title: "Open Source LLM — Llama / Qwen / DeepSeek", topics: ["ai", "open-source", "llama", "qwen", "deepseek"], source: publicTgSource, score: 62, note: "Каталог public.tg: open-source LLM и локальный inference; активность выглядит низкой." },
  { id: "ai_gen_mkt_desk", type: "channel", title: "AI Gen for Marketing", topics: ["ai", "marketing", "images", "video", "prompts"], source: publicTgSource, score: 54, note: "Каталог public.tg: Midjourney, DALL-E, Sora, Veo и workflow для брендов; активность выглядит низкой." },
  { id: "ai_for_affiliates", type: "channel", title: "AI for Affiliates", topics: ["ai", "marketing", "automation", "prompts"], source: publicTgSource, score: 48, note: "Каталог public.tg: AI-инструменты и автоматизация для арбитража; низкий приоритет из-за рекламной направленности." },
  { id: "ugc_signal", type: "channel", title: "Креативный цех", topics: ["ai", "ugc", "cro", "marketing"], source: publicTgSource, score: 46, note: "Каталог public.tg: креативы, лендинги, UGC и CRO; низкий приоритет, нужна ручная проверка." },
  { id: "producthunt_daily_aff", type: "channel", title: "ProductHunt Daily — для маркетинга", topics: ["ai", "product", "marketing", "developer-tools"], source: publicTgSource, score: 50, note: "Каталог public.tg: запуски Product Hunt и бесплатные кредиты; низкий приоритет, активность выглядит низкой." },
  { id: "ai_video_creatives", type: "channel", title: "AI Video Creatives: HeyGen, Kling, Sora", topics: ["ai", "video", "heygen", "kling", "sora", "runway"], source: publicTgSource, score: 54, note: "Каталог public.tg: видеокреативы и пресеты; активность выглядит низкой." },
  { id: "ai_chatbot_aff", type: "channel", title: "AI Chatbot Aff — саппорт через LLM", topics: ["ai", "chatbots", "llm", "support", "voiceflow"], source: publicTgSource, score: 52, note: "Каталог public.tg: LLM-саппорт и chatbot flows; активность выглядит низкой." },
  { id: "capcut_shortform_edit", type: "channel", title: "CapCut & Shortform Edit", topics: ["video", "capcut", "shorts", "reels", "ai"], source: publicTgSource, score: 50, note: "Каталог public.tg: CapCut, авто-субтитры и shortform; активность выглядит низкой." },
  { id: "ai_creative_spy", type: "channel", title: "AI Creative Detect", topics: ["ai", "creative", "advertising", "research"], source: publicTgSource, score: 45, note: "Каталог public.tg: обратная разработка AI-креативов; низкий приоритет." },
  { id: "ai_creators_monetize", type: "channel", title: "AI Creators Monetize", topics: ["ai", "creators", "monetization", "midjourney"], source: publicTgSource, score: 45, note: "Каталог public.tg: монетизация AI-артистов; низкий приоритет и нужна ручная проверка." },
  { id: "creator_tools_radar", type: "channel", title: "Creator Tools Radar", topics: ["ai", "creators", "tools", "monetization"], source: publicTgSource, score: 45, note: "Каталог public.tg: инструменты для контент-креаторов; низкий приоритет." },

  // Third-pass public previews: Russian AI video, design and automation sources.
  { id: "yes_ai_official", type: "channel", title: "Nano Banana, GPT Images, Veo 3, Midjourney — Новости YES Ai", topics: ["ai", "images", "video", "midjourney", "veo"], source: "https://t.me/s/yes_ai_official", score: 82, scanned: true, note: "Публичное превью просмотрено: новости и практические материалы по AI-видео/изображениям; коммерческие анонсы присутствуют." },
  { id: "neyroseti_dr", type: "channel", title: "Нейросети: Волшебство ИИ, IT и маркетинг", topics: ["ai", "it", "marketing", "video"], source: "https://t.me/s/neyroseti_dr", score: 80, scanned: true, note: "Публичное превью просмотрено: новости, AI-видео и маркетинг; есть рекламные публикации." },
  { id: "Aidadesigner", type: "channel", title: "Дизайнер нейросети", topics: ["ai", "design", "uiux", "figma", "images"], source: "https://t.me/s/Aidadesigner", score: 68, scanned: true, note: "Публичное превью просмотрено: AI-инструменты для UI/UX и веб-дизайна; аудитория небольшая." },
  { id: "NeuralProfit", type: "channel", title: "НейроProfit | Соня Pro Ai", topics: ["ai", "design", "tools", "images"], source: "https://t.me/s/NeuralProfit", score: 71, scanned: true, note: "Публичное превью просмотрено: подборки AI-инструментов для дизайнеров; много промо, нужна модерация контекста." },
  { id: "neurogurula", type: "channel", title: "НЕЙРОСЕТИ С ЛИЛИТ", topics: ["ai", "video", "images", "prompts"], source: "https://t.me/s/neurogurula", score: 65, scanned: true, note: "Публичное превью просмотрено: AI-видео и промпты; коммерческие призывы присутствуют." },
  { id: "delayneuro", type: "channel", title: "Роман делает дизайн Нейросетями", topics: ["ai", "design", "architecture", "3d", "images"], source: "https://t.me/s/delayneuro", score: 78, scanned: true, note: "Публичное превью просмотрено: нейродизайн, архитектура, визуализации и обсуждение задач дизайнеров." },
  { id: "kub_studio", type: "channel", title: "Нейродизайн — Интерьер, Архитектура, 3D", topics: ["ai", "design", "architecture", "3d"], source: "https://t.me/s/kub_studio", score: 76, scanned: true, note: "Публичное превью просмотрено: нейросети для интерьера, архитектуры и 3D; контент преимущественно образовательный/коммерческий." },
  { id: "myspacet_ai", type: "channel", title: "Таня Румянцева Нейросети | Автоматизация n8n", topics: ["ai", "automation", "n8n", "prompts"], source: "https://t.me/s/myspacet_ai", score: 79, scanned: true, note: "Публичное превью просмотрено: автоматизация n8n, промпты и практические анонсы; отдельный чат @myspacet_ai_chat указан в канале." },
  { id: "neiro_ai_vacancy", type: "channel", title: "Вакансии: AI, ИИ, Нейросети", topics: ["ai", "jobs", "video", "community"], source: "https://t.me/s/neiro_ai_vacancy", score: 61, scanned: true, note: "Публичное превью просмотрено: вакансии AI-креаторов и ссылка на отдельный чат; использовать только для исследования рынка, не для массовых предложений." },
  { id: "myspacet_ai_chat", type: "chat", title: "Чат Таня Румянцева / Нейросети", topics: ["ai", "automation", "n8n", "community"], source: "https://t.me/s/myspacet_ai", publicUrl: "https://t.me/myspacet_ai_chat", score: 78, note: "Чат указан в публичном посте канала; правила и история требуют отдельной проверки." },
  { id: "neiro_ai_chat", type: "chat", title: "Чат по нейросетям при канале AI-вакансий", topics: ["ai", "chatgpt", "midjourney", "prompts", "community"], source: "https://t.me/s/neiro_ai_vacancy", publicUrl: "https://t.me/neiro_ai_chat", score: 74, note: "Чат указан в публичном описании канала; правила и история требуют отдельной проверки." },
];

let saved = 0;
let scanned = 0;
for (const item of resources) {
  const username = item.id.startsWith("invite:") ? undefined : item.id;
  const publicUrl = item.publicUrl ?? `https://t.me/${item.id}`;
  const metadata = {
    discoverySource: item.source,
    discoveredAt: checkedAt,
    publicPreviewScanned: Boolean(item.scanned),
    commentsCollected: false,
    collectionScope: "public_resource_metadata_only",
  };
  const notes = item.note ?? "Кандидат из публичного каталога; нужен отдельный просмотр свежей истории и правил перед любым действием.";

  upsertTelegramResource({
    projectId,
    telegramResourceId: item.id,
    type: item.type,
    title: item.title,
    username,
    publicUrl,
    source: "web_discovery",
    status: "candidate",
    membershipStatus: "unknown",
    rulesStatus: "unknown",
    topics: item.topics,
    notes,
    metadata,
    firstSeenAt: checkedAt,
    lastCheckedAt: checkedAt,
  });

  upsertTelegramAiChat({
    projectId,
    telegramChatId: item.id,
    title: item.title,
    username,
    chatType: item.type === "channel" ? "channel" : "group",
    publicUrl,
    status: "candidate",
    relevanceScore: item.score,
    discoveryQueries: ["web:telegram-ai-resources"],
    topicHits: [{ query: "web-discovery", link: publicUrl, summary: notes }],
    notes,
    metadata,
    firstSeenAt: checkedAt,
    lastScannedAt: item.scanned ? checkedAt : undefined,
  });
  saved += 1;
  if (item.scanned) scanned += 1;
}

console.log(JSON.stringify({ projectId, discovered: resources.length, saved, publicPreviewsScanned: scanned, tables: ["tg_resources", "telegram_ai_chats"], scope: "metadata_only" }, null, 2));
