# Мастер-таблица баллов — все Ads MCP сервисы

> Дата: 3 октября 2026  
> **Total = A + B + C + D** (строго, макс 100)  
> **Единая таблица всех регионов:** [master-unified.md](./master-unified.md) (126 сервисов, Σ ↓)  
> Методология: [README](./README.md) · OSS: [master-matrix-oss.md](./master-matrix-oss.md)

---

## Рубрика

| Критерий | Макс | Шкала |
|----------|------|-------|
| **A. Регистрация аккаунта** | 25 | 0 = OAuth к существующему; 5 = Telegram login; 10 = Amazon create-account (partners); 15–20 = in-app ad networks |
| **B. Запуск кампании** | 35 | 0–8 RO-only · 12–18 partial/CSV/draft · 22–28 community write · 28–32 hosted write+confirm · 32 bulk/specialized |
| **C. Оплата** | 20 | 5 = UI billing only · 12 = TON partial · 15–18 = USDC/crypto agent settlement |
| **D. Метрики** | 20 | 12–14 basic · 15–17 breakdowns · 18–20 cross-platform + alerts + audit |

**Штрафы (внутри B/D):** Playwright −5 · beta/limited rollout −3…−5 · CSV-only B≤15

**Контекст:** оценки при **готовом аккаунте**. Потолок ~75/100 даже для лучших — регистрация и KYC не автоматизируются.

---

## 1. Hosted-агрегаторы (33 сервиса)

