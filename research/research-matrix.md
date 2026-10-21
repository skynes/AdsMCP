# Матрица Ads MCP — платформы × критерии × баллы

> Дата: 3 октября 2026  
> Методология: [README](./README.md)  
> Баллы всех сервисов: [master-scores.md](./master-scores.md) · OSS: [master-matrix-oss.md](./master-matrix-oss.md)

---

## Сводная таблица по платформам

| Платформа | Лучшее MCP-решение | A Регистрация | B Запуск | C Оплата | D Метрики | **Итого** | Статус |
|-----------|-------------------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Google Ads** | getmcpads / akelaonline / mharnett | 0 | 28 | 5 | 18 | **56** | Official RO=35; write — community/hosted |
| **Meta (FB/IG)** | AdManage / official / byadsco | 0 | 28 | 5 | 15 | **52** | Official beta rollout −3 |
| **Telegram Ads** | Free-cat/telegram_ads_mcp | 5 | 22 | 12 | 13 | **52** | TON C=12; Playwright −5 |
| **Yandex Direct** | SvechaPVL/yandex-mcp, gmen1057 | 0 | 30 | 5 | 17 | **57** | Community; API v5 |
| **TikTok Ads** | Official Agentic Hub + getmcpads | 0 | 30 | 5 | 15 | **55** | Official R/W |
| **Reddit Ads** | AdManage / desunit / getmcpads | 0 | 22 | 5 | 16 | **48** | Нет official MCP |
| **Microsoft (Bing)** | Windsor / TrueClicks / pilot | 0 | 0–18 | 5 | 15 | **25** | Official RO pilot |
| **Amazon Ads** | Official beta | 10† | 28 | 5 | 16 | **59**† | Official R/W; partners only |
| **LinkedIn Ads** | Synter / Metadata / getmcpads | 0 | 25 | 5 | 16 | **52** | Нет official MCP |
| **VK Ads** | askads/mcp-vk-ads | 0 | 24 | 5 | 14 | **48** | Greenfield, OSS |
| **Apple Search Ads** | adport | 0 | 24 | 5 | 14 | **48** | OSS, preview+approve |
| **Pinterest Ads** | getmcpads / official alpha | 0 | 15 | 5 | 14 | **34** | Alpha partners |
| **Snapchat Ads** | getmcpads | 0 | 18 | 5 | 14 | **37** | Announced, не GA |
| **X (Twitter) Ads** | getmcpads | 0 | 20 | 5 | 14 | **39** | Нет official Ads MCP |

\* Telegram: +5 за TON-крипто, но −5 за Playwright-хрупкость  
† Amazon: tool «create account» в workflow, но только для partners с API credentials

---

## Детальная матрица: решения × платформы

### Легенда
- ✅ Полностью через MCP/API
- ⚠️ Частично / с подтверждением человека / beta
- ❌ Недоступно
- 🔧 Playwright/браузер (нет API)

