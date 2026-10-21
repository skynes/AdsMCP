# СНГ / RU — рекламные площадки × MCP

> Дата: 3 октября 2026  
> Рынки: Россия, Беларусь, Казахстан, Узбекистан (через Yandex/VK), Telegram  
> **Вывод:** СНГ — один из самых зрелых регионов по Ads MCP в мире. Google здесь далеко не единственный.

---

## TL;DR

| Категория | Лучший MCP | Tools | Σ† |
|-----------|-----------|-------|-----|
| **Hosted all-in-one RU** | [LidFly](https://lidfly.ru/mcp/v3) | 166 Direct + 76 VK + Avito | **53** |
| **Yandex Direct** | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | 132 | **57** |
| **Yandex Direct hosted RO** | [mcp.askads.ru](https://mcp.askads.ru/mcp) | 44 | **39** |
| **VK Ads / myTarget** | [lexamarketolog/vk-ads-mcp](https://github.com/lexamarketolog/vk-ads-mcp) | **55** | **49** |
| **Telegram Ads** | [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) | 10+ | **52** |
| **Agency proxy** | [Click.ru MCP](https://help.click.ru/7886) | VK+TG+Direct | **46** |
| **Ozon Performance** | [ozon-mcp-server](https://github.com/DeviceIngineering/ozon-mcp-server) | 22 ads | **43** |
| **Avito Реклама** | [mcp-avito-ads](https://github.com/A1-x-Tech/mcp-avito-ads) | many | **41** |
| **Wordstat + Metrika** | askads stack | 44+ | **35–45** |

† Strict A+B+C+D. LidFly — hosted aggregator context. Для AdsMCP не выбран:
подключение собственных кабинетов выполняется через сайт LidFly, а MCP доступен
по подписке около 900 ₽/месяц.

**myTarget** → merged into **VK Ads** (`ads.vk.com`, API v2). Отдельного myTarget MCP нет — все community серверы работают через VK Ads API.

---

## Карта экосистемы СНГ

```
                    CIS / RU MCP LANDSCAPE (Oct 2026)
    ┌─────────────────────────────────────────────────────────────┐
    │  HOSTED АГРЕГАТОРЫ (RU-native)                              │
    │  LidFly v3 ── Direct(166) + VK(76) + Avito Ads + Metrika    │
    │  Ask Ads ── mcp.askads.ru (Direct RO, OAuth)                │
    │  Click.ru ── agency proxy: VK + Telegram + Direct           │
    └───────────────────────────┬─────────────────────────────────┘
                                │
    ┌───────────────────────────┼─────────────────────────────────┐
    │  YANDEX STACK             │  VK / myTarget                    │
    │  SvechaPVL 132 tools      │  lexamarketolog 55 tools        │
    │  Yurich-ru 152 tools      │  askads 18 tools                  │
    │  askads 44 tools          │  Click.ru / ai-hub-open           │
    │  LidFly 166 tools         │  sergeylopukhov all-in-one        │
    │  + Metrika MCP            │                                   │
    │  + Wordstat MCP           │                                   │
    └───────────────────────────┼─────────────────────────────────┘
                                │
    ┌───────────────────────────┼─────────────────────────────────┐
    │  TELEGRAM ADS             │  MARKETPLACES + CLASSIFIEDS       │
    │  Free-cat (Playwright+TON)│  Ozon Performance (22 ad tools)   │
    │  Click.ru proxy           │  WB ads stats (RO)                │
    │  SergeyKrin9/clickru      │  Avito Ads (LidFly + OSS)         │
    └───────────────────────────┼─────────────────────────────────┘
                                │
    ┌───────────────────────────┴─────────────────────────────────┐
    │  KZ / BY / UZ — переиспользуют Yandex Direct + VK Ads MCP     │
    │  Kaspi, Kolesa, local banks — ❌ ads MCP нет                   │
    └─────────────────────────────────────────────────────────────┘
```

---

## Сводная таблица: все СНГ MCP

### Hosted-агрегаторы

| # | Сервис | Endpoint | Платформы | Tools | Write | OSS | Σ |
|---|--------|----------|-----------|-------|-------|-----|---|
| 1 | **[LidFly](https://lidfly.ru)** | `https://lidfly.ru/mcp/v3` | Direct, VK, Avito Ads, Avito, Metrika, Wordstat, Sites | 166+76+ | ✅ gated | Нет | **53** |
| 2 | **[Ask Ads](https://mcp.askads.ru/)** | `https://mcp.askads.ru/mcp` | Yandex Direct (+ Metrika conversions) | 44 | ❌ RO | Частично | **39** |
| 3 | **[Click.ru MCP](https://help.click.ru/7886)** | `/c/<token>` или `/o/<id>/<secret>` | VK Ads, Telegram Ads, Yandex Direct | many | ✅ | Нет | **46** |

### Yandex Direct

| # | Repo / Service | Tools | Write | Hosted | Σ |
|---|----------------|-------|-------|--------|---|
| 4 | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | 132 | ✅ | self-host | **57** |
| 5 | [Yurich-ru/yandex-ads-mcp](https://github.com/Yurich-ru/yandex-ads-mcp) | 152 | ✅ | self-host | **57** |
| 6 | [gmen1057/yandex-direct-mcp](https://github.com/gmen1057/yandex-direct-mcp) | ~80 | ✅ | self-host | **55** |
| 7 | [askads/mcp-yandex-direct](https://github.com/askads/mcp-yandex-direct) | 44 | ✅ local / RO hosted | `mcp.askads.ru` | **50** |
| 8 | [LidFly Direct](https://lidfly.ru/docs/yandex-direct) | **166** | ✅ gated | `lidfly.ru/mcp/v3` | **53** |
| 9 | [axisrow/yandex-direct-mcp-plugin](https://github.com/axisrow/yandex-direct-mcp-plugin) | 149 | ✅ | Claude plugin | **55** |
| 10 | [OlegRadinuk/yandex-direct-mcp](https://github.com/OlegRadinuk/yandex-direct-mcp) | 20 | ✅ dry-run | self-host | **48** |

### Yandex Metrika + Wordstat (adjacent stack)

| # | Repo | Tools | Write | Notes |
|---|------|-------|-------|-------|
| 11 | [askads/mcp-yandex-metrica](https://github.com/askads/mcp-yandex-metrica) | many | RO | OAuth, counters, goals, reports |
| 12 | [askads/mcp-yandex-wordstat](https://github.com/askads/mcp-yandex-wordstat) | many | RO | Yandex Cloud Search API key |
| 13 | LidFly Wordstat | 5 | RO | `lidfly.ru/mcp/wordstat` |

### VK Ads / myTarget

| # | Repo | Tools | Write | Notes |
|---|------|-------|-------|-------|
| 14 | [lexamarketolog/vk-ads-mcp](https://github.com/lexamarketolog/vk-ads-mcp) | **55** | ✅ | remarketing, feeds, agency, lookalikes |
| 15 | [askads/mcp-vk-ads](https://github.com/askads/mcp-vk-ads) | 18 | ✅ | npm `mcp-vk-ads` |
| 16 | [theYahia/vk-ads-mcp](https://github.com/theYahia/vk-ads-mcp) | 8 | ✅ | WWmcp emerging markets |
| 17 | [ai-hub-open/vk-ads-mcp](https://www.npmjs.com/package/@ai-hub-open/vk-ads-mcp) | many | ✅ | Click.ru proxy built-in |
| 18 | [nikolaymokh-dev/vk-ads-mcp](https://github.com/nikolaymokh-dev/vk-ads-mcp) | 55 | ⚠️ gated | hardened fork, `VK_ADS_ENABLE_WRITES` |
| 19 | [sergeylopukhov/vk-ads-mcp-all-in-one](https://github.com/sergeylopukhov/vk-ads-mcp-all-in-one) | many | ✅ | audiences, lead forms, community research |
| 20 | [Qusto/vk-ads-mcp](https://github.com/Qusto/vk-ads-mcp) | 6 | ❌ RO | stats + structure |
| 21 | [LidFly VK](https://lidfly.ru/docs/vk-ads) | **76** | ✅ gated | `lidfly.ru/mcp/v3` |

**API mapping (VK Ads UI → MCP):**

| UI (ads.vk.com) | API term | MCP tools |
|-----------------|----------|-----------|
| Кампания | `ad_plan` | `list_ad_plans`, `create_ad_plan` |
| Группа объявлений | `ad_group` / `campaign` | `list_ad_groups`, `create_campaign` |
| Объявление | `banner` | `list_banners`, `create_banner` |

### Telegram Ads

| # | Repo | Tools | Write | Auth | Σ |
|---|------|-------|-------|------|---|
| 22 | [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) | 10+ | ✅ confirm | Playwright session | **52** |
| 23 | [sh0tn1k/telegram-ads](https://github.com/sh0tn1k/telegram-ads) | many | ✅ | Playwright | **45** |
| 24 | [Click.ru Telegram](https://help.click.ru/7886) | via agency | ✅ | Click.ru token | **46** |
| 25 | [SergeyKrin9/clickru](https://github.com/SergeyKrin9/mcp-servers) | agency | ✅ | Click.ru API | — |

**Unique:** TON crypto payment (C=12), Playwright −5 penalty → Σ=52 max.

### Marketplaces & classifieds (реклама на площадках)

| # | Platform | MCP | Ads tools | Write | Σ |
|---|----------|-----|-----------|-------|---|
| 26 | **Ozon Performance** | [ozon-mcp-server](https://github.com/DeviceIngineering/ozon-mcp-server) | 22 (CPC «Трафареты») | ✅ | **43** |
| 27 | **Wildberries** | [wildberries-api-mcp-server](https://github.com/dmitriipolushin/wildberries-api-mcp-server) | stats RO | ❌ | **28** |
| 28 | **WB+Ozon** | [marketplaces-mcp-ru](https://github.com/ilyautov/marketplaces-mcp-ru) | 793 methods† | ⚠️ | **40** |
| 29 | **Avito Реклама** | [mcp-avito-ads](https://github.com/A1-x-Tech/mcp-avito-ads) | campaigns, groups, stats | ⚠️ partial | **41** |
| 30 | **Avito Реклама** | [LidFly avito_ads](https://lidfly.ru/docs/avito-ads) | via v3 | budget/bid write | **45** |

† marketplaces-mcp-ru — seller ops; ads через Performance API отдельно

### Audit / cross-platform (incl. Yandex)

| # | Service | Platforms | Focus | Σ |
|---|---------|-----------|-------|---|
| 31 | [RoASr MCP](https://github.com/RoASr-com/roasr-mcp) | Meta, Google, **Yandex** | AI audit, Vision | **46** |

### Unified RU growth stack

| # | Repo | Servers | Coverage |
|---|------|---------|----------|
| 32 | [SergeyKrin9/mcp-servers](https://github.com/SergeyKrin9/mcp-servers) | 7 | Direct, Webmaster, Metrika, GSC, YouTube, VK wall, Telegram, **Click.ru** |

---

## Детальный разбор TOP-5

### 1. LidFly — RU-native hosted champion

| Поле | Значение |
|------|----------|
| URL | https://lidfly.ru |
| MCP v3 | `https://lidfly.ru/mcp/v3` — **единый endpoint** |
| Legacy | `/mcp` (119 Direct), `/mcp/vk` (76 VK), `/mcp/wordstat` (5) |
| Auth | OAuth email + Yandex OAuth + VK OAuth |
| Platforms | Yandex Direct (166), VK Ads (76), Avito Ads, Avito marketplace, Metrika, Wordstat, Sites, Accounting |
| Safety | `call_write_tool` with MCP client confirmation; skills system |
| Pricing | Freemium + paid tiers |

**Особенности Direct:** CPM video creatives, portfolio conversion strategies, multi-Yandex-account via `connection_id`.

**Оценка:** A=0 · B=30 · C=5 · D=18 → **53**

---

### 2. Ask Ads — zero-setup Direct RO + OSS stack

| Поле | Значение |
|------|----------|
| Hosted RO | `https://mcp.askads.ru/mcp` — OAuth Yandex, free, read-only |
| Local write | `npx mcp-yandex-direct` — 44 tools, full CRUD |
| VK | `npx mcp-vk-ads` — 18 tools |
| Metrika | `npx mcp-yandex-metrica` |
| Wordstat | `npx mcp-yandex-wordstat` — Yandex Cloud API key |
| Claude plugins | [askads/claude-plugins](https://github.com/askads/claude-plugins) marketplace |
| Product | askads.ru — chat analyst + Telegram alerts («Сторож») |

**Оценка hosted:** A=0 · B=18 · C=5 · D=16 → **39** (RO only)  
**Оценка local Direct:** A=0 · B=26 · C=5 · D=14 → **50**

---

### 3. lexamarketolog/vk-ads-mcp — deepest VK OSS

| Поле | Значение |
|------|----------|
| GitHub | [lexamarketolog/vk-ads-mcp](https://github.com/lexamarketolog/vk-ads-mcp) |
| Tools | **55** (v0.4-dev), 56 tests, verified live |
| Coverage | campaigns, ad groups, banners, content upload, statistics (daily/summary/breakdown/async), remarketing, lookalikes, product feeds, agency clients |
| Auth | OAuth client_credentials auto-refresh OR static token |
| Install | `uvx --from vk-ads-mcp vk-ads-mcp` |

**Оценка:** A=0 · B=28 · C=5 · D=16 → **49**

---

### 4. Click.ru MCP — agency gateway

| Поле | Значение |
|------|----------|
| Docs | https://help.click.ru/7886 |
| URL patterns | `/c/<click.ru_token>`, `/c/<token>/<cabinet>`, `/o/<client_id>/<secret>` |
| Platforms | **VK Ads**, **Telegram Ads**, **Yandex Direct** |
| Value | No VK API approval needed — Click.ru holds agency tokens |
| Also | [ai-hub-open/vk-ads-mcp](https://www.npmjs.com/package/@ai-hub-open/vk-ads-mcp) wraps Click.ru |

**Use case:** Agencies managing client cabinets without direct API access approval.

**Оценка:** A=0 · B=26 · C=5 · D=15 → **46**

---

### 5. Telegram Ads — unique TON channel

| Поле | Значение |
|------|----------|
| GitHub | [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) |
| Method | Playwright → ads.telegram.org (no official API) |
| Tools | list_accounts, list_ads, get_ad_info, get_stats, create_ad, update_ad_cpm, set_status, increase_budget |
| Safety | `confirm=True` required for all writes |
| Payment | TON wallet — **C=12** (best crypto partial in our matrix) |

**Оценка:** A=5 · B=22 · C=12 · D=13 → **52** (Playwright −5 embedded in B)

---

## Казахстан / Беларусь / Узбекистан

СНГ-страны **не имеют отдельных ad MCP** — используются те же API:

| Страна | Ad platforms | MCP path |
|--------|-------------|----------|
| **KZ** | Yandex Direct, VK Ads, Google Ads | Existing Yandex/VK MCP (API v5/v2 works in KZ) |
| **BY** | Yandex Direct, VK Ads, Telegram | Same stack |
| **UZ** | Yandex Direct (growing), Meta | Yandex MCP; Meta official |
| **KZ local** | Kaspi.kz | ❌ No ads API/MCP (marketplace seller API only) |
| **KZ local** | Kolesa/Krisha ads | ❌ No MCP (internal API unknown) |

**Research note:** [theYahia/mcp-servers CIS research](https://github.com/theYahia/mcp-servers/tree/main/research/cis-market) — 40 CA services investigated, zero native MCP. RU platforms (WB, Ozon, HH) are the only CIS-native MCP implementations.

---

## Сравнение: СНГ vs Global vs Азия

| Metric | СНГ/RU | Global (US/EU) | Азия |
|--------|--------|----------------|------|
| Official platform MCP | ❌ (нет official Yandex/VK) | ✅ Google, Meta, TikTok, Amazon | ✅ Tencent official |
| Community MCP depth | ⭐⭐⭐⭐⭐ deepest | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Hosted RU-native aggregator | ✅ LidFly, Ask Ads, Click.ru | getmcpads, PaidSync | — |
| Unique channels | Telegram TON, Avito | — | Ocean Engine |
| Marketplace ads MCP | Ozon, WB, Avito | Amazon | Shopee, Flipkart |
| Wordstat/keyword MCP | ✅ multiple | — | Naver KR only |

**СНГ — единственный регион с 3+ hosted native aggregators** (LidFly, Ask Ads, Click.ru) помимо global players.

---

## Что НЕ имеет MCP (greenfield)

| Platform | API | Priority | Notes |
|----------|-----|----------|-------|
| **eLama** | Multi-platform ad manager API | ⭐⭐⭐ | Direct+VK+Google aggregator |
| **Kaspi.kz Ads** | Unknown/if exists | ⭐⭐ | KZ super-app |
| **Kolesa/Krisha Ads** | Internal? | ⭐⭐ | KZ classifieds leader |
| **2GIS Ads** | Unknown | ⭐ | Geo/local |
| **MyTarget standalone** | Merged → VK Ads | — | Use VK MCP |
| **Yandex Business** | Partial | ⭐⭐ | Maps/local ads |
| **VK Реклама official MCP** | — | ⭐⭐⭐ | Only community today |

---

## Рекомендации по сценарию

### «Я веду Direct + VK, хочу быстро»
→ Для AdsMCP LidFly не рекомендуется: он требует подключать собственные кабинеты
через сайт и платную подписку. Использовать прямой provider MCP или self-hosted
модуль.

### «Нужен бесплатный аудит Direct в ChatGPT»
→ **Ask Ads** `mcp.askads.ru/mcp` — RO, OAuth, 1 мин setup

### «Self-host, полный контроль Direct»
→ **SvechaPVL/yandex-mcp** (132 tools) или **Yurich-ru** (152 tools)

### «VK Ads, максимум tools OSS»
→ **lexamarketolog/vk-ads-mcp** (55 tools); LidFly (76 hosted) оставлен только
как внешний benchmark.

### «Агентство, много клиентских кабинетов»
→ **Click.ru MCP** — без VK API approval, Telegram+VK+Direct

### «Telegram Ads + TON»
→ **Free-cat/telegram_ads_mcp** — единственный путь (Playwright)

### «Ozon/WB реклама маркетплейса»
→ **ozon-mcp-server** (22 Performance tools) + **wildberries-api-mcp-server** (stats RO)

### «Avito медийная реклама»
→ **mcp-avito-ads** OSS; LidFly avito_ads не выбран из-за hosted-посредника и
платной подписки.

### «KZ/BY/UZ — международный трафик»
→ Те же Yandex/VK MCP; локальных альтернатив нет

---

## TOP-10 СНГ MCP (strict Σ)

```
 57 ┤ SvechaPVL Yandex ●  Yurich-ru Yandex ●
 55 ┤ gmen1057 Yandex ●  axisrow Yandex ●
 53 ┤ LidFly (hosted all-in-one) ●
 52 ┤ Telegram Free-cat ●  Tencent (Asia, for comparison)
 50 ┤ askads Direct (local write) ●
 49 ┤ lexamarketolog VK ●
 48 ┤ askads VK ●  OlegRadinuk Yandex ●
 46 ┤ Click.ru ●  RoASr (Yandex audit) ●
 45 ┤ LidFly Avito Ads ●  sh0tn1k Telegram ●
 43 ┤ Ozon Performance ●
 41 ┤ Avito Ads OSS ●  mcp-avito-ads ●
 39 ┤ Ask Ads hosted RO ●
 28 ┤ Wildberries ads stats RO ●
```

---

## Связанные документы

- [research-matrix.md](./research-matrix.md) — Yandex/VK/Telegram в основной матрице
- [alternatives-google-ads.md](./alternatives-google-ads.md) — RU alternatives
- [asia-platforms-mcp.md](./asia-platforms-mcp.md) — Азия (Tencent, Naver, Kakao)
- [publisher-supply-mcp.md](./publisher-supply-mcp.md) — supply-side
- [oss-github-catalog.md](./oss-github-catalog.md) — полный GitHub каталог