| # | Сервис | Plat. | A | B | C | D | **Σ** | Write | OSS |
|---|--------|-------|---|---|---|---|-------|-------|-----|
| 1 | [Synter](https://syntermedia.ai) | 27 | 0 | 32 | 5 | 18 | **60** | ✅ gated | Да |
| 2 | [getmcpads.com](https://getmcpads.com) | 14 | 0 | 30 | 5 | 18 | **58** | ✅ preview | Частично |
| 3 | [PaidSync](https://paidsync.ai) | 14 | 0 | 32 | 5 | 20 | **57** | ✅ gated | Частично |
| 4 | [Markifact](https://markifact.com) | 20+ | 0 | 29 | 5 | 18 | **57** | ✅ HITL | Частично |
| 5 | [Blend MCP](https://blend-ai.com/mcp) | 8 | 0 | 30 | 5 | 17 | **57** | ✅ gated | Нет |
| 6 | [AdManage.ai](https://admanage.ai/mcp) | 9 | 0 | 32 | 5 | 15 | **57** | ✅ bulk | Нет |
| 7 | [Adspirer](https://adspirer.com) | 6+ | 0 | 30 | 5 | 16 | **56** | ✅ | Частично |
| 8 | [InsightfulPipe](https://insightfulpipe.com) | 46 | 0 | 27 | 5 | 18 | **55** | ✅ RO/RW | Нет |
| 9 | [Pipeboard](https://pipeboard.co) | 5 | 0 | 28 | 5 | 17 | **55** | ✅ | Частично |
| 10 | [MCP Ads](https://mcp-ads.com) | 10+ | 0 | 31 | 5 | 18 | **54** | ✅ paused | Да |
| 11 | [AdKit](https://adkit.so) | 7+ | 0 | 27 | 5 | 17 | **54** | ✅ draft | Частично |
| 12 | [Windsor.ai MCP](https://mcp.windsor.ai/) | 350+† | 0 | 26 | 5 | 17 | **53** | ✅ select | Нет |
| 13 | [Metadata.io MCP](https://metadata.io/mcp-server) | 8 | 0 | 28 | 5 | 14 | **52** | ✅ 60s gate | Нет |
| 14 | [Hyper AI MCP](https://hyperfx.ai/mcp) | 10+‡ | 0 | 29 | 5 | 18 | **52** | ✅ per-tool | Нет |
| 15 | [AdLoop Cloud](https://getadloop.com) | 3 | 0 | 28 | 5 | 14 | **52** | ✅ caps | Да |
| 16 | [Adplane](https://mcp.adplane.ai) | 2 | 0 | 28 | 5 | 14 | **52** | ✅ paused | Нет |
| 17 | [Opus Growth](https://opus-growth.com) | 4+ | 0 | 27 | 5 | 14 | **51** | ✅ preview | Да |
| 18 | [adsap.ai](https://adsap.ai) | 2 | 0 | 26 | 5 | 14 | **50** | ✅ preview | Нет |
| 19 | [Ryze AI](https://get-ryze.ai) | 4 | 0 | 28 | 5 | 17 | **50** | ✅ gated | Частично |
| 20 | [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) | 12 | 0 | 26 | 5 | 14 | **50** | ✅ self-host | Да |
| 21 | [Catchr.io MCP](https://api.catchr.io/mcp) | 100+† | 0 | 22 | 5 | 18 | **50** | ⚠️ mixed | Нет |
| 22 | [Draivix/aidvertaiser](https://github.com/Draivix/aidvertaiser) | 8 | 0 | 26 | 5 | 16 | **52** | ✅ | Да |
| 23 | [AdRoll MCP](https://help.adroll.com) | 1 | 0 | 25 | 5 | 16 | **51** | ⚠️ draft | Нет |
| 24 | [ZuckerBot](https://zuckerbot.ai) | 1 | 0 | 28 | 5 | 16 | **49** | ✅ Meta | Да |
| 25 | [Adrex AI](https://adrex.ai) | 2 | 0 | 26 | 5 | 15 | **46** | ✅ paused | Да |
| 26 | [TrueClicks](https://data.trueclicks.com/mcp) | 3 | 0 | 18 | 5 | 18 | **46** | ❌ RO | Частично |
| 27 | [RoASr MCP](https://roasr.com) | 3 | 0 | 8 | 5 | 18 | **46** | ⚠️ Yandex | Да |
| 28 | [LeverHQ](https://leverhq.app) | 2 | 0 | 24 | 5 | 14 | **43** | ✅ gated | Нет |
| 29 | [Connector.wtf](https://connector.wtf) | 5+ | 0 | 8 | 5 | 16 | **34** | ❌ RO | Нет |
| 30 | [Smacient](https://smacient.com) | 3 | 0 | 8 | 5 | 14 | **32** | ❌ RO | Нет |
| 31 | [Coupler MCP](https://coupler.io/mcp) | many† | 0 | 10 | 5 | 15 | **35** | ⚠️ ETL | Нет |
| 32 | [Flyweel MCP](https://flyweel.co/mcp) | 3 | 0 | 0 | 5 | 17 | **22** | ❌ RO | Нет |
| 33 | [AdCrunch](https://adcrunch.dev) | 3 | 0 | 0 | 5 | 16 | **21** | ❌ RO | Нет |

† Windsor/Catchr/Coupler — много источников, но ads write только на subset  
‡ Hyper — 160+ integrations, ad write на subset major platforms  
→ Раунд 2: [new-names-round2.md](./new-names-round2.md)

---

## 2. Official & community per-platform MCP

| # | Сервис | Платформа | A | B | C | D | **Σ** | OSS |
|---|--------|-----------|---|---|---|---|-------|-----|
| 24 | [Amazon Ads MCP](https://advertising-ai.amazon.com/mcp) | Amazon | 10 | 28 | 5 | 16 | **59** | Нет |
| 25 | [Taboola Realize](https://github.com/taboola/realize-mcp) | Taboola | 0 | 30 | 5 | 17 | **57** | Да |
| 26 | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | Yandex | 0 | 30 | 5 | 17 | **57** | Да |
| 27 | [PropellerAds MCP](https://github.com/propellerads/propeller-mcp) | PropellerAds | 0 | 30 | 5 | 16 | **56** | Да |
| 28 | [Meta Official MCP](https://mcp.facebook.com/ads) | Meta | 0 | 27 | 5 | 15 | **52** | Нет |
| 29 | [TikTok Agentic Hub](https://ads.tiktok.com/) | TikTok | 0 | 30 | 5 | 15 | **55** | Нет |
| 30 | [akelaonline/MCP-Google-Ads](https://github.com/akelaonline/MCP-Google-Ads) | Google | 0 | 28 | 5 | 17 | **55** | Да |
| 31 | [gmen1057/yandex-direct-mcp](https://github.com/gmen1057/yandex-direct-mcp) | Yandex | 0 | 30 | 5 | 15 | **55** | Да |
| 32 | [HilltopAds MCP](https://mcp.hilltopads.com/mcp) | HilltopAds | 0 | 28 | 5 | 15 | **53** | Нет |
| 33 | [mharnett/mcp-google-ads](https://github.com/mharnett/mcp-google-ads) | Google | 0 | 28 | 5 | 15 | **53** | Да |
| 34 | [HireOtto](https://hireotto.com) | Google | 0 | 28 | 5 | 14 | **52** | Да |
| 35 | [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | Meta | 0 | 28 | 5 | 14 | **52** | Да |
| 36 | [armavita-meta-ads-mcp](https://github.com/EfrainTorres/armavita-meta-ads-mcp) | Meta | 0 | 28 | 5 | 14 | **52** | Да |
| 37 | [Criteo MCP](https://criteo.com) | Criteo | 0 | 28 | 5 | 17 | **55** | Нет |
| 38 | [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) | Telegram | 5 | 22 | 12 | 13 | **52** | Да |
| 39 | [getmcpads (Google)](https://getmcpads.com) | Google | 0 | 28 | 5 | 18 | **56** | Частично |
| 40 | [getmcpads (Meta)](https://getmcpads.com) | Meta | 0 | 28 | 5 | 18 | **56** | Частично |
| 41 | [desunit/reddit-ads-mcp](https://github.com/desunit/reddit-ads-mcp) | Reddit | 0 | 22 | 5 | 16 | **48** | Да |
| 42 | [askads/mcp-vk-ads](https://github.com/askads/mcp-vk-ads) | VK Ads | 0 | 24 | 5 | 14 | **48** | Да |
| 43 | [askads/mcp-yandex-direct](https://github.com/askads/mcp-yandex-direct) | Yandex | 0 | 26 | 5 | 14 | **50** | Да |
| 44 | [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) | Google | 0 | 0 | 5 | 18 | **35** | Да |
| 45 | [Microsoft Ads MCP pilot](https://about.ads.microsoft.com/en/solutions/technology/mcp-server) | Bing | 0 | 0 | 5 | 15 | **25** | Нет |
| 46 | [StackAdapt MCP](https://stackadapt.com) | StackAdapt | 0 | 20 | 5 | 18 | **48** | Нет |
| 47 | [FarahTrip/reddit-ads-mcp](https://github.com/FarahTrip/reddit-ads-mcp) | Reddit | 0 | 18 | 5 | 14 | **42** | Да |
| 48 | [sh0tn1k/telegram-ads](https://github.com/sh0tn1k/telegram-ads) | Telegram | 5 | 18 | 10 | 12 | **45** | Да |
| 49 | [ynnickw/adport](https://github.com/ynnickw/adport) | Apple Ads | 0 | 24 | 5 | 14 | **48** | Да |
| 50 | [AdOps MCP (CSV)](https://www.npmjs.com/package/adops-mcp-server) | Google+Meta | 0 | 15 | 5 | 14 | **39** | Да |
| 51 | [OpenTabs](https://github.com/opentabs-dev/opentabs) | Multi‡ | 0 | 15 | 5 | 12 | **37** | Да |
| 52 | [AdSynthesis Engine](https://github.com/MAhmed004/ad-ops-mcp-hub) | 5 | 0 | 24 | 5 | 14 | **48** | Да |
| 53 | [cedricarlos07/meta-ads-mcp](https://github.com/cedricarlos07/meta-ads-mcp) | Meta | 0 | 28 | 5 | 16 | **49** | Да |
| 54 | [hashcott/meta-ads-mcp-server](https://github.com/hashcott/meta-ads-mcp-server) | Meta | 0 | 26 | 5 | 14 | **45** | Да |
| 55 | [v-p3truk/mcp-google-ads](https://github.com/v-p3truk/mcp-google-ads) | Google | 0 | 26 | 5 | 15 | **46** | Да |
| 56 | [Marvento Ads MCP](https://github.com/MarventoCapital/marvento-ads-mcp) | Google | 0 | 26 | 5 | 15 | **46** | Да |
| 57 | [martechery/mcp-google-ads-ts](https://github.com/martechery/mcp-google-ads-ts) | Google | 0 | 24 | 5 | 15 | **44** | Да |
| 58 | [Kadam MCP](https://github.com/kadam-official/mcp-server) | Kadam | 0 | 28 | 5 | 12 | **45** | Да |
| 59 | julioccorderoc/ads-platforms *(repo removed Oct 2026)* | Multi | 0 | 24 | 5 | 14 | **43** | Да |
| 60 | [HYPD openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp) | OpenAI Ads | 0 | 0 | 5 | 14 | **19** | Да |
| 61 | [kashiflashari/ads-mcp](https://github.com/kashiflashari/ads-mcp) | Google+Meta+TikTok | 0 | 0 | 5 | 13 | **18** | Да |

‡ OpenTabs — browser session, −5 Playwright in B

---

## 3. Display / CPM / programmatic (platform-level)

| # | Платформа | Лучший MCP | A | B | C | D | **Σ** |
|---|-----------|-----------|---|---|---|---|-------|
| 62 | RTB House | getmcpads | 0 | 10 | 5 | 16 | **31** |
| 63 | Adsterra | API only† | 0 | 22 | 5 | 14 | **41** |
| 64 | MGID | API only† | 0 | 20 | 5 | 14 | **39** |
| 65 | RichAds/ExoClick | API only† | 0 | 18 | 5 | 12 | **35** |
| 66 | DV360 | Synter/cesteral | 0 | 22 | 5 | 17 | **49** |
| 67 | The Trade Desk | Synter/cesteral | 0 | 20 | 5 | 16 | **46** |
| 68 | Outbrain/Zemanta | Synter | 0 | 22 | 5 | 15 | **47** |
| 69 | GDN (via aggregators) | getmcpads | 0 | 25 | 5 | 18 | **53** |

† API exists, MCP wrapper needed — B = potential with custom adapter

---

## 4. AI-native / in-app (другая категория)

| # | Сервис | A | B | C | D | **Σ** | Примечание |
|---|--------|---|---|---|---|-------|------------|
| 70 | [Adgentek AdsMCP](https://adsmcp.ai/) | 15 | 15 | 15 | 12 | **62** | In-app monetization |
| 71 | [Agentic Ads](https://github.com/nicofains1/agentic-ads) | 15 | 20 | 12 | 14 | **61** | CPC/CPM in agents |
| 72 | [Hive Ad-Bid](https://github.com/srotzin/hive-ad-bid) | 10 | 18 | 18 | 10 | **56** | USDC CPM auction |

---

## 5. Product Hunt & closed agents (не MCP, но конкурируют)

| # | Продукт | MCP? | A | B | C | D | **Σ** | PH Rank |
|---|---------|------|---|---|---|---|-------|---------|
| 73 | [Pixero AI](https://pixero.ai) | ❌ | 0 | 32 | 5 | 18 | **60** | #3 Day |
| 74 | [Pixel (Metadata)](https://metadata.io) | ❌ | 0 | 30 | 5 | 18 | **58** | — |
| 75 | [Muze AI](https://muzecmo.com) | ❌ | 0 | 28 | 5 | 17 | **55** | — |
| 76 | [Lexi AI](https://lexilexi.ai) | ❌ | 0 | 28 | 5 | 14 | **52** | — |
| 77 | [Koast.ai](https://docs.koast.ai/) | ❌ | 0 | 26 | 5 | 14 | **50** | — |
| 78 | Campaiyn *(defunct — campaiyn.ai 404 Oct 2026)* | ❌ | 0 | 12 | 5 | 16 | **38** | IH |
| 79 | [Adbloop](https://app.adbloop.com) | ❌ | 0 | 26 | 5 | 12 | **48** | IH Meta bulk |

PH MCP launches: HireOtto **52**, Connector.wtf **34**, Synter forum **60**

---

## 6. Сводка по платформам (лучший MCP)

| Платформа | Лучшее решение | A | B | C | D | **Σ** |
|-----------|---------------|---|---|---|---|-------|
| Google Ads | getmcpads / MCP Ads / akelaonline | 0 | 28–31 | 5 | 18 | **54–56** |
| Meta | AdManage / ZuckerBot / cedricarlos07 | 0 | 28–32 | 5 | 15–16 | **49–57** |
| OpenAI Ads | PaidSync / HYPD RO | 0 | 0–32 | 5 | 14–20 | **19–57** |
| Tencent Ads (CN) | Official / tencent-ad-mcp | 0 | 28–30 | 5 | 16–17 | **49–52** |
| Naver SearchAd (KR) | packative / PlatAid | 0 | 0–26 | 5 | 16–17 | **22–47** |
| Kakao Moment (KR) | PlatAid / PyPI | 0 | 0–24 | 5 | 15–16 | **21–44** |
| Ocean Engine (CN) | virgoC0der/go-mcp | 0 | 24 | 5 | 15 | **44** |
| Shopee Ads (SEA) | mcp-shopee-seller | 0 | 22 | 5 | 14 | **41** |
| Flipkart Ads (IN) | flipkart-seller-mcp | 0 | 22 | 5 | 14 | **41** |
| LidFly (RU hosted) | lidfly.ru/mcp/v3 | 0 | 30 | 5 | 18 | **53** |
| Click.ru MCP | agency gateway | 0 | 26 | 5 | 15 | **46** |
| lexamarketolog VK | vk-ads-mcp | 0 | 28 | 5 | 16 | **49** |
| Ozon Performance | ozon-mcp-server | 0 | 24 | 5 | 14 | **43** |
| Avito Ads | mcp-avito-ads | 0 | 22 | 5 | 14 | **41** |
| Ask Ads hosted RO | mcp.askads.ru | 0 | 18 | 5 | 16 | **39** |
| Telegram | Free-cat | 5 | 22 | 12 | 13 | **52** |
| Yandex Direct | SvechaPVL / gmen1057 | 0 | 30 | 5 | 17 | **57** |
| VK Ads | askads/mcp-vk-ads | 0 | 24 | 5 | 14 | **48** |
| TikTok | Agentic Hub / getmcpads | 0 | 30 | 5 | 15 | **55** |
| Reddit | AdManage / desunit / getmcpads | 0 | 22–32 | 5 | 15 | **48–57** |
| Microsoft Bing | Windsor / TrueClicks / getmcpads | 0 | 8–26 | 5 | 15 | **25–53** |
| Amazon | Official beta | 10 | 28 | 5 | 16 | **59** |
| LinkedIn | Synter / Metadata / getmcpads | 0 | 25–28 | 5 | 16 | **52–55** |
| Apple Search | adport | 0 | 24 | 5 | 14 | **48** |
| Display/CPM | PropellerAds / Taboola | 0 | 30 | 5 | 17 | **56–57** |
| Programmatic | Synter (DV360/TTD) | 0 | 32 | 5 | 18 | **60** |

---

## 7. Рейтинг TOP-20 (strict A+B+C+D)

```
 60 ┤ Synter ●
 59 ┤ Amazon Official ●
 58 ┤ getmcpads ●  Pixel (agent)
 57 ┤ PaidSync ●  Markifact ●  Blend ●  AdManage ●  Taboola ●  Yandex ●
 56 ┤ Adspirer ●  PropellerAds ●  GDN/getmcpads Google
 55 ┤ InsightfulPipe ●  Pipeboard ●  TikTok ●  akelaonline ●  Muze
 54 ┤ MCP Ads ●  AdKit ●
 53 ┤ Windsor ●  mharnett ●  HilltopAds ●
 52 ┤ Hyper ●  Metadata ●  AdLoop ●  Adplane ●  Meta official ●  HireOtto ●  byadsco ●  armavita ●  Telegram ●  Draivix ●  Lexi
 50 ┤ Ryze ●  adsap ●  cesteral ●  Catchr ●  askads Yandex ●  Koast
 49 ┤ ZuckerBot ●  cedricarlos07 Meta ●
 48 ┤ desunit Reddit ●  VK ●  adport ●  StackAdapt ●  Adbloop
 46 ┤ Adrex ●  RoASr ●  TrueClicks ●  v-p3truk ●  Marvento ●  TTD
 45 ┤ hashcott ●  Kadam ●  sh0tn1k Telegram ●
 43 ┤ LeverHQ ●  julioccorderoc ●
 35 ┤ Google official RO ●
 25 ┤ Microsoft pilot ●
 22 ┤ Flyweel RO ●
 19 ┤ HYPD OpenAI Ads RO ●
  0 ┤
    └─A──B──C──D── (max 60 при A=0, max 75 теоретически)
```

---

## 8. Ключевые выводы после полного скoring

1. **Максимум при готовом аккаунте: 60/100** (Synter) — не 68/100 как в ранних оценках; строгая сумма A+B+C+D снижила «округлённые» баллы.
2. **Ни одно решение < 75** — регистрация (A=0) + billing (C=5) = системный потолок ~60 для media buying MCP.
3. **Telegram** — лидер по C (12) за TON; итого 52 с Playwright-штрафом.
4. **Amazon** — единственный с A=10 (create account tool); итого 59.
5. **Reddit-находки:** Blend и AdManage попали в TOP-5; TrueClicks/Smacient/Connector — audit RO tier (32–46).
6. **Раунд 2 (окт 2026):** PaidSync (57) — TOP-5; MCP Ads (54) — 3363 actions; OpenAI Ads greenfield (HYPD RO=19, PaidSync write=57).
7. **Closed agents (Pixero 60)** конкурируют с MCP по B, но без протокола/OSS.
8. **Greenfield:** OpenAI Ads, VK Ads (48), Apple adport (48), Adsterra/MGID API-only (39–41).

---

## Связанные документы

- [research-matrix.md](./research-matrix.md) — детальный разбор по критериям
- [reddit-forum-survey.md](./reddit-forum-survey.md) — раунд 1: Reddit/форумы
- [new-names-round2.md](./new-names-round2.md) — раунд 2: web/Glama/GitHub
- [asia-platforms-mcp.md](./asia-platforms-mcp.md) — азиатские площадки
- [publisher-supply-mcp.md](./publisher-supply-mcp.md) — supply-side / SSP
- [cis-platforms-mcp.md](./cis-platforms-mcp.md) — СНГ/RU: LidFly, Yandex, VK, Telegram
- [master-unified.md](./master-unified.md) — **единая мастер-матрица всех регионов**
- [aggregators-catalog.md](./aggregators-catalog.md) — детали агрегаторов
- [display-banner-platforms.md](./display-banner-platforms.md) — CPM/display
