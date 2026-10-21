# Аналоги getmcpads.com — hosted MCP-агрегаторы

> Дата: 3 октября 2026  
> Критерий сравнения: один URL → много платформ, OAuth, write safety, pricing

---

## Сводная таблица агрегаторов

| # | Сервис | A | B | C | D | **Σ** | Платформ | Write | OSS | GitHub |
|---|--------|---|---|---|---|-------|----------|-------|-----|--------|
| 1 | **[Synter](https://syntermedia.ai)** | 0 | 32 | 5 | 18 | **60** | **27** | ✅ gated | **Да** | [Synter-Media-AI/mcp-server](https://github.com/Synter-Media-AI/mcp-server) |
| 2 | **[getmcpads.com](https://getmcpads.com)** | 0 | 30 | 5 | 18 | **58** | **14** | ✅ preview | **Частично** | [getmcpads-com](https://github.com/getmcpads-com) |
| 3 | **[Markifact](https://markifact.com)** | 0 | 29 | 5 | 18 | **57** | **20+** | ✅ HITL | **Частично** | [markifact/markifact-mcp](https://github.com/markifact/markifact-mcp) |
| 4 | **[Blend MCP](https://blend-ai.com/mcp)** | 0 | 30 | 5 | 17 | **57** | **8** | ✅ gated | **Нет** | — |
| 5 | **[AdManage.ai](https://admanage.ai/mcp)** | 0 | 32 | 5 | 15 | **57** | **9** | ✅ bulk | **Нет** | — |
| 6 | **[Adspirer](https://adspirer.com)** | 0 | 30 | 5 | 16 | **56** | 6+ | ✅ | **Частично** | [amekala/ads-mcp](https://github.com/amekala/ads-mcp) |
| 7 | **[InsightfulPipe](https://insightfulpipe.com)** | 0 | 27 | 5 | 18 | **55** | **46** | ✅ RO/RW | **Нет** | — |
| 8 | **[Pipeboard](https://pipeboard.co)** | 0 | 28 | 5 | 17 | **55** | 5 | ✅ | **Частично** | [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) |
| 9 | **[AdKit](https://adkit.so)** | 0 | 27 | 5 | 17 | **54** | 7+ | ✅ draft | **Частично** | [adkit/ads-mcp](https://github.com/adkit/ads-mcp) |
| 10 | **[Windsor.ai MCP](https://mcp.windsor.ai/)** | 0 | 26 | 5 | 17 | **53** | 350+† | ✅ select | **Нет** | — |
| 11 | **[Metadata.io](https://metadata.io/mcp-server)** | 0 | 28 | 5 | 14 | **52** | 8 B2B | ✅ 60s gate | **Нет** | — |
| 12 | **[AdLoop](https://getadloop.com)** | 0 | 28 | 5 | 14 | **52** | 3 | ✅ caps | **Да** | [kLOsk/adloop](https://github.com/kLOsk/adloop) |
| 13 | **[Opus Growth](https://opus-growth.com)** | 0 | 27 | 5 | 14 | **51** | 4+ | ✅ preview | **Да** | [opusgrowth](https://github.com/opusgrowth/Opus-Growth-The-MCP-Connector-for-Ad-Platforms) |
| 14 | **[adsap.ai](https://adsap.ai)** | 0 | 26 | 5 | 14 | **50** | 2 | ✅ preview | **Нет** | — |
| 15 | **[cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising)** | 0 | 26 | 5 | 14 | **50** | 12 | ✅ | **Да** | [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) |
| 16 | **[Catchr.io MCP](https://api.catchr.io/mcp)** | 0 | 22 | 5 | 18 | **50** | 100+† | ⚠️ mixed | **Нет** | — |
| 17 | **[AdRoll MCP](https://help.adroll.com/hc/en-us/articles/44128588376077)** | 0 | 25 | 5 | 16 | **51** | 1 | ⚠️ draft | **Нет** | — |
| 18 | **[TrueClicks](https://data.trueclicks.com/mcp)** | 0 | 18 | 5 | 18 | **46** | 3 | ❌ RO | **Частично** | [TrueClicks/google-ads-mcp-js](https://github.com/TrueClicks/google-ads-mcp-js) |
| 19 | **[Connector.wtf](https://connector.wtf)** | 0 | 8 | 5 | 16 | **34** | 5+ | ❌ RO | **Нет** | — |
| 20 | **[Smacient](https://smacient.com)** | 0 | 8 | 5 | 14 | **32** | 3 | ❌ RO | **Нет** | — |

\*Σ = A+B+C+D, strict sum. Полная таблица 70 сервисов: [master-scores.md](./master-scores.md)

---

## Детальный разбор топ-агрегаторов

### 1. getmcpads.com ⭐ (эталон)

| | |
|---|---|
| **URL** | https://mcp.getmcpads.com/mcp |
| **Платформы** | Google, Meta, TikTok, Pinterest, Snap, Reddit, Bing, X, LinkedIn, Apple, Amazon, RTB House, GA4, GSC |
| **Особенности** | Ticked-account allowlist, preview+confirm writes, npm packages `@getmcpads/*`, alerts |
| **Pricing** | Free (1 account, RO) / Pro $29 / Team $99 |
| **Уникально** | Per-platform endpoints, 1555 metrics, сравнительные статьи |

### 2. Synter — самый широкий каталог (27 платформ)

| | |
|---|---|
| **URL** | https://mcp.syntermedia.ai |
| **Платформы** | Google, Meta, LinkedIn, X, Reddit, Microsoft, TikTok, Amazon DSP+SP, Pinterest, Snap, Spotify, OpenAI Ads, **The Trade Desk**, **FreeWheel**, **DV360**, **CM360**, **SA360**, Walmart, Instacart, Target Roundel, **Criteo**, **StackAdapt**, Samsung, **Taboola**, **Outbrain**, Apple Search Ads |
| **Особенности** | Programmatic + retail media + CTV; spend limits; audit trail; Campaign IDE |
| **Pricing** | Solo $20/mo (+$20 credits) / Scale $500/mo (+$500 credits) |
| **Доступ** | Request access at synter.dev — не self-serve |
| **Уникально** | Единственный агрегатор с DV360, TTD, Taboola, Outbrain, StackAdapt |

### 3. Adspirer — 400+ tools, OAuth 2.1

| | |
|---|---|
| **URL** | https://mcp.adspirer.com/mcp |
| **Платформы** | Google, Meta, Amazon, TikTok, LinkedIn, ChatGPT Ads + GA, Klaviyo |
| **Registry** | `com.adspirer/ads` в MCP Server Registry |
| **GitHub** | [amekala/ads-mcp](https://github.com/amekala/ads-mcp) — plugin для Claude Code |
| **REST API** | Дублирует все MCP tools через HTTP |
| **Setup** | `claude mcp add --transport http adspirer https://mcp.adspirer.com/mcp` |

### 4. InsightfulPipe — 46 платформ (не только ads)

| | |
|---|---|
| **Unified** | `https://main.insightfulmcp.com/` (main-mcp) |
| **Per-platform** | `https://google-ads.insightfulmcp.com/` и т.д. |
| **Ads** | Google, Meta, TikTok, LinkedIn, Pinterest, Snap, X, Microsoft, Amazon |
| **Adjacent** | GA4, GSC, GTM, Shopify, Klaviyo, Mailchimp, Merchant Center, Ads Libraries |
| **Tools** | 1463 actions, `execute_action` для writes |
| **CLI** | `insightfulpipe` CLI с API key |

### 5. Markifact — 1000+ operations

| | |
|---|---|
| **Платформы** | Google, Meta, TikTok, LinkedIn, Microsoft, Reddit, Pinterest, Snap, Amazon, **DV360**, GA4, BigQuery, GSC, GBP, GMC, Shopify, HubSpot, Klaviyo, WhatsApp, Slack |
| **Особенности** | Human-in-the-loop на каждый write; no developer token |
| **Pricing** | from $79/mo |
| **GitHub** | [markifact/markifact-mcp](https://github.com/markifact/markifact-mcp) |

### 6. AdKit — draft-first + ad library

| | |
|---|---|
| **URL** | https://mcp.adkit.so |
| **Платформы** | Google, Meta, TikTok, LinkedIn, Microsoft, Reddit, X (+ Pinterest, Snap soon) |
| **Уникально** | `adkit_library` — 500k+ ads spy; `adkit_studio` — AI creatives |
| **Workflow** | Draft → human approve → publish |
| **Tools** | 10 high-level (manage, library, studio, setup) |

### 7. Opus Growth — 233 tools, TR/EU focus

| | |
|---|---|
| **Live** | Google (78), Microsoft (30), TikTok (25), LinkedIn (18) |
| **Soon** | Meta (27 tools, final review) |
| **Adjacent** | GSC, GA4, GTM, GBP, YouTube |
| **Safety** | Preview before every write |
| **Pricing** | 7-day free trial |

### 8. Pipeboard — Meta Business Partner

| | |
|---|---|
| **URLs** | `meta-ads.mcp.pipeboard.co`, google, tiktok, snap, reddit |
| **Tools** | 230+ across 5 platforms |
| **Trust** | Badged Meta Business Partner |
| **Free tier** | ✅ |

### 9. Metadata.io — B2B demand gen

| | |
|---|---|
| **URL** | `mcp-server.metadata.io/mcp` |
| **Платформы** | LinkedIn, Google, Meta, Reddit + 5 more B2B |
| **Tools** | 141 (audiences, campaigns, creative, analytics) |
| **Model** | Credits; 60-second approval gate |
| **Focus** | ABM, firmographic audiences, Bombora/G2 intent |

---

## Сравнение по use case

| Задача | Лучший выбор | Почему |
|--------|-------------|--------|
| Максимум платформ, один URL | **Synter** (27) или **InsightfulPipe** (46 incl. non-ads) | Широта |
| Лучший free tier + write | **getmcpads** | Free RO, Pro $29 write |
| Programmatic (DV360, TTD, Taboola) | **Synter** или **cesteral OSS** | Единственные с DSP |
| Ad spy + creatives | **AdKit** | library + studio |
| B2B / LinkedIn-heavy | **Metadata** | 141 B2B tools |
| Meta-focused, trusted | **Pipeboard** | Meta Business Partner |
| Zero setup, REST fallback | **Adspirer** | 400+ tools, registry |
| Self-host, full control | **cesteral/mcp-open-advertising** | 12 servers, OSS |
| Retargeting display | **AdRoll MCP** | Official beta, ABM |

---

## Open-source multi-platform (self-host)

| Repo | Platforms | Tools |
|------|-----------|-------|
| [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) | Google, Meta, DV360, TTD, LinkedIn, TikTok, CM360, SA360, Pinterest, Snap, Amazon DSP, MS Ads, Bid Manager | ~250 |
| [amekala/ads-mcp](https://github.com/amekala/ads-mcp) | → hosted as Adspirer | 400+ |
| [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | Meta only (124 tools) | agency multi-tenant |

---

## Находки с Reddit/форумов (не в основной таблице)

> Полный обзор: [reddit-forum-survey.md](./reddit-forum-survey.md)

| Сервис | A | B | C | D | **Σ** | Write | OSS | Reddit buzz |
|--------|---|---|---|---|-------|-------|-----|-------------|
| **[Blend MCP](https://blend-ai.com/mcp)** | 0 | 30 | 5 | 17 | **57** | ✅ gated | **Нет** | ⭐⭐⭐ #1 mention |
| **[AdManage.ai](https://admanage.ai/mcp)** | 0 | 32 | 5 | 15 | **57** | ✅ bulk | **Нет** | ⭐⭐ bulk launch |
| **[Windsor.ai MCP](https://mcp.windsor.ai/)** | 0 | 26 | 5 | 17 | **53** | ✅ select | **Нет** | ⭐⭐ agency ETL |
| **[AdLoop](https://getadloop.com)** | 0 | 28 | 5 | 14 | **52** | ✅ caps | **Да** | ⭐⭐ OSS 276⭐ |
| **[Adplane](https://mcp.adplane.ai)** | 0 | 28 | 5 | 14 | **52** | ✅ paused | **Нет** | ⭐ Google+Meta |
| **[Catchr.io MCP](https://api.catchr.io/mcp)** | 0 | 22 | 5 | 18 | **50** | ⚠️ mixed | **Нет** | ⭐ Ads+GSC+Trends |
| **[TrueClicks](https://data.trueclicks.com/mcp)** | 0 | 18 | 5 | 18 | **46** | ❌ RO | **Частично** | ⭐ free audit |
| **[Smacient](https://smacient.com)** | 0 | 8 | 5 | 14 | **32** | ❌ RO | **Нет** | ⭐ free 7 tools |

---

## Что выбрать вместо getmcpads

```
Нужен free RO + дёшево write     → getmcpads (остаётся #1)
Нужен DV360/TTD/Taboola/StackAdapt → Synter ($20–500/mo)
Нужен ad spy + AI creatives       → AdKit ($29/mo)
Нужен GA4+Shopify+ads в одном     → InsightfulPipe или Markifact
Нужен B2B LinkedIn automation     → Metadata.io
Нужен self-host programmatic      → cesteral/mcp-open-advertising
Нужен #1 на Reddit, official partner → Blend MCP ($23/mo)
Нужен bulk launch 100+ ads         → AdManage.ai
Нужен ETL 350+ sources + MCP       → Windsor.ai
Нужен Ads + GSC + Trends           → Catchr.io
Нужен OSS Google+Reddit+GA4        → AdLoop (276⭐)
```