| Решение | Тип | Google | Meta | Telegram | Yandex | TikTok | Reddit | Bing | Amazon | LinkedIn | OSS | GitHub | Оценка |
|---------|-----|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---|:---:|
| **googleads/google-ads-mcp** | Official OSS | RO ✅ | — | — | — | — | — | — | — | — | **Да** | [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) | 35 |
| **mharnett/mcp-google-ads** | Community | W ⚠️ | — | — | — | — | — | — | — | — | **Да** | [mharnett/mcp-google-ads](https://github.com/mharnett/mcp-google-ads) | 48 |
| **akelaonline/MCP-Google-Ads** | Community | W ⚠️ | — | — | — | — | — | — | — | — | **Да** | [akelaonline/MCP-Google-Ads](https://github.com/akelaonline/MCP-Google-Ads) | 50 |
| **adsap.ai** | Hosted | W ⚠️ | W ⚠️ | — | — | — | — | — | — | — | **Нет** | — | 55 |
| **mcp.facebook.com/ads** | Official hosted | — | W ⚠️ | — | — | — | — | — | — | — | **Нет** | hosted only | 55 |
| **byadsco/meta-ads-mcp** | Community OSS | — | W ⚠️ | — | — | — | — | — | — | — | **Да** | [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | 52 |
| **pipeboard-co/meta-ads-mcp** | Hosted | ✅ | ✅ | — | — | ✅ | ✅ | — | — | — | **Частично** | [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) | 55 |
| **Free-cat/telegram_ads_mcp** | Playwright | — | — | W 🔧 | — | — | — | — | — | — | **Да** | [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) | 52 |
| **sh0tn1k/telegram-ads** | Playwright | — | — | R/W 🔧 | — | — | — | — | — | — | **Да** | [sh0tn1k/telegram-ads](https://github.com/sh0tn1k/telegram-ads) | 45 |
| **SvechaPVL/yandex-mcp** | Community | — | — | — | W ⚠️ | — | — | — | — | — | **Да** | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | 57 |
| **gmen1057/yandex-direct-mcp** | Community | — | — | — | W ⚠️ | — | — | — | — | — | **Да** | [gmen1057/yandex-direct-mcp](https://github.com/gmen1057/yandex-direct-mcp) | 55 |
| **askads/mcp-yandex-direct** | Community + hosted RO | — | — | — | RO/W | — | — | — | — | — | **Да** | [askads/mcp-yandex-direct](https://github.com/askads/mcp-yandex-direct) | 50 |
| **TikTok Agentic Hub** | Official hosted | — | — | — | — | W ⚠️ | — | — | — | — | **Нет** | hosted only | 52 |
| **getmcpads-com/tiktok-ads-mcp** | Community OSS | — | — | — | — | W ⚠️ | — | — | — | — | **Да** | [getmcpads-com/tiktok-ads-mcp-server](https://github.com/getmcpads-com/tiktok-ads-mcp-server) | 50 |
| **desunit/reddit-ads-mcp** | Community | — | — | — | — | — | W ⚠️ | — | — | — | **Да** | [desunit/reddit-ads-mcp](https://github.com/desunit/reddit-ads-mcp) | 43 |
| **FarahTrip/reddit-ads-mcp** | Community | — | — | — | — | — | W ⚠️ | — | — | — | **Да** | [FarahTrip/reddit-ads-mcp](https://github.com/FarahTrip/reddit-ads-mcp) | 40 |
| **Microsoft Ads MCP pilot** | Official | — | — | — | — | — | — | RO ✅ | — | — | **Нет** | hosted only | 25 |
| **Amazon Ads MCP** | Official beta | — | — | — | — | — | — | — | W ⚠️ | — | **Нет** | hosted only | 59† |
| **getmcpads.com** | Hosted aggregator | RO/W | RO/W | — | — | RO/W | RO/W | RO/W | — | RO/W | **Частично** | [getmcpads-com](https://github.com/getmcpads-com) | **58** |
| **adkit.so (ads-mcp)** | Hosted aggregator | W draft | W draft | — | — | W draft | W draft | W draft | — | W draft | **Частично** | [adkit/ads-mcp](https://github.com/adkit/ads-mcp) | **54** |
| **metadata.io MCP** | Hosted B2B | W | W | — | — | — | W | — | — | W | **Нет** | — | **52** |
| **markifact.com** | Hosted aggregator | RO/W | RO/W | — | — | RO/W | RO | RO | RO/W | RO/W | **Частично** | [markifact/markifact-mcp](https://github.com/markifact/markifact-mcp) | **57** |
| **Blend MCP** | Hosted aggregator | RO/W | RO/W | — | — | RO/W | RO/W | RO/W | RO/W | RO/W | **Нет** | — | **57** |
| **AdManage.ai** | Hosted bulk launch | — | W | — | — | W | W | W | W | W | **Нет** | — | **57** |
| **Adgentek/adsmcp** | In-app ads | — | — | — | — | — | — | — | — | — | **Да** | [Adgentek/adsmcp](https://github.com/Adgentek/adsmcp) | N/A |

---

## Разбор по критериям

### A. Создание аккаунта (0–25)

| Платформа | Реальность | MCP-покрытие | Балл |
|-----------|-----------|--------------|------|
| Google Ads | Нужен Google-аккаунт, billing profile, иногда MCC; developer token отдельно | ❌ Ни один MCP не регистрирует | **0** |
| Meta | Business Manager, payment method, иногда верификация бизнеса | ❌ OAuth к существующему | **0** |
| Telegram Ads | Логин через Telegram + телефон; EUR-кабинет через партнёров (от €500–2M) | 🔧 Playwright может залогинить, но не пройти KYC партнёра | **5** |
| Yandex Direct | Яндекс ID + договор + пополнение (карта/счёт) | ❌ | **0** |
| TikTok | TikTok for Business + верификация | ❌ | **0** |
| Reddit | Reddit Business + одобрение Ads API | ❌ | **0** |
| Amazon Ads | Partner API credentials; tool «create accounts» в workflow | ⚠️ Только partners | **10** |
| Microsoft | Microsoft Advertising account | ❌ | **0** |

**Вывод:** Регистрация — системный блокер. Даже Amazon с «create account tool» требует partner status.

---

### B. Настройка и запуск кампании (0–35)

| Решение | Create | Edit | Pause/Enable | Moderation | Launch pack | Балл |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| Google official | ❌ | ❌ | ❌ | — | — | **0** |
| mharnett/mcp-google-ads | ✅ PAUSED | ✅ | ✅ enable | ⚠️ | ⚠️ Demand Gen E2E | **28** |
| Meta official | ✅ | ✅ | ✅ | ⚠️ | ✅ | **32** |
| Yandex gmen1057 | ✅ direct_launch_pack | ✅ | ✅ | ✅ moderate | ✅ | **30** |
| Yandex SvechaPVL | ✅ 80 tools | ✅ | ✅ | ✅ | ⚠️ | **30** |
| Telegram Free-cat | ✅ create_ad | ✅ update | ✅ status | ⚠️ UI | ⚠️ | **25** |
| TikTok official | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | **30** |
| Reddit desunit | ✅ create | ✅ patch | ✅ archive | ⚠️ | ❌ | **22** |
| getmcpads (Google) | ✅ preview+confirm | ✅ | ✅ | ⚠️ | ⚠️ | **28** |
| AdKit | ✅ draft-first | ✅ | ✅ | human approve | ⚠️ | **25** |

---

### C. Оплата (0–20)

| Платформа | Способ оплаты | MCP может оплатить? | Балл |
|-----------|--------------|---------------------|------|
| Google Ads | Карта, invoicing, MCC billing | ❌ Только привязка в UI | **5** |
| Meta | Карта, PayPal, invoicing | ❌ | **5** |
| **Telegram Ads** | **TON (крипто)** | ⚠️ increase_budget через UI; TON-wallet вне MCP | **12** |
| Yandex Direct | Карта, счёт, агентства | ❌ | **5** |
| TikTok | Карта, invoicing | ❌ | **5** |
| Reddit | Карта | ❌ | **5** |
| Amazon | Invoicing, credit line | ❌ billing read-only | **5** |

**Лучший кандидат на «оплату криптой»:** Telegram Ads (TON). Но пополнение кошелька и KYC EUR-кабинета MCP не закрывает.

---

### D. Метрики и аналитика (0–20)

| Решение | Reporting | Breakdowns | Export | Alerts | Балл |
|---------|:---:|:---:|:---:|:---:|:---:|
| Google official | ✅ GAQL search | ✅ | ⚠️ | ❌ | **18** |
| Meta official | ✅ insights | ✅ | ⚠️ | ❌ | **18** |
| Yandex SvechaPVL | ✅ + Wordstat + Metrika | ✅ | ✅ | ❌ | **19** |
| Telegram Free-cat | ✅ list_ads metrics | ⚠️ | ✅ CSV | ❌ | **15** |
| getmcpads | ✅ 1555 metrics | ✅ cross-platform | ✅ | ✅ Pro | **18** |
| Metadata | ✅ 141 tools | ✅ B2B | ⚠️ | ⚠️ | **16** |

---

## Кросс-платформенные агрегаторы (сравнение)

| Агрегатор | A | B | C | D | **Σ** | Платформы | Write | OSS | GitHub |
|-----------|---|---|---|---|-------|-----------|-------|-----|--------|
| **Synter** | 0 | 32 | 5 | 18 | **60** | 27 | ✅ gated | Да | [Synter-Media-AI/mcp-server](https://github.com/Synter-Media-AI/mcp-server) |
| **getmcpads.com** | 0 | 30 | 5 | 18 | **58** | 14 | ✅ preview | Частично | [getmcpads-com](https://github.com/getmcpads-com) |
| **Markifact** | 0 | 29 | 5 | 18 | **57** | 20+ | ✅ HITL | Частично | [markifact/markifact-mcp](https://github.com/markifact/markifact-mcp) |
| **Blend MCP** | 0 | 30 | 5 | 17 | **57** | 8 | ✅ gated | Нет | — |
| **AdManage.ai** | 0 | 32 | 5 | 15 | **57** | 9 | ✅ bulk | Нет | — |
| **Adspirer** | 0 | 30 | 5 | 16 | **56** | 6+ | ✅ | Частично | [amekala/ads-mcp](https://github.com/amekala/ads-mcp) |
| **InsightfulPipe** | 0 | 27 | 5 | 18 | **55** | 46 | ✅ RO/RW | Нет | — |
| **Pipeboard** | 0 | 28 | 5 | 17 | **55** | 5 | ✅ | Частично | [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) |
| **AdKit** | 0 | 27 | 5 | 17 | **54** | 7+ | ✅ draft | Частично | [adkit/ads-mcp](https://github.com/adkit/ads-mcp) |
| **Windsor.ai** | 0 | 26 | 5 | 17 | **53** | 350+† | ✅ select | Нет | — |
| **Metadata.io** | 0 | 28 | 5 | 14 | **52** | 8 B2B | ✅ 60s gate | Нет | — |
| **AdLoop** | 0 | 28 | 5 | 14 | **52** | 3 | ✅ caps | Да | [kLOsk/adloop](https://github.com/kLOsk/adloop) |
| **Adplane** | 0 | 28 | 5 | 14 | **52** | 2 | ✅ paused | Нет | — |
| **Opus Growth** | 0 | 27 | 5 | 14 | **51** | 4+ | ✅ preview | Да | [opusgrowth](https://github.com/opusgrowth/Opus-Growth-The-MCP-Connector-for-Ad-Platforms) |
| **adsap.ai** | 0 | 26 | 5 | 14 | **50** | 2 | ✅ preview | Нет | — |

**Плюсы агрегаторов:** один OAuth, единая модель confirm/preview, кросс-платформенные отчёты.  
**Минусы:** всё равно нужны готовые аккаунты; write часто за paywall; vendor lock-in.

---

## Что НЕ является Ads MCP для media buying

| Продукт | Что делает | Путаница |
|---------|-----------|----------|
| **Adgentek AdsMCP** (adsmcp.ai) | Показывает рекламу *в AI-чатах* (ads.serve) | Название «AdsMCP», но это ad server для publishers |
| **Google Analytics MCP** | Read-only аналитика сайта | Adjacent, не кампании |
| **Klaviyo MCP** | Email/lifecycle | Adjacent |
| **OpenAI Ads Manager** | Beta рекламы в ChatGPT | Нет official MCP server |

---

## Рейтинг «близости к 100/100»

```
100 ┤                                    [идеал — не существует]
 75 ┤                                    [теор. потолок]
 60 ┤ Synter ●  Pixero (agent)
 59 ┤ Amazon Official ●
 58 ┤ getmcpads ●  Markifact ●  Blend ●  AdManage ●
 57 ┤ Yandex ●  Taboola ●  PropellerAds ●
 55 ┤ TikTok ●  Pipeboard ●  InsightfulPipe ●
 52 ┤ Meta official ●  AdLoop ●  Adplane ●  Telegram ●
 50 ┤ adsap ●  cesteral ●  Catchr ●
 48 ┤ Reddit ●  VK ●  adport ●  TrueClicks ●
 35 ┤ Google Official RO ●  Connector.wtf ●
 25 ┤ Microsoft pilot ●
  0 ┤
    └─A──B──C──D── (strict sum, см. master-scores.md)
```

### Топ-5 для «почти полного цикла» (при готовом аккаунте)

1. **Synter** — 60/100 — 27 платформ incl. DV360, Taboola, StackAdapt
2. **Amazon Ads MCP** — 59/100 — create account tool (A=10), partners only
3. **getmcpads.com** — 58/100 — 14 платформ, preview writes, 1555 metrics
4. **Markifact / Blend / AdManage** — 57/100 — write + safety / bulk launch
5. **Yandex SvechaPVL** — 57/100 — 132 tools incl. Wordstat/Metrika

---

## Gaps для собственной разработки

Если делать свой Ads MCP, максимальная ценность в:

| Gap | Сложность | ROI |
|-----|-----------|-----|
| **Onboarding wizard** (OAuth + billing checklist + account health) | Средняя | Высокий |
| **Unified campaign schema** → platform adapters | Высокая | Высокий |
| **Preview → confirm → audit log** (как akelaonline, getmcpads) | Низкая | Критичный для trust |
| **Telegram Ads API layer** (если появится) или stable Playwright | Средняя | Уникально (TON) |
| **Payment orchestration** (TON wallet, Stripe delegated) | Очень высокая | Game changer |
| **Account registration automation** | Практически невозможно легально | Blocker KYC |

### Рекомендуемый MVP собственного решения

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ AI Agent    │────▶│ Ads MCP Hub  │────▶│ Platform        │
│ (Cursor)    │     │ (your code)  │     │ Adapters        │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │                ├─ Yandex (API v5)
                           │                ├─ Telegram (Playwright)
                           ▼                ├─ Google (wrap mharnett)
                    ┌──────────────┐         ├─ Meta (proxy official)
                    │ Safety Layer │         └─ TikTok (Agentic Hub)
                    │ dry-run      │
                    │ confirm      │
                    │ audit SQLite │
                    └──────────────┘
```

**Приоритет платформ для RU/CIS аудитории:**
1. Yandex Direct — нет official MCP, community зрелый, API v5 документирован
2. Telegram Ads — TON, нет конкуренции от official MCP
3. VK Ads — **нет MCP вообще** (зелёное поле!)
4. Google/Meta — через official/community, не reinvent
